import { STATS, SS, CLASSES, TIERS, BLD, BOSSES, RANKS, BOSS_RANK } from '../engine/data.js';
import { S, M, ui, dispatch, members, party, stat, status, unavailable, rosterCap, efx, era, bl } from '../engine/game.js';
import HeroCard from './HeroCard.jsx';

export function PartyCard({ p }) {
  const ms = members(p), busy = !!p.mission, inj = ms.some(unavailable);
  const state = busy ? <span className="pill warn">{p.mission.quest.title} · {p.mission.daysLeft}d left</span>
    : !ms.length ? <span className="pill">Empty</span>
    : inj ? <span className="pill bad">Hero unavailable</span>
    : <span className="pill good">Ready</span>;
  return (
    <section className="squad">
      <div className="phead"><h3>{p.name}</h3>{state}</div>
      <div className="stack">
        {Array.from({ length: 4 }, (_, i) => {
          const h = ms[i];
          if (h) return <HeroCard key={h.id} h={h} compact extra={busy ? null : <button className="btn small" onClick={() => dispatch('remove', h.id)}>Remove</button>} />;
          return busy ? null : <button key={'s' + i} className="slot-add" onClick={() => dispatch('addslot', p.id)}>+ Add a hero</button>;
        })}
      </div>
      <div className="ptotals">{STATS.map((s) => <span key={s}><b>{ms.reduce((a, h) => a + stat(h, s), 0)}</b>{SS[s]}</span>)}</div>
      {ms.length > 0 && !ms.some((h) => h.cls === 'cleric') && <div className="cinfo">No cleric: injuries and deaths are twice as likely if a quest fails.</div>}
    </section>
  );
}

export function PartiesTab() {
  return (
    <>
      <div className="sect"><h2>Your parties</h2><span className="cinfo">Up to 4 heroes each. Mix classes for better odds.</span></div>
      <div className="grid">{S.parties.map((p) => <PartyCard key={p.id} p={p} />)}</div>
    </>
  );
}

export function RosterTab() {
  const hs = [...S.heroes].sort((a, b) => b.tier - a.tier || b.level - a.level);
  return (
    <>
      <div className="sect">
        <h2>Roster</h2>
        <span className="cinfo">{S.heroes.length}/{rosterCap()} heroes · wages {Math.round(S.heroes.reduce((s, h) => s + h.wage, 0) * efx('wage', 1))}g/day</span>
      </div>
      {hs.length ? (
        <div className="grid">
          {hs.map((h) => {
            const pn = h.party && party(h.party), st = status(h);
            const extra = (
              <>
                <button className={'btn small' + (h.unread ? ' primary' : '')} onClick={() => dispatch('dossier', h.id)}>{h.unread ? `Journal (${h.unread})` : 'Journal'}</button>
                {(st === 'ready' || st === 'injured') && <button className="btn small" onClick={() => dispatch('relax', h.id)}>Relax</button>}
                {st !== 'questing' && (ui.confirm === h.id
                  ? <button className="btn small danger" onClick={() => dispatch('release', h.id)}>Confirm release</button>
                  : <button className="btn small" onClick={() => dispatch('release', h.id)}>Release</button>)}
              </>
            );
            return (
              <div className="stack" key={h.id}>
                <HeroCard h={h} extra={extra} />
                <div className="cinfo">{pn ? 'In ' + pn.name : 'Not in a party'} · {h.wins} quests won</div>
              </div>
            );
          })}
        </div>
      ) : <div className="empty">Nobody works for you. Visit the Tavern.</div>}
      {S.fallen.length > 0 && (
        <>
          <div className="sect"><h2>Fallen</h2></div>
          <div className="stack">
            {S.fallen.slice().reverse().map((f, i) => (
              <div className="cinfo" key={i}>
                {f.name}{f.title ? ` (${f.title}, ${f.rep})` : ''}, {TIERS[f.tier].n} {CLASSES[f.cls].n} (Lv {f.level}), died on day {f.day} during "{f.quest}".
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}

export function TavernTab() {
  const full = S.heroes.length >= rosterCap();
  return (
    <>
      <div className="sect"><h2>Tavern</h2><button className="btn" disabled={S.gold < 20} onClick={() => dispatch('reroll')}>New faces (20 gold)</button></div>
      <p className="cinfo" style={{ marginBottom: 12 }}>{full ? 'Your roster is full. Release someone or rank up to hire more. ' : ''}Hiring is a one-time fee. Every hero also costs daily wages. Check quirks before you sign.</p>
      <div className="grid">
        {S.tavern.map((h) => (
          <HeroCard key={h.id} h={h} extra={<button className="btn small primary" disabled={full || S.gold < h.cost} onClick={() => dispatch('hire', h.id)}>Hire {h.cost}g</button>} />
        ))}
      </div>
      <p className="cinfo" style={{ marginTop: 12 }}>Cleric: {CLASSES.cleric.role}</p>
    </>
  );
}

export function GuildTab() {
  const B = BOSSES[S.boss];
  return (
    <>
      <div className="sect"><h2>Guild hall</h2><span className="cinfo">Upgrades last for this run.</span></div>
      <div className="grid" style={{ marginBottom: 14 }}>
        <section className="panel dread">
          <h3>The final quest</h3>
          <div>{B.n}</div>
          <div className="cinfo">
            {B.lore} Appears at Rank {RANKS[BOSS_RANK].l}.
            {S.vic ? <> <b className="good">Defeated.</b></> : S.bossSpawned ? <> <b className="bad">It is waiting on the board.</b></> : null}
          </div>
        </section>
        <section className="panel dread">
          <h3>{era().n}</h3>
          <div className="cinfo">{era().d}</div>
          <div className="cinfo">Legacy points: <b>{M.legacy}</b>. Earned at the end of every run.</div>
          <div style={{ marginTop: 8 }}><button className="btn small" onClick={() => dispatch('legacy')}>View legacy perks</button></div>
        </section>
      </div>
      <div className="grid">
        {BLD.map((b) => {
          const lv = bl(b.id), max = b.cost.length, cost = b.cost[lv];
          return (
            <section className="panel bld" key={b.id}>
              <h3>{b.n}</h3>
              <div className="bpips">{b.cost.map((_, i) => <i key={i} className={i < lv ? 'on' : ''} />)}</div>
              <div className="cinfo">{b.d}</div>
              {lv < max
                ? <div><button className="btn small primary" disabled={S.gold < cost} onClick={() => dispatch('build', b.id)}>Upgrade for {cost}g</button></div>
                : <div className="cinfo good">Fully upgraded</div>}
            </section>
          );
        })}
      </div>
    </>
  );
}
