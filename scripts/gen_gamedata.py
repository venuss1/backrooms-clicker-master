# Generates src/gameData.ts from backrooms.db (Backrooms Wiki ARPG curation).
# Usage:  python3 scripts/gen_gamedata.py [path/to/backrooms.db]
import json, os, sqlite3, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "backrooms.db")
OUT = os.path.join(ROOT, "src", "gameData.ts")


def sig(x, n=6):
    if x == 0:
        return 0
    from math import log10, floor
    d = n - int(floor(log10(abs(x)))) - 1
    r = round(x, d)
    return int(r) if r == int(r) else r


def load_data(db_path):
    con = sqlite3.connect(db_path)
    con.row_factory = sqlite3.Row
    cur = con.cursor()
    rows = cur.execute("""
        SELECT sp.arpg_source_page_id AS id, sp.selection_rank AS rank,
               sp.primary_role AS role, sp.design_summary AS summary,
               ps.title AS title, ps.slug AS slug, ps.rating_score AS rating
        FROM arpg_source_pages sp
        JOIN page_snapshots ps ON ps.page_snapshot_id = sp.page_snapshot_id
        ORDER BY sp.selection_rank
    """).fetchall()
    out = []
    for r in rows:
        hooks = [{"type": h["hook_type"], "priority": h["priority"], "desc": h["description"]}
                 for h in cur.execute(
                     "SELECT hook_type, priority, description FROM arpg_design_hooks "
                     "WHERE arpg_source_page_id=? ORDER BY priority DESC, ordinal", (r["id"],))]
        roles = [x[0] for x in cur.execute(
            "SELECT role FROM arpg_page_roles WHERE arpg_source_page_id=? ORDER BY ordinal", (r["id"],))]
        out.append({"id": r["id"], "rank": r["rank"], "title": r["title"], "slug": r["slug"],
                    "role": r["role"], "roles": roles, "rating": r["rating"],
                    "summary": r["summary"], "hooks": hooks})
    return out


data = load_data(DB)
by = {}
for d in data:
    by.setdefault(d["role"], []).append(d)
for k in by:
    by[k].sort(key=lambda x: -(x["rating"] or 0))


def clean(s):
    if not s:
        return ""
    return s.replace("\\", " ").replace('"', "'").strip()


def best_hook(d):
    if d["hooks"]:
        return clean(d["hooks"][0]["desc"])
    return clean(d["summary"])


# ---------- LEVELS (progression tiers) — slower, steeper curve ----------
# Each level gets a unique visual "scene" archetype + a themed click verb/icon.
# (title keyword -> (scene, verb, icon)); a fallback cycle guarantees variety.
SCENE_RULES = [
    (["threshold"], ("corridor", "PHASE", "▚")),
    (["office", "manila", "mess"], ("office", "RUMMAGE", "▦")),
    (["hotel"], ("hotel", "CREEP", "🚪")),
    (["lights out", "sh4dy", "shady", "malignance"], ("dark", "FEEL", "◐")),
    (["thalasso", "overflow", "blue channel", "flood"], ("water", "WADE", "≈")),
    (["cave", "maze", "creatures", "monster"], ("cave", "CRAWL", "⛰")),
    (["habitable", "suburb", "home", "snack"], ("suburb", "SCAVENGE", "⌂")),
    (["crop", "garden", "paradise", "petrified"], ("field", "FORAGE", "❦")),
    (["matrix", "untextured", "corrupted", "deleted", "fragmented", "channel"], ("digital", "GLITCH", "▓")),
    (["ruins", "road", "affliction"], ("ruins", "SIFT", "◈")),
    (["sublimity", "end", "cygnus", "archive", "999", "zenith", "station"], ("void", "DRIFT", "✦")),
    (["red room", "red light", "hub"], ("neon", "SLIP", "◆")),
]
FALLBACK = [
    ("corridor", "PHASE", "▚"), ("office", "RUMMAGE", "▦"), ("dark", "FEEL", "◐"),
    ("water", "WADE", "≈"), ("cave", "CRAWL", "⛰"), ("digital", "GLITCH", "▓"),
    ("field", "FORAGE", "❦"), ("ruins", "SIFT", "◈"), ("void", "DRIFT", "✦"),
    ("neon", "SLIP", "◆"), ("suburb", "SCAVENGE", "⌂"), ("hotel", "CREEP", "🚪"),
]


def scene_for(title, i):
    t = title.lower()
    for kws, res in SCENE_RULES:
        if any(k in t for k in kws):
            return res
    return FALLBACK[i % len(FALLBACK)]


locs = sorted(by.get("location", []), key=lambda x: x["rank"])
levels = []
for i, d in enumerate(locs):
    # steeper geometric + polynomial term => meaningfully slower descents
    unlock = 0 if i == 0 else sig(120 * (3.35 ** i) + 40 * (i ** 3))
    mult = round(1 + i * 0.85 + (i ** 1.4) * 0.15, 2)  # deeper = stronger, super-linear
    scene, verb, icon = scene_for(d["title"], i)
    levels.append({
        "id": d["slug"], "name": clean(d["title"]), "desc": clean(d["summary"]),
        "hook": best_hook(d), "unlockCost": unlock, "mult": mult, "rating": d["rating"],
        "scene": scene, "verb": verb, "icon": icon, "hue": (i * 47) % 360,
    })

# ---------- GENERATORS (idle AW/sec) — steeper cost growth per unit ----------
gen_sources = list(by.get("faction", [])) + list(by.get("npc", []))
gen_sources.sort(key=lambda x: -(x["rating"] or 0))
generators = []
for i, d in enumerate(gen_sources):
    generators.append({
        "id": d["slug"], "name": clean(d["title"]), "desc": clean(d["summary"]),
        "hook": best_hook(d),
        "baseCost": sig(18 * (6.2 ** i)),
        "baseProd": sig(0.15 * (5.1 ** i)),
        "rating": d["rating"],
    })

# ---------- GEAR (equippable) — from item role ----------
SLOT_KEYWORDS = {
    "Weapon": ["firesalt", "lightning", "retributor", "pain", "voidstone", "silence"],
    "Light": ["lantern", "candy", "seer", "warpberr"],
    "Armor": ["mask", "reparation", "compression", "cube", "apotheosis"],
    "Trinket": ["key", "hermes", "ariadne", "pocket", "almond", "cookbook", "device"],
}


def slot_for(title, idx):
    t = title.lower()
    for slot, kws in SLOT_KEYWORDS.items():
        if any(k in t for k in kws):
            return slot
    return ["Weapon", "Light", "Armor", "Trinket"][idx % 4]


def rarity_for(rating):
    if rating >= 90:
        return "legendary"
    if rating >= 65:
        return "epic"
    if rating >= 52:
        return "rare"
    if rating >= 40:
        return "uncommon"
    return "common"


RAR_TIER = {"common": 1, "uncommon": 2, "rare": 3, "epic": 4, "legendary": 5}
items = sorted(by.get("item", []), key=lambda x: -(x["rating"] or 0))
gear = []
slot_counter = {"Weapon": 0, "Light": 0, "Armor": 0, "Trinket": 0}
for i, d in enumerate(items):
    slot = slot_for(d["title"], i)
    slot_counter[slot] += 1
    tier = RAR_TIER[rarity_for(d["rating"] or 0)]
    n = slot_counter[slot]
    stats = {"clickMult": 1.0, "prodMult": 1.0, "luck": 0.0, "crit": 0.0}
    step = 0.12 + tier * 0.05
    if slot == "Weapon":
        stats["clickMult"] = round(1 + step + n * 0.06, 3)
        stats["crit"] = round(0.03 + tier * 0.02 + n * 0.01, 3)
    elif slot == "Light":
        stats["prodMult"] = round(1 + step * 0.8 + n * 0.05, 3)
        stats["luck"] = round(0.05 + tier * 0.03 + n * 0.01, 3)
    elif slot == "Armor":
        stats["prodMult"] = round(1 + step + n * 0.06, 3)
        stats["clickMult"] = round(1 + step * 0.4, 3)
    else:  # Trinket
        stats["clickMult"] = round(1 + step * 0.5 + n * 0.03, 3)
        stats["prodMult"] = round(1 + step * 0.5 + n * 0.03, 3)
        stats["luck"] = round(0.03 + tier * 0.015, 3)
    # cost scales with slot tier & rarity, on a steep curve
    cost = sig(60 * (4.6 ** (n - 1)) * (1 + tier * 0.6))
    gear.append({
        "id": d["slug"], "name": clean(d["title"]), "desc": clean(d["summary"]),
        "hook": best_hook(d), "slot": slot, "rarity": rarity_for(d["rating"] or 0),
        "cost": cost, "stats": stats, "rating": d["rating"],
    })
# Assign each gear a drop level, spread across all depths by its cost rank
# (cheap gear drops shallow, powerful gear drops deep). Gear is FOUND, not bought.
num_levels = len(levels)
by_cost = sorted(gear, key=lambda g: g["cost"])
for rank, gd in enumerate(by_cost):
    frac = rank / max(1, len(by_cost) - 1)
    gd["dropLevel"] = min(num_levels - 1, round(frac * (num_levels - 1)))
# order gear by drop level then cost for nicer display
gear.sort(key=lambda g: (g["dropLevel"], ["Weapon", "Light", "Armor", "Trinket"].index(g["slot"]), g["cost"]))

# ---------- ENCOUNTERS (enemies + non-final bosses) ----------
enemies = sorted(by.get("enemy", []), key=lambda x: -(x["rating"] or 0))
bosses = sorted(by.get("boss", []), key=lambda x: -(x["rating"] or 0))
final = next((b for b in bosses if "nostalgi" in b["title"].lower()), bosses[0])
mid_bosses = [b for b in bosses if b["id"] != final["id"]]
encounters = []
for d in enemies:
    encounters.append({"id": d["slug"], "name": clean(d["title"]), "desc": clean(d["summary"]),
                       "hook": best_hook(d), "boss": False, "rating": d["rating"]})
for d in mid_bosses:
    encounters.append({"id": d["slug"], "name": clean(d["title"]), "desc": clean(d["summary"]),
                       "hook": best_hook(d), "boss": True, "rating": d["rating"]})

finale = {"id": final["slug"], "name": clean(final["title"]), "desc": clean(final["summary"]),
          "hook": best_hook(final), "rating": final["rating"]}

# ---------- PHENOMENA (random buffs/events) ----------
phen = sorted(by.get("phenomenon", []), key=lambda x: -(x["rating"] or 0))
effects = [
    {"kind": "clickX2", "label": "Click power doubled"},
    {"kind": "prodX2", "label": "Production doubled"},
    {"kind": "burst", "label": "Instant Almond Water burst"},
    {"kind": "clickX3", "label": "Click power tripled"},
    {"kind": "prodX3", "label": "Production tripled"},
    {"kind": "luck", "label": "Fortune surges (loot & events)"},
]
phenomena = []
for i, d in enumerate(phen):
    e = effects[i % len(effects)]
    phenomena.append({"id": d["slug"], "name": clean(d["title"]), "desc": clean(d["summary"]),
                      "hook": best_hook(d), "effect": e["kind"], "label": e["label"], "rating": d["rating"]})

# ---------- Emit TypeScript ----------
ts = "// AUTO-GENERATED from backrooms.db (Backrooms Wiki ARPG curation). Do not edit by hand.\n"
ts += "// Regenerate with: python3 scripts/gen_gamedata.py\n\n"
ts += """export type SceneKind = 'corridor' | 'office' | 'hotel' | 'dark' | 'water' | 'cave' | 'suburb' | 'field' | 'digital' | 'ruins' | 'void' | 'neon';
export interface Level { id: string; name: string; desc: string; hook: string; unlockCost: number; mult: number; rating: number; scene: SceneKind; verb: string; icon: string; hue: number; }
export interface Generator { id: string; name: string; desc: string; hook: string; baseCost: number; baseProd: number; rating: number; }
export type GearSlot = 'Weapon' | 'Light' | 'Armor' | 'Trinket';
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export interface GearStats { clickMult: number; prodMult: number; luck: number; crit: number; }
export interface Gear { id: string; name: string; desc: string; hook: string; slot: GearSlot; rarity: Rarity; cost: number; stats: GearStats; rating: number; dropLevel: number; }
export interface Encounter { id: string; name: string; desc: string; hook: string; boss: boolean; rating: number; }
export interface Finale { id: string; name: string; desc: string; hook: string; rating: number; }
export interface Phenomenon { id: string; name: string; desc: string; hook: string; effect: string; label: string; rating: number; }

"""


def emit(name, typ, arr):
    return f"export const {name}: {typ}[] = " + json.dumps(arr, indent=2) + ";\n\n"


ts += emit("LEVELS", "Level", levels)
ts += emit("GENERATORS", "Generator", generators)
ts += emit("GEAR", "Gear", gear)
ts += emit("ENCOUNTERS", "Encounter", encounters)
ts += "export const FINALE: Finale = " + json.dumps(finale, indent=2) + ";\n\n"
ts += emit("PHENOMENA", "Phenomenon", phenomena)

open(OUT, "w").write(ts)
print("levels", len(levels), "generators", len(generators), "gear", len(gear),
      "encounters", len(encounters), "phenomena", len(phenomena))
from collections import Counter
print("gear slots:", Counter(g["slot"] for g in gear))
print("gear rarities:", Counter(g["rarity"] for g in gear))
print("finale:", finale["name"])
print("level unlocks:", [l["unlockCost"] for l in levels[:8]], "...", levels[-1]["unlockCost"])
