import type { SceneKind } from './gameData';

// Each scene is a self-contained atmospheric diorama behind the click target.
// Uses layered CSS gradients for depth + a few animated elements for life.
// `hue` shifts the palette so levels sharing a scene type still feel distinct.
export default function Scene({ kind, hue, reduceMotion }: { kind: SceneKind; hue: number; reduceMotion: boolean }) {
  const style = { ['--hue' as string]: `${hue}` } as React.CSSProperties;
  const rm = reduceMotion ? ' rm' : '';

  const scenes: Record<SceneKind, React.ReactNode> = {
    corridor: (
      <div className="sc-corridor">
        <div className="sc-floor" />
        <div className="sc-vanish" />
        <div className="sc-ceil-light" />
        <div className="sc-perspective" />
        <div className="sc-mist" />
      </div>
    ),
    office: (
      <div className="sc-office">
        <div className="sc-ceiling" />
        <div className="sc-fluorescent" />
        <div className="sc-cubicle" />
        <div className="sc-glow" />
      </div>
    ),
    hotel: (
      <div className="sc-hotel">
        <div className="sc-wallpaper" />
        <div className="sc-wainscot" />
        <div className="sc-carpet" />
        <div className="sc-doorway" />
        <div className="sc-sconce sc-s1" />
        <div className="sc-sconce sc-s2" />
      </div>
    ),
    dark: (
      <div className="sc-dark">
        <div className="sc-flashlight" />
        <div className="sc-dust" />
        <div className="sc-eye sc-e1" />
        <div className="sc-eye sc-e2" />
        <div className="sc-eye sc-e3" />
        <div className="sc-silhouette" />
      </div>
    ),
    water: (
      <div className="sc-water">
        <div className="sc-surface" />
        <div className="sc-godray sc-gr1" />
        <div className="sc-godray sc-gr2" />
        <div className="sc-godray sc-gr3" />
        <div className="sc-caustic" />
        <div className="sc-bubble sc-b1" />
        <div className="sc-bubble sc-b2" />
        <div className="sc-bubble sc-b3" />
        <div className="sc-bubble sc-b4" />
        <div className="sc-bubble sc-b5" />
        <div className="sc-bubble sc-b6" />
      </div>
    ),
    cave: (
      <div className="sc-cave">
        <div className="sc-rock" />
        <div className="sc-stalactite sc-sk1" />
        <div className="sc-stalactite sc-sk2" />
        <div className="sc-stalactite sc-sk3" />
        <div className="sc-stalactite sc-sk4" />
        <div className="sc-stalagmite sc-sm1" />
        <div className="sc-stalagmite sc-sm2" />
        <div className="sc-crystal sc-cr1" />
        <div className="sc-crystal sc-cr2" />
        <div className="sc-crystal sc-cr3" />
        <div className="sc-drip" />
      </div>
    ),
    suburb: (
      <div className="sc-suburb">
        <div className="sc-sky" />
        <div className="sc-moon" />
        <div className="sc-house sc-h1" />
        <div className="sc-house sc-h2" />
        <div className="sc-house sc-h3" />
        <div className="sc-streetlight" />
        <div className="sc-lightpool" />
      </div>
    ),
    field: (
      <div className="sc-field">
        <div className="sc-horizon" />
        <div className="sc-moon" />
        <div className="sc-grass sc-g1" />
        <div className="sc-grass sc-g2" />
        <div className="sc-grass sc-g3" />
        <div className="sc-firefly sc-f1" />
        <div className="sc-firefly sc-f2" />
        <div className="sc-firefly sc-f3" />
        <div className="sc-firefly sc-f4" />
      </div>
    ),
    digital: (
      <div className="sc-digital">
        <div className="sc-scanlines" />
        <div className="sc-rain sc-r1" />
        <div className="sc-rain sc-r2" />
        <div className="sc-rain sc-r3" />
        <div className="sc-rain sc-r4" />
        <div className="sc-rain sc-r5" />
        <div className="sc-rain sc-r6" />
        <div className="sc-rain sc-r7" />
        <div className="sc-rain sc-r8" />
        <div className="sc-glitch sc-g1" />
        <div className="sc-glitch sc-g2" />
        <div className="sc-crt" />
      </div>
    ),
    ruins: (
      <div className="sc-ruins">
        <div className="sc-ambience" />
        <div className="sc-pillar sc-p1" />
        <div className="sc-pillar sc-p2" />
        <div className="sc-pillar sc-p3" />
        <div className="sc-pillar sc-p4" />
        <div className="sc-shaft sc-s1" />
        <div className="sc-shaft sc-s2" />
        <div className="sc-dust" />
      </div>
    ),
    void: (
      <div className="sc-void">
        <div className="sc-nebula" />
        <div className="sc-star sc-s1" /><div className="sc-star sc-s2" /><div className="sc-star sc-s3" />
        <div className="sc-star sc-s4" /><div className="sc-star sc-s5" /><div className="sc-star sc-s6" />
        <div className="sc-star sc-s7" /><div className="sc-star sc-s8" /><div className="sc-star sc-s9" />
        <div className="sc-singularity" />
        <div className="sc-ring sc-r1" />
        <div className="sc-ring sc-r2" />
      </div>
    ),
    neon: (
      <div className="sc-neon">
        <div className="sc-haze" />
        <div className="sc-sign sc-sn1" />
        <div className="sc-sign sc-sn2" />
        <div className="sc-sign sc-sn3" />
        <div className="sc-rain sc-r1" /><div className="sc-rain sc-r2" /><div className="sc-rain sc-r3" />
        <div className="sc-rain sc-r4" /><div className="sc-rain sc-r5" /><div className="sc-rain sc-r6" />
        <div className="sc-reflection" />
      </div>
    ),
  };

  return (
    <div className={`scene scene-${kind}${rm}`} style={style} aria-hidden>
      {scenes[kind]}
    </div>
  );
}
