import { STATS, SL, CLASSES, TIERS, repTier, alignTitle } from '../engine/data.js';
import { S, ui, dispatch, party, stat, status, rosterCap, efx, Q } from '../engine/game.js';
import { Sprite, stressCls } from './parts.jsx';

const ABBR = { might: 'MT', magic: 'MG', agility: 'AG', wits: 'WT' };
const STATUSES = [
  ['all', 'All'], ['ready', 'Ready'], ['questing', 'On quest'], ['roaming', 'Roaming'],
  ['injured', 'Injured'], ['resting', 'Resting'], ['unassigned', 'No party'], ['afflicted', 'Afflicted'],
];
const SORTS = [['tier', 'Rarity'], ['level', 'Level'], ['stress', 'Stress'], ['rep', 'Reputation'], ['wage', 'Wage'], ['name', 'Name']];
const SORTERS = {
  tier: (a, b) => b.tier - a.tier || b.level - a.level,
  level: (a, b) => b.level - a.level || b.tier - a.tier,
  stress: (a, b) => b.stress - a.stress,
  rep: (a, b) => (b.rep || 0) - (a.rep || 0),
  wage: (a, b) => b.wage - a.wage,
  name: (a, b) => a.name.localeCompare(b.name),
};
const DEFAULT = { cls: 'all', st: 'all', sort: 'tier' };

const matchesStatus = (h, s) => (s === 'all' ? true : s === 'unassigned' ? !h.party : s === 'afflicted' ? !!h.affl : status(h) === s);
const sign = (n) => (n > 0 ? '+' : '');

function RosterTile({ h }) {
  const st = status(h), pn = h.party && party(h.party), rt = repTier(h.rep || 0), xpNeed = 40 * h.level;
  const away = st === 'questing' || st === 'roaming';
  const pill = {
    ready: ['Ready', 'good'], questing: ['On quest', 'warn'], roaming: ['Roaming', 'warn'],
    injured: [`Hurt ${h.injured}d`, 'bad'], resting: ['Resting', 'warn'],
  }[st];
  const tags = Q(h), shown = tags.slice(0, 3);
  return (
    <article className={'rtile t' + h.tier}>
      <div className="rt-top">
        <button className="ht-main" onClick={() => dispatch('dossier', h.id)} title="Open journal">
          <span className="ht-spr"><Sprite h={h} size={32} /><span className="lvl">{h.level}</span></span>
          <span className="ht-txt"><b>{h.name}</b><small>{TIERS[h.tier].n} {CLASSES[h.cls].n}</small></span>
        </button>
        <span className={'pill ' + pill[1]}>{pill[0]}</span>
      </div>
      <div className="rt-sub">{pn ? pn.name : 'No party'} · {h.wage}g/day · {h.wins}W {(h.quests || 0) - h.wins}L</div>
      <div className="ht-stats">{STATS.map((s) => <span key={s} title={SL[s]}><i>{ABBR[s]}</i>{stat(h, s)}</span>)}</div>
      <div className="rt-bars">
        <div title={`Stress ${h.stress}/100`}><small>Stress {h.stress}</small><div className={'stress ' + stressCls(h.stress)}><i style={{ width: h.stress + '%' }} /></div></div>
        <div title={h.level < 12 ? `XP ${h.xp}/${xpNeed}` : 'Max level'}><small>{h.level < 12 ? `XP ${h.xp}/${xpNeed}` : 'Max level'}</small><div className="xp"><i style={{ width: (h.level < 12 ? Math.min(100, (h.xp / xpNeed) * 100) : 100) + '%' }} /></div></div>
      </div>
      <div className="rt-tags">
        {shown.map((x, i) => <span key={i} className={'tag ' + (x.story ? 'story' : x.pos ? 'pos' : 'neg')} title={x.d}>{x.n}</span>)}
        {tags.length > shown.length && <span className="tag" title={tags.slice(3).map((x) => x.n).join(', ')}>+{tags.length - shown.length}</span>}
        {h.affl && <span className="tag aff">{h.affl}</span>}
      </div>
      <div className="rt-rep"><b className={rt.cls}>{rt.n}</b> ({sign(h.rep || 0)}{h.rep || 0}){(h.story || []).length ? ` · ${alignTitle(h)}` : ''}</div>
      <div className="rt-act">
        <button className={'btn small' + (h.unread ? ' primary' : '')} onClick={() => dispatch('dossier', h.id)}>{h.unread ? `Journal (${h.unread})` : 'Journal'}</button>
        {(st === 'ready' || st === 'injured') && <button className="btn small" onClick={() => dispatch('relax', h.id)}>Relax</button>}
        {!away && (ui.confirm === h.id
          ? <button className="btn small danger" onClick={() => dispatch('release', h.id)}>Confirm release</button>
          : <button className="btn small" onClick={() => dispatch('release', h.id)}>Release</button>)}
      </div>
    </article>
  );
}

/** The Roster dashboard: filter by role and status, sort, and act on heroes in one place. */
export function RosterDashboard() {
  const f = { ...DEFAULT, ...(ui.rf || {}) };
  const all = S.heroes;
  const roles = Object.keys(CLASSES).filter((c) => all.some((h) => h.cls === c));
  const byStatus = all.filter((h) => matchesStatus(h, f.st));
  const byRole = all.filter((h) => f.cls === 'all' || h.cls === f.cls);
  const list = all.filter((h) => (f.cls === 'all' || h.cls === f.cls) && matchesStatus(h, f.st)).sort(SORTERS[f.sort]);
  const filtered = f.cls !== 'all' || f.st !== 'all';
  const wages = Math.round(all.reduce((s, h) => s + h.wage, 0) * efx('wage', 1));
  return (
    <div className="rd">
      <div className="rd-head">
        <div className="drawer-kicker">GUILD ROSTER</div>
        <div className="pd-top">
          <h2>Roster</h2>
          <span className="cinfo">{all.length}/{rosterCap()} heroes · wages {wages}g/day{filtered ? ` · showing ${list.length}` : ''}</span>
        </div>
        <div className="rf">
          <div className="rf-row">
            <span className="rf-lbl">Role</span>
            <div className="chips">
              <button className={'chipb' + (f.cls === 'all' ? ' on' : '')} onClick={() => dispatch('rfilter', 'cls', 'all')}>All ({byStatus.length})</button>
              {roles.map((c) => (
                <button key={c} className={'chipb' + (f.cls === c ? ' on' : '')} onClick={() => dispatch('rfilter', 'cls', c)}>{CLASSES[c].n} ({byStatus.filter((h) => h.cls === c).length})</button>
              ))}
            </div>
          </div>
          <div className="rf-row">
            <span className="rf-lbl">Status</span>
            <div className="chips">
              {STATUSES.map(([k, label]) => {
                const n = byRole.filter((h) => matchesStatus(h, k)).length;
                return <button key={k} className={'chipb' + (f.st === k ? ' on' : '')} disabled={k !== 'all' && n === 0 && f.st !== k} onClick={() => dispatch('rfilter', 'st', k)}>{label} ({n})</button>;
              })}
            </div>
          </div>
          <div className="rf-row">
            <label className="rf-lbl" htmlFor="rf-sort">Sort by</label>
            <select id="rf-sort" className="in sel" value={f.sort} onChange={(e) => dispatch('rfilter', 'sort', e.target.value)}>
              {SORTS.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
            </select>
            {filtered && <button className="btn small" onClick={() => dispatch('rfilter', 'reset')}>Clear filters</button>}
          </div>
        </div>
      </div>
      <div className="rd-list">
        {list.length
          ? <div className="rt-grid">{list.map((h) => <RosterTile key={h.id} h={h} />)}</div>
          : <div className="empty">{all.length ? 'No heroes match these filters.' : 'Nobody works for you. Visit the Tavern.'}</div>}
        {S.fallen.length > 0 && (
          <details className="rd-fallen">
            <summary>Fallen ({S.fallen.length})</summary>
            <div className="stack">
              {S.fallen.slice().reverse().map((x, i) => (
                <div className="cinfo" key={i}>{x.name}{x.title ? ` (${x.title}, ${x.rep})` : ''}, {TIERS[x.tier].n} {CLASSES[x.cls].n} (Lv {x.level}), died on day {x.day} during "{x.quest}".</div>
              ))}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}
