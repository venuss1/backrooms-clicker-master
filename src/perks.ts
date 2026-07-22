// Roguelike perks offered on Explorer level-ups. Perks are stackable (you can pick the
// same one twice), so there is always something to choose. Each perk adds `val` to a stat key.
export type PerkKey = 'click' | 'prod' | 'luck' | 'crit' | 'aw' | 'combo' | 'xp' | 'expedition';

export interface Perk {
  id: string;
  name: string;
  desc: string;
  icon: string;
  key: PerkKey;
  val: number;
  tier: 1 | 2 | 3;
}

export const PERKS: Perk[] = [
  { id: 'adrenaline', name: 'Adrenaline', desc: '+35% click power', icon: '⚡', key: 'click', val: 0.35, tier: 1 },
  { id: 'overclock', name: 'Overclock', desc: '+70% click power', icon: '⚡', key: 'click', val: 0.7, tier: 2 },
  { id: 'swarm', name: 'Swarm', desc: '+30% ally production', icon: '⚙', key: 'prod', val: 0.3, tier: 1 },
  { id: 'hive-mind', name: 'Hive Mind', desc: '+60% ally production', icon: '⚙', key: 'prod', val: 0.6, tier: 2 },
  { id: 'fortune', name: 'Fortune', desc: '+8% luck (loot & events)', icon: '🍀', key: 'luck', val: 0.08, tier: 1 },
  { id: 'jackpot', name: 'Jackpot', desc: '+16% luck', icon: '🍀', key: 'luck', val: 0.16, tier: 2 },
  { id: 'lethality', name: 'Lethality', desc: '+5% crit chance', icon: '✧', key: 'crit', val: 0.05, tier: 1 },
  { id: 'executioner', name: 'Executioner', desc: '+9% crit chance', icon: '✧', key: 'crit', val: 0.09, tier: 2 },
  { id: 'hoard', name: 'Hoard', desc: '+15% Almond Water gains', icon: '💧', key: 'aw', val: 0.15, tier: 1 },
  { id: 'greed', name: 'Greed', desc: '+30% Almond Water gains', icon: '💧', key: 'aw', val: 0.3, tier: 2 },
  { id: 'momentum', name: 'Momentum', desc: 'Combo builds 25% faster', icon: '🔥', key: 'combo', val: 0.25, tier: 1 },
  { id: 'flow-state', name: 'Flow State', desc: 'Combo builds 50% faster', icon: '🔥', key: 'combo', val: 0.5, tier: 2 },
  { id: 'insight', name: 'Insight', desc: '+30% XP gain', icon: '📖', key: 'xp', val: 0.3, tier: 1 },
  { id: 'scholar', name: 'Scholar', desc: '+60% XP gain', icon: '📖', key: 'xp', val: 0.6, tier: 2 },
  { id: 'delver', name: 'Delver', desc: '+25% expedition loot, lower risk', icon: '🗺', key: 'expedition', val: 0.25, tier: 1 },
  { id: 'pathfinder', name: 'Pathfinder', desc: '+50% expedition loot, lower risk', icon: '🗺', key: 'expedition', val: 0.5, tier: 2 },
];

export function perkById(id: string): Perk | undefined {
  return PERKS.find((p) => p.id === id);
}

// Pick `n` distinct random perks to offer as a level-up choice.
export function rollPerkChoices(n = 3): string[] {
  const pool = [...PERKS];
  const out: string[] = [];
  while (out.length < n && pool.length > 0) {
    const i = Math.floor(Math.random() * pool.length);
    out.push(pool[i].id);
    pool.splice(i, 1);
  }
  return out;
}
