#!/usr/bin/env python3
"""
Backrooms Clicker - Balance Simulation
=======================================
Simulates a fresh playthrough and the prestige loop to assess game balance.

Models the core formulas from:
  - src/useGame.ts     (productionPerSec, clickPower, genCost, xpNeed,
                        pendingEchoes, metaMult, levelMult, comboMult)
  - src/gameData.ts    (GENERATORS, LEVELS)
  - src/skillTree.ts   (SKILL_NODES, computeBonuses)

Assumptions (documented so results are interpretable):
  * Player clicks ~3 times per second and keeps combo up (combo builds while
    clicking within the 900ms decay window; comboMult asymptotes to 8x).
  * Player buys allies ASAP using a greedy "production-per-cost" rule.
  * No gear / no buffs / no expeditions / no abyss (gear is delve-exclusive and
    random; we model the *baseline* economy without RNG loot). This makes the
    sim a conservative lower bound on progression speed.
  * No perks chosen (perks are RNG-gated picks; we assume the baseline metaMult
    from Explorer levels only: xpLevelMult = 1 + xpLevel*0.02).
  * Skills are purchased in a sensible progression order (production first,
    then click, then utility) as echoes become available.
  * Prestige happens when pendingEchoes >= max(1, round(totalEchoes*0.15)+1),
    i.e. the player waits for a meaningful chunk early and a larger chunk later.
"""

import re
import json
import math
from dataclasses import dataclass, field
from typing import List, Dict, Tuple

# ---------------------------------------------------------------------------
# 1. Parse game data straight from the TypeScript source (single source of truth)
# ---------------------------------------------------------------------------
BASE = "/mnt/c/Users/Kornel/Desktop/BACKROOMSGAME/game/backrooms-clicker-master"


def parse_levels() -> List[Dict]:
    t = open(f"{BASE}/src/gameData.ts").read()
    m = re.search(r"export const LEVELS[^=]*=\s*\[\n(.*?)\n\];", t, re.S)
    block = m.group(1)
    levels = []
    for entry in re.finditer(r'\{[^{}]*"id":\s*"([^"]+)"[^{}]*"unlockCost":\s*([\d.]+)[^{}]*"mult":\s*([\d.]+)[^{}]*\}', block, re.S):
        levels.append({
            "id": entry.group(1),
            "unlockCost": float(entry.group(2)),
            "mult": float(entry.group(3)),
        })
    return levels


def parse_generators() -> List[Dict]:
    t = open(f"{BASE}/src/gameData.ts").read()
    m = re.search(r"export const GENERATORS[^=]*=\s*\[\n(.*?)\n\];", t, re.S)
    block = m.group(1)
    gens = []
    for entry in re.finditer(r'\{[^{}]*"id":\s*"([^"]+)"[^{}]*"baseCost":\s*([\d.]+)[^{}]*"baseProd":\s*([\d.]+)[^{}]*\}', block, re.S):
        gens.append({
            "id": entry.group(1),
            "baseCost": float(entry.group(2)),
            "baseProd": float(entry.group(3)),
        })
    return gens


def parse_skill_nodes() -> List[Dict]:
    t = open(f"{BASE}/src/skillTree.ts").read()
    nodes = []
    # n('id','name','desc','icon','branch',tier,cost,maxRanks,['reqs'],col,'type')
    pat = re.compile(
        r"n\(\s*'([^']+)',\s*'([^']+)',\s*'([^']*)',\s*'([^']*)',\s*"
        r"'(wanderer|architect|noclipper)',\s*(\d+),\s*(\d+),\s*(\d+),\s*"
        r"\[([^\]]*)\],\s*(-?[\d.]+),\s*'(travel|notable|keystone)'"
    )
    for m in pat.finditer(t):
        reqs = [r.strip().strip("'") for r in m.group(8).split(",") if r.strip()]
        nodes.append({
            "id": m.group(1), "name": m.group(2), "branch": m.group(5),
            "tier": int(m.group(6)), "cost": int(m.group(7)),
            "maxRanks": int(m.group(8)), "requires": reqs,
            "nodeType": m.group(11),
        })
    return nodes


LEVELS = parse_levels()
GENERATORS = parse_generators()
SKILL_NODES = parse_skill_nodes()

NUM_LEVELS = len(LEVELS)          # 36
NUM_GENS = len(GENERATORS)        # 23
NUM_NODES = len(SKILL_NODES)      # 48

# ---------------------------------------------------------------------------
# 2. Skill bonus computation (mirrors computeBonuses in skillTree.ts)
# ---------------------------------------------------------------------------
@dataclass
class SkillBonuses:
    clickMult: float = 1.0
    prodMult: float = 1.0
    comboBuildMult: float = 1.0
    comboCapBonus: float = 0.0
    critMult: float = 7.0
    allyCostGrowth: float = 1.15
    awMult: float = 1.0
    allySynergyPct: float = 0.0
    prodXpLevelBonus: float = 0.0
    allyTypeBonus: float = 0.0
    clickGainsProdPct: float = 0.0
    autoClickRate: float = 0.0
    xpMult: float = 1.0


def compute_bonuses(skills: Dict[str, int]) -> SkillBonuses:
    r = lambda i: skills.get(i, 0)
    b = SkillBonuses()
    # Wanderer
    b.clickMult *= 1 + 0.15 * r("w-restless")
    b.comboBuildMult *= 1 + 0.10 * r("w-swift")
    if r("w-frenzy"):
        b.comboBuildMult *= 1.6
    if r("w-execution"):
        b.critMult = 10.0
    if r("w-transcend"):
        b.clickGainsProdPct = 0.50
    if r("w-eternal"):
        b.clickMult *= 0.5
    # Architect
    b.prodMult *= 1 + 0.20 * r("a-foundation")
    if r("a-efficiency"):
        b.allyCostGrowth = 1.12
    if r("a-synergy"):
        b.allySynergyPct = 0.05
    if r("a-deepwells"):
        b.awMult *= 1.5
    b.awMult *= 1 + 0.10 * r("a-midastouch")
    if r("a-singularity"):
        b.prodXpLevelBonus = 0.05
    if r("a-automaton"):
        b.autoClickRate += 1.0
    # Noclipper has no direct econ bonuses relevant to baseline sim
    return b


# ---------------------------------------------------------------------------
# 3. Game state + core formulae
# ---------------------------------------------------------------------------
@dataclass
class State:
    aw: float = 0.0
    total_aw: float = 0.0          # this run
    lifetime_aw: float = 0.0       # across all prestiges
    generators: Dict[str, int] = field(default_factory=dict)
    level_index: int = 0
    max_level_reached: int = 0
    echoes: int = 0
    total_echoes: int = 0
    skills: Dict[str, int] = field(default_factory=dict)
    prestiges: int = 0
    xp: float = 0.0
    xp_level: int = 0
    combo: float = 0.0
    playtime: float = 0.0          # seconds


def level_mult(s: State) -> float:
    return LEVELS[s.level_index]["mult"] if s.level_index < NUM_LEVELS else LEVELS[-1]["mult"]


def level_prestige_gate(idx: int) -> int:
    if idx >= 31:
        return 3
    if idx >= 24:
        return 1
    return 0


def xp_need(level: int) -> int:
    return int(math.floor(80 * 1.25 ** level))


def xp_level_mult(s: State) -> float:
    return 1 + s.xp_level * 0.02


def meta_mult(s: State, sb: SkillBonuses) -> float:
    # No perks, no abyss, no set bonuses in baseline sim.
    return xp_level_mult(s) * sb.awMult


def gen_cost(s: State, gid: str, sb: SkillBonuses) -> float:
    owned = s.generators.get(gid, 0)
    g = next(x for x in GENERATORS if x["id"] == gid)
    return math.ceil(g["baseCost"] * sb.allyCostGrowth ** owned)


def production_per_sec(s: State, sb: SkillBonuses) -> float:
    p = 0.0
    owned_types = 0
    for g in GENERATORS:
        n = s.generators.get(g["id"], 0)
        if n > 0:
            p += n * g["baseProd"]
            owned_types += 1
    synergy = 1 + owned_types * sb.allySynergyPct
    singularity = 1 + s.xp_level * sb.prodXpLevelBonus
    ally_type_bonus = 1 + owned_types * sb.allyTypeBonus
    return p * level_mult(s) * sb.prodMult * synergy * singularity * ally_type_bonus * meta_mult(s, sb)


def combo_mult(combo: float, cap_bonus: float = 0.0) -> float:
    return 1 + (1 - math.exp(-combo / 30.0)) * (7 + cap_bonus)


def base_click_power(s: State, sb: SkillBonuses) -> float:
    # No gear in baseline sim -> gearClickMult = 1
    return 1.0 * level_mult(s) * sb.clickMult * meta_mult(s, sb)


def click_power(s: State, sb: SkillBonuses) -> float:
    return base_click_power(s, sb) * combo_mult(s.combo, sb.comboCapBonus)


def pending_echoes(s: State) -> int:
    base = math.floor(math.cbrt(s.lifetime_aw / 1e5))
    return max(0, base - s.total_echoes)


# ---------------------------------------------------------------------------
# 4. Greedy ally-buying AI
# ---------------------------------------------------------------------------
def buy_greedy(s: State, sb: SkillBonuses, max_buys: int = 500) -> int:
    """Buy the ally with the best baseProd/cost ratio that's affordable."""
    bought = 0
    for _ in range(max_buys):
        best = None
        best_ratio = -1.0
        for g in GENERATORS:
            cost = gen_cost(s, g["id"], sb)
            if cost <= s.aw:
                ratio = g["baseProd"] / cost
                if ratio > best_ratio:
                    best_ratio = ratio
                    best = g
        if best is None:
            break
        cost = gen_cost(s, best["id"], sb)
        s.aw -= cost
        s.generators[best["id"]] = s.generators.get(best["id"], 0) + 1
        bought += 1
    return bought


def first_gen_cost(gid: str) -> float:
    g = next(x for x in GENERATORS if x["id"] == gid)
    return g["baseCost"]


# ---------------------------------------------------------------------------
# 5. Skill purchase AI (progression order)
#    Production-first build that respects prerequisites and keystone
#    mutual-exclusivity (pick one keystone per branch).
# ---------------------------------------------------------------------------
# A realistic "max the tree" target: all non-keystone nodes + one keystone
# per branch. We pick the strongest keystones for an economy sim:
#   Wanderer:  w-transcend (clicking grants 50% of production)
#   Architect: a-singularity (production scales with Explorer level)
#   Noclipper: n-apex (any-depth loot) -- econ-irrelevant but counts toward "max"
KEystone_PICKS = {"wanderer": "w-transcend", "architect": "a-singularity", "noclipper": "n-apex"}
KEYSTONES = {"w-transcend", "w-overclock", "w-eternal",
             "a-singularity", "a-noclip", "a-ascension",
             "n-apex", "n-immortal", "n-titan"}


def build_target_node_list() -> List[str]:
    """Return the ordered list of (node, ranks) to purchase for a 'maxed' tree."""
    target = []
    chosen_keystones = set(KEystone_PICKS.values())
    # include all non-keystone nodes + chosen keystones
    for node in SKILL_NODES:
        if node["nodeType"] == "keystone" and node["id"] not in chosen_keystones:
            continue
        target.append(node)
    return target


def can_unlock(node, skills, echoes):
    if skills.get(node["id"], 0) >= node["maxRanks"]:
        return False
    if echoes < node["cost"]:
        return False
    return all(skills.get(req, 0) >= 1 for req in node["requires"])


def buy_skills(s: State, target_nodes: List[Dict]) -> int:
    """Spend echoes on the next affordable target node rank."""
    spent = 0
    progress = True
    while progress:
        progress = False
        for node in target_nodes:
            if can_unlock(node, s.skills, s.echoes):
                s.echoes -= node["cost"]
                s.skills[node["id"]] = s.skills.get(node["id"], 0) + 1
                spent += node["cost"]
                progress = True
                break
    return spent


# ---------------------------------------------------------------------------
# 6. Core simulation step (1 second of playtime)
# ---------------------------------------------------------------------------
CLICK_RATE = 3.0          # clicks per second
XP_PER_CLICK = 0.6        # base, * xpMult


def simulate_second(s: State, sb: SkillBonuses, click: bool = True):
    # --- combo ---
    if click:
        # combo builds by clickRate * comboBuildMult per second while clicking
        s.combo += CLICK_RATE * sb.comboBuildMult
    # (combo never decays in this continuous-click model; comboMult caps at 8x)

    # --- clicks ---
    click_aw = 0.0
    if click:
        cp = click_power(s, sb)
        click_aw = cp * CLICK_RATE
        # Transcendence: clicking also grants 50% of per-second production
        if sb.clickGainsProdPct > 0:
            click_aw += production_per_sec(s, sb) * sb.clickGainsProdPct
        # auto-clicker (Architect Automaton) adds clicks
        if sb.autoClickRate > 0:
            click_aw += click_power(s, sb) * sb.autoClickRate

    # --- production ---
    prod_aw = production_per_sec(s, sb)

    gain = click_aw + prod_aw
    s.aw += gain
    s.total_aw += gain
    s.lifetime_aw += gain

    # --- XP from clicking ---
    if click:
        s.xp += XP_PER_CLICK * CLICK_RATE * sb.xpMult
        if sb.autoClickRate > 0:
            s.xp += XP_PER_CLICK * sb.autoClickRate * sb.xpMult
    # level-ups
    while s.xp >= xp_need(s.xp_level):
        s.xp -= xp_need(s.xp_level)
        s.xp_level += 1

    # --- level unlocks (only auto-advance at deepest reached) ---
    if s.level_index >= s.max_level_reached:
        while True:
            nxt = LEVELS[s.level_index + 1] if s.level_index + 1 < NUM_LEVELS else None
            if nxt and s.total_aw >= nxt["unlockCost"]:
                gate = level_prestige_gate(s.level_index + 1)
                if s.prestiges < gate:
                    break
                s.level_index += 1
                s.max_level_reached = max(s.max_level_reached, s.level_index)
                # descent XP
                s.xp += 20 + s.level_index * 6
                while s.xp >= xp_need(s.xp_level):
                    s.xp -= xp_need(s.xp_level)
                    s.xp_level += 1
            else:
                break

    s.playtime += 1.0


# ---------------------------------------------------------------------------
# 7. Run simulator
# ---------------------------------------------------------------------------
def fmt_time(sec: float) -> str:
    if sec < 60:
        return f"{sec:.0f}s"
    if sec < 3600:
        return f"{sec/60:.1f}m"
    if sec < 86400:
        return f"{sec/3600:.2f}h"
    return f"{sec/86400:.2f}d"


def fmt_aw(x: float) -> str:
    if x < 1e3:
        return f"{x:.1f}"
    if x < 1e6:
        return f"{x/1e3:.2f}K"
    if x < 1e9:
        return f"{x/1e6:.2f}M"
    if x < 1e12:
        return f"{x/1e9:.2f}B"
    if x < 1e15:
        return f"{x/1e12:.2f}T"
    return f"{x:.3e}"


def prestige_threshold(total_echoes: int) -> int:
    """Prestige when pendingEchoes >= this many."""
    return max(1, round(total_echoes * 0.15) + 1)


def run_playthrough(starting_echoes: int = 0, starting_skills: Dict = None,
                    starting_xp_level: int = 0, starting_prestiges: int = 0,
                    click: bool = True, max_seconds: float = 60 * 60 * 24 * 365,
                    target_echoes: int = None, target_level: int = None,
                    milestone_marks: List[float] = None) -> Dict:
    """
    Run a single playthrough (one life). Returns a result dict with milestones.
    If target_echoes is set, stop once pendingEchoes >= target_echoes.
    If target_level is set, stop once level_index >= target_level.
    """
    s = State()
    s.echoes = starting_echoes
    s.total_echoes = starting_echoes  # echoes already banked carry
    s.skills = dict(starting_skills or {})
    s.xp_level = starting_xp_level
    s.prestiges = starting_prestiges

    target_nodes = build_target_node_list()

    milestones = {}
    gen_first_time = {g["id"]: None for g in GENERATORS}
    level_first_time = {i: None for i in range(NUM_LEVELS)}
    level_first_time[0] = 0.0
    rate_samples = {}
    if milestone_marks:
        for m in milestone_marks:
            rate_samples[m] = None
    first_prestige_time = None
    first_prestige_echoes = None

    sb = compute_bonuses(s.skills)

    # cap iterations
    iters = int(max_seconds)
    for i in range(iters):
        sb = compute_bonuses(s.skills)
        # spend echoes on skills whenever possible
        buy_skills(s, target_nodes)
        sb = compute_bonuses(s.skills)
        # buy allies
        buy_greedy(s, sb)
        # record level index BEFORE the tick so we can detect newly-unlocked levels
        prev_level = s.level_index
        # simulate one second
        simulate_second(s, sb, click=click)

        # record first-purchase times for each ally
        for g in GENERATORS:
            if gen_first_time[g["id"]] is None and s.generators.get(g["id"], 0) > 0:
                gen_first_time[g["id"]] = s.playtime

        # record level unlock times for every level crossed this tick
        for li in range(prev_level + 1, s.level_index + 1):
            if level_first_time.get(li) is None:
                level_first_time[li] = s.playtime

        # rate samples
        if milestone_marks:
            for m in milestone_marks:
                if rate_samples[m] is None and s.playtime >= m:
                    sb2 = compute_bonuses(s.skills)
                    rate_samples[m] = {
                        "aw_per_sec": production_per_sec(s, sb2) + (click_power(s, sb2) * CLICK_RATE if click else 0),
                        "prod_per_sec": production_per_sec(s, sb2),
                        "click_per_sec": click_power(s, sb2) * CLICK_RATE if click else 0,
                        "level": s.level_index,
                        "xp_level": s.xp_level,
                        "lifetime_aw": s.lifetime_aw,
                    }

        # first prestige
        if first_prestige_time is None and pending_echoes(s) > 0:
            first_prestige_time = s.playtime
            first_prestige_echoes = pending_echoes(s)

        # stop conditions
        if target_echoes is not None and pending_echoes(s) >= target_echoes:
            break
        if target_level is not None and s.level_index >= target_level:
            break
        if s.level_index >= NUM_LEVELS - 1 and target_level is None and target_echoes is None:
            break

    return {
        "state": s,
        "gen_first_time": gen_first_time,
        "level_first_time": level_first_time,
        "rate_samples": rate_samples,
        "first_prestige_time": first_prestige_time,
        "first_prestige_echoes": first_prestige_echoes,
        "final_prod": production_per_sec(s, compute_bonuses(s.skills)),
        "final_click": click_power(s, compute_bonuses(s.skills)) * CLICK_RATE if click else 0,
    }


# ---------------------------------------------------------------------------
# 8. Multi-run prestige loop simulator
# ---------------------------------------------------------------------------
def run_prestige_loop(target_total_echoes: int, click: bool = True,
                      max_runs: int = 200, max_run_seconds: float = 60 * 60 * 24 * 30,
                      report_every: int = 1) -> Dict:
    """
    Simulate repeated prestiges until total_echoes >= target.
    Returns cumulative stats.
    """
    # persistent across prestiges: echoes, total_echoes, skills, xp_level, prestiges
    echoes = 0
    total_echoes = 0
    skills: Dict[str, int] = {}
    xp_level = 0
    prestiges = 0
    cumulative_time = 0.0
    run_log = []

    target_nodes = build_target_node_list()

    for run_idx in range(max_runs):
        threshold = prestige_threshold(total_echoes)
        res = run_playthrough(
            starting_echoes=echoes,
            starting_skills=skills,
            starting_xp_level=xp_level,
            starting_prestiges=prestiges,
            click=click,
            max_seconds=max_run_seconds,
            target_echoes=threshold,
        )
        s = res["state"]
        run_time = s.playtime
        cumulative_time += run_time
        # apply prestige
        gain = pending_echoes(s)
        if gain <= 0:
            # couldn't reach threshold in time; force prestige at whatever's pending
            gain = max(0, pending_echoes(s))
        echoes = s.echoes + gain
        total_echoes += gain
        # spend echoes on skills immediately (persisted)
        skills = dict(s.skills)
        # buy skills with new echoes
        temp = State()
        temp.echoes = echoes
        temp.skills = skills
        buy_skills(temp, target_nodes)
        skills = temp.skills
        echoes = temp.echoes
        xp_level = s.xp_level
        prestiges += 1

        run_log.append({
            "run": run_idx + 1,
            "threshold": threshold,
            "gain": gain,
            "total_echoes": total_echoes,
            "run_time": run_time,
            "cumulative_time": cumulative_time,
            "xp_level": xp_level,
            "max_level": s.max_level_reached,
            "lifetime_aw": s.lifetime_aw,
        })

        if total_echoes >= target_total_echoes:
            break

    return {
        "run_log": run_log,
        "total_echoes": total_echoes,
        "echoes": echoes,
        "skills": skills,
        "xp_level": xp_level,
        "prestiges": prestiges,
        "cumulative_time": cumulative_time,
    }


# ---------------------------------------------------------------------------
# 9. Reporting
# ---------------------------------------------------------------------------
def section(title):
    print("\n" + "=" * 72)
    print(f"  {title}")
    print("=" * 72)


def main():
    print("#" * 72)
    print("  BACKROOMS CLICKER - BALANCE SIMULATION REPORT")
    print("#" * 72)
    print(f"  Levels: {NUM_LEVELS}  |  Allies (generators): {NUM_GENS}  |  Skill nodes: {NUM_NODES}")

    # --- Skill tree cost analysis ---
    section("SKILL TREE COST ANALYSIS")
    full_cost = sum(n["cost"] * n["maxRanks"] for n in SKILL_NODES)
    keystones = [n for n in SKILL_NODES if n["nodeType"] == "keystone"]
    non_keystone_cost = sum(n["cost"] * n["maxRanks"] for n in SKILL_NODES if n["nodeType"] != "keystone")
    ks_cost = sum(n["cost"] * n["maxRanks"] for n in keystones)
    realistic_cost = non_keystone_cost + 3 * 8  # one keystone per branch (each costs 8)
    print(f"  Total nodes: {NUM_NODES}  (note: prompt said 60; actual is {NUM_NODES})")
    print(f"  Keystones: {len(keystones)} (3 per branch, mutually exclusive within a branch)")
    print(f"  Theoretical 'buy everything' echo cost: {full_cost}  (IMPOSSIBLE - keystones conflict)")
    print(f"  Realistic 'maxed tree' echo cost (all non-keystone + 1 keystone/branch): {realistic_cost}")
    print(f"    - non-keystone nodes: {non_keystone_cost} echoes")
    print(f"    - 3 chosen keystones: {3*8} echoes")
    # echoes needed: floor(cbrt(lifetimeAw/1e5)) >= realistic_cost
    needed_lifetime = realistic_cost ** 3 * 1e5
    print(f"  Lifetime AW required to have earned {realistic_cost} echoes: {fmt_aw(needed_lifetime)}")

    # --- Fresh playthrough ---
    section("FRESH PLAYTHROUGH (0 AW, 0 echoes, 0 skills, clicking 3/s)")
    marks = [60, 300, 1800, 3600, 7200, 14400]  # 1m,5m,30m,1h,2h,4h
    fresh = run_playthrough(click=True, max_seconds=14400 + 60, milestone_marks=marks)

    print("\n  -- Time to afford each ally type (first purchase) --")
    for g in GENERATORS:
        t = fresh["gen_first_time"][g["id"]]
        tstr = fmt_time(t) if t is not None else "not reached"
        print(f"    {g['id']:<28} cost {fmt_aw(g['baseCost']):>10}  prod {fmt_aw(g['baseProd']):>10}/s  -> {tstr}")

    print("\n  -- Time to reach each level unlock cost --")
    for i in range(NUM_LEVELS):
        t = fresh["level_first_time"].get(i)
        tstr = fmt_time(t) if t is not None else "NOT REACHED (needs prestige gate or too slow)"
        gate = level_prestige_gate(i)
        gatetag = f"  [gate: {gate} prestige]" if gate else ""
        print(f"    L{i:>2} {LEVELS[i]['id']:<22} unlock {fmt_aw(LEVELS[i]['unlockCost']):>14}  -> {tstr}{gatetag}")

    print("\n  -- AW generation rate at key milestones --")
    for m in marks:
        r = fresh["rate_samples"].get(m)
        if r:
            dom = "CLICK" if r["click_per_sec"] > r["prod_per_sec"] else "PROD"
            ratio = r["click_per_sec"] / r["prod_per_sec"] if r["prod_per_sec"] > 0 else float("inf")
            print(f"    {fmt_time(m):>6}: total {fmt_aw(r['aw_per_sec'])}/s  "
                  f"(click {fmt_aw(r['click_per_sec'])}/s, prod {fmt_aw(r['prod_per_sec'])}/s)  "
                  f"level {r['level']}  xpLvl {r['xp_level']}  lifetime {fmt_aw(r['lifetime_aw'])}  "
                  f"dominant: {dom} ({ratio:.2f}x)")

    print(f"\n  -- First prestige --")
    if fresh["first_prestige_time"] is not None:
        print(f"    First prestige available at: {fmt_time(fresh['first_prestige_time'])}")
        print(f"    Echoes from first prestige: {fresh['first_prestige_echoes']}")
    else:
        print(f"    Not reached within 4h (need lifetime AW >= 100,000 for first echo)")

    print(f"\n  -- XP / Explorer level progression (after 4h) --")
    s = fresh["state"]
    print(f"    Explorer level: {s.xp_level}  (xp toward next: {s.xp:.0f}/{xp_need(s.xp_level)})")
    print(f"    xpLevelMult: {xp_level_mult(s):.3f}")
    # how long to reach a few explorer levels (rough extrapolation from rate)
    print(f"    XP gain rate ~ {XP_PER_CLICK*CLICK_RATE:.1f}/s from clicking (+ descent bonuses)")

    # --- Post-prestige progression ---
    section("POST-PRESTIGE PROGRESSION")
    # Re-reach the same point (e.g. deepest level reached in run 1) with N prestiges
    baseline_deepest = fresh["state"].max_level_reached
    print(f"  Baseline run reached level index {baseline_deepest} ({LEVELS[baseline_deepest]['id']}) in {fmt_time(fresh['state'].playtime)}")
    print(f"  Re-reaching level {baseline_deepest} with accumulated skills/echoes:\n")
    # simulate single runs starting with N prestiges worth of skills (approximate)
    # We approximate by giving the player the skill tree they'd have after N prestiges
    # from the prestige loop below. For a quick estimate, run the loop first.
    TARGET = realistic_cost

    section(f"PRESTIGE LOOP -> earn {TARGET} echoes (max realistic tree)")
    loop = run_prestige_loop(target_total_echoes=TARGET, click=True, max_runs=300,
                             max_run_seconds=60 * 60 * 24 * 7)
    print(f"  Prestiges performed: {loop['prestiges']}")
    print(f"  Total echoes earned: {loop['total_echoes']}")
    print(f"  Cumulative playtime: {fmt_time(loop['cumulative_time'])}")
    print(f"  Final Explorer level: {loop['xp_level']}")
    print(f"\n  Run-by-run log (first 15 + last 5):")
    print(f"    {'run':>3} {'thr':>4} {'gain':>4} {'total':>5} {'run_t':>8} {'cum_t':>9} {'xpL':>4} {'maxL':>4} {'lifetime':>12}")
    log = loop["run_log"]
    show = log[:15] + (log[-5:] if len(log) > 20 else [])
    if len(log) > 20:
        print("    ...")
    for e in show:
        print(f"    {e['run']:>3} {e['threshold']:>4} {e['gain']:>4} {e['total_echoes']:>5} "
              f"{fmt_time(e['run_time']):>8} {fmt_time(e['cumulative_time']):>9} "
              f"{e['xp_level']:>4} {e['max_level']:>4} {fmt_aw(e['lifetime_aw']):>12}")

    # --- Re-reach baseline deepest with skills from loop ---
    section("RE-REACHING BASELINE DEPTH WITH PROGRESSION")
    # Use skills accumulated at a few prestige milestones
    # Re-simulate: take skills after N prestiges by running smaller loops
    for n_prest in [1, 5, 10, 20]:
        sub = run_prestige_loop(target_total_echoes=999999, click=True, max_runs=n_prest,
                                max_run_seconds=60 * 60 * 24 * 7)
        # now do a fresh run with those skills/echoes/xp and see time to reach baseline_deepest
        res = run_playthrough(
            starting_echoes=sub["echoes"],
            starting_skills=sub["skills"],
            starting_xp_level=sub["xp_level"],
            starting_prestiges=n_prest,
            click=True,
            max_seconds=60 * 60 * 24,
            target_level=baseline_deepest,
        )
        t = res["state"].playtime
        print(f"  After {n_prest:>2} prestiges (skills, {sub['total_echoes']} echoes, xpLvl {sub['xp_level']}): "
              f"reach L{baseline_deepest} in {fmt_time(t)}")

    # --- Total time to unlock all 36 levels ---
    section("TOTAL TIME TO UNLOCK ALL 36 LEVELS")
    # Need 3 prestiges (gate for level 31+). Simulate: do 3 prestiges then push to max level.
    # Use the loop to get skills after 3 prestiges, then a final push.
    sub3 = run_prestige_loop(target_total_echoes=999999, click=True, max_runs=3,
                             max_run_seconds=60 * 60 * 24 * 7)
    time_so_far = sub3["cumulative_time"]
    res = run_playthrough(
        starting_echoes=sub3["echoes"],
        starting_skills=sub3["skills"],
        starting_xp_level=sub3["xp_level"],
        starting_prestiges=3,
        click=True,
        max_seconds=60 * 60 * 24 * 400,  # up to 400 days
        target_level=NUM_LEVELS - 1,
    )
    total = time_so_far + res["state"].playtime
    print(f"  3 prestiges took: {fmt_time(time_so_far)} (to satisfy level-31 gate)")
    print(f"  Final push to L{NUM_LEVELS-1} ({LEVELS[-1]['id']}, unlock {fmt_aw(LEVELS[-1]['unlockCost'])}): {fmt_time(res['state'].playtime)}")
    print(f"  TOTAL to unlock all {NUM_LEVELS} levels: {fmt_time(total)}")
    print(f"  Final production at max level: {fmt_aw(res['final_prod'])}/s, click {fmt_aw(res['final_click'])}/s")

    # --- Total time to max skill tree ---
    section("TOTAL TIME TO MAX THE SKILL TREE")
    print(f"  Realistic tree cost: {realistic_cost} echoes")
    print(f"  Prestiges needed: {loop['prestiges']}")
    print(f"  Total playtime to afford full tree: {fmt_time(loop['cumulative_time'])}")

    # --- Complete the game ---
    section('ESTIMATED TOTAL TIME TO "COMPLETE" THE GAME')
    complete_time = max(total, loop["cumulative_time"])
    print(f"  All {NUM_LEVELS} levels unlocked: {fmt_time(total)}")
    print(f"  Full skill tree maxed:           {fmt_time(loop['cumulative_time'])}")
    print(f"  (gear is RNG/delve-gated and not modeled; add significant time for full gear sets)")
    print(f"  => Estimated economic completion: {fmt_time(complete_time)}")

    # --- Production vs clicking dominance ---
    section("PRODUCTION vs CLICKING DOMINANCE")
    print("  Stage            | click/s        | prod/s         | dominant")
    print("  " + "-" * 64)
    for m in marks:
        r = fresh["rate_samples"].get(m)
        if r:
            dom = "CLICK" if r["click_per_sec"] > r["prod_per_sec"] else "PROD"
            print(f"  {fmt_time(m):>15}  | {fmt_aw(r['click_per_sec']):>13}  | {fmt_aw(r['prod_per_sec']):>13}  | {dom}")
    print(f"  {'end of 4h':>15}  | {fmt_aw(fresh['final_click']):>13}  | {fmt_aw(fresh['final_prod']):>13}  | "
          f"{'CLICK' if fresh['final_click'] > fresh['final_prod'] else 'PROD'}")

    # --- Balance assessment ---
    section("BALANCE ASSESSMENT & RECOMMENDATIONS")
    print(balanced_assessment(fresh, loop, total, realistic_cost, full_cost))


def balanced_assessment(fresh, loop, total_levels_time, realistic_cost, full_cost):
    lines = []
    fp = fresh["first_prestige_time"]
    # assess pace
    if fp is not None and fp < 120:
        lines.append(f"  [FAST] First prestige in {fmt_time(fp)} - very quick; players may prestige before engaging.")
    elif fp is not None and fp < 1800:
        lines.append(f"  [OK]   First prestige in {fmt_time(fp)} - reasonable early-game hook.")
    elif fp is not None:
        lines.append(f"  [SLOW] First prestige in {fmt_time(fp)} - first rebirth may feel grindy.")
    else:
        lines.append(f"  [SLOW] First prestige NOT reached in 4h - the rebirth loop opens too late.")

    # level pace
    l1 = fresh["level_first_time"].get(1)
    l5 = fresh["level_first_time"].get(5)
    l10 = fresh["level_first_time"].get(10)
    if l1: lines.append(f"  Level 1 unlock at {fmt_time(l1)}; Level 5 at {fmt_time(l5) if l5 else 'n/a'}; Level 10 at {fmt_time(l10) if l10 else 'n/a'}.")

    # total completion
    lines.append(f"  All levels unlocked in ~{fmt_time(total_levels_time)}.")
    lines.append(f"  Full skill tree in ~{fmt_time(loop['cumulative_time'])} over {loop['prestiges']} prestiges.")

    # dominance
    s = fresh["state"]
    if fresh["final_click"] > fresh["final_prod"] * 5:
        lines.append("  [ISSUE] Clicking dominates the ENTIRE early/mid game. Idle production is negligible")
        lines.append("          for hours - allies are far too weak relative to combo-clicking. This makes")
        lines.append("          the 'idle' playstyle invalid and pressures constant clicking.")
    elif fresh["final_prod"] > fresh["final_click"]:
        lines.append("  Production overtakes clicking by 4h - good transition to idle.")
    else:
        lines.append("  Clicking and production are comparable by 4h.")

    # recommendations
    lines.append("")
    lines.append("  RECOMMENDATIONS:")
    # generator cost growth
    lines.append("   1. Generator baseProd is ~5% of baseCost (e.g. Blanche 0.15/18=0.83%/s, Red Knight")
    lines.append("      0.765/111.6=0.69%/s). Payback ~120-145s per first unit - reasonable, BUT with")
    lines.append("      1.15x cost growth, mass-buying is punished hard. The Architect 'Efficiency' node")
    lines.append("      (1.15->1.12) is almost mandatory. Consider a base growth of 1.13 and Efficiency")
    lines.append("      ->1.10 so idle builds feel rewarding without a skill tax.")
    # first generator affordability
    g0 = GENERATORS[0]
    lines.append(f"   2. First ally ({g0['id']}) costs {g0['baseCost']} AW = ~{g0['baseCost']/ (1*7.5):.0f}s of clicking.")
    lines.append("      Fine, but the first ~5 allies contribute <1 AW/s total while clicking yields ~23 AW/s.")
    lines.append("      Boost early generator baseProd (e.g. Blanche 0.15->0.5) so production matters sooner.")
    # echo formula
    lines.append("   3. Echo formula floor(cbrt(lifetimeAw/1e5)) is very flat. Going from 1->10 echoes needs")
    lines.append("      lifetimeAw 1e5 -> 1e8 (1000x) for only 9 more echoes. Going 10->100 needs 1e8->1e11.")
    lines.append("      This makes mid-game prestige gains feel tiny. Consider cbrt(lifetimeAw/1e4) or a")
    lines.append("      piecewise formula so each prestige visibly increases echo yield.")
    # prestige gate
    lines.append("   4. Level prestige gates (L24=1, L31=3) are good pacing, but the jump from 1->3 prestiges")
    lines.append("      is steep. Consider L24=1, L28=2, L31=3 for smoother gating.")
    # completion time
    if loop["cumulative_time"] > 60 * 60 * 24 * 30:
        lines.append(f"   5. Full tree takes {fmt_time(loop['cumulative_time'])} - likely TOO LONG for a web clicker.")
        lines.append("      Most players won't persist past ~1-2 weeks. Target ~3-7 days to 'max' the tree.")
    else:
        lines.append(f"   5. Full tree takes {fmt_time(loop['cumulative_time'])} - within a reasonable window.")
    # clicking
    lines.append("   6. Combo caps at 8x with no hard combo counter cap; an active clicker sustains ~7.8x.")
    lines.append("      Combined with metaMult this makes clicking always competitive. If you want a true")
    lines.append("      idle meta, reduce combo cap to 5x or add combo decay that scales with playtime.")
    return "\n".join(lines)


if __name__ == "__main__":
    main()
