import { useEffect, useRef } from 'react';
import type { Theme } from './themes';
import type { SceneKind } from './gameData';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  a: number;
  phase: number;
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Scene-specific particle behavior presets
const SCENE_PARTICLE: Record<SceneKind, { style: 'motes' | 'rain' | 'stars' | 'void' | 'spores' | 'ash'; density: number; speed: number }> = {
  corridor: { style: 'motes', density: 0.7, speed: 0.3 },
  office: { style: 'motes', density: 0.4, speed: 0.15 },
  hotel: { style: 'ash', density: 0.5, speed: 0.2 },
  dark: { style: 'motes', density: 0.3, speed: 0.1 },
  water: { style: 'rain', density: 1.2, speed: 0.6 },
  cave: { style: 'motes', density: 0.5, speed: 0.25 },
  suburb: { style: 'motes', density: 0.6, speed: 0.2 },
  field: { style: 'spores', density: 1.0, speed: 0.35 },
  digital: { style: 'rain', density: 1.5, speed: 1.0 },
  ruins: { style: 'ash', density: 0.8, speed: 0.3 },
  void: { style: 'void', density: 1.3, speed: 0.15 },
  neon: { style: 'rain', density: 1.0, speed: 0.8 },
};

// Scene-specific background gradient colors.
// These are related to the click-zone scene's color family but lighter & more diffused,
// so the website background shifts mood with each level while staying distinct from the
// darker, more saturated click-zone diorama behind the button.
const SCENE_PALETTE: Record<SceneKind, { c1: string; c2: string; c3: string; accent: string; glow: string }> = {
  corridor: { c1: '#3a3018', c2: '#221c10', c3: '#0c0a06', accent: '#ffe27a', glow: '#ffd25a' },
  office:   { c1: '#2a2a18', c2: '#1c1c10', c3: '#0a0a06', accent: '#ffe88a', glow: '#fff0a0' },
  hotel:    { c1: '#3a1e1a', c2: '#241410', c3: '#100808', accent: '#ff9b6b', glow: '#ff7b4b' },
  dark:     { c1: '#1a1a1e', c2: '#101014', c3: '#040406', accent: '#ffd25a', glow: '#ffbb33' },
  water:    { c1: '#0e3848', c2: '#082838', c3: '#02141e', accent: '#8fe0ff', glow: '#4fc8ff' },
  cave:     { c1: '#2e2010', c2: '#1e1408', c3: '#0a0604', accent: '#ffb84d', glow: '#ff9b33' },
  suburb:   { c1: '#1a1e36', c2: '#121628', c3: '#080a14', accent: '#ffd76b', glow: '#ffbb44' },
  field:    { c1: '#162a18', c2: '#0e1c10', c3: '#040a06', accent: '#9bffcf', glow: '#7be0a0' },
  digital:  { c1: '#06140a', c2: '#040c08', c3: '#010604', accent: '#7bff9b', glow: '#4fff7b' },
  ruins:    { c1: '#2e2410', c2: '#1e1808', c3: '#0a0804', accent: '#ffd76b', glow: '#ddb044' },
  void:     { c1: '#1a0e2e', c2: '#10081e', c3: '#04020e', accent: '#c79bff', glow: '#9b5bff' },
  neon:     { c1: '#260a1a', c2: '#18060e', c3: '#08020a', accent: '#ff6bab', glow: '#ff3b8b' },
};

export default function Background({ theme, scene, hue, reduceMotion }: { theme: Theme; scene: SceneKind; hue: number; reduceMotion: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef(0);
  const sceneRef = useRef(scene);
  sceneRef.current = scene;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const sp = SCENE_PARTICLE[sceneRef.current];
    const count = reduceMotion ? 20 : Math.floor(90 * sp.density);
    const rand = (a: number, b: number) => a + Math.random() * (b - a);
    particlesRef.current = Array.from({ length: count }, () => ({
      x: rand(0, w),
      y: rand(0, h),
      vx: rand(-0.15, 0.15),
      vy: rand(-0.5, -0.05),
      r: rand(0.6, 2.6),
      a: rand(0.1, 0.6),
      phase: rand(0, Math.PI * 2),
    }));

    const onResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);

    let t = 0;
    const draw = () => {
      const sc = sceneRef.current;
      const cfg = SCENE_PARTICLE[sc];
      const pal = SCENE_PALETTE[sc];
      const [r, g, b] = hexToRgb(pal.accent);
      ctx.clearRect(0, 0, w, h);
      t += 0.016;

      for (const p of particlesRef.current) {
        const style = cfg.style;
        if (style === 'rain') {
          p.y += 3.2 * cfg.speed;
          p.x += 0.4 * cfg.speed;
        } else if (style === 'stars' || style === 'void') {
          p.x += p.vx * 0.4;
          p.y += p.vy * 0.4;
          p.a = 0.3 + Math.sin(t * 2 + p.phase) * 0.3;
        } else if (style === 'spores') {
          p.x += p.vx + Math.sin(t * 0.8 + p.phase) * 0.5;
          p.y += p.vy * 0.5;
        } else if (style === 'ash') {
          p.x += Math.sin(t + p.phase) * 0.4;
          p.y += 0.3 * cfg.speed;
        } else {
          p.x += p.vx + Math.sin(t + p.phase) * 0.3;
          p.y += p.vy * cfg.speed;
        }
        if (p.y < -5) { p.y = h + 5; p.x = rand(0, w); }
        if (p.y > h + 6) p.y = -5;
        if (p.x < -5) p.x = w + 5;
        if (p.x > w + 5) p.x = -5;

        ctx.beginPath();
        if (style === 'rain') {
          ctx.strokeStyle = `rgba(${r},${g},${b},${p.a * 0.5})`;
          ctx.lineWidth = 1;
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - 1, p.y - 8);
          ctx.stroke();
        } else {
          const glow = style === 'stars' || style === 'void' || style === 'spores';
          ctx.fillStyle = `rgba(${r},${g},${b},${p.a})`;
          if (glow) {
            ctx.shadowBlur = 8;
            ctx.shadowColor = `rgba(${r},${g},${b},0.8)`;
          } else {
            ctx.shadowBlur = 0;
          }
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.shadowBlur = 0;
      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', onResize);
    };
  }, [reduceMotion, scene, hue]);

  const hueStyle = { ['--hue' as string]: `${hue}` } as React.CSSProperties;
  const pal = SCENE_PALETTE[scene];

  return (
    <div className="bg-root" aria-hidden>
      <div
        className="bg-gradient"
        style={{
          background: `radial-gradient(130% 90% at 50% -10%, ${pal.c1} 0%, ${pal.c2} 50%, ${pal.c3} 100%)`,
        }}
      />
      {/* Scene-specific atmospheric layer — matches the current level's mood */}
      <div className={`bg-scene bg-scene-${scene}`} style={hueStyle} />
      <div
        className="bg-grid"
        style={{
          backgroundImage: `repeating-linear-gradient(0deg, ${theme.grid} 0 2px, transparent 2px 46px), repeating-linear-gradient(90deg, ${theme.grid} 0 2px, transparent 2px 46px)`,
        }}
      />
      <canvas ref={canvasRef} className="bg-canvas" />
      <div className="bg-fog" style={{ opacity: theme.fog }} />
      <div className="bg-vignette" />
      {!reduceMotion && <div className="bg-flicker" style={{ background: pal.glow }} />}
    </div>
  );
}
