import { KINDS } from '../engine/world.js';
import { S, dispatch, towns, foundTowns, townAt, partyPos, members } from '../engine/game.js';

function copySeed() {
  try { navigator.clipboard.writeText(S.seed); } catch (e) { /* clipboard blocked */ }
}

/** Every settlement the guild has found, and what its tavern offers. */
export function TownsTab() {
  const found = foundTowns(), unknown = towns().length - found.length;
  const crews = S.parties.filter((p) => members(p).length);
  return (
    <>
      <div className="drawer-kicker">THE REALM</div>
      <h2>Towns and taverns</h2>
      <div className="seedbox">
        <span>World seed</span><code>{S.seed}</code>
        <button className="btn small" onClick={copySeed}>Copy</button>
      </div>
      <p className="cinfo" style={{ margin: '8px 0 12px' }}>
        Roaming parties explore and find new settlements. Inns charge per hero per night, calm stress and speed up healing. Hurt or frayed parties head to the nearest one on their own.
      </p>
      <div className="stack">
        {found.map((t) => {
          const K = KINDS[t.kind], there = crews.filter((p) => { const a = townAt(partyPos(p)); return a && a.id === t.id; });
          return (
            <section className="panel town-card" key={t.id}>
              <div className="tc-head"><h3>{t.name}</h3><span className="pill">{K.n}</span></div>
              <div className="cinfo"><b>{t.tavern}</b>. {K.d}</div>
              <div className="tc-stats">
                <span>Bed <b>{t.inn}g</b> per hero</span>
                <span>Stress <b>-{t.relief}</b>/night</span>
                <span>Healing <b>{t.heal ? `+${t.heal} day${t.heal > 1 ? 's' : ''}/night` : 'none'}</b></span>
                <span>Visits <b>{t.visits}</b></span>
              </div>
              {there.length > 0 && <div className="cinfo good">Here now: {there.map((p) => p.name).join(', ')}</div>}
              {crews.length > 0 && (
                <div className="tc-send">
                  {crews.map((p) => <button key={p.id} className="btn small" onClick={() => dispatch('resttown', p.id, t.id)}>Send {p.name}</button>)}
                </div>
              )}
            </section>
          );
        })}
        {!found.length && <div className="empty">No towns found yet.</div>}
      </div>
      <p className="cinfo" style={{ marginTop: 12 }}>{unknown > 0 ? `${unknown} more place${unknown > 1 ? 's' : ''} lie undiscovered. Send parties roaming to find them.` : 'You have found every settlement in this world.'}</p>
    </>
  );
}
