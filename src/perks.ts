// Roguelike perks offered on Explorer level-ups. Perks are stackable (you can pick the
// same one twice), so there is always something to choose. Each perk adds `val` to a stat key.
export type PerkKey = 'click' | 'prod' | 'luck' | 'crit' | 'aw' | 'combo' | 'xp' | 'expedition' | 'autoclick' | 'echo';

export interface Perk {
  id: string;
  name: string;
  desc: string;
  icon: string;
  key: PerkKey;
  val: number;
  tier: 1 | 2 | 3;
  flavor?: string;
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
  // --- Tier 3: powerful, build-defining choices ---
  { id: 'surge', name: 'Surge', desc: '+120% click power', icon: '⚡', key: 'click', val: 1.2, tier: 3, flavor: 'Your clicks surge with the force of the Backrooms themselves.' },
  { id: 'overmind', name: 'Overmind', desc: '+100% ally production', icon: '⚙', key: 'prod', val: 1.0, tier: 3, flavor: 'Allies move as one, guided by a will beyond their own.' },
  { id: 'destiny', name: 'Destiny', desc: '+25% luck', icon: '🍀', key: 'luck', val: 0.25, tier: 3, flavor: 'The Backrooms bend to your will. Fortune is no longer chance.' },
  { id: 'annihilator', name: 'Annihilator', desc: '+15% crit chance', icon: '✧', key: 'crit', val: 0.15, tier: 3, flavor: 'Every strike finds the weak point. Every time.' },
  { id: 'tidal-wave', name: 'Tidal Wave', desc: '+50% Almond Water gains', icon: '💧', key: 'aw', val: 0.5, tier: 3, flavor: 'AW flows like water, like the flood that never recedes.' },
  { id: 'hyperflow', name: 'Hyperflow', desc: 'Combo builds 80% faster', icon: '🔥', key: 'combo', val: 0.8, tier: 3, flavor: 'Time slows. Your fingers don\'t.' },
  { id: 'enlightenment', name: 'Enlightenment', desc: '+100% XP gain', icon: '📖', key: 'xp', val: 1.0, tier: 3, flavor: 'Knowledge of the Backrooms floods your mind.' },
  { id: 'pathfinder-iii', name: 'Pathfinder', desc: '+80% expedition loot, -40% risk', icon: '🗺', key: 'expedition', val: 0.8, tier: 3, flavor: 'You know every path, every shortcut, every exit.' },
  // --- Tier 2: new stats ---
  { id: 'autoclicker', name: 'Autoclicker', desc: '+0.5 auto-clicks per second', icon: '🖱', key: 'autoclick', val: 0.5, tier: 2, flavor: 'Your finger taps even when you\'re not touching it.' },
  { id: 'echo-boost', name: 'Echo Boost', desc: '+20% echoes earned on prestige', icon: '🌀', key: 'echo', val: 0.2, tier: 2, flavor: 'The walls remember you better.' },
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
