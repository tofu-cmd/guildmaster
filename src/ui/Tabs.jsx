import { STATS, SS, CLASSES, TIERS, BLD, BOSSES, RANKS, BOSS_RANK } from '../engine/data.js';
import { S, M, ui, dispatch, members, party, stat, status, unavailable, rosterCap, efx, era, bl, atHome } from '../engine/game.js';
import HeroCard from './HeroCard.jsx';

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
