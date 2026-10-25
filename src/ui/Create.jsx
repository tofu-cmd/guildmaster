import { STATS, SL, SS, CLASSES, TIERS, QUIRKS } from '../engine/data.js';
import { SKINS, CLOTHS, HAIRS, CPAL } from '../engine/art.js';
import { ui, dispatch, availableClasses, slotStats, setCreateField } from '../engine/game.js';
import { Sprite } from './parts.jsx';

function Swatches({ i, k, list, sel, def }) {
  return list.map((col, n) => (
    <button key={n} className={'sw' + ((sel || 0) === n ? ' on' : '')} style={{ background: col || def }}
      onClick={() => dispatch('clook', i, `${k}:${n}`)} aria-label={`${k} ${n + 1}`} aria-pressed={(sel || 0) === n} />
  ));
}

function Slot({ s, i }) {
  const avail = availableClasses(), st = slotStats(s), mx = Math.max(...STATS.map((k) => st[k]), 1);
  let wage = TIERS[s.tier].wage;
  [s.pos, s.neg].forEach((id) => { wage *= QUIRKS[id].fx.wage || 1; });
  wage = Math.max(1, Math.round(wage));
  const hero = { cls: s.cls, tier: s.tier, look: s.look };
  return (
    <section className="panel slot">
      <div className="hhead">
        <div className={'hero t' + s.tier} style={{ background: 'none', border: 0, boxShadow: 'none' }}>
          <div className="spr big"><Sprite h={hero} size={52} /></div>
        </div>
        <div style={{ minWidth: 0 }}>
          <div className="cinfo">{s.vet ? 'Veteran recruit (Uncommon)' : `Hero ${i + 1}`}</div>
          <input className="in" id={'cn' + i} maxLength={16} value={s.name} onChange={(e) => setCreateField('name', i, e.target.value)} aria-label={`Hero ${i + 1} name`} />
        </div>
        <button className="btn small" onClick={() => dispatch('cname', i)} title="Random name">Random</button>
      </div>
      <div className="lbl">Class</div>
      <div className="chips">{avail.map((k) => <button key={k} className={'chipb' + (s.cls === k ? ' on' : '')} onClick={() => dispatch('ccls', i, k)}>{CLASSES[k].n}</button>)}</div>
      <div className="cinfo">{CLASSES[s.cls].role}</div>
      <div className="lbl">Focus (+{Math.round(3 * TIERS[s.tier].mult)} to one stat)</div>
      <div className="chips">{STATS.map((k) => <button key={k} className={'chipb' + (s.focus === k ? ' on' : '')} onClick={() => dispatch('cfocus', i, k)}>{SL[k]}</button>)}</div>
      <div className="sgrid">
        {STATS.map((k) => <div className="srow" key={k}><span>{SS[k]}</span><div className="sbar"><i style={{ width: (st[k] / mx) * 100 + '%' }} /></div><b>{st[k]}</b></div>)}
      </div>
      <div className="lbl">Look</div>
      <div className="looks"><span>Skin</span><Swatches i={i} k="skin" list={SKINS} sel={s.look.skin} def="" /></div>
      <div className="looks"><span>Cloth</span><Swatches i={i} k="cloth" list={CLOTHS} sel={s.look.cloth} def={CPAL[s.cls].b} /></div>
      <div className="looks"><span>Hair</span><Swatches i={i} k="hair" list={HAIRS} sel={s.look.hair} def={CPAL[s.cls].h} /></div>
      <div className="lbl">Strength (pick one)</div>
      <div className="stack">
        {s.posOpts.map((id) => (
          <button key={id} className={'opt' + (s.pos === id ? ' sel' : '')} aria-pressed={s.pos === id} onClick={() => dispatch('cpos', i, id)}>
            <span><b>{QUIRKS[id].n}</b><br /><span className="cinfo">{QUIRKS[id].d}</span></span>
          </button>
        ))}
      </div>
      <div className="lbl">Flaw (pick one)</div>
      <div className="stack">
        {s.negOpts.map((id) => (
          <button key={id} className={'opt' + (s.neg === id ? ' sel' : '')} aria-pressed={s.neg === id} onClick={() => dispatch('cneg', i, id)}>
            <span><b>{QUIRKS[id].n}</b><br /><span className="cinfo">{QUIRKS[id].d}</span></span>
          </button>
        ))}
      </div>
      <div className="hfoot"><button className="btn small" onClick={() => dispatch('creroll', i)}>Reroll traits</button><span className="cinfo">Wage {wage}g/day</span></div>
    </section>
  );
}

export default function Create() {
  const c = ui.create;
  const hasCleric = c.slots.some((s) => s.cls === 'cleric');
  return (
    <>
      <header className="deck">
        <div className="deck-in">
          <div className="command">
            <div className="brand"><div className="wordmark">Guildmaster</div><div className="subtitle">Guild Command · <b>The Ember Crown</b></div></div>
            <button className="btn small" onClick={() => dispatch('help')}>How to play</button>
          </div>
        </div>
      </header>
      <main className="wrap">
        <section className="create">
          <h2>Found your guild</h2>
          <p className="cinfo" style={{ margin: '6px 0' }}>Build your first party. Pick each hero’s class, focus, look, strength and flaw. They start as Common heroes with the same quirks you choose here, so choose a team you want to grow attached to.</p>
          <div className="grid" style={{ margin: '14px 0' }}>
            <label className="fld">Guild name<input className="in" id="gname" maxLength={26} value={c.gname} onChange={(e) => setCreateField('gname', 0, e.target.value)} /></label>
            <label className="fld">First party name<input className="in" id="pname" maxLength={22} value={c.pname} onChange={(e) => setCreateField('pname', 0, e.target.value)} /></label>
            <div className="fld">World seed
              <div className="seedrow">
                <input className="in" id="wseed" maxLength={28} value={c.seed || ''} onChange={(e) => dispatch('cseed', e.target.value)} aria-label="World seed" />
                <button className="btn small" onClick={() => dispatch('cnewseed')}>New seed</button>
              </div>
              <small className="cinfo">Same seed, same map, towns, era and final boss. Share it to play the same world.</small>
            </div>
          </div>
          <div className="grid">{c.slots.map((s, i) => <Slot key={i} s={s} i={i} />)}</div>
          {!hasCleric && <p className="cinfo bad" style={{ marginTop: 12 }}>No Cleric in this party. Injuries and deaths are twice as likely when quests fail. You can hire one later.</p>}
          {c.err && <p className="bad" role="alert">{c.err}</p>}
          <div className="mact" style={{ marginTop: 16 }}>
            <button className="btn" onClick={() => dispatch('crand')}>Randomize everything</button>
            <button className="btn primary" onClick={() => dispatch('cfound')}>Found the guild</button>
          </div>
        </section>
      </main>
    </>
  );
}
