// Cinematic per-depth theme bands. Colors shift as you descend, getting moodier & stranger.
export interface Theme {
  name: string;
  c1: string; // top gradient
  c2: string; // mid gradient
  c3: string; // deep gradient
  accent: string; // UI accent + particles
  glow: string; // glow color
  particle: 'motes' | 'spores' | 'ash' | 'rain' | 'void' | 'stars';
  fog: number; // 0..1 fog density
  grid: string; // wallpaper line color
}

const THEMES: Theme[] = [
  { name: 'Threshold', c1: '#e4d47a', c2: '#c1b155', c3: '#8a7d38', accent: '#fff1a8', glow: '#ffe27a', particle: 'motes', fog: 0.12, grid: 'rgba(0,0,0,0.06)' },
  { name: 'Habitation', c1: '#cdbf63', c2: '#a89a4c', c3: '#6f6531', accent: '#ffe27a', glow: '#ffd25a', particle: 'motes', fog: 0.16, grid: 'rgba(0,0,0,0.07)' },
  { name: 'Damp Halls', c1: '#9ea24e', c2: '#7c8447', c3: '#4f5a30', accent: '#e8ffa8', glow: '#c6e06a', particle: 'spores', fog: 0.24, grid: 'rgba(0,0,0,0.08)' },
  { name: 'Overgrowth', c1: '#6f7a52', c2: '#55613f', c3: '#333f24', accent: '#b9ffb0', glow: '#8fe08a', particle: 'spores', fog: 0.3, grid: 'rgba(0,0,0,0.1)' },
  { name: 'Terror Halls', c1: '#5b3f3f', c2: '#472f2f', c3: '#2a1818', accent: '#ffb0a8', glow: '#ff6b6b', particle: 'ash', fog: 0.36, grid: 'rgba(0,0,0,0.14)' },
  { name: 'Lights Out', c1: '#2e2e34', c2: '#1f1f26', c3: '#101015', accent: '#ffd25a', glow: '#ffbb33', particle: 'ash', fog: 0.5, grid: 'rgba(255,210,90,0.05)' },
  { name: 'Drowned Deep', c1: '#22424e', c2: '#173039', c3: '#0b1a20', accent: '#8fe0ff', glow: '#4fc8ff', particle: 'rain', fog: 0.44, grid: 'rgba(143,224,255,0.06)' },
  { name: 'Violet Dread', c1: '#33294e', c2: '#241c3a', c3: '#140f22', accent: '#c79bff', glow: '#9b5bff', particle: 'spores', fog: 0.4, grid: 'rgba(199,155,255,0.06)' },
  { name: 'Crimson Sink', c1: '#41293a', c2: '#301f2c', c3: '#1a0f18', accent: '#ff9bd0', glow: '#ff5ba8', particle: 'ash', fog: 0.46, grid: 'rgba(255,155,208,0.06)' },
  { name: 'Emerald Void', c1: '#1e3a30', c2: '#142a23', c3: '#081712', accent: '#9bffcf', glow: '#3bffab', particle: 'void', fog: 0.5, grid: 'rgba(155,255,207,0.06)' },
  { name: 'The Abyss', c1: '#1a1a28', c2: '#101018', c3: '#050508', accent: '#a6b6ff', glow: '#7a8cff', particle: 'stars', fog: 0.6, grid: 'rgba(166,182,255,0.05)' },
  { name: 'End of Depth', c1: '#0c0c14', c2: '#08080e', c3: '#000000', accent: '#ffe27a', glow: '#ffffff', particle: 'stars', fog: 0.7, grid: 'rgba(255,226,122,0.05)' },
];

export function themeForDepth(index: number): Theme {
  // 12 bands mapped across all levels
  const band = Math.min(THEMES.length - 1, Math.floor((index / 36) * THEMES.length));
  return THEMES[band];
}

export { THEMES };
