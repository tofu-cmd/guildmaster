import { useEffect, useRef, useState } from 'react';
import {
  STATS, SL, CLASSES, TIERS, RANKS, BOSSES, PERKS, CHAPTERS, repTier, alignTitle, fillStory,
} from '../engine/data.js';
import {
  S, M, ui, dispatch, bump, hero, party, members, unavailable, chance, rosterCap, rank, perk, bl,
  calcLegacy, deathChance, reliefOpts,
} from '../engine/game.js';
import HeroCard from './HeroCard.jsx';
import { OddsBar } from './parts.jsx';

const FOCUSABLE = 'button:not([disabled]), input, [href], [tabindex]:not([tabindex="-1"])';

function Shell({ dismiss = true, dark, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const prev = document.activeElement;
    if (ref.current) ref.current.focus();
    return () => { if (prev && prev.focus && document.contains(prev)) prev.focus(); };
  }, []);
  const onKey = (e) => {
    if (e.key === 'Escape' && dismiss) { e.stopPropagation(); dispatch('close'); }
    if (e.key === 'Tab' && ref.current) {
      const els = [...ref.current.querySelectorAll(FOCUSABLE)];
      if (!els.length) return;
      const first = els[0], last = els[els.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  };
  return (
    <div className="back" onClick={(e) => { if (dismiss && e.target === e.currentTarget) dispatch('backdrop'); }}>
      <div className={'modal' + (dark ? ' dark' : '')} role="dialog" aria-modal="true" aria-labelledby="modal-title" tabIndex={-1} ref={ref} onKeyDown={onKey}>
        {children}
      </div>
    </div>
  );
}

/** Closes the modal if the thing it points at has gone away. */
function useCloseWhen(cond) { useEffect(() => { if (cond) dispatch('close'); }, [cond]); }

const Title = ({ children }) => <h2 id="modal-title">{children}</h2>;
const sign = (n) => (n > 0 ? '+' : '');

function Intro() {
  return (
    <Shell>
      <Title>Welcome, Guildmaster</Title>
      <ol className="steps">
        <li><b>Hire heroes</b> in the Tavern. Each has a class, rarity and quirks, good and bad. Wages come out every day.</li>
        <li><b>Build parties</b> of up to 4. Different classes boost your odds. A Cleric keeps people alive.</li>
        <li><b>Send a party on a quest</b> by tapping a pin on the map or using the board. Press <b>End Day</b> to move time forward. Parties walk the roads, and each day something happens, solved on its own by whoever in the party is best suited. Class mix matters. Prefer real time? Switch "Time" at the bottom of the page to Live.</li>
        <li><b>Watch stress.</b> Fear builds up. At 100 a hero breaks: afflicted, or rarely, heroic. Use the Relax button on the Roster tab to calm them down.</li>
        <li><b>Build their legends.</b> Wins raise a hero’s reputation and losses lower it. As they finish quests, chapters of their backstory write themselves, shaped by how they are regarded. Read it all in each hero’s Journal, on the Roster tab.</li>
        <li><b>Answer crises.</b> Now and then, a red crisis quest appears with a 25-day deadline. If it expires unanswered, or your party fails it, your guild is lost. A banner at the top counts the days down.</li>
        <li><b>Grow the guild.</b> Win quests for renown and rank. Spend gold on upgrades in the Guild tab. Stronger heroes come knocking.</li>
        <li><b>Reach Rank S</b> and the final boss awakens. Slay it to win the run. Every run, win or lose, earns Legacy points that unlock perks and new classes for the next run.</li>
      </ol>
      <p className="mute">Your first heroes are already in Party 1. Try a Danger 1 quest.</p>
      <div className="mact"><button className="btn primary" onClick={() => dispatch('close')}>Let’s go</button></div>
    </Shell>
  );
}

function Assign({ m }) {
  const q = S.board.find((x) => x.id == m.qid);
  useCloseWhen(!q);
  if (!q) return null;
  const rows = S.parties.map((p) => {
    const ms = members(p);
    const why = p.mission ? 'Out on a quest' : !ms.length ? 'Has no heroes' : ms.some(unavailable) ? 'Hero injured or resting' : '';
    return { p, ms, why, c: chance(ms, q) };
  });
  const open = rows.filter((r) => !r.why);
  const best = Math.max(...open.map((r) => r.c), -1);
  return (
    <Shell>
      <Title>{q.title}</Title>
      <p className="mute">Danger {q.d} · {q.type} · {q.gold} gold, {q.renown} renown, {q.days} days. Needs {STATS.filter((s) => q.w[s]).sort((a, b) => q.w[b] - q.w[a]).map((s) => SL[s]).join(', ')}.</p>
      <div className="stack">
        {rows.map((r) => (
          <div className="arow" key={r.p.id}>
            <div className="top">
              <b>{r.p.name}</b>
              {r.why ? <span className="pill">{r.why}</span>
                : <button className="btn small primary" onClick={() => dispatch('send', q.id, r.p.id)}>{r.c === best && open.length > 1 ? 'Send (best odds)' : 'Send'}</button>}
            </div>
            <div className="names">{r.ms.length ? r.ms.map((h) => `${h.name.split(' ')[0]} (${CLASSES[h.cls].n}, stress ${h.stress})`).join(', ') : 'Nobody assigned'}</div>
            {r.ms.length > 0 && <OddsBar c={r.c} />}
          </div>
        ))}
      </div>
      {q.crisis && <p className="bad"><b>This is a crisis.</b> If this party fails, the guild is lost. Send your strongest and check their stress first.</p>}
      <p className="cinfo">
        Odds start here and move with what happens on the road.
        {S.hardcore
          ? ` If the quest fails, each hero risks death: about ${Math.round(deathChance(q, false, false) * 100)}%, or ${Math.round(deathChance(q, true, false) * 100)}% with a Cleric. A crushing defeat is worse.`
          : ' Heroes cannot die right now (see the toggle at the bottom).'}
      </p>
      <div className="mact"><button className="btn" onClick={() => dispatch('tab', 'parties')}>Edit parties</button><button className="btn" onClick={() => dispatch('close')}>Cancel</button></div>
    </Shell>
  );
}

function AddMember({ m }) {
  const p = party(m.pid);
  useCloseWhen(!p);
  if (!p) return null;
  const free = S.heroes.filter((h) => !h.party).sort((a, b) => b.tier - a.tier);
  return (
    <Shell>
      <Title>Add to {p.name}</Title>
      {free.length
        ? <div className="stack">{free.map((h) => <HeroCard key={h.id} h={h} compact extra={<button className="btn small primary" onClick={() => dispatch('addhero', p.id, h.id)}>Add</button>} />)}</div>
        : <div className="empty">Every hero is already in a party. Hire someone in the Tavern or remove a hero from another party.</div>}
      <div className="mact"><button className="btn" onClick={() => dispatch('close')}>Done</button></div>
    </Shell>
  );
}

function Relax({ m }) {
  const h = hero(m.hid);
  useCloseWhen(!h);
  if (!h) return null;
  return (
    <Shell>
      <Title>Relax</Title>
      <HeroCard h={h} compact />
      <div className="stack">
        {reliefOpts(h).map((o) => (
          <button key={o.id} className="opt" disabled={S.gold < o.cost} onClick={() => dispatch('relief', h.id, o.id)}>
            <span><b>{o.n}</b><br /><span className="cinfo">{o.d} Stress -{o.amt}. Unavailable for one day.</span></span>
            <small>{o.cost ? o.cost + ' gold' : 'Free'}</small>
          </button>
        ))}
      </div>
      {!bl('chapel') && <p className="cinfo">Build a Chapel in the Guild tab for stronger relief.</p>}
      <div className="mact"><button className="btn" onClick={() => dispatch('close')}>Cancel</button></div>
    </Shell>
  );
}

function Report({ m }) {
  return (
    <Shell dismiss={false}>
      <Title>Day {S.day - 1} report</Title>
      <ul className="ev">
        {m.ev.length ? m.ev.map((e, i) => <li key={i} className={e.k}>{e.t}</li>) : <li>A quiet day.</li>}
      </ul>
      <div className="mact"><button className="btn primary" onClick={() => dispatch('next')}>Continue</button></div>
    </Shell>
  );
}

function Offer() {
  const o = S.offers[0];
  useCloseWhen(!o);
  if (!o) return null;
  const h = o.hero, full = S.heroes.length >= rosterCap();
  return (
    <Shell dismiss={false}>
      <Title>A visitor at the door</Title>
      <p><b className={'hname t' + h.tier} style={{ display: 'inline', color: `var(--t${h.tier})` }}>{h.name}</b>, a {TIERS[h.tier].n} {CLASSES[h.cls].n}, {o.why}</p>
      <HeroCard h={h} open />
      {full && <p className="bad">Your roster is full. Release someone from the Roster tab first, or turn them away.</p>}
      <div className="mact"><button className="btn" onClick={() => dispatch('decline')}>Turn away</button><button className="btn primary" disabled={full} onClick={() => dispatch('accept')}>Welcome them</button></div>
    </Shell>
  );
}

function Dossier({ m }) {
  const h = hero(m.hid);
  const [fresh] = useState(() => (h ? h.unread || 0 : 0));
  const [tab0] = useState(() => m.tab || (h && h.unread ? 'journal' : 'story'));
  const tab = m.tab || tab0;
  useCloseWhen(!h);
  useEffect(() => { if (h && tab === 'journal' && h.unread) { h.unread = 0; bump(); } });
  if (!h) return null;
  const rt = repTier(h.rep || 0), unread = h.unread || 0, jr = (h.journal || []).slice().reverse();
  return (
    <Shell>
      <Title>{h.name}</Title>
      <HeroCard h={h} open />
      <p className="cinfo">
        Reputation: <b className={rt.cls}>{rt.n}</b> ({sign(h.rep || 0)}{h.rep || 0}) · Leaning: <b>{alignTitle(h)}</b> · {h.quests || 0} quests finished. Wins raise reputation and losses lower it. Backstory chapters write themselves as heroes finish quests, and lean on how the hero is regarded.
      </p>
      <div className="mtabs">
        <button className={'mtab' + (tab === 'story' ? ' on' : '')} onClick={() => dispatch('dtab', 'story')}>Backstory</button>
        <button className={'mtab' + (tab === 'journal' ? ' on' : '')} onClick={() => dispatch('dtab', 'journal')}>Journal{unread && tab !== 'journal' ? ` (${unread} new)` : ''}</button>
      </div>
      <div className="stack">
        {tab === 'journal'
          ? (jr.length ? jr.map((j, i) => (
            <div key={i} className={'jent' + (j.k === 'story' ? ' story' : '') + (i < fresh ? ' fresh' : '')}>
              <div className="jday">Day {j.d}{j.k === 'story' ? ' · Chapter' : j.k === 'quest' ? ' · Quest' : ''}</div>
              <p>{j.t}</p>
            </div>
          )) : <div className="empty">Nothing written yet. Entries appear as this hero quests.</div>)
          : CHAPTERS.map((C, i) => {
            const s = h.story[i];
            if (s) {
              const o = C.o[s.o];
              return (
                <div className="chap" key={i}>
                  <div className="chead">Chapter {i + 1}: {C.n} — {o.l}</div>
                  <p>{fillStory(o.s, h)}</p>
                  <div className="cinfo">Trait: <b>{o.t}</b>. {o.d}</div>
                </div>
              );
            }
            return <div className="chap lock" key={i}>Chapter {i + 1}: ??? Unlocks after {C.at} finished quest{C.at > 1 ? 's' : ''} ({Math.min(h.quests || 0, C.at)}/{C.at}). It writes itself.</div>;
          })}
      </div>
      <div className="mact"><button className="btn" onClick={() => dispatch('close')}>Close</button></div>
    </Shell>
  );
}

function Victory() {
  const B = BOSSES[S.boss];
  return (
    <Shell dismiss={false} dark>
      <Title>{B.n} is slain</Title>
      <p>You led the guild from a ragged tavern to the end of the age. This run was won on day {S.day - 1}, at Rank {RANKS[rank()].l}, with {S.stats.won} quests completed.</p>
      <p>Retiring now earns <b className="good">{calcLegacy()} legacy points</b> for your next run. You can also keep playing and retire later.</p>
      <div className="mact"><button className="btn" onClick={() => dispatch('close')}>Keep playing</button><button className="btn primary" onClick={() => dispatch('claim')}>Retire and claim legacy</button></div>
    </Shell>
  );
}

function Retire() {
  return (
    <Shell>
      <Title>Retire this run?</Title>
      <p>You will earn <b className="good">{calcLegacy()} legacy points</b> and start a fresh guild. This guild is lost.</p>
      <div className="mact"><button className="btn" onClick={() => dispatch('close')}>Keep playing</button><button className="btn danger" onClick={() => dispatch('claim')}>Retire</button></div>
    </Shell>
  );
}

function Legacy({ m }) {
  return (
    <Shell dismiss={!m.between} dark>
      <Title>Legacy</Title>
      <p>Spendable points: <b className="good">{M.legacy}</b>{S.gain && m.between ? ` (you just earned ${S.gain})` : ''}. Perks carry into every future run.</p>
      <div className="stack">
        {PERKS.map((p) => {
          const lv = perk(p.id), max = p.cost.length, cost = p.cost[lv];
          return (
            <div className="arow" key={p.id}>
              <div className="top"><b>{p.n}</b><span className="bpips">{p.cost.map((_, i) => <i key={i} className={i < lv ? 'on' : ''} />)}</span></div>
              <div className="cinfo">{p.d}</div>
              {lv < max
                ? <div><button className="btn small primary" disabled={M.legacy < cost} onClick={() => dispatch('buyperk', p.id)}>Buy for {cost}</button></div>
                : <div className="cinfo good">Owned</div>}
            </div>
          );
        })}
      </div>
      {M.hall.length > 0 && (
        <div className="cinfo"><b>Hall of Legends:</b><br />
          {M.hall.slice(0, 8).map((x, i) => (
            <span key={i}>{x.name}, {TIERS[x.tier].n} {CLASSES[x.cls] ? CLASSES[x.cls].n : ''} · {x.title}, {repTier(x.rep).n}{x.fell ? ' (fell in service)' : ''}{x.traits.length ? ' · ' + x.traits.join(', ') : ''}<br /></span>
          ))}
        </div>
      )}
      {M.runs.length > 0 && (
        <div className="cinfo"><b>Past runs:</b><br />
          {M.runs.slice(0, 5).map((r, i) => <span key={i}>{r.vic ? 'Victory' : 'Fell'} · day {r.day} · Rank {r.rank} · {r.won} quests · {r.era} · +{r.gain}<br /></span>)}
        </div>
      )}
      <div className="mact">{m.between ? <button className="btn primary" onClick={() => dispatch('begin')}>Begin a new run</button> : <button className="btn" onClick={() => dispatch('close')}>Close</button>}</div>
    </Shell>
  );
}

function NewGame() {
  return (
    <Shell>
      <Title>Start over?</Title>
      <p>This ends your current guild and starts a new one. You keep the legacy points this run has earned ({calcLegacy()}).</p>
      <div className="mact"><button className="btn" onClick={() => dispatch('close')}>Keep playing</button><button className="btn danger" onClick={() => dispatch('claim')}>End run and restart</button></div>
    </Shell>
  );
}

function Over() {
  return (
    <Shell dismiss={false} dark>
      <Title>The guild has fallen</Title>
      {S.overReason && <p className="bad">{S.overReason}</p>}
      <p>You lasted {S.day - 1} days, won {S.stats.won} quests, lost {S.stats.lost}, and reached Rank {RANKS[rank()].l}. {S.stats.fallen} heroes died in your service.</p>
      <p>This run earns <b className="good">{calcLegacy()} legacy points</b>.</p>
      <div className="mact"><button className="btn primary" onClick={() => dispatch('claim')}>Claim legacy and continue</button></div>
    </Shell>
  );
}

export default function ModalHost() {
  const m = ui.modal;
  if (!m) return null;
  switch (m.type) {
    case 'intro': return <Intro key="intro" />;
    case 'assign': return <Assign key={'a' + m.qid} m={m} />;
    case 'addmember': return <AddMember key={'m' + m.pid} m={m} />;
    case 'relax': return <Relax key={'r' + m.hid} m={m} />;
    case 'report': return <Report key={'rep' + S.day} m={m} />;
    case 'offer': return <Offer key={'o' + S.offers.length} />;
    case 'dossier': return <Dossier key={'d' + m.hid} m={m} />;
    case 'victory': return <Victory key="v" />;
    case 'retire': return <Retire key="ret" />;
    case 'legacy': return <Legacy key="leg" m={m} />;
    case 'newgame': return <NewGame key="ng" />;
    case 'over': return <Over key="over" />;
    default: return null;
  }
}
