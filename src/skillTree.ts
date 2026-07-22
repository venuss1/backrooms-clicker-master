// The Echo Tree — rebirth skill tree. Three branches with unique mechanics.
// Echoes are earned by rebirthing (Noclip Out) and spent on persistent tree nodes.

export type SkillBranch = 'wanderer' | 'architect' | 'noclipper';

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
  col: number; // column within branch: -1 (left), 0 (center), 1 (right)
}

export interface SkillBonuses {
  clickMult: number; // multiplicative click power
  prodMult: number; // multiplicative production
  comboDecayMs: number; // combo decay delay (default 900)
  comboBuildMult: number; // combo build speed multiplier
  comboCapBonus: number; // bonus added to combo cap (default 7)
  critAdd: number; // additive crit chance
  critMult: number; // crit multiplier (default 7)
  luckAdd: number; // additive luck
  gearStatMult: number; // multiplier to gear bonus portion
  buffDurationMult: number; // buff duration multiplier
  expeditionLootMult: number; // expedition loot multiplier
  expeditionRiskMult: number; // expedition risk multiplier
  allyCostGrowth: number; // ally cost growth exponent (default 1.15)
  xpMult: number; // xp gain multiplier
  awMult: number; // almond water gain multiplier
  scavengeMult: number; // scavenge speed multiplier
  abyssRoomMult: number; // abyss per-room bonus (default 0.02)
  abyssCap: number; // abyss room cap (default 50)
  clickGainsProdPct: number; // % of production gained per click
  prodXpLevelBonus: number; // production *= (1 + xpLevel * this)
  expeditionAnyDepth: boolean; // expeditions find gear from any depth
  allySynergyPct: number; // +% prod per owned ally type
  burstMult: number; // phenomena burst multiplier
  rarityShift: number; // shifts rarity weights toward rarer
}

// Radial layout: 3 branches at 120° apart, each growing outward from center.
// Center is at (1200, 1200). Each branch has a binary tree structure.
const CENTER = { x: 1200, y: 1200 };
const BRANCH_ANGLE: Record<SkillBranch, number> = {
  wanderer: -90,   // up
  architect: 30,   // lower-right
  noclipper: 150,  // lower-left
};
const TIER_RADIUS = [280, 440, 600, 760, 940]; // distance from center per tier
const COL_SPREAD = [0, 90, 110, 110, 0]; // perpendicular offset per tier (0 for single-node tiers)

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
export const TREE_BOUNDS = { x: 0, y: 0, w: 2400, h: 2400 };

export const SKILL_NODES: SkillNode[] = [
  // ===== WANDERER (active clicking) — points up =====
  { id: 'w-restless', name: 'Restless', desc: '+25% click power per rank', icon: '⚡', branch: 'wanderer', tier: 0, cost: 1, maxRanks: 3, requires: [], col: 0, ...branchPos('wanderer', 0, 0) },
  { id: 'w-resonance', name: 'Resonance', desc: 'Combo holds for 2.5s instead of 0.9s', icon: '〰', branch: 'wanderer', tier: 1, cost: 2, maxRanks: 1, requires: ['w-restless'], col: -1, ...branchPos('wanderer', 1, -1) },
  { id: 'w-frenzy', name: 'Frenzy', desc: 'Combo builds 60% faster', icon: '🔥', branch: 'wanderer', tier: 1, cost: 2, maxRanks: 1, requires: ['w-restless'], col: 1, ...branchPos('wanderer', 1, 1) },
  { id: 'w-keeneye', name: 'Keen Eye', desc: '+10% crit chance', icon: '✧', branch: 'wanderer', tier: 2, cost: 3, maxRanks: 1, requires: ['w-resonance'], col: -1, ...branchPos('wanderer', 2, -1) },
  { id: 'w-phasing', name: 'Phasing', desc: '20% chance per click for double combo gain', icon: '◈', branch: 'wanderer', tier: 2, cost: 3, maxRanks: 1, requires: ['w-frenzy'], col: 1, ...branchPos('wanderer', 2, 1) },
  { id: 'w-execution', name: 'Execution', desc: 'Crit multiplier 7x → 10x', icon: '⚔', branch: 'wanderer', tier: 3, cost: 4, maxRanks: 1, requires: ['w-keeneye'], col: -1, ...branchPos('wanderer', 3, -1) },
  { id: 'w-perpetual', name: 'Perpetual Motion', desc: 'Combo cap raised from 8x to 12x', icon: '∞', branch: 'wanderer', tier: 3, cost: 4, maxRanks: 1, requires: ['w-phasing'], col: 1, ...branchPos('wanderer', 3, 1) },
  { id: 'w-transcend', name: 'Transcendence', desc: 'Clicking also grants 50% of your per-second production', icon: '★', branch: 'wanderer', tier: 4, cost: 5, maxRanks: 1, requires: ['w-execution', 'w-perpetual'], col: 0, ...branchPos('wanderer', 4, 0) },

  // ===== ARCHITECT (idle production) — points lower-right =====
  { id: 'a-foundation', name: 'Foundation', desc: '+30% ally production per rank', icon: '⚙', branch: 'architect', tier: 0, cost: 1, maxRanks: 3, requires: [], col: 0, ...branchPos('architect', 0, 0) },
  { id: 'a-efficiency', name: 'Efficiency', desc: 'Ally cost growth 1.15 → 1.12', icon: '▼', branch: 'architect', tier: 1, cost: 3, maxRanks: 1, requires: ['a-foundation'], col: -1, ...branchPos('architect', 1, -1) },
  { id: 'a-synergy', name: 'Synergy', desc: '+5% production for each ally type you own', icon: '⬡', branch: 'architect', tier: 1, cost: 3, maxRanks: 1, requires: ['a-foundation'], col: 1, ...branchPos('architect', 1, 1) },
  { id: 'a-overclock', name: 'Overclock', desc: 'Buffs last 60% longer', icon: '⏱', branch: 'architect', tier: 2, cost: 3, maxRanks: 1, requires: ['a-efficiency'], col: -1, ...branchPos('architect', 2, -1) },
  { id: 'a-mirror', name: 'Mirror', desc: 'Phenomena bursts are 100% stronger', icon: '◈', branch: 'architect', tier: 2, cost: 3, maxRanks: 1, requires: ['a-synergy'], col: 1, ...branchPos('architect', 2, 1) },
  { id: 'a-deepwells', name: 'Deep Wells', desc: '+50% Almond Water gains', icon: '💧', branch: 'architect', tier: 3, cost: 4, maxRanks: 1, requires: ['a-overclock'], col: -1, ...branchPos('architect', 3, -1) },
  { id: 'a-automaton', name: 'Automaton', desc: 'Scavenge meter fills 2.5x faster', icon: '⬢', branch: 'architect', tier: 3, cost: 4, maxRanks: 1, requires: ['a-mirror'], col: 1, ...branchPos('architect', 3, 1) },
  { id: 'a-singularity', name: 'Singularity', desc: 'Production × (1 + Explorer level × 0.05)', icon: '◉', branch: 'architect', tier: 4, cost: 5, maxRanks: 1, requires: ['a-deepwells', 'a-automaton'], col: 0, ...branchPos('architect', 4, 0) },

  // ===== NOCLIPPER (exploration & loot) — points lower-left =====
  { id: 'n-sleuth', name: 'Sleuth', desc: '+15% luck per rank', icon: '🍀', branch: 'noclipper', tier: 0, cost: 1, maxRanks: 2, requires: [], col: 0, ...branchPos('noclipper', 0, 0) },
  { id: 'n-scavenger', name: 'Scavenger', desc: 'Gear stats 25% stronger', icon: '🎒', branch: 'noclipper', tier: 1, cost: 3, maxRanks: 1, requires: ['n-sleuth'], col: -1, ...branchPos('noclipper', 1, -1) },
  { id: 'n-delver', name: 'Delver', desc: 'Expedition loot +50%, risk -25%', icon: '🗺', branch: 'noclipper', tier: 1, cost: 3, maxRanks: 1, requires: ['n-sleuth'], col: 1, ...branchPos('noclipper', 1, 1) },
  { id: 'n-lucky', name: 'Lucky Streak', desc: 'Legendary drop weight ×3, epic ×2', icon: '✦', branch: 'noclipper', tier: 2, cost: 3, maxRanks: 1, requires: ['n-scavenger'], col: -1, ...branchPos('noclipper', 2, -1) },
  { id: 'n-abyssal', name: 'Abyssal Tether', desc: 'Abyss bonus +3%/room (was 2%), cap 75', icon: '▾', branch: 'noclipper', tier: 2, cost: 4, maxRanks: 1, requires: ['n-delver'], col: 1, ...branchPos('noclipper', 2, 1) },
  { id: 'n-hoarder', name: 'Hoarder', desc: 'All gear stats +40% (stacks with Scavenger)', icon: '💰', branch: 'noclipper', tier: 3, cost: 4, maxRanks: 1, requires: ['n-lucky'], col: -1, ...branchPos('noclipper', 3, -1) },
  { id: 'n-deepdive', name: 'Deep Dive', desc: 'Expedition loot doubled again', icon: '⬇', branch: 'noclipper', tier: 3, cost: 4, maxRanks: 1, requires: ['n-abyssal'], col: 1, ...branchPos('noclipper', 3, 1) },
  { id: 'n-apex', name: 'Apex Explorer', desc: 'Expeditions find gear from any depth', icon: '✧', branch: 'noclipper', tier: 4, cost: 5, maxRanks: 1, requires: ['n-hoarder', 'n-deepdive'], col: 0, ...branchPos('noclipper', 4, 0) },
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
  // Node is visible if its requires are met OR already purchased
  if (skillRank(skills, node.id) > 0) return true;
  return node.requires.every((req) => skillRank(skills, req) >= 1);
}

// Compute all skill bonuses from purchased nodes
export function computeBonuses(skills: Record<string, number>): SkillBonuses {
  const r = (id: string) => skillRank(skills, id);
  const b: SkillBonuses = {
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
  };

  // Wanderer
  b.clickMult *= 1 + 0.25 * r('w-restless');
  if (r('w-resonance')) b.comboDecayMs = 2500;
  if (r('w-frenzy')) b.comboBuildMult *= 1.6;
  if (r('w-keeneye')) b.critAdd += 0.10;
  // Phasing handled in doClick via comboBuildMult bonus chance
  if (r('w-execution')) b.critMult = 10;
  if (r('w-perpetual')) b.comboCapBonus += 4; // 7 → 11, cap 8x → 12x
  if (r('w-transcend')) b.clickGainsProdPct = 0.50;

  // Architect
  b.prodMult *= 1 + 0.30 * r('a-foundation');
  if (r('a-efficiency')) b.allyCostGrowth = 1.12;
  if (r('a-synergy')) b.allySynergyPct = 0.05;
  if (r('a-overclock')) b.buffDurationMult *= 1.6;
  if (r('a-mirror')) b.burstMult *= 2;
  if (r('a-deepwells')) b.awMult *= 1.5;
  if (r('a-automaton')) b.scavengeMult *= 2.5;
  if (r('a-singularity')) b.prodXpLevelBonus = 0.05;

  // Noclipper
  b.luckAdd += 0.15 * r('n-sleuth');
  if (r('n-scavenger')) b.gearStatMult *= 1.25;
  if (r('n-delver')) { b.expeditionLootMult *= 1.5; b.expeditionRiskMult *= 0.75; }
  if (r('n-lucky')) b.rarityShift = 1;
  if (r('n-abyssal')) { b.abyssRoomMult = 0.03; b.abyssCap = 75; }
  if (r('n-hoarder')) b.gearStatMult *= 1.4;
  if (r('n-deepdive')) b.expeditionLootMult *= 2;
  if (r('n-apex')) b.expeditionAnyDepth = true;

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
