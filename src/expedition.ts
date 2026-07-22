import { ENCOUNTERS, PHENOMENA } from './gameData';

// A push-your-luck "delve": you enter rooms one at a time, resolve an event, then choose to
// press deeper (more reward, more risk of being caught) or extract to bank your haul.
export type ExpeditionMode = 'normal' | 'abyss';
export type EventKind = 'cache' | 'entity' | 'fork' | 'shrine';
export type ExpeditionPhase = 'event' | 'choice' | 'done';

export interface ExpOption {
  id: string;
  label: string;
  hint: string;
}

export interface ExpEvent {
  kind: EventKind;
  title: string;
  name: string; // flavor name pulled from the DB
  desc: string;
  options: ExpOption[];
}

export interface Expedition {
  mode: ExpeditionMode;
  depth: number;
  room: number;
  haulAw: number;
  haulXp: number;
  haulGear: string[];
  risk: number; // chance the next "delve deeper" ends in an ambush
  event: ExpEvent;
  phase: ExpeditionPhase;
  over: 'active' | 'extracted' | 'caught';
  log: string[];
  lastText: string;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function clean(name: string): string {
  return name.replace(/^(Entity|Object|Level|Unnumbered Entity|Unnumbered Level)[^-]*-\s*/i, '').replace(/["“”']/g, '');
}

export function rollEvent(room: number, mode: ExpeditionMode): ExpEvent {
  const roll = Math.random();
  // deeper rooms lean toward entities (danger); abyss is nastier
  const entityBias = Math.min(0.55, 0.2 + room * 0.03 + (mode === 'abyss' ? 0.15 : 0));
  let kind: EventKind;
  if (roll < entityBias) kind = 'entity';
  else if (roll < entityBias + 0.28) kind = 'cache';
  else if (roll < entityBias + 0.5) kind = 'fork';
  else kind = 'shrine';

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
  // shrine
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
