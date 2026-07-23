import { useCallback, useEffect, useRef, useState } from 'react';
import {
  LEVELS,
  GENERATORS,
  GEAR,
  ENCOUNTERS,
  FINALE,
  PHENOMENA,
  type Encounter,
  type Phenomenon,
  type Gear,
  type GearSlot,
} from './gameData';
import { perkById, rollPerkChoices, type PerkKey } from './perks';
import { rollEvent, rollModifier, type Expedition, type ExpeditionMode } from './expedition';
import { sfx, setSfxVolume } from './sound';
import { computeBonuses, canUnlockNode, skillNodeById, type SkillBonuses } from './skillTree';

const SAVE_KEY = 'backrooms-clicker-save-v3';
export const CRIT_MULT = 7;
export const SLOTS: GearSlot[] = ['Weapon', 'Light', 'Armor', 'Trinket'];

export interface Settings {
  reduceMotion: boolean;
  sound: boolean;
  volume: number; // 0..1
}

export interface ActiveBuff {
  id: string;
  name: string;
  effect: string;
  label: string;
  until: number;
}

export interface PendingPhenomenon {
  id: string;
  name: string;
  effect: string;
  label: string;
  icon: string;
  spawned: number; // performance.now() when spawned
  expires: number; // performance.now() when the click window ends
  x: number; // target position (0-1 relative)
  y: number;
  vx: number; // velocity for flying movement
  vy: number;
}

export interface ActiveEncounter {
  id: string;
  name: string;
  desc: string;
  boss: boolean;
  isFinale: boolean;
  need: number;
  got: number;
  until: number | null; // null = no timer (finale)
  reward: number;
}

export interface Toast {
  id: number;
  kind: 'unlock' | 'achieve' | 'event' | 'win' | 'info' | 'loot' | 'prestige' | 'xp';
  text: string;
}

export interface GameState {
  aw: number;
  totalAw: number; // this run
  lifetimeAw: number; // across all prestiges
  clicks: number;
  generators: Record<string, number>;
  gearOwned: string[];
  gearDuplicates: Record<string, number>; // gearId → count of duplicate copies
  gearUpgrades: Record<string, number>; // gearId → upgrade level (0=base, 1=+10%, 2=+20%...)
  equipped: Partial<Record<GearSlot, string>>;
  levelIndex: number; // current level the player is exploring
  maxLevelReached: number; // deepest level ever unlocked (for going back)
  defeated: string[];
  achievements: string[];
  echoes: number; // unspent rebirth currency
  totalEchoes: number; // total echoes ever earned (for display)
  skills: Record<string, number>; // skill node id → ranks
  prestiges: number;
  finaleDefeated: boolean;
  finaleAvailable: boolean;
  settings: Settings;
  buff: ActiveBuff | null;
  encounter: ActiveEncounter | null;
  playtime: number;
  searchProgress: number; // scavenging effort toward next gear drop on this level
  searchLevel: number; // level the search progress belongs to
  xp: number; // progress toward next Explorer level
  xpLevel: number; // Explorer level (persists through prestige)
  perks: string[]; // chosen perk ids (stackable)
  perkTokens: number; // unspent perk picks
  pendingPerks: string[] | null; // current perk choices, or null
  pendingLevelUp: boolean; // true when a level-up popup should show first
  expedition: Expedition | null;
  deepestAbyss: number; // deepest abyss room ever reached (permanent multiplier)
  encounterCooldownUntil: number; // performance.now() timestamp; no encounters spawn before this
  pendingPhenomenon: PendingPhenomenon | null; // flying phenomenon orb to click
  lastSaved: number; // Date.now() of last save — used for offline progress
}

export interface Achievement {
  id: string;
  name: string;
  desc: string;
  test: (s: GameState) => boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first-click', name: 'You Noclipped In', desc: 'Make your first click.', test: (s) => s.clicks >= 1 },
  { id: 'clicks-500', name: 'Wall Toucher', desc: 'Click 500 times.', test: (s) => s.clicks >= 500 },
  { id: 'clicks-5000', name: 'Frantic Wanderer', desc: 'Click 5,000 times.', test: (s) => s.clicks >= 5000 },
  { id: 'aw-10k', name: 'Hydrated', desc: 'Earn 10K Almond Water total.', test: (s) => s.lifetimeAw >= 10_000 },
  { id: 'aw-10m', name: 'Flush With Fluid', desc: 'Earn 10M lifetime AW.', test: (s) => s.lifetimeAw >= 10_000_000 },
  { id: 'aw-1b', name: 'Ocean of Almond', desc: 'Earn 1B lifetime AW.', test: (s) => s.lifetimeAw >= 1_000_000_000 },
  { id: 'gen-1', name: 'Not Alone', desc: 'Recruit your first ally.', test: (s) => allyCount(s) >= 1 },
  { id: 'gen-50', name: 'Building a Base', desc: 'Own 50 allies/outposts.', test: (s) => allyCount(s) >= 50 },
  { id: 'gear-1', name: 'Kitted Out', desc: 'Equip your first item.', test: (s) => Object.keys(s.equipped).length >= 1 },
  { id: 'gear-full', name: 'Fully Geared', desc: 'Fill all 4 equipment slots.', test: (s) => SLOTS.every((sl) => s.equipped[sl]) },
  { id: 'gear-legendary', name: 'Legend', desc: 'Equip a legendary item.', test: (s) => Object.values(s.equipped).some((id) => GEAR.find((g) => g.id === id)?.rarity === 'legendary') },
  { id: 'gear-mythic', name: 'Myth Bearer', desc: 'Equip a mythic item from the Abyss.', test: (s) => Object.values(s.equipped).some((id) => GEAR.find((g) => g.id === id)?.rarity === 'mythic') },
  { id: 'level-5', name: 'Going Deeper', desc: 'Reach depth 5.', test: (s) => s.levelIndex >= 5 },
  { id: 'level-15', name: 'Lost For Good', desc: 'Reach depth 15.', test: (s) => s.levelIndex >= 15 },
  { id: 'level-max', name: 'The Bottom', desc: 'Reach the deepest level.', test: (s) => s.levelIndex >= LEVELS.length - 1 },
  { id: 'kill-10', name: 'Not Prey', desc: 'Escape 10 encounters.', test: (s) => s.defeated.length >= 10 },
  { id: 'boss-1', name: 'Giant Slayer', desc: 'Defeat a boss.', test: (s) => s.defeated.some((d) => ENCOUNTERS.find((e) => e.id === d)?.boss) },
  { id: 'finale', name: 'Escaped', desc: 'Defeat Nostalgi Gaius.', test: (s) => s.finaleDefeated },
  { id: 'prestige-1', name: 'Round and Round', desc: 'Noclip Out once.', test: (s) => s.prestiges >= 1 },
  { id: 'echoes-50', name: 'Echo Chamber', desc: 'Earn 50 Echoes total.', test: (s) => s.totalEchoes >= 50 },
  { id: 'xp-5', name: 'Seasoned', desc: 'Reach Explorer level 5.', test: (s) => s.xpLevel >= 5 },
  { id: 'xp-20', name: 'Veteran', desc: 'Reach Explorer level 20.', test: (s) => s.xpLevel >= 20 },
  { id: 'perk-5', name: 'Specialist', desc: 'Choose 5 perks.', test: (s) => s.perks.length >= 5 },
  { id: 'delve-1', name: 'Delver', desc: 'Extract from an expedition.', test: (s) => s.achievements.includes('delve-1') },
  { id: 'delve-deep', name: 'Deep Diver', desc: 'Reach delve room 15.', test: (s) => s.deepestAbyss >= 15 || s.achievements.includes('delve-deep') },
  { id: 'abyss-10', name: 'Into the Abyss', desc: 'Reach Abyss room 10.', test: (s) => s.deepestAbyss >= 10 },
];

function freshState(): GameState {
  return {
    aw: 0,
    totalAw: 0,
    lifetimeAw: 0,
    clicks: 0,
    generators: {},
    gearOwned: [],
    gearDuplicates: {},
    gearUpgrades: {},
    equipped: {},
    levelIndex: 0,
    maxLevelReached: 0,
    defeated: [],
    achievements: [],
    echoes: 0,
    totalEchoes: 0,
    skills: {},
    prestiges: 0,
    finaleDefeated: false,
    finaleAvailable: false,
    settings: { reduceMotion: false, sound: true, volume: 0.5 },
    buff: null,
    encounter: null,
    playtime: 0,
    searchProgress: 0,
    searchLevel: 0,
    xp: 0,
    xpLevel: 0,
    perks: [],
    perkTokens: 0,
    pendingPerks: null,
    pendingLevelUp: false,
    expedition: null,
    deepestAbyss: 0,
    encounterCooldownUntil: 0,
    pendingPhenomenon: null,
    lastSaved: Date.now(),
  };
}

function load(): GameState {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return freshState();
    const s = JSON.parse(raw) as Partial<GameState>;
    const merged = {
      ...freshState(),
      ...s,
      settings: { ...freshState().settings, ...(s.settings ?? {}) },
      skills: s.skills ?? {},
      gearDuplicates: s.gearDuplicates ?? {},
      gearUpgrades: s.gearUpgrades ?? {},
      buff: null,
      encounter: null,
      expedition: null,
      pendingPerks: null,
      pendingLevelUp: false,
      encounterCooldownUntil: 0,
      pendingPhenomenon: null,
    };
    // Migrate old saves: ensure maxLevelReached is at least the current levelIndex
    if (merged.maxLevelReached < merged.levelIndex) merged.maxLevelReached = merged.levelIndex;

    // Offline progress — production at reduced efficiency while away
    const sb = skillBonuses(merged);
    const lastSaved = (s as Partial<GameState>).lastSaved ?? Date.now();
    const elapsed = Math.max(0, Math.min(8 * 3600, (Date.now() - lastSaved) / 1000));
    if (elapsed > 60) {
      const prod = productionPerSec(merged);
      const gain = prod * elapsed * sb.offlineEfficiency;
      merged.aw += gain;
      merged.totalAw += gain;
      merged.lifetimeAw += gain;
      if (sb.offlineXp) {
        merged.xp += elapsed * (1 + merged.levelIndex * 0.4) * (1 + perkStat(merged, 'xp'));
        while (merged.xp >= xpNeed(merged.xpLevel)) {
          merged.xp -= xpNeed(merged.xpLevel);
          merged.xpLevel += 1;
          if (merged.xpLevel % 2 === 0) merged.perkTokens += 1;
        }
      }
    }
    merged.lastSaved = Date.now();
    return merged;
  } catch {
    return freshState();
  }
}

// ---------- Derived stats ----------
export function allyCount(s: GameState): number {
  return Object.values(s.generators).reduce((a, b) => a + b, 0);
}

export function genCount(s: GameState, id: string): number {
  return s.generators[id] ?? 0;
}

// Skill tree bonuses for the current state
export function skillBonuses(s: GameState): SkillBonuses {
  return computeBonuses(s.skills);
}

// Per-unit cost growth — adjusted by Architect "Efficiency" skill
export function genCost(s: GameState, id: string): number {
  const owned = genCount(s, id);
  const g = GENERATORS.find((x) => x.id === id)!;
  const sb = skillBonuses(s);
  const growth = sb.allyCostGrowth;
  let cost = g.baseCost * Math.pow(growth, owned) * (1 - sb.allyCostReduction);
  if (sb.allyTypeBonus > 0) cost *= 2; // a-ascension keystone doubles ally costs
  return Math.ceil(cost);
}

// Total cost of buying `count` generators starting from current owned count
export function genBulkCost(s: GameState, id: string, count: number): number {
  const owned = genCount(s, id);
  const g = GENERATORS.find((x) => x.id === id)!;
  const sb = skillBonuses(s);
  const growth = sb.allyCostGrowth;
  const reduction = 1 - sb.allyCostReduction;
  const ascensionMult = sb.allyTypeBonus > 0 ? 2 : 1;
  let total = 0;
  for (let i = 0; i < count; i++) {
    total += Math.ceil(g.baseCost * Math.pow(growth, owned + i) * reduction * ascensionMult);
  }
  return total;
}

// How many generators can you afford right now (capped at maxCount)
export function genMaxAffordable(s: GameState, id: string, maxCount: number = 1000): number {
  const owned = genCount(s, id);
  const g = GENERATORS.find((x) => x.id === id)!;
  const sb = skillBonuses(s);
  const growth = sb.allyCostGrowth;
  const reduction = 1 - sb.allyCostReduction;
  const ascensionMult = sb.allyTypeBonus > 0 ? 2 : 1;
  let total = 0;
  let n = 0;
  for (let i = 0; i < maxCount; i++) {
    const cost = Math.ceil(g.baseCost * Math.pow(growth, owned + i) * reduction * ascensionMult);
    if (total + cost > s.aw) break;
    total += cost;
    n++;
  }
  return n;
}

export function levelMult(s: GameState): number {
  return LEVELS[s.levelIndex]?.mult ?? 1;
}

// Levels 24+ require 1 rebirth, levels 28+ require 2, levels 31+ require 3.
// This gates deeper content behind the rebirth loop (NOT the skill tree).
export function levelPrestigeGate(levelIndex: number): number {
  if (levelIndex >= 31) return 3;
  if (levelIndex >= 28) return 2;
  if (levelIndex >= 24) return 1;
  return 0;
}

// ---------- Perks & Explorer XP ----------
export function perkStat(s: GameState, key: PerkKey): number {
  // Diminishing returns on duplicate perks: each extra copy adds 70% of the previous.
  // n copies of a perk yield val * (1 - 0.7^n) / 0.3.
  const counts: Record<string, number> = {};
  for (const id of s.perks) {
    const p = perkById(id);
    if (p && p.key === key) counts[id] = (counts[id] ?? 0) + 1;
  }
  let v = 0;
  for (const [id, n] of Object.entries(counts)) {
    const p = perkById(id);
    if (!p) continue;
    v += (p.val * (1 - Math.pow(0.7, n))) / 0.3;
  }
  return v;
}

// XP needed to go from level L to L+1 (steepens so higher levels are milestones)
export function xpNeed(level: number): number {
  return Math.floor(80 * Math.pow(1.25, level));
}

// Every Explorer level adds a small flat global boost on top of chosen perks
export function xpLevelMult(s: GameState): number {
  return 1 + s.xpLevel * 0.02;
}

// The Abyss: deepest room reached is a permanent multiplier, modified by Noclipper skills
export function abyssMult(s: GameState): number {
  const sb = skillBonuses(s);
  return 1 + Math.min(sb.abyssCap, s.deepestAbyss) * sb.abyssRoomMult;
}

// Combined meta multiplier applied to both click power and production
function metaMult(s: GameState): number {
  const sb = skillBonuses(s);
  const ownedTypes = GENERATORS.filter((g) => genCount(s, g.id) > 0).length;
  return xpLevelMult(s) * (1 + perkStat(s, 'aw')) * abyssMult(s) * sb.awMult * setBonusMult(s) * (1 + ownedTypes * sb.allyTypeBonus);
}

// ---------- Set Bonuses ----------
// Collecting all items at a depth grants a passive multiplier (no equipping needed)
export interface SetBonus { levelIndex: number; mult: number; name: string; }

export function levelSetComplete(s: GameState, levelIndex: number): boolean {
  const items = GEAR.filter((g) => g.levelIndex === levelIndex);
  if (items.length === 0) return false;
  return items.every((g) => s.gearOwned.includes(g.id));
}

export function completedSets(s: GameState): number[] {
  const result: number[] = [];
  for (let i = 0; i < LEVELS.length; i++) {
    if (levelSetComplete(s, i)) result.push(i);
  }
  return result;
}

// Each completed set adds +5% multiplier (compounding)
export function setBonusMult(s: GameState): number {
  const count = completedSets(s).length;
  return Math.pow(1.05, count);
}

export function setBonusInfo(s: GameState): { count: number; mult: number; sets: number[] } {
  const sets = completedSets(s);
  return { count: sets.length, mult: setBonusMult(s), sets };
}

export function perkPct(s: GameState, key: PerkKey): number {
  return perkStat(s, key);
}

function equippedGear(s: GameState): Gear[] {
  return SLOTS.map((sl) => s.equipped[sl])
    .filter((id): id is string => !!id)
    .map((id) => GEAR.find((g) => g.id === id))
    .filter((g): g is Gear => !!g);
}

export function gearClickMult(s: GameState): number {
  const sb = skillBonuses(s);
  const mult = sb.gearStatMult * (1 + sb.gearStatFromSets * setBonusInfo(s).count);
  return equippedGear(s).reduce((m, g) => {
    const upgrade = s.gearUpgrades[g.id] ?? 0;
    const upgradeBonus = 1 + 0.10 * upgrade;
    return m * (1 + (g.stats.clickMult - 1) * upgradeBonus * mult);
  }, 1);
}
export function gearProdMult(s: GameState): number {
  const sb = skillBonuses(s);
  const mult = sb.gearStatMult * (1 + sb.gearStatFromSets * setBonusInfo(s).count);
  return equippedGear(s).reduce((m, g) => {
    const upgrade = s.gearUpgrades[g.id] ?? 0;
    const upgradeBonus = 1 + 0.10 * upgrade;
    return m * (1 + (g.stats.prodMult - 1) * upgradeBonus * mult);
  }, 1);
}
export function gearLuck(s: GameState): number {
  const sb = skillBonuses(s);
  const buffLuck = s.buff?.effect === 'luck' ? 0.15 : 0;
  return equippedGear(s).reduce((m, g) => {
    const upgrade = s.gearUpgrades[g.id] ?? 0;
    const upgradeBonus = 1 + 0.10 * upgrade;
    return m + g.stats.luck * upgradeBonus * sb.gearStatMult;
  }, 0) + buffLuck + perkStat(s, 'luck') + sb.luckAdd;
}
export function gearCrit(s: GameState): number {
  const sb = skillBonuses(s);
  return Math.min(0.75, equippedGear(s).reduce((m, g) => {
    const upgrade = s.gearUpgrades[g.id] ?? 0;
    const upgradeBonus = 1 + 0.10 * upgrade;
    return m + g.stats.crit * upgradeBonus * sb.gearStatMult;
  }, 0) + perkStat(s, 'crit') + sb.critAdd);
}

export function critMultVal(s: GameState): number {
  return skillBonuses(s).critMult;
}

export function buffClickMult(s: GameState): number {
  if (s.buff?.effect === 'clickX1.3') return 1.3;
  if (s.buff?.effect === 'clickX1.5') return 1.5;
  return 1;
}
export function buffProdMult(s: GameState): number {
  if (s.buff?.effect === 'prodX1.3') return 1.3;
  if (s.buff?.effect === 'prodX1.5') return 1.5;
  return 1;
}

// Smooth, softcapped combo — rewards bursts, cap modified by Wanderer skills
export function comboMult(combo: number, capBonus: number = 0): number {
  return 1 + (1 - Math.exp(-combo / 30)) * (7 + capBonus);
}

export function baseClickPower(s: GameState): number {
  const sb = skillBonuses(s);
  const buffed = s.buff ? 1 + sb.clickPowerBuffed : 1;
  return 1 * gearClickMult(s) * levelMult(s) * sb.clickMult * (1 + perkStat(s, 'click')) * metaMult(s) * buffed;
}

export function clickPower(s: GameState, combo: number): number {
  const sb = skillBonuses(s);
  const perCombo = 1 + sb.clickPowerPerCombo * Math.floor(combo / 50);
  const threshold = sb.comboThresholdDoubled && combo > 50 ? 2 : 1;
  return baseClickPower(s) * comboMult(combo, sb.comboCapBonus) * buffClickMult(s) * perCombo * threshold;
}

export function productionPerSec(s: GameState): number {
  const sb = skillBonuses(s);
  let p = 0;
  let ownedTypes = 0;
  for (const g of GENERATORS) {
    const n = genCount(s, g.id);
    if (n > 0) { p += n * g.baseProd; ownedTypes++; }
  }
  const synergyMult = 1 + ownedTypes * sb.allySynergyPct;
  const singularityMult = 1 + s.xpLevel * sb.prodXpLevelBonus;
  const typeBonus = 1 + ownedTypes * sb.allyTypeBonus;
  const overdrive = s.buff ? 1 + 0.10 * (s.skills['a-overdrive'] ?? 0) : 1;
  const generatorBonus = 1 + 0.08 * (s.skills['a-generator'] ?? 0) * ownedTypes;
  return p * levelMult(s) * gearProdMult(s) * buffProdMult(s) * sb.prodMult * synergyMult * singularityMult * typeBonus * overdrive * generatorBonus * (1 + perkStat(s, 'prod')) * metaMult(s);
}

export function nextLevel(s: GameState) {
  return LEVELS[s.levelIndex + 1] ?? null;
}

export function xpPct(s: GameState): number {
  return Math.min(100, (s.xp / xpNeed(s.xpLevel)) * 100);
}

export function abyssUnlocked(s: GameState): boolean {
  return s.finaleDefeated;
}

export function isMaxDepth(s: GameState): boolean {
  return s.levelIndex >= LEVELS.length - 1;
}

// Echoes you'd gain by rebirthing now — cube root scaling, available early
export function pendingEchoes(s: GameState): number {
  const sb = skillBonuses(s);
  const base = Math.floor(Math.cbrt(s.lifetimeAw / 7e5) * (1 + sb.prestigeEchoBonus + perkStat(s, 'echo')));
  return Math.max(0, base - s.totalEchoes);
}

export function gearBySlot(slot: GearSlot): Gear[] {
  return GEAR.filter((g) => g.slot === slot);
}

// Gear you can currently find at this level (duplicates CAN drop)
export function eligibleDrops(s: GameState): Gear[] {
  return GEAR.filter((g) => g.levelIndex === s.levelIndex);
}

// Upgrade level for a owned gear item (0 = base, 1 = +10%, 2 = +20%...)
export function gearUpgradeLevel(s: GameState, gearId: string): number {
  return s.gearUpgrades[gearId] ?? 0;
}

// Number of duplicate copies collected for a gear item
export function gearDuplicateCount(s: GameState, gearId: string): number {
  return s.gearDuplicates[gearId] ?? 0;
}

// ---------- Floating click numbers ----------
export interface FloatNum {
  id: number;
  x: number;
  y: number;
  amount: number;
  crit: boolean;
}

let floatId = 0;
let toastId = 0;

// Rarity weights for delve gear drops — rarer items are genuinely rare.
// Mythic items only appear in abyss delves at deep rooms.
const RARITY_WEIGHTS: Record<string, number> = {
  common: 45,
  uncommon: 28,
  rare: 16,
  epic: 8,
  legendary: 3,
  mythic: 0,
};

// Rarity weights shifted by Noclipper "Lucky Streak" skill
const RARITY_WEIGHTS_SHIFTED: Record<string, number> = {
  common: 25,
  uncommon: 27,
  rare: 22,
  epic: 14,
  legendary: 8,
  mythic: 4,
};

function weightedGearPick(pool: Gear[], rarityShift: number = 0): Gear {
  const weights = rarityShift > 0 ? RARITY_WEIGHTS_SHIFTED : RARITY_WEIGHTS;
  const weighted = pool.map((g) => ({ g, w: weights[g.rarity] ?? 1 }));
  const total = weighted.reduce((s, x) => s + x.w, 0);
  let r = Math.random() * total;
  for (const { g, w } of weighted) {
    r -= w;
    if (r <= 0) return g;
  }
  return weighted[weighted.length - 1].g;
}

export function useGame() {
  const stateRef = useRef<GameState>(load());
  const comboRef = useRef(0);
  const lastClickRef = useRef(0);
  const [, force] = useState(0);
  const [floats, setFloats] = useState<FloatNum[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const rerender = useCallback(() => force((v) => v + 1), []);

  const pushToast = useCallback((kind: Toast['kind'], text: string) => {
    const id = ++toastId;
    setToasts((t) => [...t.slice(-5), { id, kind, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4600);
  }, []);

  const grantGear = useCallback(
    (_reason: string) => {
      // Gear is now delve-exclusive — this is kept for compatibility but does nothing
      return false;
    },
    [pushToast],
  );

  const checkAchievements = useCallback(() => {
    const s = stateRef.current;
    for (const a of ACHIEVEMENTS) {
      if (!s.achievements.includes(a.id) && a.test(s)) {
        s.achievements.push(a.id);
        if (s.settings.sound) sfx.unlock();
        pushToast('achieve', `Achievement: ${a.name}`);
      }
    }
  }, [pushToast]);

  // Award Explorer XP; handles multiple level-ups and queues perk picks.
  const gainXp = useCallback(
    (amount: number) => {
      const s = stateRef.current;
      s.xp += amount * (1 + perkStat(s, 'xp'));
      let leveled = false;
      while (s.xp >= xpNeed(s.xpLevel)) {
        s.xp -= xpNeed(s.xpLevel);
        s.xpLevel += 1;
        leveled = true;
        if (s.xpLevel % 2 === 0) s.perkTokens += 1; // a perk pick every 2 levels
      }
      if (leveled) {
        if (s.settings.sound) sfx.unlock();
        pushToast('xp', `Explorer Level ${s.xpLevel}!`);
        // Show level-up popup first; perk choices are rolled when the player dismisses it
        if (s.perkTokens > 0) s.pendingLevelUp = true;
        checkAchievements();
      }
    },
    [pushToast, checkAchievements],
  );

  const checkLevelUp = useCallback(() => {
    const s = stateRef.current;
    // Only auto-advance when the player is at their deepest reached level.
    // If they've navigated back to a previous level, stay there.
    if (s.levelIndex < s.maxLevelReached) {
      checkAchievements();
      return;
    }
    while (true) {
      const nxt = LEVELS[s.levelIndex + 1];
      if (nxt && s.totalAw >= nxt.unlockCost) {
        // Gate deeper levels behind rebirth count (not the skill tree)
        const gate = levelPrestigeGate(s.levelIndex + 1);
        if (s.prestiges < gate) break;
        s.levelIndex += 1;
        s.maxLevelReached = Math.max(s.maxLevelReached, s.levelIndex);
        if (s.settings.sound) sfx.descend();
        pushToast('unlock', `Descended to ${nxt.name}`);
        gainXp(20 + s.levelIndex * 6); // descents are big XP milestones
      } else break;
    }
    if (isMaxDepth(s) && !s.finaleDefeated && !s.finaleAvailable) {
      s.finaleAvailable = true;
      pushToast('event', 'The deepest level hums. Nostalgi Gaius awaits...');
    }
    checkAchievements();
  }, [pushToast, checkAchievements, gainXp]);

  const goToLevel = useCallback(
    (idx: number) => {
      const s = stateRef.current;
      if (idx < 0 || idx > s.maxLevelReached || idx === s.levelIndex) return;
      s.levelIndex = idx;
      if (s.settings.sound) sfx.descend();
      rerender();
    },
    [rerender],
  );

  const dismissLevelUp = useCallback(() => {
    const s = stateRef.current;
    s.pendingLevelUp = false;
    if (s.perkTokens > 0 && !s.pendingPerks) s.pendingPerks = rollPerkChoices(3);
    rerender();
  }, [rerender]);

  const choosePerk = useCallback(
    (id: string) => {
      const s = stateRef.current;
      if (!s.pendingPerks || !s.pendingPerks.includes(id)) return;
      const p = perkById(id);
      if (!p) return;
      s.perks.push(id);
      s.perkTokens = Math.max(0, s.perkTokens - 1);
      s.pendingPerks = s.perkTokens > 0 ? rollPerkChoices(3) : null;
      if (s.settings.sound) sfx.buy();
      pushToast('unlock', `Perk gained: ${p.name}`);
      checkAchievements();
      rerender();
    },
    [pushToast, checkAchievements, rerender],
  );

  const doClick = useCallback(
    (clientX: number, clientY: number) => {
      const s = stateRef.current;
      const sb = skillBonuses(s);
      const now = performance.now();
      // Combo build speed (Frenzy skill) + phasing double-combo chance
      let comboGain = 1 + perkStat(s, 'combo');
      if (Math.random() < (s.skills['w-phasing'] ? 0.20 : 0)) comboGain *= 2;
      if (now - lastClickRef.current < sb.comboDecayMs) comboRef.current += comboGain * sb.comboBuildMult;
      else comboRef.current = 1;
      lastClickRef.current = now;

      let power = clickPower(s, comboRef.current);
      const isCrit = Math.random() < gearCrit(s);
      if (isCrit) {
        power *= critMultVal(s) + sb.critDamageAdd;
        // Keen Eye: crits restore 10 combo
        if (s.skills['w-keeneye']) comboRef.current += 10;
        // Adrenaline: +15% click power per rank for 3s after crit (stacks as temporary buff)
        const adrenalineRanks = s.skills['w-adrenaline'] ?? 0;
        if (adrenalineRanks > 0) power *= 1 + 0.15 * adrenalineRanks;
      }

      // Transcendence: clicking also grants a fraction of per-second production
      if (sb.clickGainsProdPct > 0) power += productionPerSec(s) * sb.clickGainsProdPct;

      // Execution: crits have a chance to trigger a phenomena burst
      if (isCrit && Math.random() < sb.critBurstChance) {
        const burst = Math.max(50, (productionPerSec(s) * 45 + baseClickPower(s) * 25) * sb.burstMult);
        power += burst;
      }

      s.aw += power;
      s.totalAw += power;
      s.lifetimeAw += power;
      s.clicks += 1;
      gainXp(0.6 * sb.xpMult);
      // Chance per click for bonus XP (Noclipper tree)
      if (sb.clickXpChance > 0 && Math.random() < sb.clickXpChance) gainXp(5 * sb.xpMult);

      if (s.settings.sound) sfx.click(comboRef.current);

      const fid = ++floatId;
      setFloats((f) => [...f.slice(-24), { id: fid, x: clientX, y: clientY, amount: power, crit: isCrit }]);
      setTimeout(() => setFloats((f) => f.filter((x) => x.id !== fid)), 900);

      checkLevelUp();
      checkAchievements();
      rerender();
    },
    [checkLevelUp, checkAchievements, rerender, gainXp],
  );

  const attackEncounter = useCallback(() => {
    const s = stateRef.current;
    if (!s.encounter) return;
    const sb = skillBonuses(s);
    const now = performance.now();
    if (now - lastClickRef.current < sb.comboDecayMs) comboRef.current += 1 * sb.comboBuildMult;
    else comboRef.current = 1;
    lastClickRef.current = now;
    // stronger click = more hits on tough foes
    const hit = 1 + Math.floor(gearCrit(s) * 4) + (Math.random() < gearCrit(s) ? 3 : 0);
    s.encounter.got += hit;
    if (s.settings.sound) sfx.click(comboRef.current);
    if (s.encounter.got >= s.encounter.need) {
      const enc = s.encounter;
      s.aw += enc.reward;
      s.totalAw += enc.reward;
      s.lifetimeAw += enc.reward;
      if (!s.defeated.includes(enc.id)) s.defeated.push(enc.id);
      s.encounter = null;
      if (s.settings.sound) sfx.win();
      if (enc.isFinale) {
        s.finaleDefeated = true;
        s.finaleAvailable = false;
        gainXp(200);
        pushToast('prestige', `You escaped ${enc.name}! Noclip Out & the Abyss are unlocked.`);
      } else {
        pushToast('win', `Escaped ${enc.name}! +${Math.round(enc.reward)} AW`);
        gainXp(enc.boss ? 45 : 14);
        // breather before the next encounter can spawn
        s.encounterCooldownUntil = performance.now() + 45_000;
      }
      checkAchievements();
      checkLevelUp();
    }
    rerender();
  }, [pushToast, grantGear, checkAchievements, checkLevelUp, rerender, gainXp]);

  const fleeEncounter = useCallback(() => {
    const s = stateRef.current;
    if (!s.encounter) return;
    if (s.encounter.isFinale) s.finaleAvailable = true;
    s.encounter = null;
    if (!s.finaleAvailable) s.encounterCooldownUntil = performance.now() + 45_000;
    rerender();
  }, [rerender]);

  const startFinale = useCallback(() => {
    const s = stateRef.current;
    if (!s.finaleAvailable || s.encounter) return;
    const need = 120 + s.prestiges * 40;
    const reward = Math.max(1e6, productionPerSec(s) * 120);
    s.encounter = {
      id: FINALE.id,
      name: FINALE.name,
      desc: FINALE.desc,
      boss: true,
      isFinale: true,
      need,
      got: 0,
      until: null,
      reward,
    };
    if (s.settings.sound) sfx.event();
    pushToast('event', `FINALE: ${FINALE.name}!`);
    rerender();
  }, [pushToast, rerender]);

  // ---------- Expeditions (push-your-luck delving for gear) ----------
  const startExpedition = useCallback(
    (mode: ExpeditionMode) => {
      const s = stateRef.current;
      if (s.expedition || s.encounter) return;
      if (mode === 'abyss' && !s.finaleDefeated) return;
      const sb = skillBonuses(s);
      const baseRisk = (mode === 'abyss' ? 0.08 : 0.03) * sb.expeditionRiskMult;
      const modifier = rollModifier();
      const startRoom = sb.expeditionStartRooms;
      s.expedition = {
        mode,
        depth: s.levelIndex,
        room: startRoom,
        haulAw: 0,
        haulXp: 0,
        haulGear: [],
        risk: baseRisk,
        event: rollEvent(startRoom, mode),
        phase: 'event',
        over: 'active',
        log: [],
        lastText: mode === 'abyss' ? 'You step off the edge into the Abyss.' : 'You slip into the walls to explore.',
        modifier,
        pendingGearReveal: null,
        lastLoot: null,
        deathSavedOnce: false,
      };
      if (s.settings.sound) sfx.event();
      const modText = modifier.id !== 'normal' ? ` [${modifier.name}]` : '';
      pushToast('event', mode === 'abyss' ? `Descending into the Abyss...${modText}` : `Expedition started!${modText}`);
      rerender();
    },
    [pushToast, rerender],
  );

  const expeditionChoose = useCallback(
    (optId: string) => {
      const s = stateRef.current;
      const exp = s.expedition;
      if (!exp || exp.phase !== 'event') return;
      const ev = exp.event;
      const luck = gearLuck(s);
      const expBonus = perkStat(s, 'expedition');
      const sb = skillBonuses(s);
      const roomN = exp.room + 1;
      const mod = exp.modifier;
      const setBonus = 1 + sb.expeditionBonusPerSet * setBonusInfo(s).count;
      const base = (productionPerSec(s) * 12 + baseClickPower(s) * 25 + 100) * roomN * (exp.mode === 'abyss' ? 2.2 : 1) * (1 + expBonus) * sb.expeditionLootMult * mod.lootMult * setBonus;
      const addRisk = (v: number) => { exp.risk = Math.min(0.9, exp.risk + v * (1 - Math.min(0.6, expBonus)) * mod.riskMult); };

      // Level-based gear pool: items only drop at their assigned level (exp.depth)
      // Duplicates are allowed — when a gear is already owned, it becomes a duplicate.
      const grantExpGear = (force: boolean = false): string | null => {
        const sb = skillBonuses(s);
        let pool = GEAR.filter((g) => {
          if (g.levelIndex !== exp.depth) return false;
          if (g.abyssOnly && exp.mode !== 'abyss') return false;
          return true;
        });
        if (pool.length === 0) {
          // Fallback: any gear at this level (ignoring abyssOnly)
          pool = GEAR.filter((g) => g.levelIndex === exp.depth);
        }
        if (pool.length === 0) return null;
        const pk = weightedGearPick(pool, sb.rarityShift + (force ? 2 : 0));
        exp.haulGear.push(pk.id);
        exp.pendingGearReveal = pk.id; // trigger reveal animation
        if (s.settings.sound) sfx.loot();
        return pk.id;
      };

      // Returns true if actually caught (expedition over), false if a death save triggered
      const caught = (text: string): boolean => {
        if (!exp.deathSavedOnce && sb.deathSaveOnce) {
          exp.deathSavedOnce = true;
          exp.risk = Math.max(0, exp.risk - 0.15);
          return false;
        }
        if (Math.random() < sb.deathSaveChance) {
          exp.risk = Math.max(0, exp.risk - 0.15);
          return false;
        }
        exp.over = 'caught';
        exp.phase = 'done';
        exp.lastText = text;
        if (s.settings.sound) sfx.event();
        return true;
      };

      let text = '';
      let lootAw = 0, lootXp = 0, lootGear = 0;
      if (ev.kind === 'boss') {
        if (optId === 'retreat') {
          exp.over = 'extracted';
          exp.phase = 'done';
          exp.lastText = 'You retreat from the guardian, hauling what you have.';
          if (s.settings.sound) sfx.win();
          s.aw += exp.haulAw; s.totalAw += exp.haulAw; s.lifetimeAw += exp.haulAw;
          for (const id of exp.haulGear) {
            if (!s.gearOwned.includes(id)) {
              s.gearOwned.push(id);
            } else {
              s.gearDuplicates[id] = (s.gearDuplicates[id] ?? 0) + 1;
            }
          }
          gainXp(exp.haulXp * sb.expeditionXpMult);
          rerender();
          return;
        }
        const win = Math.random() < Math.max(0.20, Math.min(0.85, 0.40 + gearCrit(s) + luck * 0.5 + expBonus * 0.3 - exp.room * 0.015));
        if (win) {
          const aw = base * 3.0;
          exp.haulAw += aw; exp.haulXp += 50 * roomN * sb.expeditionXpMult; lootAw = aw; lootXp = 50 * roomN;
          // Bosses drop gear — extra/double gear from Noclipper skills
          const bossGearCount = (1 + sb.bossExtraGear) * (sb.bossDoubleGear ? 2 : 1);
          let g: string | null = grantExpGear(true);
          if (g) lootGear = 1;
          const gname = g ? GEAR.find((x) => x.id === g)?.name : null;
          for (let i = 1; i < bossGearCount; i++) {
            const extra = grantExpGear(true);
            if (extra) lootGear++;
          }
          text = `Slew ${ev.name}! +${Math.round(aw)} AW${gname ? ` — it dropped ${gname}!` : ''}${lootGear > 1 ? ` (${lootGear} items)` : ''}`;
        } else {
          const deathText = `${ev.name} crushed you — your entire haul is lost.`;
          if (caught(deathText)) {
            rerender();
            return;
          }
          text = `${deathText} ...but you cheated death! Risk reduced.`;
        }
      } else if (ev.kind === 'cache') {
        if (optId === 'open') {
          const aw = base * 1.2;
          exp.haulAw += aw; exp.haulXp += 8 * roomN * sb.expeditionXpMult; addRisk(0.02); lootAw = aw; lootXp = 8 * roomN;
          const g = Math.random() < 0.25 + luck + mod.gearBonus + sb.gearDropBonus ? grantExpGear() : null;
          if (g) lootGear = 1;
          const gname = g ? GEAR.find((x) => x.id === g)?.name : null;
          text = `Pried the cache: +${Math.round(aw)} AW${gname ? ` — found ${gname}!` : ''}`;
        } else {
          const aw = base * 0.5;
          exp.haulAw += aw; exp.haulXp += 5 * roomN * sb.expeditionXpMult; lootAw = aw; lootXp = 5 * roomN;
          text = `Searched carefully: +${Math.round(aw)} AW (no risk)`;
        }
      } else if (ev.kind === 'entity') {
        if (optId === 'fight') {
          const win = Math.random() < Math.max(0.15, Math.min(0.92, 0.45 + gearCrit(s) + luck * 0.5 + expBonus * 0.3 - exp.room * 0.02));
          if (win) {
            const aw = base * 1.7;
            exp.haulAw += aw; exp.haulXp += 15 * roomN * sb.expeditionXpMult; lootAw = aw; lootXp = 15 * roomN;
            const g = Math.random() < 0.35 + luck + mod.gearBonus + sb.gearDropBonus ? grantExpGear() : null;
            if (g) lootGear = 1;
            const gname = g ? GEAR.find((x) => x.id === g)?.name : null;
            text = `Slew ${ev.name}: +${Math.round(aw)} AW${gname ? ` — dropped ${gname}!` : ''}`;
          } else {
            const deathText = `${ev.name} overwhelmed you — your haul is lost.`;
            if (caught(deathText)) {
              rerender();
              return;
            }
            text = `${deathText} ...but you escaped death! Risk reduced.`;
          }
        } else if (optId === 'sneak') {
          const ok = Math.random() < Math.max(0.1, Math.min(0.9, 0.42 + luck + expBonus * 0.3 - exp.room * 0.03));
          if (ok) {
            const aw = base * 0.3; exp.haulAw += aw; exp.haulXp += 6 * roomN * sb.expeditionXpMult; lootAw = aw; lootXp = 6 * roomN;
            text = `Slipped past ${ev.name}: +${Math.round(aw)} AW`;
          } else {
            addRisk(0.16);
            text = `${ev.name} caught your scent — risk rising!`;
          }
        } else {
          const cost = exp.haulAw * 0.4;
          exp.haulAw -= cost; addRisk(-0.06);
          text = `Bought passage from ${ev.name} for ${Math.round(cost)} AW`;
        }
      } else if (ev.kind === 'fork') {
        if (Math.random() < 0.6) {
          const aw = base * 1.3; exp.haulAw += aw; exp.haulXp += 10 * roomN * sb.expeditionXpMult; lootAw = aw; lootXp = 10 * roomN;
          const g = Math.random() < 0.20 + luck + mod.gearBonus + sb.gearDropBonus ? grantExpGear() : null;
          if (g) lootGear = 1;
          const gname = g ? GEAR.find((x) => x.id === g)?.name : null;
          text = `The passage opened up: +${Math.round(aw)} AW${gname ? ` — found ${gname}!` : ''}`;
        } else {
          const loss = exp.haulAw * 0.3; exp.haulAw -= loss; addRisk(0.1);
          text = `A trap! Lost ${Math.round(loss)} AW and drew attention.`;
        }
      } else if (ev.kind === 'shrine') {
        if (optId === 'attune') {
          exp.haulXp += 22 * roomN * sb.expeditionXpMult; lootXp = 22 * roomN;
          const aw = base * 0.6; exp.haulAw += aw; lootAw = aw;
          text = `Attuned to ${ev.name}: +${22 * roomN} XP, +${Math.round(aw)} AW`;
        } else {
          if (Math.random() < 0.55) {
            const aw = base * 2.2; exp.haulAw += aw; exp.haulXp += 12 * roomN * sb.expeditionXpMult; lootAw = aw; lootXp = 12 * roomN;
            const g = Math.random() < 0.40 + luck + mod.gearBonus + sb.gearDropBonus ? grantExpGear() : null;
            if (g) lootGear = 1;
            const gname = g ? GEAR.find((x) => x.id === g)?.name : null;
            text = `Harvested ${ev.name}: +${Math.round(aw)} AW${gname ? ` — tore loose ${gname}!` : ''}`;
          } else {
            addRisk(0.2);
            text = `${ev.name} lashed out — risk surges!`;
          }
        }
      } else if (ev.kind === 'treasure') {
        if (optId === 'pry') {
          const g = Math.random() < 0.60 + luck + mod.gearBonus + sb.gearDropBonus ? grantExpGear() : null;
          if (g) lootGear = 1;
          const gname = g ? GEAR.find((x) => x.id === g)?.name : null;
          const aw = base * 0.4; exp.haulAw += aw; lootAw = aw;
          addRisk(0.08);
          text = `Tore the wall open: ${gname ? `found ${gname}!` : 'nothing behind it.'} +${Math.round(aw)} AW. The noise echoes.`;
        } else {
          text = `You left it behind. Some things aren't worth the risk.`;
        }
      } else if (ev.kind === 'trap') {
        if (optId === 'disarm') {
          const ok = Math.random() < Math.max(0.2, Math.min(0.85, 0.45 + luck + expBonus * 0.3));
          if (ok) {
            const aw = base * 0.8; exp.haulAw += aw; exp.haulXp += 8 * roomN * sb.expeditionXpMult; lootAw = aw; lootXp = 8 * roomN;
            const g = Math.random() < 0.15 + luck + mod.gearBonus + sb.gearDropBonus ? grantExpGear() : null;
            if (g) lootGear = 1;
            const gname = g ? GEAR.find((x) => x.id === g)?.name : null;
            text = `Disarmed it! Salvaged +${Math.round(aw)} AW${gname ? ` and found ${gname}!` : ''}`;
          } else {
            addRisk(0.12);
            const loss = exp.haulAw * 0.2; exp.haulAw -= loss;
            text = `It went off! Lost ${Math.round(loss)} AW, risk climbing.`;
          }
        } else {
          addRisk(-0.03);
          text = `You wait until the mechanism resets. Tense, but safe.`;
        }
      } else if (ev.kind === 'altar') {
        if (optId === 'offer-aw') {
          const cost = exp.haulAw * 0.3;
          exp.haulAw -= cost;
          exp.risk = Math.max(0, exp.risk - 0.10);
          text = `You poured ${Math.round(cost)} AW onto the altar. The air grows calmer — risk reduced.`;
        } else if (optId === 'offer-gear') {
          if (exp.haulGear.length > 0) {
            exp.haulGear.pop();
            exp.haulXp += 40 * roomN * sb.expeditionXpMult; lootXp = 40 * roomN;
            const g = grantExpGear(true);
            if (g) lootGear = 1;
            const gname = g ? GEAR.find((x) => x.id === g)?.name : null;
            text = `The altar consumed an item.${gname ? ` In return, it revealed ${gname}!` : ''} +${40 * roomN} XP.`;
          } else {
            text = `You have no gear to offer. The altar ignores you.`;
          }
        } else {
          text = `You walk past the altar. It watches you leave.`;
        }
      }

      // Double loot chance — Noclipper "Treasure Hunter" skill
      if ((lootAw > 0 || lootGear > 0) && Math.random() < sb.doubleLootChance) {
        exp.haulAw += lootAw;
        exp.haulXp += lootXp;
        lootAw *= 2;
        lootXp *= 2;
        if (lootGear > 0) {
          const lastGear = exp.haulGear[exp.haulGear.length - 1];
          if (lastGear) exp.haulGear.push(lastGear);
          lootGear *= 2;
        }
        text += ' (DOUBLE LOOT!)';
      }

      exp.lastLoot = { aw: lootAw, xp: lootXp, gear: lootGear };
      if (exp.over === 'active') {
        exp.phase = 'choice';
        exp.lastText = text;
        if (s.settings.sound) sfx.buy();
      }
      exp.log = [...exp.log, text].slice(-5);
      rerender();
    },
    [rerender, gainXp],
  );

  const claimGearReveal = useCallback(() => {
    const s = stateRef.current;
    const exp = s.expedition;
    if (!exp || !exp.pendingGearReveal) return;
    exp.pendingGearReveal = null;
    rerender();
  }, [rerender]);

  const expeditionDeeper = useCallback(() => {
    const s = stateRef.current;
    const exp = s.expedition;
    if (!exp || exp.phase !== 'choice') return;
    const sb = skillBonuses(s);
    // ambush check — the deeper you push, the likelier you're caught
    if (Math.random() < exp.risk) {
      const deathText = 'An ambush! You were caught — the haul is gone.';
      // Attempt death save before ending the expedition
      let saved = false;
      if (!exp.deathSavedOnce && sb.deathSaveOnce) {
        exp.deathSavedOnce = true;
        saved = true;
      } else if (Math.random() < sb.deathSaveChance) {
        saved = true;
      }
      if (saved) {
        exp.risk = Math.max(0, exp.risk - 0.15);
        exp.lastText = `${deathText} ...but you slipped away! Risk reduced.`;
        // fall through to continue delving
      } else {
        exp.over = 'caught';
        exp.phase = 'done';
        exp.lastText = deathText;
        if (s.settings.sound) sfx.event();
        rerender();
        return;
      }
    }
    exp.room += 1;
    if (exp.mode === 'abyss' && exp.room > s.deepestAbyss) {
      s.deepestAbyss = exp.room;
      checkAchievements();
    }
    exp.risk = Math.min(0.9, exp.risk + (exp.mode === 'abyss' ? 0.04 : 0.025) * skillBonuses(s).expeditionRiskMult * (1 - Math.min(0.6, perkStat(s, 'expedition'))) * exp.modifier.riskMult);
    exp.event = rollEvent(exp.room, exp.mode);
    exp.phase = 'event';
    if (s.settings.sound) sfx.descend();
    rerender();
  }, [checkAchievements, rerender]);

  const checkSetBonuses = useCallback(() => {
    const s = stateRef.current;
    for (let i = 0; i < LEVELS.length; i++) {
      if (levelSetComplete(s, i)) {
        const key = `set-${i}`;
        if (!s.achievements.includes(key)) {
          s.achievements.push(key);
          const mult = setBonusMult(s);
          const lvlName = LEVELS[i]?.name ?? `Depth ${i}`;
          pushToast('achieve', `SET COMPLETE: ${lvlName}! +5% to all output (total ×${mult.toFixed(2)})`);
          if (s.settings.sound) sfx.prestige();
        }
      }
    }
  }, [pushToast]);

  const expeditionExtract = useCallback(() => {
    const s = stateRef.current;
    const exp = s.expedition;
    if (!exp || exp.phase !== 'choice') return;
    const sb = skillBonuses(s);
    s.aw += exp.haulAw;
    s.totalAw += exp.haulAw;
    s.lifetimeAw += exp.haulAw;
    for (const id of exp.haulGear) {
      if (!s.gearOwned.includes(id)) {
        s.gearOwned.push(id);
      } else {
        s.gearDuplicates[id] = (s.gearDuplicates[id] ?? 0) + 1;
      }
    }
    gainXp(exp.haulXp * sb.expeditionXpMult);
    if (exp.mode === 'abyss' && exp.room > s.deepestAbyss) s.deepestAbyss = exp.room;
    if (!s.achievements.includes('delve-1')) {
      s.achievements.push('delve-1');
      pushToast('achieve', 'Achievement: Delver');
    }
    exp.over = 'extracted';
    exp.phase = 'done';
    exp.lastText = `Extracted: +${Math.round(exp.haulAw)} AW, +${Math.round(exp.haulXp)} XP, ${exp.haulGear.length} gear.`;
    if (s.settings.sound) sfx.win();
    pushToast('loot', `Extracted haul: +${Math.round(exp.haulAw)} AW, ${exp.haulGear.length} gear`);
    checkSetBonuses();
    checkAchievements();
    rerender();
  }, [pushToast, gainXp, checkAchievements, checkSetBonuses, rerender]);

  const expeditionClose = useCallback(() => {
    const s = stateRef.current;
    s.expedition = null;
    checkSetBonuses();
    rerender();
  }, [checkSetBonuses, rerender]);

  const buyGenerator = useCallback(
    (id: string, count: number = 1) => {
      const s = stateRef.current;
      let bought = 0;
      for (let i = 0; i < count; i++) {
        const owned = genCount(s, id);
        const cost = genCost(s, id);
        if (s.aw < cost) break;
        s.aw -= cost;
        s.generators[id] = owned + 1;
        bought++;
      }
      if (bought > 0) {
        if (s.settings.sound) sfx.buy();
        checkAchievements();
        rerender();
      }
    },
    [checkAchievements, rerender],
  );

  const equipGear = useCallback(
    (id: string) => {
      const s = stateRef.current;
      const g = GEAR.find((x) => x.id === id);
      if (!g || !s.gearOwned.includes(id)) return;
      if (s.equipped[g.slot] === id) {
        delete s.equipped[g.slot];
      } else {
        s.equipped[g.slot] = id;
      }
      if (s.settings.sound) sfx.equip();
      checkAchievements();
      rerender();
    },
    [checkAchievements, rerender],
  );

  // Spend 5 duplicates of a gear item to raise its upgrade level by 1 (+10% stats)
  const upgradeGear = useCallback((id: string) => {
    const s = stateRef.current;
    if (!s.gearOwned.includes(id)) return;
    const dupes = s.gearDuplicates[id] ?? 0;
    if (dupes < 5) return;
    s.gearDuplicates[id] -= 5;
    s.gearUpgrades[id] = (s.gearUpgrades[id] ?? 0) + 1;
    if (s.settings.sound) sfx.loot();
    pushToast('loot', `${GEAR.find(g => g.id === id)?.name} upgraded to +${s.gearUpgrades[id]}! Stats +${10 * s.gearUpgrades[id]}%`);
    rerender();
  }, [pushToast, rerender]);

  const prestige = useCallback(() => {
    const s = stateRef.current;
    const gain = pendingEchoes(s);
    if (gain <= 0) return;
    s.echoes += gain;
    s.totalEchoes += gain;
    s.prestiges += 1;
    // reset run progress; keep gear, echoes, skills, XP, perks, codex
    s.aw = 0;
    s.totalAw = 0;
    s.generators = {};
    s.levelIndex = 0;
    s.maxLevelReached = 0;
    s.buff = null;
    s.encounter = null;
    s.expedition = null;
    s.pendingPhenomenon = null;
    s.finaleAvailable = false;
    s.searchProgress = 0;
    s.searchLevel = 0;
    s.encounterCooldownUntil = 0;
    s.perks = [];
    s.perkTokens = 0;
    s.pendingPerks = null;
    s.pendingLevelUp = false;
    s.xp = 0;
    s.xpLevel = 1;
    comboRef.current = 0;
    // Skills, echoes, gear, deepest Abyss persist through rebirth
    if (s.settings.sound) sfx.prestige();
    pushToast('prestige', `Noclip Out! +${gain} Echoes (total ${s.totalEchoes})`);
    checkAchievements();
    rerender();
  }, [pushToast, checkAchievements, rerender]);

  const unlockSkill = useCallback((nodeId: string) => {
    const s = stateRef.current;
    const node = skillNodeById(nodeId);
    if (!node) return;
    if (!canUnlockNode(node, s.skills, s.echoes)) return;
    s.echoes -= node.cost;
    s.skills[nodeId] = (s.skills[nodeId] ?? 0) + 1;
    if (s.settings.sound) sfx.win();
    rerender();
  }, [rerender]);

  const toggleSetting = useCallback(
    (key: 'sound' | 'reduceMotion') => {
      const s = stateRef.current;
      s.settings[key] = !s.settings[key];
      rerender();
    },
    [rerender],
  );

  const setVolume = useCallback(
    (v: number) => {
      const s = stateRef.current;
      s.settings.volume = Math.max(0, Math.min(1, v));
      setSfxVolume(s.settings.volume);
      rerender();
    },
    [rerender],
  );

  const hardReset = useCallback(() => {
    stateRef.current = freshState();
    comboRef.current = 0;
    localStorage.removeItem(SAVE_KEY);
    pushToast('info', 'Progress wiped. Back to Level 0.');
    rerender();
  }, [pushToast, rerender]);

  // Catch a flying phenomenon orb — skill check mechanic
  const catchPhenomenon = useCallback(() => {
    const s = stateRef.current;
    const pp = s.pendingPhenomenon;
    if (!pp) return;
    const now = performance.now();
    const sb = skillBonuses(s);

    if (pp.effect === 'burst') {
      // Smaller burst — toned down from 45s+25 clicks to 20s+10 clicks
      const amt = Math.max(50, (productionPerSec(s) * 20 + baseClickPower(s) * 10) * sb.burstMult);
      s.aw += amt;
      s.totalAw += amt;
      s.lifetimeAw += amt;
      pushToast('event', `${pp.name} caught! +${Math.round(amt)} AW burst!`);
      checkLevelUp();
    } else {
      // Shorter duration: 12s instead of 18s
      s.buff = { id: pp.id, name: pp.name, effect: pp.effect, label: pp.label, until: now + 12000 * sb.buffDurationMult };
      pushToast('event', `${pp.name} caught! ${pp.label} (12s)`);
    }
    if (s.settings.sound) sfx.event();
    s.pendingPhenomenon = null;
    rerender();
  }, [pushToast, rerender]);

  useEffect(() => {
    let last = performance.now();
    let saveAccum = 0;
    let eventAccum = 0;
    const interval = setInterval(() => {
      const s = stateRef.current;
      const now = performance.now();
      const dt = (now - last) / 1000;
      last = now;
      s.playtime += dt;

      // Auto-click from Automaton skill + Autoclicker perk
      const sb = skillBonuses(s);
      const autoRate = sb.autoClickRate + perkStat(s, 'autoclick');
      if (autoRate > 0) {
        const autoClicks = autoRate * dt;
        let autoPower = clickPower(s, comboRef.current);
        // Auto-clicks can crit too
        if (Math.random() < gearCrit(s)) autoPower *= critMultVal(s) + sb.critDamageAdd;
        if (sb.clickGainsProdPct > 0) autoPower += productionPerSec(s) * sb.clickGainsProdPct;
        const autoGain = autoPower * autoClicks;
        s.aw += autoGain;
        s.totalAw += autoGain;
        s.lifetimeAw += autoGain;
        s.clicks += Math.floor(autoClicks);
        // Auto-clicks build combo too
        if (now - lastClickRef.current < sb.comboDecayMs) comboRef.current += autoClicks * sb.comboBuildMult;
        else comboRef.current = autoClicks;
        lastClickRef.current = now;
        gainXp(autoClicks * 0.6 * sb.xpMult);
        if (sb.clickXpChance > 0 && Math.random() < sb.clickXpChance * autoClicks) gainXp(5 * sb.xpMult);
        checkLevelUp();
      }

      const prod = productionPerSec(s);
      if (prod > 0) {
        const gain = prod * dt;
        s.aw += gain;
        s.totalAw += gain;
        s.lifetimeAw += gain;
        gainXp(dt * (1 + s.levelIndex * 0.4));
        checkLevelUp();
      }

      // Gear is delve-exclusive now — no passive scavenging

      if (!skillBonuses(s).comboNoDecay && now - lastClickRef.current > skillBonuses(s).comboDecayMs && comboRef.current > 0) comboRef.current = 0;
      if (s.buff && now > s.buff.until) s.buff = null;

      // Expire the pending phenomenon orb if player missed it
      if (s.pendingPhenomenon && now > s.pendingPhenomenon.expires) {
        pushToast('info', `${s.pendingPhenomenon.name} faded away...`);
        s.pendingPhenomenon = null;
      }
      if (s.encounter && s.encounter.until && now > s.encounter.until) {
        pushToast('info', `${s.encounter.name} wandered off...`);
        s.encounter = null;
        // cooldown after an encounter ends so the player gets a breather
        s.encounterCooldownUntil = now + 45_000;
      }

      eventAccum += dt;
      if (eventAccum > 1) {
        eventAccum = 0;
        // encounters only start after the player has been playing a short while
        const started = s.playtime > 45 && (s.totalAw > 300 || s.clicks > 40);
        const luck = gearLuck(s);
        if (started && !s.encounter?.isFinale) {
          // Spawn a flying phenomenon orb that the player must click to catch
          if (!s.buff && !s.pendingPhenomenon && Math.random() < 0.04 + luck * 0.15 + skillBonuses(s).buffChanceBonus) {
            const p: Phenomenon = PHENOMENA[Math.floor(Math.random() * PHENOMENA.length)];
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.08 + Math.random() * 0.06; // movement speed in screen-fractions per second
            s.pendingPhenomenon = {
              id: p.id,
              name: p.name,
              effect: p.effect,
              label: p.label,
              icon: p.effect === 'burst' ? '💧' : p.effect.startsWith('click') ? '⚡' : p.effect.startsWith('prod') ? '⚙' : '🍀',
              spawned: now,
              expires: now + 6000, // 6 seconds to click it
              x: 0.2 + Math.random() * 0.6,
              y: 0.2 + Math.random() * 0.5,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
            };
            if (s.settings.sound) sfx.event();
          }
          // Encounters: ~2%/sec base (≈ once per ~50s), gated by a 45s cooldown after the
          // last one ended. Luck slightly raises the chance. Bosses only from depth 6+.
          // Note: encounters can spawn even while a buff is active (they coexist).
          if (!s.encounter && now > s.encounterCooldownUntil && Math.random() < 0.02 + luck * 0.03) {
            const pool: Encounter[] = ENCOUNTERS.filter((e) => (s.levelIndex >= 6 ? true : !e.boss));
            const enc = pool[Math.floor(Math.random() * pool.length)];
            const need = enc.boss ? 40 + s.levelIndex * 5 : 15 + s.levelIndex * 3;
            const reward = Math.max(
              enc.boss ? 500 : 100,
              productionPerSec(s) * (enc.boss ? 70 : 25) + baseClickPower(s) * (enc.boss ? 50 : 18),
            );
            s.encounter = {
              id: enc.id,
              name: enc.name,
              desc: enc.desc,
              boss: enc.boss,
              isFinale: false,
              need,
              got: 0,
              until: now + (enc.boss ? 16000 : 12000),
              reward,
            };
            if (s.settings.sound) sfx.event();
            pushToast('event', `${enc.boss ? 'BOSS' : 'Encounter'}: ${enc.name}!`);
          }
        }
      }

      saveAccum += dt;
      if (saveAccum > 5) {
        saveAccum = 0;
        try {
          s.lastSaved = Date.now();
          localStorage.setItem(SAVE_KEY, JSON.stringify(s));
        } catch {
          /* ignore */
        }
      }

      rerender();
    }, 100);
    return () => {
      clearInterval(interval);
      try {
        stateRef.current.lastSaved = Date.now();
        localStorage.setItem(SAVE_KEY, JSON.stringify(stateRef.current));
      } catch {
        /* ignore */
      }
    };
  }, [checkLevelUp, pushToast, rerender, grantGear, checkAchievements, gainXp]);

  return {
    state: stateRef.current,
    combo: comboRef.current,
    floats,
    toasts,
    doClick,
    attackEncounter,
    fleeEncounter,
    startFinale,
    buyGenerator,
    equipGear,
    upgradeGear,
    prestige,
    goToLevel,
    unlockSkill,
    toggleSetting,
    setVolume,
    hardReset,
    catchPhenomenon,
    choosePerk,
    dismissLevelUp,
    startExpedition,
    expeditionChoose,
    claimGearReveal,
    expeditionDeeper,
    expeditionExtract,
    expeditionClose,
  };
}
