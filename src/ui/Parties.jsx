import { STATS, SL, CLASSES, TIERS, AFFL, VIRT } from '../engine/data.js';
import { PCOL } from '../engine/map.js';
import {
  S, dispatch, members, stat, status, unavailable, atHome, partyPos, nearestPlace, chance,
} from '../engine/game.js';
import { Sprite, stressCls } from './parts.jsx';

const ABBR = { might: 'MT', magic: 'MG', agility: 'AG', wits: 'WT' };

/** One line saying what a party is doing right now. */
export function partyState(p) {
  if (p.mission) return `On a quest: ${p.mission.quest.title} (day ${p.mission.total - p.mission.daysLeft} of ${p.mission.total})`;
  if (p.recall) return 'Returning to the tavern';
  if (atHome(p)) return p.auto ? 'At the tavern, about to head out' : 'At the tavern, waiting for orders';
  if (!p.auto) return 'Heading back to the tavern';
  return `Roaming near ${nearestPlace(partyPos(p))}`;
}

function shortState(p) {
  if (p.mission) return { label: 'On quest', cls: 'warn' };
  if (p.recall) return { label: 'Returning', cls: 'warn' };
  if (atHome(p)) return p.members.length ? (p.auto ? { label: 'Leaving', cls: 'warn' } : { label: 'At tavern', cls: 'good' }) : { label: 'Empty', cls: '' };
  return p.auto ? { label: 'Roaming', cls: 'warn' } : { label: 'Heading home', cls: 'warn' };
}

/** A compact hero tile: portrait, name, class, stats, stress. Click for the journal. */
export function HeroTile({ h, onRemove, action }) {
  const st = status(h);
  const flag = st === 'injured' ? <span className="ht-flag bad">Hurt {h.injured}d</span>
    : st === 'resting' ? <span className="ht-flag warn">Resting</span>
    : h.affl ? <span className="ht-flag bad" title={AFFL[h.affl].d}>{AFFL[h.affl].n}</span>
    : h.virtue ? <span className="ht-flag good" title={VIRT[h.virtue].d}>{VIRT[h.virtue].n}</span> : null;
  return (
    <div className={'htile t' + h.tier}>
      <button className="ht-main" onClick={() => dispatch('dossier', h.id)} title={`${TIERS[h.tier].n} ${CLASSES[h.cls].n}. Open journal.`}>
        <span className="ht-spr"><Sprite h={h} size={32} /><span className="lvl">{h.level}</span></span>
        <span className="ht-txt"><b>{h.name.split(' ')[0]}</b><small>{CLASSES[h.cls].n}</small></span>
      </button>
      {onRemove && <button className="ht-x" onClick={onRemove} aria-label={`Remove ${h.name} from the party`} title="Remove from party">×</button>}
      <div className="ht-stats">{STATS.map((s) => <span key={s} title={SL[s]}><i>{ABBR[s]}</i>{stat(h, s)}</span>)}</div>
      <div className="ht-bar" title={`Stress ${h.stress}/100`}><div className={'stress ' + stressCls(h.stress)}><i style={{ width: h.stress + '%' }} /></div><small>{h.stress}</small></div>
      {flag}
      {action}
    </div>
  );
}

function PartyPanel({ p, i }) {
  const ms = members(p), home = atHome(p), blocked = !ms.length || ms.some(unavailable);
  const st = shortState(p), c = PCOL[i % PCOL.length];
  const best = S.board.length ? Math.max(...S.board.map((q) => chance(ms, q))) : 0;
  return (
    <section className="pd-card" style={{ '--pc': c }}>
      <header className="pd-head">
        <h3><span className="pd-dot" />{p.name}</h3>
        <span className={'pill ' + st.cls}>{st.label}</span>
      </header>
      <div className="pd-sub" title={partyState(p)}>{ms.length ? partyState(p) : 'No heroes yet. Add some below.'}</div>
      <div className="pd-grid">
        {[0, 1, 2, 3].map((k) => {
          const h = ms[k];
          if (h) return <HeroTile key={h.id} h={h} onRemove={home ? () => dispatch('remove', h.id) : null} />;
          return home
            ? <button key={'e' + k} className="pd-add" onClick={() => dispatch('addslot', p.id)}>+ Add hero</button>
            : <div key={'e' + k} className="pd-add off">Empty slot</div>;
        })}
      </div>
      <div className="pd-tot">
        {STATS.map((s) => <span key={s} title={SL[s]}><i>{ABBR[s]}</i>{ms.reduce((a, h) => a + stat(h, s), 0)}</span>)}
        {ms.length > 0 && <span className={'pd-best ' + (best >= 0.7 ? 'good' : best >= 0.4 ? 'warn' : 'bad')} title="Your best odds on the quest board">Best odds {Math.round(best * 100)}%</span>}
        {ms.length > 0 && !ms.some((h) => h.cls === 'cleric') && <span className="pd-warn" title="Injuries and deaths are twice as likely without a Cleric">No cleric</span>}
      </div>
      <footer className="pd-foot">
        <button className="btn small primary" disabled={!ms.length} onClick={() => dispatch('selectparty', p.id)}>Orders</button>
        {!home || p.mission
          ? <button className="btn small" onClick={() => dispatch('recall', p.id)}>Recall</button>
          : <button className="btn small" disabled={blocked || p.auto} onClick={() => dispatch('roamon', p.id)}>{p.auto ? 'Roaming on' : 'Roam'}</button>}
        {!home && <span className="cinfo">Recall to change heroes</span>}
        {home && blocked && ms.length > 0 && <span className="cinfo bad">A hero is hurt or resting</span>}
      </footer>
    </section>
  );
}

/** The Parties dashboard: every party at a glance, no scrolling in the usual case. */
export function PartiesDashboard() {
  const squads = S.parties.map((p, i) => ({ p, i }));
  const out = S.parties.filter((p) => p.members.length && !atHome(p)).length;
  const free = S.heroes.filter((h) => !h.party);
  return (
    <div className="pd">
      <div className="drawer-kicker">PARTY COMMAND</div>
      <div className="pd-top">
        <h2>Parties</h2>
        <span className="cinfo">{out} out · {S.parties.length - out} home · {free.length} unassigned</span>
        <span className="cinfo pd-legend">MT Might · MG Magic · AG Agility · WT Wits. Click a hero for their journal.</span>
      </div>
      <div className="pd-cards">{squads.map(({ p, i }) => <PartyPanel key={p.id} p={p} i={i} />)}</div>
      {free.length > 0 && (
        <div className="pd-free">
          <b>Unassigned heroes</b>
          <div className="pd-chips">
            {free.map((h) => (
              <button key={h.id} className={'pd-chip t' + h.tier} onClick={() => dispatch('dossier', h.id)} title={`${TIERS[h.tier].n} ${CLASSES[h.cls].n}, level ${h.level}`}>
                <Sprite h={h} size={20} />{h.name.split(' ')[0]}
              </button>
            ))}
          </div>
          <span className="cinfo">Use “+ Add hero” in a party that is at the tavern.</span>
        </div>
      )}
    </div>
  );
}
