import { useEffect, useRef } from 'react';
import { STATS, SL, MAPW, MAPH } from '../engine/data.js';
import { icon, sprite } from '../engine/art.js';
import { PCOL, LOC, GUILD, locOf, route, bez, routeD, svgAt, terrain } from '../engine/map.js';
import { S, ui, dispatch, members, foundTowns, progress, setView, zoomBy, partyPos, atHome } from '../engine/game.js';
import { useTick } from './hooks.js';
import { Glyph, Pips, PxIcon, stressCls } from './parts.jsx';

export function QuestCard({ q }) {
  const needs = STATS.filter((s) => q.w[s]).sort((a, b) => q.w[b] - q.w[a]);
  return (
    <article className={'contract' + (q.boss ? ' boss' : '') + (q.crisis ? ' crisis' : '')}>
      <div className="qtop">
        <div style={{ minWidth: 0 }}>
          <div className="qtype">{(q.crisis || q.boss) && <Glyph name="skull" size={15} />}{q.type}</div>
          <h3 className="qtitle">{q.title}</h3>
          {q.crisis && <div className="cinfo bad">{q.stake} Fail or ignore this and the guild is lost.</div>}
        </div>
        <div><Pips d={q.d} /><div className="dlabel">Danger {q.d}</div></div>
      </div>
      <div className="needs">
        {needs.map((s) => <span key={s} className="need" style={{ '--w': Math.round(q.w[s] * 100) + '%' }}>{SL[s]} {Math.round(q.w[s] * 100)}%</span>)}
      </div>
      <div className="rewards">
        <div className="rw"><Glyph name="coin" size={22} /><div><b>{q.gold}</b><small>gold</small></div></div>
        <div className="rw"><Glyph name="crown" size={22} /><div><b>{q.renown}</b><small>renown</small></div></div>
        <div className="rw"><Glyph name="clock" size={22} /><div><b>{q.days}</b><small>day{q.days > 1 ? 's' : ''}</small></div></div>
      </div>
      <div className="qmeta">
        {q.boss ? <span className="tm">Waits on the board until you are ready</span>
          : q.crisis ? <span className="tm bad"><Glyph name="flame" size={15} /> {q.expires} days left to send a party</span>
          : <span className="tm"><Glyph name="flame" size={15} /> Leaves board in {q.expires} day{q.expires > 1 ? 's' : ''}</span>}
      </div>
      <button className="btn send" onClick={() => dispatch('assign', q.id)}>Send a party</button>
    </article>
  );
}

export function MissionCard({ p }) {
  const m = p.mission, q = m.quest, t = m.total || q.days, e = t - m.daysLeft, evs = m.ev || [], ms = members(p);
  const idx = S.parties.indexOf(p);
  const log = evs.filter((x) => x.day <= e && x.day < t && !x.pending);
  const mood = m.mom > 0.04 ? <span className="pill good">Going well</span> : m.mom < -0.04 ? <span className="pill bad">Going badly</span> : <span className="pill">Steady</span>;
  return (
    <article className={'contract mission' + (q.boss ? ' boss' : '') + (q.crisis ? ' crisis' : '')}>
      <div className="qtop">
        <div style={{ minWidth: 0 }}>
          <div className="qtype"><span className="pdot" style={{ background: PCOL[idx % PCOL.length] }} />{p.name} · day {e} of {t}</div>
          <h3 className="qtitle">{q.title}</h3>
          {q.crisis && <div className="cinfo bad">The guild’s survival depends on this quest.</div>}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}><div className="dlabel">Danger {q.d}</div>{mood}</div>
      </div>
      <div className="mstress">
        {ms.map((h) => (
          <div key={h.id}><small>{h.name.split(' ')[0]} {h.stress}</small><div className={'stress ' + stressCls(h.stress)}><i style={{ width: h.stress + '%' }} /></div></div>
        ))}
      </div>
      <div className="mlog">
        <div><PxIcon name="flag" size={18} /><span><b>Day 0</b> {p.name} sets out for {q.place}.</span></div>
        {log.map((x, i) => (
          <div key={i} className={x.tone === 'neutral' ? '' : x.tone === 'good' ? 'good' : 'bad'}><PxIcon name={x.icon} size={18} /><span><b>Day {x.day}</b> {x.t}</span></div>
        ))}
      </div>
    </article>
  );
}

/** Bird's-eye map with live party movement, zoom and pan. */
export function MapPanel() {
  useTick();
  const boxRef = useRef(null), pts = useRef(new Map()), drag = useRef(null), pinch = useRef(0);
  const v = ui.mv;
  const moving = ui.advancing || (ui.mode === 'live' && !ui.paused && !ui.modal && !S.over);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return undefined;
    const onWheel = (e) => {
      if (e.deltaY > 0 && ui.mv.w >= MAPW) return;
      e.preventDefault();
      const r = el.getBoundingClientRect();
      zoomBy(e.deltaY < 0 ? 1.2 : 1 / 1.2, (e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const onDown = (e) => {
    if (e.target.closest('.mapctl')) return;
    ui.mapMoved = false;
    pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pts.current.size === 1) drag.current = { x: e.clientX, y: e.clientY, v: { ...ui.mv } };
    else if (pts.current.size === 2) { const [a, b] = [...pts.current.values()]; pinch.current = Math.hypot(a.x - b.x, a.y - b.y); drag.current = null; }
  };
  const onMove = (e) => {
    if (!pts.current.has(e.pointerId)) return;
    pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const r = boxRef.current.getBoundingClientRect();
    if (pts.current.size === 2) {
      const [a, b] = [...pts.current.values()], d = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinch.current > 0 && d > 0) { zoomBy(d / pinch.current, ((a.x + b.x) / 2 - r.left) / r.width, ((a.y + b.y) / 2 - r.top) / r.height); pinch.current = d; ui.mapMoved = true; }
    } else if (drag.current && drag.current.v.w < MAPW) {
      const dx = e.clientX - drag.current.x, dy = e.clientY - drag.current.y;
      if (Math.abs(dx) + Math.abs(dy) > 6) ui.mapMoved = true;
      if (ui.mapMoved) setView(drag.current.v.x - (dx * drag.current.v.w) / r.width, drag.current.v.y - (dy * drag.current.v.w) / r.width, drag.current.v.w);
    }
  };
  const onUp = (e) => { pts.current.delete(e.pointerId); if (!pts.current.size) { drag.current = null; pinch.current = 0; } };

  const act = S.parties.map((p, i) => ({ p, c: PCOL[i % PCOL.length] })).filter((x) => x.p.mission);
  const groups = {};
  S.board.forEach((q) => { (groups[q.place] = groups[q.place] || []).push(q); });

  const openQuest = (q) => { if (ui.mapMoved) { ui.mapMoved = false; return; } dispatch('assign', q.id); };

  return (
    <div className={'mapbox' + (moving ? ' moving' : '')} ref={boxRef} style={{ touchAction: v.w < MAPW ? 'none' : 'pan-y' }}
      onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
      onClickCapture={(e) => { if (ui.mapMoved) { e.stopPropagation(); e.preventDefault(); ui.mapMoved = false; } }}>
      <svg className="map" viewBox={`${v.x} ${v.y} ${v.w} ${(v.w * MAPH) / MAPW}`} role="img" aria-label="Map of the realm">
        <g dangerouslySetInnerHTML={{ __html: terrain() }} />
        {Object.keys(LOC).map((n) => <circle key={n} cx={LOC[n].x} cy={LOC[n].y} r="3" fill="#a08a64" opacity=".55"><title>{n}</title></circle>)}
        {foundTowns().map((t) => (
          <g key={t.id} className="town-pin" role="button" tabIndex={0} aria-label={`${t.name}, a ${t.kind} with the inn ${t.tavern}. Open town list.`}
            onClick={() => dispatch('drawer', 'towns')} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); dispatch('drawer', 'towns'); } }}>
            <circle cx={t.x} cy={t.y} r="19" fill="transparent" />
            <rect x={t.x - 7} y={t.y - 4} width="14" height="10" fill="#7a5d35" />
            <path d={`M${t.x - 10} ${t.y - 4}L${t.x} ${t.y - 14}L${t.x + 10} ${t.y - 4}z`} fill={t.kind === 'town' ? '#c9a24a' : t.kind === 'village' ? '#a5603a' : '#8a6a52'} />
            <rect x={t.x - 2} y={t.y + 1} width="4" height="5" fill="#2b1d10" />
            <circle className="town-glow" cx={t.x} cy={t.y - 1} r="14" fill="none" stroke="#f5c56f" strokeOpacity=".35" />
            <text className="mlabel" x={t.x} y={t.y + 20} textAnchor="middle">{t.name}</text>
            <title>{t.name} ({t.kind}). {t.tavern}: beds {t.inn}g per hero.</title>
          </g>
        ))}
        {act.map(({ p, c }) => {
          const m = p.mission, q = m.quest, t = m.total || q.days, e = t - m.daysLeft, r = route(q.place, m.origin), pf = progress(p) / 100;
          const marks = [];
          for (let k = 1; k < t; k++) {
            const pt = bez(r, k / t), ev = (m.ev || []).find((x) => x.day === k);
            if (k <= e && ev && !ev.pending) {
              const col = ev.tone === 'good' ? '#86b86b' : ev.tone === 'bad' ? '#dc6a4e' : '#bba98d';
              marks.push(
                <g key={k} className="mark">
                  <circle cx={pt.x} cy={pt.y} r="9" fill="#1b130f" stroke={col} strokeWidth="2" />
                  <g dangerouslySetInnerHTML={{ __html: svgAt(icon(ev.icon, 12), (pt.x - 6).toFixed(1), (pt.y - 6).toFixed(1)) }} />
                  <title>{ev.t}</title>
                </g>,
              );
            } else marks.push(<circle key={k} cx={pt.x} cy={pt.y} r="4" fill="#1b130f" stroke="#bba98d" strokeOpacity=".6" />);
          }
          return (
            <g key={p.id}>
              <path className="route" d={routeD(r)} fill="none" stroke="#f1dfbd" strokeOpacity=".35" strokeWidth="2" strokeDasharray="5 5" />
              <path d={routeD(r)} pathLength="1" fill="none" stroke={c} strokeWidth="3.5" strokeLinecap="round" strokeDasharray={`${pf.toFixed(3)} 2`} />
              {marks}
              <circle className="ping" cx={r.L.x} cy={r.L.y} r="14" fill="none" stroke={c} strokeWidth="2" />
              <circle cx={r.L.x} cy={r.L.y} r="14" fill="#1b130f" stroke={c} strokeWidth="2.5" />
              <g dangerouslySetInnerHTML={{ __html: svgAt(icon('boss', 16), r.L.x - 8, r.L.y - 8) }} />
              <text className="mlabel" x={r.L.x} y={r.L.y + 31} textAnchor="middle">{q.place}</text>
            </g>
          );
        })}
        {Object.keys(groups).flatMap((pl) => {
          const l = locOf(pl), arr = groups[pl];
          return arr.map((q, i) => {
            const x = l.x + (i - (arr.length - 1) / 2) * 34, y = l.y - 24, hot = q.crisis || q.boss, col = hot ? '#dc6a4e' : '#e1a04b';
            return (
              <g key={q.id} className={'pin' + (hot ? ' hot' : '')} role="button" tabIndex={0}
                aria-label={`${q.title} at ${pl}. Danger ${q.d}. Send a party.`}
                onClick={() => openQuest(q)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openQuest(q); } }}>
                <circle cx={x} cy={y} r="21" fill="transparent" />
                <path d={`M${x} ${y + 15}L${l.x} ${l.y - 3}`} stroke={col} strokeWidth="1.5" opacity=".7" />
                <circle className="pinc" cx={x} cy={y} r="15" fill="#2a1c0e" stroke={col} strokeWidth="2.2" />
                <text className="pinn" x={x} y={y + 5.5} textAnchor="middle">{q.d}</text>
                <title>{q.title} at {pl}. Danger {q.d}. Click to send a party.</title>
              </g>
            );
          });
        })}
        <g transform={`translate(${GUILD.x} ${GUILD.y})`}>
          <rect x="-11" y="-8" width="22" height="15" fill="#8a6a3a" /><path d="M-14 -8L0 -22L14 -8z" fill="#b0463a" /><rect x="-3" y="0" width="6" height="7" fill="#2b1d10" />
        </g>
        <text className="mlabel" x={GUILD.x} y={GUILD.y - 30} textAnchor="middle">{S.guildName || 'Your guild'}</text>
        {S.parties.map((p, i) => {
          const ms = members(p), n = ms.length;
          if (!n || p.mission) return null;
          const c = PCOL[i % PCOL.length], here = p.leg && Math.hypot(p.leg.to.x - p.leg.from.x, p.leg.to.y - p.leg.from.y) > 1;
          if (atHome(p) && here) return null;
          const target = p.recall || !p.auto ? GUILD : p.dest;
          return target && !atHome(p) ? (
            <g key={'w' + p.id}>
              <path d={`M${partyPos(p).x.toFixed(1)} ${partyPos(p).y.toFixed(1)}L${target.x} ${target.y}`} stroke={c} strokeOpacity=".55" strokeWidth="2" strokeDasharray="2 6" strokeLinecap="round" fill="none" />
              {target !== GUILD && <circle className="ping" cx={target.x} cy={target.y} r="7" fill="none" stroke={c} strokeWidth="1.5" />}
            </g>
          ) : null;
        })}
        {(() => {
          const homeIdx = {};
          let hc = 0;
          S.parties.forEach((p) => { if (members(p).length && !p.mission && atHome(p) && !(p.leg && Math.hypot(p.leg.to.x - p.leg.from.x, p.leg.to.y - p.leg.from.y) > 1)) homeIdx[p.id] = hc++; });
          return S.parties.map((p, i) => {
            const ms = members(p), n = ms.length;
            if (!n) return null;
            const c = PCOL[i % PCOL.length], sel = ui.selectedParty === p.id;
            const pos = homeIdx[p.id] !== undefined ? { x: GUILD.x + (homeIdx[p.id] - (hc - 1) / 2) * 76, y: GUILD.y + 56 } : partyPos(p);
            const state = p.mission ? `on "${p.mission.quest.title}"` : p.recall ? 'returning to the tavern' : atHome(p) ? 'at the tavern' : p.auto ? 'roaming' : 'heading home';
            return (
              <g key={p.id} className={'mrun party-token' + (sel ? ' selected-party' : '')} role="button" tabIndex={0}
                aria-label={`${p.name}, ${state}. Open orders.`}
                style={{ transform: `translate(${pos.x.toFixed(1)}px,${pos.y.toFixed(1)}px)` }}
                onClick={(e) => { e.stopPropagation(); if (ui.mapMoved) { ui.mapMoved = false; return; } dispatch('selectparty', p.id); }}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); dispatch('selectparty', p.id); } }}>
                <rect x={-n * 9 - 8} y="-34" width={n * 18 + 16} height="46" fill="transparent" />
                {sel && <ellipse cx="0" cy="3" rx={n * 9 + 9} ry="7" fill="none" stroke="#f5c56f" strokeWidth="2" strokeDasharray="4 3" />}
                <ellipse cx="0" cy="3" rx={n * 9 + 4} ry="4.5" fill="#000" opacity=".35" />
                {ms.map((h, k) => <g key={h.id} className="step idle-sprite" dangerouslySetInnerHTML={{ __html: svgAt(sprite(h.cls, h.tier, 18, h.look), (-n * 9 + k * 18).toFixed(0), -20) }} />)}
                <text className="plabel" x="0" y="-25" textAnchor="middle" fill={c}>{p.name}</text>
                <title>{p.name}: {state}</title>
              </g>
            );
          });
        })()}
        <text x={MAPW - 14} y="22" textAnchor="end" className="mlabel">N</text>
      </svg>
      <div className="mapctl">
        <button onClick={() => dispatch('mz', 'in')} aria-label="Zoom in">+</button>
        <button onClick={() => dispatch('mz', 'out')} aria-label="Zoom out">−</button>
        <button className="fit" onClick={() => dispatch('mz', 'fit')} aria-label="Fit the whole map">Fit</button>
      </div>
      <div className="maphint">Scroll, pinch or drag to explore</div>
    </div>
  );
}

export function QuestsTab() {
  const out = S.parties.filter((p) => p.mission);
  return (
    <>
      <div className="qlayout">
        <div>
          <div className="sect"><h2>The realm</h2><span className="cinfo">Tap a numbered pin to send a party.</span></div>
          <MapPanel />
          <div className="maplegend">
            <span><i className="lg pin1" />Quest (danger)</span><span><i className="lg pin2" />Crisis or final</span><span><i className="lg pin3" />Destination</span>
          </div>
        </div>
        <div>
          <div className="sect"><h2>Out on quests</h2><span className="cinfo">Each day, a party travels a step.</span></div>
          {out.length
            ? <div className="stack">{out.map((p) => <MissionCard key={p.id} p={p} />)}</div>
            : <div className="empty">No party is out. Tap a pin on the map or pick from the board below.</div>}
        </div>
      </div>
      <div className="sect"><h2>Quest board</h2><span className="cinfo">Higher danger pays more, but your odds drop.</span></div>
      {S.board.length
        ? <div className="grid">{S.board.map((q) => <QuestCard key={q.id} q={q} />)}</div>
        : <div className="empty">The board is empty. End the day for new quests.</div>}
    </>
  );
}
