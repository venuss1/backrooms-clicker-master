# NO-CLIP — an ADHD-friendly Backrooms clicker

A cinematic incremental / clicker game set in the Backrooms, built with **React + TypeScript + Vite**.
All of the game content (levels, allies, equippable gear, enemies, bosses, world events) is generated
from a crawl of the **Backrooms Wiki** stored in `backrooms.db` — specifically the curated
`arpg_source_pages` / `arpg_design_hooks` tables.

## How to run

```bash
npm install
npm run dev      # http://localhost:5173
```

Other scripts:

```bash
npm run build    # type-check + production build to dist/
npm run lint     # oxlint
npm run preview  # serve the production build
```

## The game

You are lost in the Backrooms. **Explore** each level (the click action + backdrop change every
depth) to earn **Almond Water (AW)**, recruit **allies** for passive income, **find & equip gear**
that drops as you play, and **noclip deeper** through 36 real wiki levels. Reach the bottom,
defeat the finale, then **Noclip Out** (rebirth) for permanent **Echoes** and do it all again,
stronger.

### Cinematic visuals & transitions

- **A unique scene per level** — the click target sits inside a bespoke animated backdrop that
  matches the level: a receding corridor, a flickering office grid, a submerged caustic dungeon,
  raining code, a starfield with a glowing core, a neon red-light haze, and more (`Scene.tsx`).
  The **click action itself changes too** — PHASE, WADE, RUMMAGE, GLITCH, DRIFT… with its own icon.
- **Living background** — a full-screen animated canvas (drifting motes, spores, ash, rain,
  stars) layered over shifting radial gradients, a scrolling liminal grid, fog and vignette.
- **12 depth themes** — the whole palette (and particle style) morphs as you descend, from the
  yellow "Threshold" to the near-black "Abyss". Colors crossfade seamlessly (`themes.ts`).
- **Climactic descent** — every time you reach a new level a full-screen "DEPTH N" transition
  sweeps in with a downward audio sweep.
- Polished micro-animations everywhere: shimmering bars, floating crit numbers, breathing glow,
  rarity-tinted gear, animated encounter/finale overlays, tab crossfades.

### Progression & (more complex) formulas

Slower, deeper curves than a typical idle game (see `useGame.ts` / `scripts/gen_gamedata.py`):

- **Level unlock:** `120·3.35^i + 40·i³` (geometric + cubic — descents take real investment).
- **Level multiplier:** `1 + 0.85·i + 0.15·i^1.4` (super-linear reward for going deep).
- **Ally cost:** `baseCost · 1.15^owned` (Cookie Clicker-standard per-unit growth, reducible to 1.12 via skills).
- **Combo:** softcapped `1 + (1 − e^(−combo/30))·(7 + capBonus)` (asymptotes ~×8, raisable to ×12 via skills).
- **Gear:** multiplicative click/production mults, additive **crit%** (×7 crit hits, cap 75%, both improvable via skills) and **luck%**
  (better loot & event odds). Drops use rarity weights (common 50% → legendary 2%, shiftable via skills).
- **Rebirth (Echo Tree):** Echoes = `⌊∛(lifetimeAW / 1e5)⌋`. Rebirth is available early — no need to reach
  the end. Echoes are spent on a **skill tree** with three branches (Wanderer, Architect, Noclipper),
  24 nodes with unique mechanics (combo decay, crit mult, gear stat boosts, expedition loot, etc.).
  Skills persist through rebirths.
- **Level gating by rebirths:** Levels 0–23 are always available. Levels 24–30 require 1+ rebirths.
  Levels 31–35 (including the finale) require 3+ rebirths. This is separate from the skill tree.
- **Perks:** stackable with diminishing returns (each duplicate adds 70% of the previous).
- **Abyss:** `1 + min(cap, deepestRoom)·roomMult` (capped at ×2, improvable to ×3.25 via skills).

### Gear that drops from levels

Every wiki **object** becomes a piece of gear with a rarity (common → legendary) and stats.
Gear is **never bought — it drops from the level it belongs to.** Each item is assigned a home
depth (cheap gear shallow, powerful gear deep); a **Scavenge** meter fills as you play that
depth (clicking speeds it up) and rewards you with an item you haven't found yet. The Gear tab
doubles as an inventory + field guide, showing where undiscovered gear drops. Four slots —
**Weapon / Light / Armor / Trinket** — equip/unequip freely. Gear (and Echoes, skills) are kept through
prestige, so each run starts stronger.

### Explorer XP & roguelike perks

Everything you do — clicking, passive income, descending, escaping encounters, finding gear and
extracting expeditions — grants **Explorer XP** (`xpNeed(l) = ⌊80·1.32^l⌋`). Each Explorer level
adds a small permanent global bonus (`1 + 0.02·level`), and **every 2nd level hands you a perk
token**. Spending a token pops a **choose-1-of-3** overlay drawn from a stackable perk pool
(`perks.ts`): click power, ally production, luck, crit, AW gains, faster combo growth, more XP, or
richer/safer expeditions. Perks persist through prestige, so builds compound run-over-run.

### Expeditions (active, push-your-luck delving)

The real way to hunt gear. From the **Delve** tab you slip into the walls and go **room by room**;
each room rolls a database-driven event — a **cache**, a stalking **entity** (from the wiki's
enemies/bosses), a **forked passage**, or an anomaly **shrine** (from the wiki's phenomena). Every
event has real choices (fight / sneak / bribe, pry / search carefully, attune / gamble…). Loot
stays **unbanked**: each room you push deeper raises the **ambush risk**, and if you're caught the
whole haul is lost. **Extract** to bank the AW, XP and gear you've gathered. High risk, high reward,
never the same twice.

### Endgame — the finale & the Abyss

Reach the deepest level to unlock **Nostalgi Gaius**, the finale boss. Beat it to unlock **the
Abyss**: an endless, escalating expedition where rooms get richer and deadlier with no bottom. Your
**deepest Abyss room** is tracked forever and grants a **permanent ×(1 + 0.04·room)** multiplier to
all AW gains — so pushing one room deeper is always worth it. Then **Noclip Out** (prestige) to
reset your run for Echoes (skill tree currency); XP, perks and Abyss progress all carry over.

### ADHD-friendly design choices

- **Instant, juicy feedback** — every click pops a floating number, crit splashes, and a sound blip.
- **Combo streak** — clicking fast builds a multiplier, rewarding bursts of focus.
- **One clear goal at a time** — a big "Next level" progress bar is always visible.
- **Frequent dopamine** — steady stream of achievements, loot drops, unlocks, and toasts.
- **Novelty** — random **Phenomena** buffs and short **Encounters/Bosses** you mash to escape.
- **Accessibility** — one-tap **reduce-motion** (disables the canvas churn + transitions) and
  **sound** toggles; autosaves to `localStorage`.

### Where the data comes from

| Game concept | Source in `backrooms.db` |
|---|---|
| Levels (progression + depth theming) | pages with role `location` |
| Allies (idle generators) | roles `faction`, `npc` |
| Gear (equippable, 4 slots, rarities) | role `item` |
| Encounters / Bosses | roles `enemy`, `boss` |
| Finale (endgame boss) | boss "Nostalgi Gaius" |
| Phenomena (random buffs) | role `phenomenon` |
| Flavor text ("hooks") | `arpg_design_hooks.description` |

The dataset is baked into `src/gameData.ts` (auto-generated by `scripts/gen_gamedata.py` — do not edit by hand).
Regenerate with `python3 scripts/gen_gamedata.py`.

## Saves

Progress autosaves to `localStorage` under `backrooms-clicker-save-v3`. The redesign uses a new
save key, so pre-redesign saves start fresh. Use **Codex → Wipe everything** to hard-reset.
