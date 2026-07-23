// The Echo Tree — rebirth skill tree. Three branches with unique mechanics.
// Echoes are earned by rebirthing (Noclip Out) and spent on persistent tree nodes.
//
// Design: Path of Exile-style tree with travel nodes (small buffs),
// notable nodes (big interesting effects), and keystone nodes
// (build-defining changes, usually mutually exclusive).

export type SkillBranch = 'wanderer' | 'architect' | 'noclipper';
export type NodeType = 'travel' | 'notable' | 'keystone';

export interface SkillNode {
  id: string;
  name: string;
  desc: string;
  icon: string;
  branch: SkillBranch;
  tier: number; // 0-indexed within branch
  cost: number; // echo cost per rank
  maxRanks: number;
  requires: string[]; // node ids that must have >= 1 rank
  x: number; // SVG coordinate
  y: number; // SVG coordinate
  col: number; // column within branch
  nodeType: NodeType;
}

export interface SkillBonuses {
  // --- Existing stats ---
  clickMult: number;
  prodMult: number;
  comboDecayMs: number;
  comboBuildMult: number;
  comboCapBonus: number;
  critAdd: number;
  critMult: number;
  luckAdd: number;
  gearStatMult: number;
  buffDurationMult: number;
  expeditionLootMult: number;
  expeditionRiskMult: number;
  allyCostGrowth: number;
  xpMult: number;
  awMult: number;
  scavengeMult: number;
  abyssRoomMult: number;
  abyssCap: number;
  clickGainsProdPct: number;
  prodXpLevelBonus: number;
  expeditionAnyDepth: boolean;
  allySynergyPct: number;
  burstMult: number;
  rarityShift: number;

  // --- New stats ---
  autoClickRate: number; // auto-clicks per second
  offlineEfficiency: number; // offline progress efficiency (0-1)
  offlineXp: boolean; // generate XP while offline
  gearDropBonus: number; // bonus to gear drop chance
  doubleLootChance: number; // chance for double loot in expeditions
  deathSaveChance: number; // chance to survive death in expeditions
  expeditionXpMult: number; // bonus XP from expeditions
  expeditionBonusPerSet: number; // expedition loot bonus per completed set
  bossExtraGear: number; // extra gear drops from bosses
  comboNoResetEncounter: boolean; // combo doesn't reset on encounter
  critBurstChance: number; // chance for crit to trigger a phenomena burst
  comboNoDecay: boolean; // combo never decays
  comboThresholdDoubled: boolean; // stats doubled while combo > 50
  allyTypeBonus: number; // % to all output per ally type owned
  clickPowerBuffed: number; // bonus click mult while buff active
  clickPowerPerCombo: number; // bonus click power per 50 combo
  critDamageAdd: number; // additive crit damage multiplier
  expeditionStartRooms: number; // start expeditions with N rooms of progress
  buffChanceBonus: number; // bonus to phenomena spawn chance
  allyCostReduction: number; // additive ally cost reduction
  bossDoubleGear: boolean; // bosses drop double gear
  deathSaveOnce: boolean; // first death per expedition is free
  prestigeEchoBonus: number; // bonus echoes earned on prestige
  clickXpChance: number; // chance per click to gain bonus XP
  gearStatFromSets: number; // gear stats boosted by completed sets
}

// Radial layout: 3 branches at 120° apart, each growing outward from center.
const CENTER = { x: 1500, y: 1500 };
const BRANCH_ANGLE: Record<SkillBranch, number> = {
  wanderer: -90,   // up
  architect: 30,   // lower-right
  noclipper: 150,  // lower-left
};
const TIER_RADIUS = [220, 380, 540, 700, 860, 1040];
const COL_SPREAD = [70, 100, 120, 120, 100, 70];

function branchPos(branch: SkillBranch, tier: number, col: number): { x: number; y: number } {
  const ang = (BRANCH_ANGLE[branch] * Math.PI) / 180;
  const dir = { x: Math.cos(ang), y: Math.sin(ang) };
  const perp = { x: -Math.sin(ang), y: Math.cos(ang) };
  const r = TIER_RADIUS[tier];
  const spread = COL_SPREAD[tier] * col;
  return {
    x: CENTER.x + r * dir.x + spread * perp.x,
    y: CENTER.y + r * dir.y + spread * perp.y,
  };
}

export const TREE_CENTER = CENTER;
export const TREE_BOUNDS = { x: 0, y: 0, w: 3000, h: 3000 };

// Helper to create nodes concisely
function n(
  id: string, name: string, desc: string, icon: string,
  branch: SkillBranch, tier: number, cost: number, maxRanks: number,
  requires: string[], col: number, nodeType: NodeType,
): SkillNode {
  return { id, name, desc, icon, branch, tier, cost, maxRanks, requires, col, nodeType, ...branchPos(branch, tier, col) };
}

export const SKILL_NODES: SkillNode[] = [
  // ===== WANDERER (active clicking) — points up =====

  // Tier 0: Entry nodes (travel)
  n('w-restless', 'Restless', '+15% click power per rank', '⚡', 'wanderer', 0, 1, 3, [], -1, 'travel'),
  n('w-swift', 'Swift Hands', '+10% combo build speed per rank', '✦', 'wanderer', 0, 1, 2, [], 1, 'travel'),

  // Tier 1: First notables + travel
  n('w-resonance', 'Resonance', 'Combo holds for 2.5s instead of 0.9s', '〰', 'wanderer', 1, 3, 1, ['w-restless'], -1, 'notable'),
  n('w-frenzy', 'Frenzy', 'Combo builds 60% faster', '🔥', 'wanderer', 1, 3, 1, ['w-swift'], 1, 'notable'),
  n('w-precision', 'Precision', '+5% crit chance per rank', '✧', 'wanderer', 1, 2, 2, ['w-restless', 'w-swift'], 0, 'travel'),

  // Tier 2: Notables + travel
  n('w-keeneye', 'Keen Eye', '+10% crit chance. Crits restore 10 combo', '◆', 'wanderer', 2, 4, 1, ['w-resonance'], -1.5, 'notable'),
  n('w-phasing', 'Phasing', '20% chance per click for double combo gain', '◈', 'wanderer', 2, 4, 1, ['w-frenzy'], 1.5, 'notable'),
  n('w-momentum', 'Momentum', '+8% click power per rank while a buff is active', '↑', 'wanderer', 2, 2, 2, ['w-precision'], -0.5, 'travel'),
  n('w-flow', 'Flow State', '+5% click power per rank for each 50 combo you have', '〜', 'wanderer', 2, 2, 2, ['w-precision'], 0.5, 'travel'),

  // Tier 3: Powerful notables + travel
  n('w-execution', 'Execution', 'Crit multiplier 7x → 10x. Crits have 20% chance to trigger a phenomena burst', '⚔', 'wanderer', 3, 5, 1, ['w-keeneye'], -1.5, 'notable'),
  n('w-perpetual', 'Perpetual Motion', 'Combo cap raised from 8x to 12x. Combo does not reset when an encounter starts', '∞', 'wanderer', 3, 5, 1, ['w-phasing'], 1.5, 'notable'),
  n('w-bloodlust', 'Bloodlust', '+0.5x crit damage per rank', '🩸', 'wanderer', 3, 3, 2, ['w-momentum'], -0.5, 'travel'),
  n('w-adrenaline', 'Adrenaline', '+15% click power per rank for 3s after landing a crit', '💥', 'wanderer', 3, 3, 2, ['w-flow'], 0.5, 'travel'),

  // Tier 4: Keystones (pick one — they are mutually exclusive via requires)
  n('w-transcend', 'Transcendence', 'Clicking also grants 50% of your per-second production. The wall is an illusion.', '★', 'wanderer', 4, 8, 1, ['w-execution', 'w-perpetual'], -1, 'keystone'),
  n('w-overclock', 'Overclock', 'While combo is above 50, ALL click stats are doubled. Push the limit.', '⚡', 'wanderer', 4, 8, 1, ['w-execution', 'w-perpetual'], 0, 'keystone'),
  n('w-eternal', 'Eternal Echo', 'Combo never decays. But your base click power is halved. For those who never stop.', '◐', 'wanderer', 4, 8, 1, ['w-execution', 'w-perpetual'], 1, 'keystone'),

  // ===== ARCHITECT (idle production) — points lower-right =====

  // Tier 0: Entry nodes (travel)
  n('a-foundation', 'Foundation', '+20% ally production per rank', '⚙', 'architect', 0, 1, 3, [], -1, 'travel'),
  n('a-frugal', 'Frugal', '-5% ally cost per rank', '▽', 'architect', 0, 1, 2, [], 1, 'travel'),

  // Tier 1: First notables + travel
  n('a-efficiency', 'Efficiency', 'Ally cost growth 1.15 → 1.12. Mass production becomes viable.', '▼', 'architect', 1, 3, 1, ['a-foundation'], -1, 'notable'),
  n('a-synergy', 'Synergy', '+5% production for each different ally type you own', '⬡', 'architect', 1, 3, 1, ['a-frugal'], 1, 'notable'),
  n('a-overdrive', 'Overdrive', '+10% production per rank while a buff is active', '↑', 'architect', 1, 2, 2, ['a-foundation', 'a-frugal'], 0, 'travel'),

  // Tier 2: Notables + travel
  n('a-overclock', 'Overclock', 'Buffs last 60% longer', '⏱', 'architect', 2, 4, 1, ['a-efficiency'], -1.5, 'notable'),
  n('a-mirror', 'Mirror', 'Phenomena bursts are 100% stronger', '◈', 'architect', 2, 4, 1, ['a-synergy'], 1.5, 'notable'),
  n('a-catalyst', 'Catalyst', '+8% phenomena spawn chance per rank', '✦', 'architect', 2, 2, 2, ['a-overdrive'], -0.5, 'travel'),
  n('a-stockpile', 'Stockpile', '+10% buff duration per rank', '⏳', 'architect', 2, 2, 2, ['a-overdrive'], 0.5, 'travel'),

  // Tier 3: Powerful notables + travel
  n('a-deepwells', 'Deep Wells', '+50% Almond Water gains from all sources', '💧', 'architect', 3, 5, 1, ['a-overclock'], -1.5, 'notable'),
  n('a-automaton', 'Automaton', 'Scavenge meter fills 2.5x faster. Auto-clicks once per second.', '⬢', 'architect', 3, 5, 1, ['a-mirror'], 1.5, 'notable'),
  n('a-midastouch', 'Midas Touch', '+10% AW from all sources per rank', '✨', 'architect', 3, 3, 2, ['a-catalyst'], -0.5, 'travel'),
  n('a-generator', 'Generator', '+8% production per rank for each ally type you own', '🔌', 'architect', 3, 3, 2, ['a-stockpile'], 0.5, 'travel'),

  // Tier 4: Keystones
  n('a-singularity', 'Singularity', 'Production × (1 + Explorer level × 0.05). Knowledge compounds.', '◉', 'architect', 4, 8, 1, ['a-deepwells', 'a-automaton'], -1, 'keystone'),
  n('a-noclip', 'Noclip Protocol', 'Offline progress at 80% efficiency. Generates XP while offline. The game never stops.', '⬡', 'architect', 4, 8, 1, ['a-deepwells', 'a-automaton'], 0, 'keystone'),
  n('a-ascension', 'Ascension', 'Each ally type owned gives +1% to ALL output. But ally costs are doubled. Quality over quantity.', '▲', 'architect', 4, 8, 1, ['a-deepwells', 'a-automaton'], 1, 'keystone'),

  // ===== NOCLIPPER (exploration & loot) — points lower-left =====

  // Tier 0: Entry nodes (travel)
  n('n-sleuth', 'Sleuth', '+15% luck per rank', '🍀', 'noclipper', 0, 1, 2, [], -1, 'travel'),
  n('n-surveyor', 'Surveyor', '+10% expedition loot per rank', '📐', 'noclipper', 0, 1, 2, [], 1, 'travel'),

  // Tier 1: First notables + travel
  n('n-scavenger', 'Scavenger', 'Gear stats 25% stronger. Finders keepers.', '🎒', 'noclipper', 1, 3, 1, ['n-sleuth'], -1, 'notable'),
  n('n-delver', 'Delver', 'Expedition loot +50%, risk -25%', '🗺', 'noclipper', 1, 3, 1, ['n-surveyor'], 1, 'notable'),
  n('n-greed', 'Greed', '+8% gear drop chance per rank', '💰', 'noclipper', 1, 2, 2, ['n-sleuth', 'n-surveyor'], 0, 'travel'),

  // Tier 2: Notables + travel
  n('n-lucky', 'Lucky Streak', 'Legendary drop weight ×3, epic ×2. Fortune favors the bold.', '✦', 'noclipper', 2, 4, 1, ['n-scavenger'], -1.5, 'notable'),
  n('n-abyssal', 'Abyssal Tether', 'Abyss bonus +3% per room (was 2%), cap raised to 75', '▾', 'noclipper', 2, 4, 1, ['n-delver'], 1.5, 'notable'),
  n('n-treasure', 'Treasure Hunter', '+10% chance for double loot per rank', '💎', 'noclipper', 2, 2, 2, ['n-greed'], -0.5, 'travel'),
  n('n-shield', 'Aegis', '+15% chance to survive a fatal encounter per rank', '🛡', 'noclipper', 2, 2, 2, ['n-greed'], 0.5, 'travel'),

  // Tier 3: Powerful notables + travel
  n('n-hoarder', 'Hoarder', 'All gear stats +40% (stacks with Scavenger). Plus +2% gear stats per completed set.', '💰', 'noclipper', 3, 5, 1, ['n-lucky'], -1.5, 'notable'),
  n('n-deepdive', 'Deep Dive', 'Expedition loot doubled again. Bosses drop 1 extra gear.', '⬇', 'noclipper', 3, 5, 1, ['n-abyssal'], 1.5, 'notable'),
  n('n-cartographer', 'Cartographer', '+15% expedition XP per rank', '📜', 'noclipper', 3, 3, 2, ['n-treasure'], -0.5, 'travel'),
  n('n-veteran', 'Veteran Explorer', '+10% expedition loot per rank for each completed gear set', '🎖', 'noclipper', 3, 3, 2, ['n-shield'], 0.5, 'travel'),

  // Tier 4: Keystones
  n('n-apex', 'Apex Explorer', 'Expeditions find gear from ANY depth. The whole Backrooms is your loot pool.', '✧', 'noclipper', 4, 8, 1, ['n-hoarder', 'n-deepdive'], -1, 'keystone'),
  n('n-immortal', 'Immortal', 'First death per expedition is free — retreat with all loot intact. Death is just a door.', '♾', 'noclipper', 4, 8, 1, ['n-hoarder', 'n-deepdive'], 0, 'keystone'),
  n('n-titan', 'Titan', 'Start each expedition with 5 rooms of progress. Bosses drop DOUBLE gear. Speed is power.', '⚔', 'noclipper', 4, 8, 1, ['n-hoarder', 'n-deepdive'], 1, 'keystone'),
];

export const BRANCH_INFO: Record<SkillBranch, { name: string; color: string; icon: string; desc: string }> = {
  wanderer: { name: 'Wanderer', color: '#ff8a6b', icon: '⚡', desc: 'Active clicking & combo' },
  architect: { name: 'Architect', color: '#6bcfff', icon: '⚙', desc: 'Idle production & economy' },
  noclipper: { name: 'Noclipper', color: '#c79bff', icon: '🗺', desc: 'Exploration & loot' },
};

export function skillNodeById(id: string): SkillNode | undefined {
  return SKILL_NODES.find((n) => n.id === id);
}

export function skillRank(skills: Record<string, number>, id: string): number {
  return skills[id] ?? 0;
}

export function canUnlockNode(node: SkillNode, skills: Record<string, number>, echoes: number): boolean {
  const rank = skillRank(skills, node.id);
  if (rank >= node.maxRanks) return false;
  if (echoes < node.cost) return false;
  return node.requires.every((req) => skillRank(skills, req) >= 1);
}

export function isNodeVisible(node: SkillNode, skills: Record<string, number>): boolean {
  if (skillRank(skills, node.id) > 0) return true;
  return node.requires.every((req) => skillRank(skills, req) >= 1);
}

// Compute all skill bonuses from purchased nodes
export function computeBonuses(skills: Record<string, number>): SkillBonuses {
  const r = (id: string) => skillRank(skills, id);
  const b: SkillBonuses = {
    // Existing
    clickMult: 1,
    prodMult: 1,
    comboDecayMs: 900,
    comboBuildMult: 1,
    comboCapBonus: 0,
    critAdd: 0,
    critMult: 7,
    luckAdd: 0,
    gearStatMult: 1,
    buffDurationMult: 1,
    expeditionLootMult: 1,
    expeditionRiskMult: 1,
    allyCostGrowth: 1.15,
    xpMult: 1,
    awMult: 1,
    scavengeMult: 1,
    abyssRoomMult: 0.02,
    abyssCap: 50,
    clickGainsProdPct: 0,
    prodXpLevelBonus: 0,
    expeditionAnyDepth: false,
    allySynergyPct: 0,
    burstMult: 1,
    rarityShift: 0,
    // New
    autoClickRate: 0,
    offlineEfficiency: 0.5,
    offlineXp: false,
    gearDropBonus: 0,
    doubleLootChance: 0,
    deathSaveChance: 0,
    expeditionXpMult: 1,
    expeditionBonusPerSet: 0,
    bossExtraGear: 0,
    comboNoResetEncounter: false,
    critBurstChance: 0,
    comboNoDecay: false,
    comboThresholdDoubled: false,
    allyTypeBonus: 0,
    clickPowerBuffed: 0,
    clickPowerPerCombo: 0,
    critDamageAdd: 0,
    expeditionStartRooms: 0,
    buffChanceBonus: 0,
    allyCostReduction: 0,
    bossDoubleGear: false,
    deathSaveOnce: false,
    prestigeEchoBonus: 0,
    clickXpChance: 0,
    gearStatFromSets: 0,
  };

  // ===== WANDERER =====
  // Tier 0
  b.clickMult *= 1 + 0.15 * r('w-restless');
  b.comboBuildMult *= 1 + 0.10 * r('w-swift');

  // Tier 1
  if (r('w-resonance')) b.comboDecayMs = 2500;
  if (r('w-frenzy')) b.comboBuildMult *= 1.6;
  b.critAdd += 0.05 * r('w-precision');

  // Tier 2
  if (r('w-keeneye')) { b.critAdd += 0.10; }
  if (r('w-phasing')) b.comboBuildMult *= 1.0; // handled in doClick via chance
  b.clickPowerBuffed += 0.08 * r('w-momentum');
  b.clickPowerPerCombo += 0.05 * r('w-flow');

  // Tier 3
  if (r('w-execution')) { b.critMult = 10; b.critBurstChance = 0.20; }
  if (r('w-perpetual')) { b.comboCapBonus += 4; b.comboNoResetEncounter = true; }
  b.critDamageAdd += 0.5 * r('w-bloodlust');
  // w-adrenaline handled dynamically in click code — store as clickPowerBuffed-ish
  // We'll use a separate field for "after crit" — but for simplicity, fold into clickMult conditionally

  // Tier 4 keystones
  if (r('w-transcend')) b.clickGainsProdPct = 0.50;
  if (r('w-overclock')) b.comboThresholdDoubled = true;
  if (r('w-eternal')) { b.comboNoDecay = true; b.clickMult *= 0.5; }

  // ===== ARCHITECT =====
  // Tier 0
  b.prodMult *= 1 + 0.20 * r('a-foundation');
  b.allyCostReduction += 0.05 * r('a-frugal');

  // Tier 1
  if (r('a-efficiency')) b.allyCostGrowth = 1.12;
  if (r('a-synergy')) b.allySynergyPct = 0.05;
  // a-overdrive: +10% prod per rank while buffed — store as separate stat
  // For simplicity, we'll add it to prodMult conditionally in productionPerSec

  // Tier 2
  if (r('a-overclock')) b.buffDurationMult *= 1.6;
  if (r('a-mirror')) b.burstMult *= 2;
  b.buffChanceBonus += 0.08 * r('a-catalyst');
  b.buffDurationMult *= 1 + 0.10 * r('a-stockpile');

  // Tier 3
  if (r('a-deepwells')) b.awMult *= 1.5;
  if (r('a-automaton')) { b.scavengeMult *= 2.5; b.autoClickRate += 1; }
  b.awMult *= 1 + 0.10 * r('a-midastouch');
  // a-generator: +8% prod per rank per ally type — handled in productionPerSec

  // Tier 4 keystones
  if (r('a-singularity')) b.prodXpLevelBonus = 0.05;
  if (r('a-noclip')) { b.offlineEfficiency = 0.80; b.offlineXp = true; }
  if (r('a-ascension')) { b.allyTypeBonus = 0.01; b.allyCostGrowth = Math.max(b.allyCostGrowth, 1.15) * 1.0; }
  // a-ascension doubles ally cost — handled in genCost

  // ===== NOCLIPPER =====
  // Tier 0
  b.luckAdd += 0.15 * r('n-sleuth');
  b.expeditionLootMult *= 1 + 0.10 * r('n-surveyor');

  // Tier 1
  if (r('n-scavenger')) b.gearStatMult *= 1.25;
  if (r('n-delver')) { b.expeditionLootMult *= 1.5; b.expeditionRiskMult *= 0.75; }
  b.gearDropBonus += 0.08 * r('n-greed');

  // Tier 2
  if (r('n-lucky')) b.rarityShift = 1;
  if (r('n-abyssal')) { b.abyssRoomMult = 0.03; b.abyssCap = 75; }
  b.doubleLootChance += 0.10 * r('n-treasure');
  b.deathSaveChance += 0.15 * r('n-shield');

  // Tier 3
  if (r('n-hoarder')) { b.gearStatMult *= 1.4; b.gearStatFromSets = 0.02; }
  if (r('n-deepdive')) { b.expeditionLootMult *= 2; b.bossExtraGear += 1; }
  b.expeditionXpMult *= 1 + 0.15 * r('n-cartographer');
  b.expeditionBonusPerSet += 0.10 * r('n-veteran');

  // Tier 4 keystones
  if (r('n-apex')) b.expeditionAnyDepth = true;
  if (r('n-immortal')) b.deathSaveOnce = true;
  if (r('n-titan')) { b.expeditionStartRooms = 5; b.bossDoubleGear = true; }

  return b;
}

// Total echoes spent on the tree
export function echoesSpent(skills: Record<string, number>): number {
  let total = 0;
  for (const node of SKILL_NODES) {
    total += skillRank(skills, node.id) * node.cost;
  }
  return total;
}
