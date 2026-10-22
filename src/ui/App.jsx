import { useEffect, useMemo, useState } from 'react';
import { RT, RANKS, TIERS, TIER_CAP, BOSS_RANK } from '../engine/data.js';
import { S, ui, dispatch, rank, rosterCap, partyCount, era } from '../engine/game.js';
import { useGame, useTick } from './hooks.js';
import { Glyph, AnimatedNumber } from './parts.jsx';
import { motionSetting, saveMotion } from './motion.js';
import { QuestsTab } from './Quests.jsx';
import { PartiesTab, RosterTab, TavernTab, GuildTab } from './Tabs.jsx';
import LedgerTab from './Ledger.jsx';
import Create from './Create.jsx';
import ModalHost from './Modals.jsx';

function DayMeter() {
  useTick();
  return <div className="daymeter" title="Progress through the current day"><i style={{ width: ui.frac * 100 + '%' }} /></div>;
}

function Deck() {
  const live = ui.mode === 'live';
  const tabs = [
    ['quests', 'Quests', S.board.length],
    ['parties', 'Parties', S.parties.length],
    ['roster', 'Roster', S.heroes.length, S.heroes.filter((h) => h.unread).length],
    ['tavern', 'Tavern', null],
    ['guild', 'Guild', null],
    ['ledger', 'Ledger', null],
  ];
  return (
    <header className="deck">
      <div className="deck-in">
        <div className="command">
          <div className="brand"><div className="wordmark">Guildmaster</div><div className="subtitle">Guild Command · <b>The Ember Crown</b></div></div>
          <div className="chip"><Glyph name="clock" size={20} /><div><small>Day</small><b key={S.day} className="tick">{S.day}</b></div></div>
          <div className="chip"><Glyph name="coin" size={20} /><div><small>Gold</small><AnimatedNumber value={S.gold} className={S.gold < 0 ? 'neg' : ''} /></div></div>
          <div className="ctl">
            {live
              ? (
                <div className="speed" role="group" aria-label="Game speed">
                  {[['0', 'Pause'], ['1', '1x'], ['2', '2x'], ['4', '4x']].map(([a, label]) => (
                    <button key={a} className={(ui.paused ? '0' : String(ui.speed)) === a ? 'on' : ''} aria-pressed={(ui.paused ? '0' : String(ui.speed)) === a} onClick={() => dispatch('speed', a)}>{label}</button>
                  ))}
                </div>
              )
              : <button className={'btn primary' + (!ui.advancing && !ui.modal ? ' idle' : '')} disabled={ui.advancing} onClick={() => dispatch('endday')}>End Day ▸</button>}
            <div className="modeswitch" role="group" aria-label="Time mode">
              <button className={!live ? 'on' : ''} aria-pressed={!live} onClick={() => { if (live) dispatch('mode'); }}>Manual</button>
              <button className={live ? 'on' : ''} aria-pressed={live} onClick={() => { if (!live) dispatch('mode'); }}>Live</button>
            </div>
          </div>
          <DayMeter />
        </div>
        <nav className="rail" aria-label="Sections">
          {tabs.map((t) => (
            <button key={t[0]} className={'rbtn' + (ui.tab === t[0] ? ' on' : '')} aria-current={ui.tab === t[0] ? 'page' : undefined} onClick={() => dispatch('tab', t[0])}>
              <Glyph name={t[0]} size={19} />
              <span>{t[1]}</span>
              {t[2] !== null && <span className="cnt">{t[2]}</span>}
              {t[3] > 0 && <span className="dot" title="New journal entry" aria-label="New journal entry" />}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}

function CrisisBar() {
  const c = S.board.find((x) => x.crisis), m = S.parties.find((p) => p.mission && p.mission.quest.crisis);
  if (c) {
    return (
      <div className={'crisisbar' + (c.expires <= 5 ? ' hot' : '')} role="alert">
        <span><b>CRISIS:</b> {c.title}. <b>{c.expires} days</b> left to send a party.</span>
        <button className="btn small" onClick={() => dispatch('tab', 'quests')}>View</button>
      </div>
    );
  }
  if (m) return <div className="crisisbar"><span><b>CRISIS:</b> {m.name} is facing "{m.mission.quest.title}". If they fail, the guild is lost.</span></div>;
  return null;
}

function Status() {
  const r = rank(), next = RT[r + 1], pct = next ? ((S.renown - RT[r]) / (next - RT[r])) * 100 : 100;
  const dmin = Math.min(8, 1 + r), dmax = Math.min(10, 3 + r);
  let unlock = null;
  if (next) {
    const bits = [];
    if (TIER_CAP[r + 1] > TIER_CAP[r]) bits.push(`${TIERS[TIER_CAP[r + 1]].n} heroes`);
    bits.push(`danger ${Math.min(8, 2 + r)}–${Math.min(10, 4 + r)} quests`, '+2 roster slots');
    if (partyCount() < 2 + Math.floor((r + 1) / 2)) bits.push('a new party');
    if (r + 1 === BOSS_RANK) bits.push('the final quest');
    unlock = <div className="unlock">Rank {RANKS[r + 1].l} unlocks: <b>{bits.join(', ')}</b></div>;
  }
  return (
    <section className="status" aria-label="Guild status">
      <div key={r} className="seal fresh" aria-label={`Rank ${RANKS[r].l}`}>{RANKS[r].l}</div>
      <div>
        {S.guildName && <div className="gname">{S.guildName}</div>}
        <div className="rname">{RANKS[r].n}</div>
        <div className="renown" title="Renown"><i style={{ width: pct + '%' }} /></div>
        <div className="cinfo">{S.renown}{next ? ` / ${next}` : ''} renown{next ? '' : ' (max rank)'}</div>
      </div>
      <div className="plaques">
        <div className="plaque era" title={era().d}><small>Era</small><b>{era().n}</b></div>
        <div className="plaque"><small>Quest danger now</small><b>{dmin}–{dmax}</b></div>
        <div className="plaque"><small>Best heroes in tavern</small><b>{TIERS[TIER_CAP[r]].n}</b></div>
        <div className="plaque"><small>Roster</small><b>{S.heroes.length}/{rosterCap()}</b></div>
        <div className="plaque"><small>Record</small><b>{S.stats.won}W {S.stats.lost}L</b></div>
      </div>
      {unlock}
    </section>
  );
}

function Main() {
  const tab = { quests: QuestsTab, parties: PartiesTab, roster: RosterTab, tavern: TavernTab, guild: GuildTab, ledger: LedgerTab }[ui.tab] || QuestsTab;
  const Tab = tab;
  return (
    <>
      <Deck />
      <main className="wrap">
        <CrisisBar />
        <Status />
        <div key={ui.tab} className="tabpane"><Tab /></div>
        <section className="news">
          <div className="sect"><h2>Recent news</h2></div>
          <ol>{S.log.slice(0, 6).map((l, i) => <li key={i}><span>Day {l.d}</span>{l.t}</li>)}</ol>
          <button className="btn small" style={{ marginTop: 10 }} onClick={() => dispatch('tab', 'ledger')}>Open the full ledger</button>
        </section>
        <div className="foot">
          <MotionSwitch />
          <button className="btn small" onClick={() => dispatch('hardcore')}>Heroes can die: {S.hardcore ? 'ON' : 'OFF'}</button>
          <button className="btn small" onClick={() => dispatch('mode')}>Time: {ui.mode === 'live' ? 'Live' : 'Manual (End Day)'}</button>
          <button className="btn small" onClick={() => dispatch('help')}>How to play</button>
          <button className="btn small" onClick={() => dispatch('legacy')}>Legacy</button>
          <button className="btn small" onClick={() => dispatch('retire')}>Retire run</button>
        </div>
      </main>
    </>
  );
}

function MotionSwitch() {
  const [m, setM] = useState(motionSetting());
  return (
    <button className="btn small" aria-pressed={m === 'on'} onClick={() => setM(saveMotion(m === 'on' ? 'off' : 'on'))}>
      Animations: {m === 'on' ? 'On' : 'Off'}
    </button>
  );
}

/** A few slow embers drifting up behind the interface. */
function Embers() {
  const sparks = useMemo(() => Array.from({ length: 16 }, (_, i) => ({
    left: (i * 37 + 11) % 100, s: 2 + (i % 4), d: 14 + ((i * 7) % 11), w: -((i * 5) % 17), dx: ((i % 2 ? 1 : -1) * (14 + ((i * 3) % 40))), o: 0.35 + (i % 4) * 0.12,
  })), []);
  return (
    <div className="embers" aria-hidden="true">
      {sparks.map((p, i) => <i key={i} style={{ left: p.left + '%', '--s': p.s + 'px', '--d': p.d + 's', '--w': p.w + 's', '--dx': p.dx + 'px', '--o': p.o }} />)}
    </div>
  );
}

function Toasts() {
  return (
    <div className="toasts" aria-live="polite">
      {ui.toasts.map((t) => <div key={t.id} className={'toast ' + t.k}>{t.t}</div>)}
    </div>
  );
}

export default function App() {
  useGame();
  useEffect(() => { window.scrollTo(0, 0); }, [S.setup]);
  return (
    <>
      <Embers />
      {S.setup ? <Create /> : <Main />}
      <ModalHost />
      <Toasts />
    </>
  );
}
