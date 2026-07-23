// Tiny WebAudio blips — no assets required. Kept short & quiet for ADHD-friendly feedback.
let ctx: AudioContext | null = null;
let masterVolume = 0.5;

export function setSfxVolume(v: number) {
  masterVolume = Math.max(0, Math.min(1, v));
}

function ac(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

type Tone = { freq: number; dur: number; type?: OscillatorType; gain?: number };

function play({ freq, dur, type = 'sine', gain = 0.05 }: Tone) {
  const c = ac();
  if (!c) return;
  if (c.state === 'suspended') void c.resume();
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(gain * masterVolume, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
  osc.connect(g);
  g.connect(c.destination);
  osc.start();
  osc.stop(c.currentTime + dur);
}

export const sfx = {
  click(combo = 0) {
    play({ freq: 320 + Math.min(combo, 60) * 8, dur: 0.06, type: 'triangle', gain: 0.04 });
  },
  buy() {
    play({ freq: 520, dur: 0.12, type: 'square', gain: 0.05 });
    setTimeout(() => play({ freq: 780, dur: 0.12, type: 'square', gain: 0.05 }), 70);
  },
  unlock() {
    play({ freq: 440, dur: 0.14, type: 'sine', gain: 0.06 });
    setTimeout(() => play({ freq: 660, dur: 0.16, type: 'sine', gain: 0.06 }), 90);
    setTimeout(() => play({ freq: 880, dur: 0.2, type: 'sine', gain: 0.06 }), 190);
  },
  event() {
    play({ freq: 180, dur: 0.3, type: 'sawtooth', gain: 0.05 });
  },
  win() {
    play({ freq: 660, dur: 0.1, type: 'triangle', gain: 0.06 });
    setTimeout(() => play({ freq: 990, dur: 0.22, type: 'triangle', gain: 0.06 }), 110);
  },
  equip() {
    play({ freq: 420, dur: 0.08, type: 'square', gain: 0.05 });
    setTimeout(() => play({ freq: 640, dur: 0.1, type: 'triangle', gain: 0.05 }), 60);
  },
  descend() {
    // downward sweep for the seamless descent transition
    play({ freq: 520, dur: 0.5, type: 'sine', gain: 0.06 });
    setTimeout(() => play({ freq: 340, dur: 0.5, type: 'sine', gain: 0.06 }), 120);
    setTimeout(() => play({ freq: 200, dur: 0.6, type: 'sine', gain: 0.06 }), 260);
  },
  prestige() {
    play({ freq: 300, dur: 0.2, type: 'sine', gain: 0.07 });
    setTimeout(() => play({ freq: 500, dur: 0.2, type: 'sine', gain: 0.07 }), 130);
    setTimeout(() => play({ freq: 760, dur: 0.25, type: 'sine', gain: 0.07 }), 270);
    setTimeout(() => play({ freq: 1140, dur: 0.4, type: 'triangle', gain: 0.07 }), 420);
  },
};
