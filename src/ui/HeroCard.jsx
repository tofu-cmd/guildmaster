import {
  STATS, SL, SS, CLASSES, TIERS, AFFL, VIRT, CHAPTERS, repTier, alignTitle,
} from '../engine/data.js';
import { ui, stat, status, Q, dispatch } from '../engine/game.js';
import { Sprite, stressCls } from './parts.jsx';

function StatGrid({ h }) {
  const vals = STATS.map((s) => stat(h, s)), mx = Math.max(...vals, 1);
  return (
    <div className="sgrid">
      {STATS.map((s, i) => (
        <div className="srow" key={s} title={SL[s]}>
          <span>{SS[s]}</span>
          <div className="sbar"><i style={{ width: (vals[i] / mx) * 100 + '%' }} /></div>
          <b>{vals[i]}</b>
        </div>
      ))}
    </div>
  );
}

function Tags({ h }) {
  return (
    <div className="tags">
      {Q(h).map((x, i) => (
        <span key={i} className={'tag ' + (x.story ? 'story' : x.pos ? 'pos' : 'neg')} title={x.d}>{x.n}</span>
      ))}
      {h.affl && <span className="tag aff" title={AFFL[h.affl].d}>{AFFL[h.affl].n}</span>}
      {h.virtue && <span className="tag vir" title={VIRT[h.virtue].d}>{VIRT[h.virtue].n}</span>}
    </div>
  );
}

function StatusPill({ h }) {
  const st = status(h);
  if (st === 'injured') return <span className="pill bad">Injured {h.injured}d</span>;
  if (st === 'resting') return <span className="pill warn">Resting</span>;
  if (st === 'questing') return <span className="pill warn">On quest</span>;
  if (st === 'roaming') return <span className="pill warn">Roaming</span>;
  return null;
}

const sign = (n) => (n > 0 ? '+' : '');

export default function HeroCard({ h, extra, compact, open }) {
  const xpNeed = 40 * h.level, rt = repTier(h.rep || 0);
  const story = h.story || [];

  if (compact) {
    return (
      <div className={`hero compact t${h.tier}`}>
        <div className="spr" title={CLASSES[h.cls].n}><Sprite h={h} size={34} /></div>
        <div style={{ minWidth: 0 }}>
          <div className="hname">{h.name}</div>
          <div className="hsub">{TIERS[h.tier].n} {CLASSES[h.cls].n} · Lv {h.level} · {h.wage}g/day</div>
          <div className="hstats">{STATS.map((s) => <span key={s}><b>{stat(h, s)}</b>{SS[s]}</span>)}</div>
          <Tags h={h} />
          <div className="rep">
            <b className={rt.cls}>{rt.n}</b> ({sign(h.rep || 0)}{h.rep || 0}){story.length ? ` · ${alignTitle(h)}` : ''}
          </div>
          <div className={'stress ' + stressCls(h.stress)} title={`Stress ${h.stress}/100. At 100 the hero breaks.`}><i style={{ width: h.stress + '%' }} /></div>
          {h.level < 12 && <div className="xp" title={`XP ${h.xp}/${xpNeed}`}><i style={{ width: Math.min(100, (h.xp / xpNeed) * 100) + '%' }} /></div>}
        </div>
        <div className="hside"><StatusPill h={h} />{extra}</div>
      </div>
    );
  }

  const exp = open || (ui.exp && ui.exp[h.id]);
  const lost = (h.quests || 0) - h.wins;
  return (
    <div className={`hero full t${h.tier}`}>
      <div className="hhead">
        <div className="spr big" title={CLASSES[h.cls].n}>
          <Sprite h={h} size={44} /><span key={h.level} className="lvl fresh" title="Level">{h.level}</span>
        </div>
        <div style={{ minWidth: 0 }}>
          <div className="hname">{h.name}</div>
          <div className="hsub">{TIERS[h.tier].n} {CLASSES[h.cls].n}{story.length ? ` · ${alignTitle(h)}` : ''}</div>
          <div className="rep"><b className={rt.cls}>{rt.n}</b> ({sign(h.rep || 0)}{h.rep || 0})</div>
        </div>
        <div><StatusPill h={h} /></div>
      </div>
      <StatGrid h={h} />
      <Tags h={h} />
      <div className="meters">
        <div><small>Stress {h.stress}/100</small><div className={'stress ' + stressCls(h.stress)}><i style={{ width: h.stress + '%' }} /></div></div>
        <div><small>{h.level < 12 ? `XP ${h.xp}/${xpNeed}` : 'Max level'}</small><div className="xp"><i style={{ width: (h.level < 12 ? Math.min(100, (h.xp / xpNeed) * 100) : 100) + '%' }} /></div></div>
      </div>
      <div className="hfacts">{h.wage}g/day · {h.quests || 0} quest{(h.quests || 0) === 1 ? '' : 's'} ({h.wins} won, {lost} lost)</div>
      {exp && (
        <div className="hdet">
          <div className="cinfo"><b>{CLASSES[h.cls].n}:</b> {CLASSES[h.cls].role}</div>
          <ul className="tdesc">
            {Q(h).map((x, i) => <li key={i}><b>{x.n}.</b> {x.d}</li>)}
            {h.affl && <li><b className="bad">{AFFL[h.affl].n}.</b> {AFFL[h.affl].d}</li>}
            {h.virtue && <li><b className="good">{VIRT[h.virtue].n}.</b> {VIRT[h.virtue].d}</li>}
          </ul>
          <div className="cinfo">
            Backstory: {story.length ? story.map((s) => CHAPTERS[s.c].o[s.o].l).join(', ') : 'nothing written yet'} ({story.length}/{CHAPTERS.length} chapters). Reputation {sign(h.rep || 0)}{h.rep || 0}.
          </div>
        </div>
      )}
      <div className="hfoot">
        {!open && <button className="btn small" onClick={() => dispatch('expand', h.id)}>{exp ? 'Hide details' : 'Details'}</button>}
        {extra}
      </div>
    </div>
  );
}
