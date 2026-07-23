import { useEffect, useMemo, useRef, useState } from 'react';
import {
  useGame,
  genCount,
  genCost,
  genBulkCost,
  genMaxAffordable,
  productionPerSec,
  clickPower,
  comboMult,
  nextLevel,
  levelMult,
  skillBonuses,
  critMultVal,
  gearCrit,
  gearLuck,
  gearClickMult,
  gearProdMult,
  pendingEchoes,
  allyCount,
  gearBySlot,
  eligibleDrops,
  ACHIEVEMENTS,
  SLOTS,
  xpNeed,
  xpPct,
  xpLevelMult,
  abyssMult,
  abyssUnlocked,
  levelPrestigeGate,
} from './useGame';
import { perkById } from './perks';
import type { EventKind } from './expedition';
import { GENERATORS, GEAR, LEVELS, FINALE, type GearSlot } from './gameData';
import { themeForDepth } from './themes';
import Background from './Background';
import Scene from './Scene';
import { fmt, fmtRate } from './format';
import { SKILL_NODES, BRANCH_INFO, canUnlockNode, skillRank, isNodeVisible, TREE_CENTER, TREE_BOUNDS, skillNodeById, type SkillBranch } from './skillTree';
import './App.css';

type Tab = 'allies' | 'gear' | 'delve' | 'codex' | 'echoes' | 'wiki';

const EVENT_ICON: Record<EventKind, string> = {
  cache: '▣',
  entity: '☠',
  fork: '⑂',
  shrine: '✧',
  treasure: '✦',
  trap: '⚠',
  altar: '⛿',
  boss: '☠',
};

export default function App() {
  const g = useGame();
  const s = g.state;
  const [tab, setTab] = useState<Tab>('allies');
  const [gearSlotFilter, setGearSlotFilter] = useState<GearSlot>('Weapon');
  const [showSettings, setShowSettings] = useState(false);
  const [buyQty, setBuyQty] = useState<1 | 2 | 5 | 'max'>('max');
  const [wikiLevel, setWikiLevel] = useState<number>(-1); // -1 = all levels

  // Skill tree pan/zoom state
  const [treeZoom, setTreeZoom] = useState(0.5);
  const [treePan, setTreePan] = useState({ x: 0, y: 0 });
  const [hoveredSkill, setHoveredSkill] = useState<string | null>(null);
  const [showTree, setShowTree] = useState(false);
  const [treeMouse, setTreeMouse] = useState({ x: 0, y: 0 });
  const treeDragRef = useRef<{ x: number; y: number; px: number; py: number } | null>(null);

  const theme = useMemo(() => themeForDepth(s.levelIndex), [s.levelIndex]);
  const prod = productionPerSec(s);
  const cp = clickPower(s, g.combo);
  const lvl = LEVELS[s.levelIndex];
  const nxt = nextLevel(s);
  const sb = skillBonuses(s);
  const cmb = comboMult(g.combo, sb.comboCapBonus);

  // Seamless descent transition
  const [descent, setDescent] = useState<{ name: string; depth: number } | null>(null);
  const prevLevel = useRef(s.levelIndex);
  useEffect(() => {
    if (s.levelIndex > prevLevel.current) {
      setDescent({ name: lvl.name, depth: s.levelIndex });
      const t = setTimeout(() => setDescent(null), s.settings.reduceMotion ? 600 : 1900);
      prevLevel.current = s.levelIndex;
      return () => clearTimeout(t);
    }
    prevLevel.current = s.levelIndex;
  }, [s.levelIndex, lvl.name, s.settings.reduceMotion]);

  const goalPct = useMemo(() => {
    if (!nxt) return 100;
    const prev = LEVELS[s.levelIndex]?.unlockCost ?? 0;
    return Math.min(100, ((s.totalAw - prev) / (nxt.unlockCost - prev)) * 100);
  }, [s.totalAw, s.levelIndex, nxt]);

  const rootStyle = {
    ['--accent' as string]: theme.accent,
    ['--glow' as string]: theme.glow,
  } as React.CSSProperties;

  return (
    <div className={`app${s.settings.reduceMotion ? ' reduce-motion' : ''}`} style={rootStyle}>
      <Background theme={theme} scene={lvl.scene} hue={lvl.hue} reduceMotion={s.settings.reduceMotion} />

      <header className="topbar">
        <div className="brand">
          <span className="logo">◱</span>
          <div>
            <h1>NO-CLIP</h1>
            <p>a backrooms clicker</p>
          </div>
        </div>
        <div className="stats">
          {s.totalEchoes > 0 && (
            <div className="lumens" title={`${s.echoes} unspent Echoes`}>
              <span className="lm-val">✦ {fmt(s.echoes)}</span>
              <span className="lm-lbl">Echoes ({s.totalEchoes} total)</span>
            </div>
          )}
          <div className="aw">
            <span className="aw-val">{fmt(s.aw)}</span>
            <span className="aw-lbl">Almond Water</span>
          </div>
          <div className="rate">{fmtRate(prod)}</div>
          <div className="xp" title={`Explorer bonus ×${xpLevelMult(s).toFixed(2)} to everything`}>
            <div className="xp-head">
              <span className="xp-lvl">⬡ Explorer {s.xpLevel}</span>
              <span className="xp-num">{fmt(Math.floor(s.xp))}/{fmt(xpNeed(s.xpLevel))}</span>
            </div>
            <div className="xp-bar"><div className="xp-fill" style={{ width: `${xpPct(s)}%` }} /></div>
            {s.perkTokens > 0 && <span className="perk-token">◆ {s.perkTokens} perk{s.perkTokens > 1 ? 's' : ''} to choose</span>}
          </div>
        </div>
        <div className="settings">
          <button className="toggle on" onClick={() => setShowSettings(true)} title="Settings">
            {'\u2699'}
          </button>
        </div>
      </header>

      <main className="stage">
        <section className="clicker-col">
          <div className="level-card">
            <div className="level-nav">
              <button className="lvl-nav-btn" onClick={() => g.goToLevel(s.levelIndex - 1)} disabled={s.levelIndex <= 0} title="Go to previous level">{'\u25C0'}</button>
              <span className="depth-tag">Depth {s.levelIndex} · {theme.name}</span>
              <button className="lvl-nav-btn" onClick={() => g.goToLevel(s.levelIndex + 1)} disabled={s.levelIndex >= s.maxLevelReached} title="Go to next level">{'\u25B6'}</button>
            </div>
            <h2>{lvl.name}</h2>
            <p className="level-desc">{lvl.desc}</p>
            <p className="level-hook">▸ {lvl.hook}</p>
            <div className="mult-chip">×{levelMult(s).toFixed(1)} everything at this depth</div>
            {s.levelIndex < s.maxLevelReached && (
              <p className="level-back-hint">Exploring a previous depth. Go to Depth {s.maxLevelReached} for the full multiplier.</p>
            )}
          </div>

          <div className="goal">
            {nxt ? (
              <>
                <div className="goal-head">
                  <span>Next: {nxt.name}</span>
                  <span>{fmt(s.totalAw)} / {fmt(nxt.unlockCost)}</span>
                </div>
                <div className="bar"><div className="bar-fill" style={{ width: `${goalPct}%` }} /></div>
                {(() => {
                  const gate = levelPrestigeGate(s.levelIndex + 1);
                  if (gate > 0 && s.prestiges < gate) {
                    return <div className="goal-sub">⚠ Noclip Out {gate}× to unlock deeper levels ({s.prestiges}/{gate})</div>;
                  }
                  return <div className="goal-sub">Keep earning to noclip deeper</div>;
                })()}
              </>
            ) : (
              <div className="goal-head">
                <span>{s.finaleDefeated ? 'You escaped. Noclip Out to go again, stronger. 🏆' : 'Deepest level reached — face the finale in the Echoes tab.'}</span>
              </div>
            )}
          </div>

          <div className={`click-zone scene-zone sz-${lvl.scene}`}>
            <Scene kind={lvl.scene} hue={lvl.hue} reduceMotion={s.settings.reduceMotion} />
            <button
              className={`click-target ${g.combo >= 25 ? 'hot' : ''}`}
              onClick={(e) => g.doClick(e.clientX, e.clientY)}
              aria-label={`${lvl.verb} through ${lvl.name}`}
            >
              <span className="ct-ring" />
              <span className="ct-inner">
                <span className="ct-icon">{lvl.icon}</span>
                <span className="ct-big" style={{ fontSize: lvl.verb.length >= 8 ? 32 : lvl.verb.length >= 6 ? 38 : 44, letterSpacing: lvl.verb.length >= 8 ? 2 : 4 }}>{lvl.verb}</span>
                <span className="ct-sub">+{fmt(cp)} per click</span>
                {gearCrit(s) > 0 && <span className="ct-crit">{Math.round(gearCrit(s) * 100)}% crit ×{critMultVal(s)}</span>}
              </span>
            </button>
            {g.floats.map((f) => (
              <span key={f.id} className={`float ${f.crit ? 'crit' : ''}`} style={{ left: f.x, top: f.y }}>
                {f.crit ? 'CRIT ' : '+'}{fmt(f.amount)}
              </span>
            ))}
          </div>

          {(() => {
            const elig = eligibleDrops(s);
            const lvlName = LEVELS[s.levelIndex]?.name ?? 'this depth';
            return (
              <div className="scavenge">
                <div className="combo-head">
                  <span>Delve for Gear at {lvlName}</span>
                  <span>{elig.length > 0 ? `${elig.length} item${elig.length > 1 ? 's' : ''} to find here` : 'all gear found here'}</span>
                </div>
                <div className="combo-sub">
                  {elig.length > 0
                    ? `Each depth has unique gear — go back to earlier levels to collect what you missed`
                    : `All items at this depth found. Explore other depths for more gear.`}
                </div>
              </div>
            );
          })()}

          <div className="combo">
            <div className="combo-head">
              <span>Combo streak</span>
              <span className="combo-mult">×{cmb.toFixed(2)}</span>
            </div>
            <div className="bar small"><div className="bar-fill combo-fill" style={{ width: `${Math.min(g.combo, 100)}%` }} /></div>
            <div className="combo-sub">{g.combo > 0 ? `${g.combo} in a row — keep clicking fast!` : 'Click fast to build a multiplier'}</div>
          </div>

          <div className="mini-stats">
            <div><b>{fmt(cp)}</b><span>per click</span></div>
            <div><b>×{(gearClickMult(s) * gearProdMult(s)).toFixed(2)}</b><span>gear power</span></div>
            <div><b>{Math.round(gearCrit(s) * 100)}%</b><span>crit</span></div>
            <div><b>{Math.round(gearLuck(s) * 100)}%</b><span>luck</span></div>
          </div>
        </section>

        <section className="panel">
          {s.encounter && !s.encounter.isFinale && (
            <div className={`enc-card ${s.encounter.boss ? 'boss' : ''}`}>
              <div className="enc-card-head">
                <span className="enc-tag">{s.encounter.boss ? 'BOSS' : 'ENCOUNTER'}</span>
                {s.encounter.until && (
                  <span className="enc-card-timer">{Math.max(0, Math.ceil((s.encounter.until - performance.now()) / 1000))}s</span>
                )}
              </div>
              <h3>{s.encounter.name}</h3>
              <p>{s.encounter.desc}</p>
              <div className="bar enc-bar"><div className="bar-fill enc-fill" style={{ width: `${(s.encounter.got / s.encounter.need) * 100}%` }} /></div>
              <div className="enc-card-foot">
                <span className="enc-count">{s.encounter.got} / {s.encounter.need}</span>
                <span className="enc-reward">+{fmt(s.encounter.reward)} AW</span>
              </div>
              <div className="enc-card-actions">
                <button className="enc-attack" onClick={g.attackEncounter}>{s.encounter.boss ? 'STRIKE!' : 'MASH!'}</button>
                <button className="enc-flee" onClick={g.fleeEncounter}>flee</button>
              </div>
            </div>
          )}
          <nav className="tabs">
            <button className={`allies-tab ${tab === 'allies' ? 'active' : ''}`} onClick={() => setTab('allies')}>Allies</button>
            <button className={tab === 'gear' ? 'active' : ''} onClick={() => setTab('gear')}>Gear</button>
            <button className={`delve-tab ${tab === 'delve' ? 'active' : ''}`} onClick={() => setTab('delve')}>Delve</button>
            <button className={tab === 'codex' ? 'active' : ''} onClick={() => setTab('codex')}>Codex</button>
            <button className={`wiki-tab ${tab === 'wiki' ? 'active' : ''}`} onClick={() => setTab('wiki')}>Wiki</button>
            <button className={`end-tab ${tab === 'echoes' ? 'active' : ''}`} onClick={() => setTab('echoes')}>Echoes</button>
          </nav>

          <div className="tab-body" key={tab}>
            {tab === 'allies' && (
              <div className="list">
                <div className="buy-qty-bar">
                  <span className="bq-label">Buy quantity:</span>
                  <div className="bq-btns">
                    <button className={`bq-btn ${buyQty === 1 ? 'sel' : ''}`} onClick={() => setBuyQty(1)}>1</button>
                    <button className={`bq-btn ${buyQty === 2 ? 'sel' : ''}`} onClick={() => setBuyQty(2)}>2</button>
                    <button className={`bq-btn ${buyQty === 5 ? 'sel' : ''}`} onClick={() => setBuyQty(5)}>5</button>
                    <button className={`bq-btn ${buyQty === 'max' ? 'sel' : ''}`} onClick={() => setBuyQty('max')}>Max</button>
                  </div>
                </div>
                {GENERATORS.map((gen, i) => {
                  const owned = genCount(s, gen.id);
                  const locked = i > 0 && genCount(s, GENERATORS[i - 1].id) === 0 && owned === 0;
                  if (locked) return null;
                  const qty = buyQty === 'max' ? genMaxAffordable(s, gen.id) : buyQty;
                  const cost = qty > 0 ? genBulkCost(s, gen.id, qty) : genCost(s, gen.id);
                  const afford = buyQty === 'max' ? qty > 0 : s.aw >= cost;
                  const displayQty = buyQty === 'max' ? Math.max(qty, 1) : buyQty;
                  return (
                    <div key={gen.id} className={`ally-row ${afford ? '' : 'poor'}`}>
                      <div className="ally-info">
                        <div className="row-title"><span>{gen.name}</span>{owned > 0 && <span className="owned">×{owned}</span>}</div>
                        <p className="row-desc">{gen.hook}</p>
                        <p className="row-prod">+{fmt(gen.baseProd)} AW/s each</p>
                      </div>
                      <button className="buy-single" onClick={() => g.buyGenerator(gen.id, qty)} disabled={!afford}>
                        <span className="buy-single-qty">Buy {displayQty > 0 ? displayQty : 1}</span>
                        <span className="buy-single-cost">Cost: {fmt(cost)}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {tab === 'gear' && (
              <div className="gear-tab">
                <div className="slots">
                  {SLOTS.map((slot) => {
                    const eqId = s.equipped[slot];
                    const eq = eqId ? GEAR.find((x) => x.id === eqId) : null;
                    return (
                      <button key={slot} className={`slot ${eq ? `rar-${eq.rarity}` : 'empty'} ${gearSlotFilter === slot ? 'sel' : ''}`} onClick={() => setGearSlotFilter(slot)}>
                        <span className="slot-name">{slot}</span>
                        <span className="slot-item">{eq ? eq.name : '— empty —'}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="list">
                  {gearBySlot(gearSlotFilter)
                    .filter((it) => s.gearOwned.includes(it.id))
                    .slice()
                    .sort((a, b) => a.levelIndex - b.levelIndex || a.cost - b.cost)
                    .map((it) => {
                      const equipped = s.equipped[it.slot] === it.id;
                      return (
                        <div key={it.id} className={`gear-row rar-${it.rarity} ${equipped ? 'equipped' : ''}`}>
                          <div className="row-main">
                            <div className="row-title">
                              <span>{it.name}</span>
                              <span className={`rar-badge rar-${it.rarity}`}>{it.rarity}</span>
                            </div>
                            <p className="row-desc">{it.hook}</p>
                            <p className="gear-stats">
                              {it.stats.clickMult > 1 && <span>⚔ ×{it.stats.clickMult.toFixed(2)} click</span>}
                              {it.stats.prodMult > 1 && <span>⚙ ×{it.stats.prodMult.toFixed(2)} prod</span>}
                              {it.stats.crit > 0 && <span>✧ +{Math.round(it.stats.crit * 100)}% crit</span>}
                              {it.stats.luck > 0 && <span>🍀 +{Math.round(it.stats.luck * 100)}% luck</span>}
                            </p>
                          </div>
                          <button className={`gear-btn ${equipped ? 'unequip' : 'equip'}`} onClick={() => g.equipGear(it.id)}>
                            {equipped ? 'Unequip' : 'Equip'}
                          </button>
                        </div>
                      );
                    })}
                  {gearBySlot(gearSlotFilter).filter((it) => s.gearOwned.includes(it.id)).length === 0 && (
                    <p className="muted gear-empty-hint">No {gearSlotFilter} items found yet. Delve to find gear for this slot.</p>
                  )}
                </div>
              </div>
            )}

            {tab === 'delve' && (
              <div className="delve">
                <div className="delve-intro">
                  <h3>Expeditions</h3>
                  <p>Slip into the walls and push room by room. Loot stays <b>unbanked</b> until you extract — get caught and it's gone. Every delve rolls a random <b>modifier</b>. Every 5th room is a <b>boss</b> with guaranteed gear. The deeper you go, the better the items — mythic gear awaits in the Abyss.</p>
                  <button className="delve-start" disabled={!!s.encounter} onClick={() => g.startExpedition('normal')}>
                    ▸ Begin Expedition (Depth {s.levelIndex})
                  </button>
                  {abyssUnlocked(s) && (
                    <button className="delve-start abyss" disabled={!!s.encounter} onClick={() => g.startExpedition('abyss')}>
                      ✦ Descend into the Abyss
                    </button>
                  )}
                </div>

                <div className="perks-box">
                  <h4>Perks {s.perks.length > 0 && <span>({s.perks.length})</span>}</h4>
                  {s.perks.length === 0 ? (
                    <p className="muted">Gain Explorer levels to earn perk choices. Every 2nd level grants a perk token.</p>
                  ) : (
                    <div className="perk-list">
                      {Object.entries(
                        s.perks.reduce<Record<string, number>>((acc, id) => { acc[id] = (acc[id] ?? 0) + 1; return acc; }, {}),
                      ).map(([id, n]) => {
                        const p = perkById(id);
                        if (!p) return null;
                        return (
                          <div key={id} className={`perk-chip tier-${p.tier}`}>
                            <span className="perk-ic">{p.icon}</span>
                            <span className="perk-nm">{p.name}{n > 1 ? ` ×${n}` : ''}</span>
                            <span className="perk-ds">{p.desc}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {abyssUnlocked(s) && (
                  <div className="abyss-box">
                    <h4>✦ The Abyss</h4>
                    <div className="abyss-nums">
                      <div><b>{s.deepestAbyss}</b><span>deepest room</span></div>
                      <div><b>×{abyssMult(s).toFixed(2)}</b><span>permanent bonus</span></div>
                    </div>
                    <p className="muted">Every new deepest Abyss room permanently boosts all AW gains. There is no bottom.</p>
                  </div>
                )}
              </div>
            )}

            {tab === 'codex' && (
              <div className="codex">
                <h3>Achievements ({s.achievements.length}/{ACHIEVEMENTS.length})</h3>
                <div className="ach-grid">
                  {ACHIEVEMENTS.map((a) => {
                    const got = s.achievements.includes(a.id);
                    return (
                      <div key={a.id} className={`ach ${got ? 'got' : ''}`}>
                        <b>{got ? '★' : '☆'} {a.name}</b>
                        <span>{a.desc}</span>
                      </div>
                    );
                  })}
                </div>
                <h3>Run stats</h3>
                <div className="stat-lines">
                  <div><span>Depth</span><b>{s.levelIndex} / {LEVELS.length - 1}</b></div>
                  <div><span>Explorer level</span><b>{s.xpLevel}</b></div>
                  <div><span>Perks</span><b>{s.perks.length}</b></div>
                  {abyssUnlocked(s) && <div><span>Deepest Abyss</span><b>{s.deepestAbyss}</b></div>}
                  <div><span>Allies</span><b>{allyCount(s)}</b></div>
                  <div><span>Gear owned</span><b>{s.gearOwned.length} / {GEAR.length}</b></div>
                  <div><span>Escapes</span><b>{s.defeated.length}</b></div>
                  <div><span>Clicks</span><b>{s.clicks}</b></div>
                  <div><span>Lifetime AW</span><b>{fmt(s.lifetimeAw)}</b></div>
                  <div><span>Rebirths</span><b>{s.prestiges}</b></div>
                  <div><span>Echoes earned</span><b>{s.totalEchoes}</b></div>
                  <div><span>Skill nodes</span><b>{Object.values(s.skills).filter((v) => v > 0).length}/{SKILL_NODES.length}</b></div>
                  <div><span>Playtime</span><b>{Math.floor(s.playtime / 60)}m</b></div>
                </div>
                <button className="reset" onClick={() => { if (confirm('Reset ALL progress including Echoes & skills? Cannot be undone.')) g.hardReset(); }}>
                  Wipe everything
                </button>
              </div>
            )}

            {tab === 'echoes' && (
              <div className="echoes-tab">
                <div className="rebirth-card">
                  <span className="enc-tag">✦ NOCLIP OUT (REBIRTH)</span>
                  <p>Reset your run — lose Almond Water, allies & depth, but keep all <b>gear</b>, <b>skills</b>, XP & perks. Gain <b>Echoes</b> to spend on the skill tree below.</p>
                  <div className="prestige-num">
                    <div><b>{fmt(s.echoes)}</b><span>Echoes now</span></div>
                    <div><b>+{fmt(pendingEchoes(s))}</b><span>on rebirth</span></div>
                    <div><b>{s.prestiges}</b><span>rebirths</span></div>
                  </div>
                  <button
                    className="prestige-btn"
                    disabled={pendingEchoes(s) <= 0}
                    onClick={() => { if (confirm(`Noclip Out for +${pendingEchoes(s)} Echoes? Your run resets but skills & gear persist.`)) g.prestige(); }}
                  >
                    {pendingEchoes(s) > 0 ? `Noclip Out (+${fmt(pendingEchoes(s))} ✦)` : 'Earn more AW to gain Echoes'}
                  </button>
                </div>

                {s.finaleAvailable && (
                  <div className="finale-card">
                    <span className="enc-tag">ENDGAME</span>
                    <h3>{FINALE.name}</h3>
                    <p>{FINALE.desc}</p>
                    {!s.finaleDefeated ? (
                      <button className="finale-btn" onClick={g.startFinale}>Confront the Finale</button>
                    ) : (
                      <p className="done">✔ Escaped — the loop is broken (this run).</p>
                    )}
                  </div>
                )}

                <div className="skill-tree-open">
                  <button className="open-tree-btn" onClick={() => setShowTree(true)}>
                    <span className="open-tree-icon">✦</span>
                    <span className="open-tree-text">
                      <b>Open Echo Tree</b>
                      <span>{Object.values(s.skills).filter((v) => v > 0).length}/{SKILL_NODES.length} nodes · {fmt(s.echoes)} Echoes unspent</span>
                    </span>
                  </button>
                </div>
              </div>
            )}

            {tab === 'wiki' && (
              <div className="wiki-tab">
                <div className="wiki-header">
                  <h3>Item Wiki</h3>
                  <p className="muted">All {GEAR.length} items in the game. Items are found by delving at their assigned depth.</p>
                </div>
                <div className="wiki-level-filter">
                  <button className={`wiki-lvl-btn ${wikiLevel === -1 ? 'sel' : ''}`} onClick={() => setWikiLevel(-1)}>All</button>
                  {LEVELS.map((lvl, i) => {
                    const reached = i <= s.maxLevelReached;
                    const hasItems = GEAR.some((g) => g.levelIndex === i);
                    if (!hasItems) return null;
                    return (
                      <button
                        key={lvl.id}
                        className={`wiki-lvl-btn ${wikiLevel === i ? 'sel' : ''} ${reached ? '' : 'locked'}`}
                        onClick={() => setWikiLevel(i)}
                        title={reached ? lvl.name : 'Not yet reached'}
                      >
                        {i}
                      </button>
                    );
                  })}
                </div>
                <div className="wiki-items">
                  {GEAR
                    .filter((g) => wikiLevel === -1 || g.levelIndex === wikiLevel)
                    .sort((a, b) => a.levelIndex - b.levelIndex || a.slot.localeCompare(b.slot) || a.cost - b.cost)
                    .map((it) => {
                      const owned = s.gearOwned.includes(it.id);
                      const equipped = s.equipped[it.slot] === it.id;
                      const lvl = LEVELS[it.levelIndex];
                      return (
                        <div key={it.id} className={`wiki-item rar-${it.rarity} ${owned ? 'owned' : ''}`}>
                          <div className="wiki-item-header">
                            <span className="wiki-item-name">{owned ? it.name : '???'}</span>
                            <span className={`rar-badge rar-${it.rarity}`}>{it.rarity}</span>
                            <span className="wiki-item-slot">{it.slot}</span>
                          </div>
                          <p className="wiki-item-desc">{owned ? it.desc : 'Undiscovered — delve to find it.'}</p>
                          {owned && (
                            <p className="wiki-item-hook">{it.hook}</p>
                          )}
                          <div className="wiki-item-meta">
                            <span className="wiki-depth">Depth {it.levelIndex} · {lvl?.name ?? '???'}</span>
                            {equipped && <span className="wiki-equipped">Equipped</span>}
                          </div>
                          <div className="wiki-stats">
                            {it.stats.clickMult > 1 && <span>⚔ ×{it.stats.clickMult.toFixed(2)} click</span>}
                            {it.stats.prodMult > 1 && <span>⚙ ×{it.stats.prodMult.toFixed(2)} prod</span>}
                            {it.stats.crit > 0 && <span>✧ +{Math.round(it.stats.crit * 100)}% crit</span>}
                            {it.stats.luck > 0 && <span>🍀 +{Math.round(it.stats.luck * 100)}% luck</span>}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      {showTree && (
        <div className="tree-overlay">
          <div className="tree-overlay-bar">
            <div className="tree-overlay-info">
              <span className="tree-overlay-title">✦ The Echo Tree</span>
              <span className="tree-overlay-echoes">{fmt(s.echoes)} Echoes</span>
            </div>
            <div className="tree-controls">
              <button className="tree-zoom-btn" onClick={() => setTreeZoom((z) => Math.min(3, z * 1.25))}>+</button>
              <button className="tree-zoom-btn" onClick={() => setTreeZoom((z) => Math.max(0.1, z / 1.25))}>−</button>
              <button className="tree-zoom-btn" onClick={() => { setTreeZoom(0.5); setTreePan({ x: 0, y: 0 }); }}>⌖</button>
              <button className="tree-close" onClick={() => setShowTree(false)}>✕ Close</button>
            </div>
          </div>

          <div
            className="tree-canvas-full"
            onWheel={(e) => {
              const delta = e.deltaY > 0 ? 1 / 1.15 : 1.15;
              setTreeZoom((z) => Math.max(0.1, Math.min(3, z * delta)));
            }}
            onMouseDown={(e) => {
              treeDragRef.current = { x: e.clientX, y: e.clientY, px: treePan.x, py: treePan.y };
            }}
            onMouseMove={(e) => {
              if (treeDragRef.current) {
                setTreePan({
                  x: treeDragRef.current.px + (e.clientX - treeDragRef.current.x),
                  y: treeDragRef.current.py + (e.clientY - treeDragRef.current.y),
                });
              }
              setTreeMouse({ x: e.clientX, y: e.clientY });
            }}
            onMouseUp={() => { treeDragRef.current = null; }}
            onMouseLeave={() => { treeDragRef.current = null; setHoveredSkill(null); }}
          >
            <svg
              viewBox={`${TREE_BOUNDS.x} ${TREE_BOUNDS.y} ${TREE_BOUNDS.w} ${TREE_BOUNDS.h}`}
              style={{ transform: `translate(${treePan.x}px, ${treePan.y}px) scale(${treeZoom})`, transformOrigin: 'center' }}
            >
              {/* Background rings */}
              <circle cx={TREE_CENTER.x} cy={TREE_CENTER.y} r={1000} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={2} />
              <circle cx={TREE_CENTER.x} cy={TREE_CENTER.y} r={500} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth={1} />

              {/* Central hub */}
              <circle cx={TREE_CENTER.x} cy={TREE_CENTER.y} r={45} fill="rgba(199,155,255,0.08)" stroke="rgba(199,155,255,0.3)" strokeWidth={3} />
              <text x={TREE_CENTER.x} y={TREE_CENTER.y} textAnchor="middle" dominantBaseline="central" fontSize={28} fill="#c79bff" fontWeight="bold" style={{ pointerEvents: 'none' }}>✦</text>

              {/* Lines from center to each T0 node */}
              {SKILL_NODES.filter((n) => n.tier === 0).map((node) => {
                const info = BRANCH_INFO[node.branch];
                const active = skillRank(s.skills, node.id) > 0;
                return (
                  <line key={`line-center-${node.id}`} x1={TREE_CENTER.x} y1={TREE_CENTER.y} x2={node.x} y2={node.y} stroke={active ? info.color : 'rgba(255,255,255,0.08)'} strokeWidth={active ? 4 : 2.5} />
                );
              })}

              {/* Lines between connected nodes */}
              {SKILL_NODES.flatMap((node) =>
                node.requires.map((reqId) => {
                  const req = skillNodeById(reqId);
                  if (!req) return null;
                  const info = BRANCH_INFO[node.branch];
                  const active = skillRank(s.skills, node.id) > 0 && skillRank(s.skills, reqId) > 0;
                  const partial = skillRank(s.skills, reqId) > 0;
                  return (
                    <line key={`line-${reqId}-${node.id}`} x1={req.x} y1={req.y} x2={node.x} y2={node.y} stroke={active ? info.color : partial ? `${info.color}66` : 'rgba(255,255,255,0.06)'} strokeWidth={active ? 4 : 2.5} />
                  );
                }).filter(Boolean),
              )}

              {/* Nodes */}
              {SKILL_NODES.map((node) => {
                const info = BRANCH_INFO[node.branch];
                const rank = skillRank(s.skills, node.id);
                const visible = isNodeVisible(node, s.skills);
                const canBuy = canUnlockNode(node, s.skills, s.echoes);
                const maxed = rank >= node.maxRanks;
                const isHovered = hoveredSkill === node.id;
                const r = node.tier === 4 ? 44 : node.tier === 0 ? 38 : 30;
                const fill = maxed ? info.color : rank > 0 ? `${info.color}88` : visible ? 'rgba(20,18,28,0.9)' : 'rgba(10,8,14,0.7)';
                const stroke = maxed ? info.color : canBuy ? info.color : rank > 0 ? `${info.color}aa` : visible ? `${info.color}44` : 'rgba(255,255,255,0.08)';
                const glow = canBuy || maxed ? `drop-shadow(0 0 12px ${info.color})` : isHovered ? `drop-shadow(0 0 8px ${info.color}88)` : 'none';
                return (
                  <g key={node.id} style={{ cursor: visible && !maxed ? 'pointer' : 'default', opacity: visible ? 1 : 0.2 }} onMouseEnter={() => setHoveredSkill(node.id)} onMouseLeave={() => setHoveredSkill(null)} onClick={() => { if (canBuy) g.unlockSkill(node.id); }}>
                    {(node.maxRanks > 1 && rank > 0) && <circle cx={node.x} cy={node.y} r={r + 7} fill="none" stroke={info.color} strokeWidth={2} opacity={0.4} />}
                    <circle cx={node.x} cy={node.y} r={r} fill={fill} stroke={stroke} strokeWidth={maxed ? 4 : canBuy ? 3.5 : 2.5} style={{ filter: glow, transition: 'all 0.15s' }} />
                    <text x={node.x} y={node.y} textAnchor="middle" dominantBaseline="central" fontSize={r * 0.9} fill={maxed ? '#1a0a08' : rank > 0 ? info.color : 'rgba(255,255,255,0.5)'} style={{ pointerEvents: 'none', userSelect: 'none' }}>{node.icon}</text>
                    {node.maxRanks > 1 && <text x={node.x} y={node.y + r + 18} textAnchor="middle" fontSize={15} fill={info.color} fontWeight="bold" style={{ pointerEvents: 'none' }}>{rank}/{node.maxRanks}</text>}
                    {canBuy && <text x={node.x} y={node.y + r + (node.maxRanks > 1 ? 36 : 18)} textAnchor="middle" fontSize={14} fill="#c79bff" fontWeight="bold" style={{ pointerEvents: 'none' }}>✦{node.cost}</text>}
                  </g>
                );
              })}
            </svg>

            {/* Hovered node tooltip — follows the cursor */}
            {hoveredSkill && (() => {
              const node = skillNodeById(hoveredSkill);
              if (!node) return null;
              const info = BRANCH_INFO[node.branch];
              const rank = skillRank(s.skills, node.id);
              const canBuy = canUnlockNode(node, s.skills, s.echoes);
              const maxed = rank >= node.maxRanks;
              const tipW = 300;
              const flip = treeMouse.x > window.innerWidth - tipW - 20;
              const tx = flip ? treeMouse.x - tipW - 16 : treeMouse.x + 16;
              const ty = Math.min(treeMouse.y + 16, window.innerHeight - 140);
              return (
                <div className="tree-tooltip" style={{ borderColor: info.color, left: tx, top: ty }}>
                  <div className="tree-tooltip-head" style={{ color: info.color }}>
                    <span className="tree-tooltip-icon">{node.icon}</span>
                    <span>{node.name}</span>
                    {node.maxRanks > 1 && <span className="tree-tooltip-rank">{rank}/{node.maxRanks}</span>}
                  </div>
                  <p className="tree-tooltip-desc">{node.desc}</p>
                  <div className="tree-tooltip-foot">
                    <span style={{ color: info.color }}>{BRANCH_INFO[node.branch].name}</span>
                    {maxed ? (
                      <span className="tree-tooltip-maxed">MAXED</span>
                    ) : canBuy ? (
                      <span className="tree-tooltip-cost">✦ {node.cost} — click to unlock</span>
                    ) : (
                      <span className="tree-tooltip-locked">✦ {node.cost} — {s.echoes < node.cost ? 'not enough echoes' : 'requirements not met'}</span>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Branch legend */}
          <div className="tree-legend-bar">
            {(['wanderer', 'architect', 'noclipper'] as SkillBranch[]).map((b) => {
              const info = BRANCH_INFO[b];
              const count = SKILL_NODES.filter((n) => n.branch === b && skillRank(s.skills, n.id) > 0).length;
              const total = SKILL_NODES.filter((n) => n.branch === b).length;
              return (
                <div key={b} className="tree-legend-item">
                  <span className="tree-legend-dot" style={{ background: info.color }} />
                  <span className="tree-legend-name" style={{ color: info.color }}>{info.icon} {info.name}</span>
                  <span className="tree-legend-count">{count}/{total}</span>
                  <span className="tree-legend-desc">{info.desc}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {s.buff && (
        <div className="buff-banner">
          <span className="pulse">⚡</span> {s.buff.name}: {s.buff.label} — {Math.max(0, Math.ceil((s.buff.until - performance.now()) / 1000))}s
        </div>
      )}

      {s.pendingLevelUp && !s.pendingPerks && (
        <div className="perk-overlay">
          <div className="levelup-modal">
            <div className="levelup-glow" />
            <span className="levelup-star">✦</span>
            <h2 className="levelup-title">LEVEL UP!</h2>
            <p className="levelup-sub">Explorer Level {s.xpLevel}</p>
            {s.perkTokens > 0 && <p className="levelup-perk-hint">You have {s.perkTokens} perk{s.perkTokens > 1 ? 's' : ''} to choose</p>}
            <button className="levelup-btn" onClick={g.dismissLevelUp}>
              {s.perkTokens > 0 ? 'Choose Perk' : 'Continue'}
            </button>
          </div>
        </div>
      )}

      {s.pendingPerks && (
        <div className="perk-overlay">
          <div className="perk-modal">
            <span className="enc-tag">◆ EXPLORER PERK</span>
            <h2>Choose a perk</h2>
            <p className="perk-sub">Explorer Level {s.xpLevel} — pick one. They stack for the rest of your journey.</p>
            <div className="perk-choices">
              {s.pendingPerks.map((id) => {
                const p = perkById(id);
                if (!p) return null;
                return (
                  <button key={id} className={`perk-card tier-${p.tier}`} onClick={() => g.choosePerk(id)}>
                    <span className="pc-ic">{p.icon}</span>
                    <span className="pc-nm">{p.name}</span>
                    <span className="pc-tier">Tier {p.tier}</span>
                    <span className="pc-ds">{p.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {s.expedition && (() => {
        const exp = s.expedition;
        const riskPct = Math.round(exp.risk * 100);
        const abyss = exp.mode === 'abyss';
        const revealGear = exp.pendingGearReveal ? GEAR.find((x) => x.id === exp.pendingGearReveal) : null;
        return (
          <div className="exp-overlay">
            <div className={`exp-modal${abyss ? ' abyss' : ''}`}>
              <div className="exp-top">
                <span className="enc-tag">{abyss ? '✦ THE ABYSS' : '▚ EXPEDITION'}</span>
                <span className="exp-room">Room {exp.room + 1}</span>
              </div>
              {exp.modifier.id !== 'normal' && (
                <div className="exp-modifier">
                  <span className="mod-name">{exp.modifier.name}</span>
                  <span className="mod-desc">{exp.modifier.desc}</span>
                </div>
              )}
              <div className="exp-haul">
                <div><b>{fmt(Math.round(exp.haulAw))}</b><span>AW haul</span></div>
                <div><b>{fmt(Math.round(exp.haulXp))}</b><span>XP haul</span></div>
                <div><b>{exp.haulGear.length}</b><span>gear</span></div>
                <div className={riskPct >= 60 ? 'danger' : ''}><b>{riskPct}%</b><span>ambush risk</span></div>
              </div>
              <div className="bar small"><div className={`bar-fill risk-fill${riskPct >= 60 ? ' hot' : ''}`} style={{ width: `${riskPct}%` }} /></div>

              {exp.phase !== 'done' && (
                <div className={`exp-event ev-${exp.event.kind}`}>
                  <span className="exp-icon">{EVENT_ICON[exp.event.kind]}</span>
                  <h2>{exp.event.title}</h2>
                  <p>{exp.event.desc}</p>
                </div>
              )}

              {exp.lastText && exp.phase !== 'done' && (
                <div className="exp-result-box">
                  <p className="exp-last">{exp.lastText}</p>
                  {exp.lastLoot && (exp.lastLoot.aw > 0 || exp.lastLoot.xp > 0) && (
                    <div className="exp-loot-icons">
                      {exp.lastLoot.aw > 0 && <span className="loot-chip aw-chip">+{fmt(Math.round(exp.lastLoot.aw))} AW</span>}
                      {exp.lastLoot.xp > 0 && <span className="loot-chip xp-chip">+{fmt(Math.round(exp.lastLoot.xp))} XP</span>}
                      {exp.lastLoot.gear > 0 && <span className="loot-chip gear-chip">+{exp.lastLoot.gear} GEAR</span>}
                    </div>
                  )}
                </div>
              )}

              {exp.phase === 'event' && (
                <div className="exp-options">
                  {exp.event.options.map((o) => (
                    <button key={o.id} className="exp-opt" onClick={() => g.expeditionChoose(o.id)}>
                      <span className="eo-label">{o.label}</span>
                      <span className="eo-hint">{o.hint}</span>
                    </button>
                  ))}
                </div>
              )}

              {exp.phase === 'choice' && (
                <div className="exp-actions">
                  <button className="exp-deeper" onClick={g.expeditionDeeper}>
                    ▸ Delve deeper <span>risk an ambush ({riskPct}%)</span>
                  </button>
                  <button className="exp-extract" disabled={exp.haulAw <= 0 && exp.haulGear.length === 0 && exp.haulXp <= 0} onClick={g.expeditionExtract}>
                    ✔ Extract now <span>bank the haul</span>
                  </button>
                </div>
              )}

              {exp.phase === 'done' && (
                <div className="exp-done">
                  {exp.over === 'extracted' ? (
                    <>
                      <div className="exp-done-header extracted">
                        <span className="exp-done-icon">✔</span>
                        <h2>EXTRACTED SAFELY</h2>
                        <p>You banked your haul from Room {exp.room + 1}</p>
                      </div>
                      <div className="exp-summary">
                        <div className="summary-stat aw-stat">
                          <span className="ss-icon">💧</span>
                          <span className="ss-val">+{fmt(Math.round(exp.haulAw))}</span>
                          <span className="ss-label">Almond Water</span>
                        </div>
                        <div className="summary-stat xp-stat">
                          <span className="ss-icon">⬡</span>
                          <span className="ss-val">+{fmt(Math.round(exp.haulXp))}</span>
                          <span className="ss-label">Explorer XP</span>
                        </div>
                      </div>
                      {exp.haulGear.length > 0 && (
                        <div className="exp-gear-summary">
                          <h3 className="gear-summary-title">Gear Recovered</h3>
                          <div className="gear-summary-grid">
                            {exp.haulGear.map((id, i) => {
                              const gear = GEAR.find((x) => x.id === id);
                              if (!gear) return null;
                              return (
                                <div key={id} className={`gear-reveal-card rar-${gear.rarity}`} style={{ animationDelay: `${i * 0.15}s` }}>
                                  <div className="grc-glow" />
                                  <span className={`grc-rarity-badge rar-badge rar-${gear.rarity}`}>{gear.rarity}</span>
                                  <span className="grc-slot">{gear.slot}</span>
                                  <span className="grc-name">{gear.name}</span>
                                  <div className="grc-stats">
                                    {gear.stats.clickMult > 0 && <span>+{(gear.stats.clickMult * 100).toFixed(0)}% click</span>}
                                    {gear.stats.prodMult > 0 && <span>+{(gear.stats.prodMult * 100).toFixed(0)}% prod</span>}
                                    {gear.stats.luck > 0 && <span>+{(gear.stats.luck * 100).toFixed(0)}% luck</span>}
                                    {gear.stats.crit > 0 && <span>+{(gear.stats.crit * 100).toFixed(0)}% crit</span>}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="exp-done-header caught">
                      <span className="exp-done-icon">✖</span>
                      <h2>CAUGHT</h2>
                      <p>{exp.lastText}</p>
                      <div className="exp-lost">
                        <span>Lost: {fmt(Math.round(exp.haulAw))} AW</span>
                        {exp.haulGear.length > 0 && <span> · {exp.haulGear.length} gear item{exp.haulGear.length > 1 ? 's' : ''}</span>}
                      </div>
                    </div>
                  )}
                  <button className="exp-close" onClick={g.expeditionClose}>Leave</button>
                </div>
              )}

              {exp.log.length > 0 && exp.phase !== 'done' && (
                <div className="exp-log">
                  {exp.log.map((l, i) => (<span key={i}>{l}</span>))}
                </div>
              )}
            </div>

            {revealGear && (
              <div className="gear-reveal-overlay" onClick={g.claimGearReveal}>
                <div className={`gear-reveal-pop rar-${revealGear.rarity}`} onClick={(e) => e.stopPropagation()}>
                  <div className="grp-glow" />
                  <div className="grp-rays" />
                  <span className="grp-label">ITEM FOUND</span>
                  <span className={`grp-rarity rar-badge rar-${revealGear.rarity}`}>{revealGear.rarity}</span>
                  <span className="grp-slot">{revealGear.slot}</span>
                  <h2 className="grp-name">{revealGear.name}</h2>
                  <p className="grp-desc">{revealGear.desc}</p>
                  <div className="grp-stats">
                    {revealGear.stats.clickMult > 0 && <div className="grp-stat"><span className="gs-icon">⚡</span><span className="gs-val">+{(revealGear.stats.clickMult * 100).toFixed(0)}%</span><span className="gs-label">Click Power</span></div>}
                    {revealGear.stats.prodMult > 0 && <div className="grp-stat"><span className="gs-icon">⚙</span><span className="gs-val">+{(revealGear.stats.prodMult * 100).toFixed(0)}%</span><span className="gs-label">Production</span></div>}
                    {revealGear.stats.luck > 0 && <div className="grp-stat"><span className="gs-icon">🍀</span><span className="gs-val">+{(revealGear.stats.luck * 100).toFixed(0)}%</span><span className="gs-label">Luck</span></div>}
                    {revealGear.stats.crit > 0 && <div className="grp-stat"><span className="gs-icon">✧</span><span className="gs-val">+{(revealGear.stats.crit * 100).toFixed(0)}%</span><span className="gs-label">Crit</span></div>}
                  </div>
                  <button className="grp-claim" onClick={g.claimGearReveal}>Claim Item</button>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {s.encounter && s.encounter.isFinale && (
        <div className="encounter-overlay">
          <div className={`encounter ${s.encounter.boss ? 'boss' : ''} ${s.encounter.isFinale ? 'finale' : ''}`}>
            <span className="enc-tag">{s.encounter.isFinale ? 'THE FINALE' : s.encounter.boss ? 'BOSS ENCOUNTER' : 'ENCOUNTER'}</span>
            <h2>{s.encounter.name}</h2>
            <p>{s.encounter.desc}</p>
            <div className="bar enc-bar"><div className="bar-fill enc-fill" style={{ width: `${(s.encounter.got / s.encounter.need) * 100}%` }} /></div>
            <p className="enc-count">{s.encounter.got} / {s.encounter.need} — mash to break free!</p>
            <p className="enc-timer">
              {s.encounter.until ? `${Math.max(0, Math.ceil((s.encounter.until - performance.now()) / 1000))}s left · ` : 'no escape · '}
              reward {fmt(s.encounter.reward)} AW
            </p>
            <button className="enc-attack" onClick={g.attackEncounter}>{s.encounter.boss ? 'STRIKE!' : 'RUN / MASH!'}</button>
            {!s.encounter.isFinale && <button className="enc-flee" onClick={g.fleeEncounter}>give up</button>}
            {s.encounter.isFinale && <button className="enc-flee" onClick={g.fleeEncounter}>retreat for now</button>}
          </div>
        </div>
      )}

      {descent && (
        <div className={`descent ${s.settings.reduceMotion ? 'rm' : ''}`}>
          <div className="descent-inner">
            <span className="descent-depth">DEPTH {descent.depth}</span>
            <span className="descent-name">{descent.name}</span>
            <span className="descent-sub">descending…</span>
          </div>
        </div>
      )}

      <div className="toasts">
        {g.toasts.map((t) => (<div key={t.id} className={`toast ${t.kind}`}>{t.text}</div>))}
      </div>

      {showSettings && (
        <div className="perk-overlay" onClick={() => setShowSettings(false)}>
          <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Settings</h2>
            <div className="settings-row">
              <span className="settings-label">Sound</span>
              <button className={`toggle ${s.settings.sound ? 'on' : ''}`} onClick={() => g.toggleSetting('sound')}>
                {s.settings.sound ? 'ON' : 'OFF'}
              </button>
            </div>
            {s.settings.sound && (
              <div className="settings-row">
                <span className="settings-label">Volume</span>
                <div className="volume-slider-wrap">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={Math.round(s.settings.volume * 100)}
                    onChange={(e) => g.setVolume(Number(e.target.value) / 100)}
                    className="volume-slider"
                  />
                  <span className="volume-val">{Math.round(s.settings.volume * 100)}%</span>
                </div>
              </div>
            )}
            <div className="settings-row">
              <span className="settings-label">Reduce Motion</span>
              <button className={`toggle ${s.settings.reduceMotion ? 'on' : ''}`} onClick={() => g.toggleSetting('reduceMotion')}>
                {s.settings.reduceMotion ? 'ON' : 'OFF'}
              </button>
            </div>
            <div className="settings-row danger-row">
              <button className="settings-danger" onClick={() => { g.hardReset(); setShowSettings(false); }}>
                Reset All Progress
              </button>
            </div>
            <button className="settings-close" onClick={() => setShowSettings(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
