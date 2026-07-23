import { ENCOUNTERS, PHENOMENA } from './gameData';

// A push-your-luck "delve": you enter rooms one at a time, resolve an event, then choose to
// press deeper (more reward, more risk of being caught) or extract to bank your haul.
// Every 5th room is a boss room with guaranteed gear. Gear ONLY comes from delves.
export type ExpeditionMode = 'normal' | 'abyss';
export type EventKind = 'cache' | 'entity' | 'fork' | 'shrine' | 'treasure' | 'trap' | 'altar' | 'boss';
export type ExpeditionPhase = 'event' | 'choice' | 'done';

export interface ExpOption {
  id: string;
  label: string;
  hint: string;
}

export interface ExpEvent {
  kind: EventKind;
  title: string;
  name: string;
  desc: string;
  options: ExpOption[];
}

// Delve-wide modifiers rolled at the start — each one changes the run's flavor
export interface DelveModifier {
  id: string;
  name: string;
  desc: string;
  lootMult: number;   // multiplies AW haul
  riskMult: number;   // multiplies risk gain
  gearBonus: number;  // flat bonus to gear drop chance
}

export const DELVE_MODIFIERS: DelveModifier[] = [
  { id: 'normal', name: 'Standard Delve', desc: 'No special conditions.', lootMult: 1, riskMult: 1, gearBonus: 0 },
  { id: 'rich', name: 'Rich Veins', desc: 'Almond Water flows thicker here, but so does attention.', lootMult: 1.5, riskMult: 1.3, gearBonus: 0 },
  { id: 'quiet', name: 'Dead Zone', desc: 'Fewer entities stalk these halls. Loot is thinner.', lootMult: 0.8, riskMult: 0.5, gearBonus: 0.05 },
  { id: 'cursed', name: 'Cursed Halls', desc: 'Something wrong permeates the air. Gear glints brighter, but the dark bites harder.', lootMult: 1, riskMult: 1.5, gearBonus: 0.15 },
  { id: 'treasure-hunt', name: 'Treasure Hunt', desc: 'The walls whisper of hidden caches. More gear, less water.', lootMult: 0.7, riskMult: 1.1, gearBonus: 0.25 },
  { id: 'abyss-touched', name: 'Abyss-Touched', desc: 'The Abyss bleeds through. Everything is amplified.', lootMult: 1.8, riskMult: 1.8, gearBonus: 0.10 },
];

export interface Expedition {
  mode: ExpeditionMode;
  depth: number;
  room: number;
  haulAw: number;
  haulXp: number;
  haulGear: string[];
  risk: number;
  event: ExpEvent;
  phase: ExpeditionPhase;
  over: 'active' | 'extracted' | 'caught';
  log: string[];
  lastText: string;
  modifier: DelveModifier;
  pendingGearReveal: string | null; // gear ID awaiting reveal animation
  lastLoot: { aw: number; xp: number; gear: number } | null; // last event's loot for display
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function clean(name: string): string {
  return name.replace(/^(Entity|Object|Level|Unnumbered Entity|Unnumbered Level)[^-]*-\s*/i, '').replace(/["""]/g, '');
}

export function rollModifier(): DelveModifier {
  // 40% chance of a non-standard modifier
  if (Math.random() < 0.4) {
    return pick(DELVE_MODIFIERS.slice(1));
  }
  return DELVE_MODIFIERS[0];
}

export function rollEvent(room: number, mode: ExpeditionMode): ExpEvent {
  // Boss room every 5 rooms (room 4, 9, 14, 19...) — 0-indexed
  if (room > 0 && room % 5 === 4) {
    const e = pick(ENCOUNTERS.filter((x) => x.boss));
    const nm = clean(e.name);
    return {
      kind: 'boss',
      title: 'A guardian stirs',
      name: nm,
      desc: e.hook,
      options: [
        { id: 'fight', label: `Challenge ${nm}`, hint: 'Guaranteed gear drop on victory — death loses everything' },
        { id: 'retreat', label: 'Retreat to the exit', hint: 'Skip the boss, keep your haul, end the delve' },
      ],
    };
  }

  const roll = Math.random();
  const entityBias = Math.min(0.45, 0.18 + room * 0.025 + (mode === 'abyss' ? 0.12 : 0));
  let kind: EventKind;
  if (roll < entityBias) kind = 'entity';
  else if (roll < entityBias + 0.22) kind = 'cache';
  else if (roll < entityBias + 0.38) kind = 'fork';
  else if (roll < entityBias + 0.50) kind = 'shrine';
  else if (roll < entityBias + 0.62) kind = 'treasure';
  else if (roll < entityBias + 0.75) kind = 'trap';
  else kind = 'altar';

  if (kind === 'entity') {
    const e = pick(ENCOUNTERS);
    const nm = clean(e.name);
    return {
      kind,
      title: e.boss ? 'A hulking shape blocks the way' : 'Something stalks the corridor',
      name: nm,
      desc: e.hook,
      options: [
        { id: 'fight', label: `Fight ${nm}`, hint: 'Win for loot — lose and you may be caught' },
        { id: 'sneak', label: 'Sneak past', hint: 'Luck-based; failure risks a chase' },
        { id: 'bribe', label: 'Toss Almond Water', hint: 'Spend part of your haul to pass safely' },
      ],
    };
  }
  if (kind === 'cache') {
    return {
      kind,
      title: 'A forgotten cache',
      name: 'Supply cache',
      desc: 'Sealed crates and spilled bottles glint in the half-light.',
      options: [
        { id: 'open', label: 'Pry it open', hint: 'Almond Water + a chance at gear' },
        { id: 'careful', label: 'Search carefully', hint: 'Less loot, but safe' },
      ],
    };
  }
  if (kind === 'fork') {
    return {
      kind,
      title: 'The corridor splits',
      name: 'Forked passage',
      desc: 'Two identical hallways yawn open. One of them is lying.',
      options: [
        { id: 'left', label: 'Take the left hall', hint: 'Unknown' },
        { id: 'right', label: 'Take the right hall', hint: 'Unknown' },
      ],
    };
  }
  if (kind === 'shrine') {
    const p = pick(PHENOMENA);
    return {
      kind,
      title: 'An anomaly pulses ahead',
      name: clean(p.name),
      desc: p.hook,
      options: [
        { id: 'attune', label: 'Attune to it', hint: 'Gain XP + a boon' },
        { id: 'harvest', label: 'Harvest it', hint: 'Gamble: big reward or it turns on you' },
      ],
    };
  }
  if (kind === 'treasure') {
    return {
      kind,
      title: 'A glimmer behind the wall',
      name: 'Hidden treasure',
      desc: 'Something glints behind a loose panel. You can feel it through the wallpaper.',
      options: [
        { id: 'pry', label: 'Tear the wall open', hint: 'High chance of gear — but the noise draws attention' },
        { id: 'leave', label: 'Leave it be', hint: 'Safe, but you\'ll always wonder' },
      ],
    };
  }
  if (kind === 'trap') {
    return {
      kind,
      title: 'The floor shifts',
      name: 'Trap corridor',
      desc: 'Tiles click under your weight. Something is armed and you\'re standing on it.',
      options: [
        { id: 'disarm', label: 'Try to disarm it', hint: 'Luck-based: success yields salvage, failure hurts' },
        { id: 'wait', label: 'Wait for it to reset', hint: 'Lose time, gain a little safety' },
      ],
    };
  }
  // altar
  return {
    kind,
    title: 'A crude altar sits in the dark',
    name: 'Wanderer\'s altar',
    desc: 'A pile of objects, keys, and bones arranged with deliberate care. Something wants an offering.',
    options: [
      { id: 'offer-aw', label: 'Offer Almond Water', hint: 'Sacrifice haul for a permanent delve boon' },
      { id: 'offer-gear', label: 'Offer a piece of gear', hint: 'Risk losing an item for a powerful blessing' },
      { id: 'ignore', label: 'Walk past it', hint: 'Nothing gained, nothing lost' },
    ],
  };
}
