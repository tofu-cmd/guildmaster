import { useState } from 'react';
import { clamp, S, ui, dispatch, setSearch, catOf, LCATS } from '../engine/game.js';
import { GCATS } from './ledgerData.js';

function eventRows() {
  const q = (ui.lq || '').trim().toLowerCase(), f = ui.lf || 'all';
  return S.log.filter((e) => (f === 'all' || catOf(e) === f) && (!q || e.t.toLowerCase().includes(q)));
}

function Events() {
  const rows = eventRows(), shown = rows.slice(0, ui.llim || 60);
  let day = null;
  const out = [];
  shown.forEach((e, i) => {
    if (e.d !== day) { day = e.d; out.push(<div key={'d' + e.d + i} className="ldayhd">Day {e.d}</div>); }
    out.push(<div key={i} className="lrow"><span className="ltag">{LCATS[catOf(e)]}</span><span className="ltxt">{e.t}</span></div>);
  });
  return (
    <div>
      {shown.length ? out : <div className="empty">Nothing matches. Try another filter.</div>}
      {rows.length > shown.length && <div className="mact"><button className="btn" onClick={() => dispatch('lmore')}>Show older entries ({rows.length - shown.length} more)</button></div>}
    </div>
  );
}

function balanceSeries() {
  const L = (S.ledger || []).slice().reverse(), byDay = {};
  L.forEach((x) => { byDay[x.d] = x.bal; });
  const first = L.length ? L[0].d : S.day, pts = [];
  let last = L.length ? L[0].bal - L[0].n : S.gold;
  for (let d = first; d <= S.day; d++) { if (byDay[d] !== undefined) last = byDay[d]; pts.push({ d, v: d === S.day ? S.gold : last }); }
  const step = Math.ceil(pts.length / 100);
  return pts.filter((p, i) => i % step === 0 || i === pts.length - 1);
}

function GoldChart({ pts }) {
  const [hover, setHover] = useState(null);
  const W = 400, H = 150, L = 44, R = 12, T = 14, B = 22;
  if (pts.length < 2) return <div className="empty">The chart appears once a few days have passed.</div>;
  let lo = Math.min(...pts.map((p) => p.v)), hi = Math.max(...pts.map((p) => p.v));
  if (hi === lo) hi = lo + 1;
  const pad = (hi - lo) * 0.08; lo -= pad; hi += pad;
  const d0 = pts[0].d, d1 = pts[pts.length - 1].d || d0 + 1;
  const X = (d) => L + ((d - d0) / Math.max(1, d1 - d0)) * (W - L - R), Y = (v) => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${X(p.d).toFixed(1)} ${Y(p.v).toFixed(1)}`).join('');
  const area = `${line}L${X(d1).toFixed(1)} ${H - B}L${X(d0).toFixed(1)} ${H - B}Z`;
  const ticks = [lo + pad, (lo + hi) / 2, hi - pad].map((v) => Math.round(v));
  const last = pts[pts.length - 1];
  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    setHover(Math.round(clamp((e.clientX - r.left) / r.width, 0, 1) * (pts.length - 1)));
  };
  const hp = hover === null ? null : pts[hover];
  return (
    <div className="gchart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Gold balance by day, from ${Math.round(pts[0].v)} to ${last.v}`}>
        {ticks.map((v) => (
          <g key={v}>
            <line className="ggrid" x1={L} x2={W - R} y1={Y(v)} y2={Y(v)} />
            <text className="gtxt" x={L - 6} y={Y(v) + 3} textAnchor="end">{v}</text>
          </g>
        ))}
        <text className="gtxt" x={L} y={H - 6}>Day {d0}</text>
        <text className="gtxt" x={W - R} y={H - 6} textAnchor="end">Day {d1}</text>
        <path className="garea" d={area} /><path className="gline" d={line} />
        {hp && <><line className="gx" y1={T} y2={H - B} x1={X(hp.d)} x2={X(hp.d)} /><circle className="gdot" r="4" cx={X(hp.d)} cy={Y(hp.v)} /></>}
        <circle className="gend" cx={X(last.d)} cy={Y(last.v)} r="4" />
        <rect x={L} y={T} width={W - L - R} height={H - T - B} fill="transparent" onPointerMove={onMove} onPointerLeave={() => setHover(null)} />
      </svg>
      {hp && <div className="gtip" style={{ left: Math.max(0, Math.min(70, (X(hp.d) / W) * 100 - 12)) + '%' }}>Day {hp.d}: {hp.v} gold</div>}
    </div>
  );
}

function Gold() {
  const L = (S.ledger || []).filter((x) => x.c !== 'open');
  const inc = L.filter((x) => x.n > 0).reduce((a, x) => a + x.n, 0), out = -L.filter((x) => x.n < 0).reduce((a, x) => a + x.n, 0);
  const by = {}; L.forEach((x) => { by[x.c] = (by[x.c] || 0) + x.n; });
  const cats = Object.keys(GCATS).filter((k) => by[k]), mx = Math.max(1, ...cats.map((k) => Math.abs(by[k])));
  const rows = (S.ledger || []).slice(0, ui.glim || 30), net = inc - out;
  return (
    <>
      <div className="gstats">
        <div><small>Balance</small><b className={S.gold < 0 ? 'neg' : ''}>{S.gold}</b></div>
        <div><small>Earned</small><b>+{inc}</b></div>
        <div><small>Spent</small><b>−{out}</b></div>
        <div><small>Net</small><b className={net < 0 ? 'neg' : ''}>{net > 0 ? '+' : net < 0 ? '−' : ''}{Math.abs(net)}</b></div>
      </div>
      <div className="sect"><h2>Balance by day</h2><span className="cinfo">Hover the chart to read a day.</span></div>
      <GoldChart pts={balanceSeries()} />
      <div className="sect"><h2>Where it goes</h2></div>
      <div className="gbreak">
        {cats.length ? cats.map((k) => (
          <div className="gb" key={k}><span>{GCATS[k]}</span><div className="gbar"><i className={by[k] < 0 ? 'out' : 'in'} style={{ width: (Math.abs(by[k]) / mx) * 100 + '%' }} /></div><b>{by[k] > 0 ? '+' : '−'}{Math.abs(by[k])}</b></div>
        )) : <div className="cinfo">No gold has moved yet.</div>}
      </div>
      <div className="sect"><h2>Every transaction</h2></div>
      <div className="gtblwrap">
        <table className="gtbl">
          <thead><tr><th>Day</th><th>What</th><th className="r">Amount</th><th className="r">Balance</th></tr></thead>
          <tbody>
            {rows.map((x, i) => (
              <tr key={i}><td>{x.d}</td><td>{x.why}</td>
                <td className={'r ' + (x.n < 0 ? 'bad' : 'good')}>{x.c === 'open' ? x.n : (x.n > 0 ? '+' : '−') + Math.abs(x.n)}</td><td className="r">{x.bal}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      {(S.ledger || []).length > rows.length && <div className="mact"><button className="btn" onClick={() => dispatch('gmore')}>Show older transactions</button></div>}
    </>
  );
}

export default function LedgerTab() {
  const v = ui.lv || 'events', f = ui.lf || 'all';
  const counts = { all: S.log.length };
  Object.keys(LCATS).forEach((k) => { counts[k] = S.log.filter((e) => catOf(e) === k).length; });
  return (
    <div className="sheet">
      <div className="sect"><h2>Ledger</h2><span className="cinfo">Everything your guild has done, and every coin that moved.</span></div>
      <div className="mtabs" style={{ marginBottom: 14 }}>
        <button className={'mtab' + (v === 'events' ? ' on' : '')} onClick={() => dispatch('lv', 'events')}>Events</button>
        <button className={'mtab' + (v === 'gold' ? ' on' : '')} onClick={() => dispatch('lv', 'gold')}>Gold</button>
      </div>
      {v === 'gold' ? <div className="scrollbox" tabIndex={0} role="region" aria-label="Gold account"><Gold /></div> : (
        <>
          <div className="chips" style={{ marginBottom: 10 }}>
            {['all', ...Object.keys(LCATS)].map((k) => (
              <button key={k} className={'chipb' + (f === k ? ' on' : '')} onClick={() => dispatch('lf', k)}>{k === 'all' ? 'All' : LCATS[k]} ({counts[k]})</button>
            ))}
          </div>
          <input className="in" placeholder="Search the ledger" value={ui.lq || ''} onChange={(e) => setSearch(e.target.value)} aria-label="Search the ledger" style={{ marginBottom: 10 }} />
          <div className="scrollbox" tabIndex={0} role="region" aria-label="Ledger entries"><Events /></div>
        </>
      )}
    </div>
  );
}
