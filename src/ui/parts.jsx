import { useEffect, useRef, useState } from 'react';
import { sprite, icon } from '../engine/art.js';
import { portrait } from '../3d/portrait.js';

export const stressCls = (s) => (s >= 75 ? 'hi' : s >= 50 ? 'mid' : '');
export const oddsClass = (c) => (c >= 0.7 ? 'good' : c >= 0.4 ? 'warn' : 'bad');

/** Pixel art is generated as trusted SVG strings by the engine. */
export function Px({ html, className = '' }) {
  return <span className={'px ' + className} dangerouslySetInnerHTML={{ __html: html }} />;
}
/** A 3D-rendered portrait; falls back to the pixel sprite when WebGL is missing. */
export function Sprite({ h, size }) {
  const url = portrait(h.cls, h.tier, h.look);
  if (!url) return <Px html={sprite(h.cls, h.tier, size, h.look)} />;
  const s = Math.round(size * 1.35);
  return <img className="portrait" src={url} width={s} height={s} alt="" draggable={false} />;
}
export const PxIcon = ({ name, size }) => <Px html={icon(name, size)} />;

const PATHS = {
  coin: (<><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.5" /></>),
  crown: <path d="M4 18h16l1.2-10-5 4-4.2-7-4.2 7-5-4z" />,
  clock: (<><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5.2l3.4 2" /></>),
  flame: <path d="M12 3c1 4.2 5 5.4 5 10.2A5 5 0 0 1 7 13.2c0-3 2.2-4 2.2-6.4 1.2.8 2.2.6 2.8-3.8z" />,
  quests: (<><path d="M7 4h11a1.5 1.5 0 0 1 1.5 1.5V19a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a1 1 0 0 1 1-1z" /><path d="M9.5 9h7M9.5 12.5h7M9.5 16h4" /></>),
  parties: <path d="M12 3l8 3v6c0 5-3.5 8-8 9.2C7.5 20 4 17 4 12V6z" />,
  roster: (<><path d="M6 3h12v17l-6-4-6 4z" /><path d="M9.5 8.5h5" /></>),
  tavern: (<><path d="M5 7h11v9a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z" /><path d="M16 9.5h1.8a2.2 2.2 0 0 1 0 4.4H16" /><path d="M8 3.5c0 1 1 1 1 2M12 3.5c0 1 1 1 1 2" /></>),
  guild: (<><path d="M5 21V9l2-2V4h2v2h6V4h2v3l2 2v12z" /><path d="M10 21v-5h4v5" /></>),
  ledger: (<><path d="M5 4h10.5A2.5 2.5 0 0 1 18 6.5V20H8a3 3 0 0 1-3-3z" /><path d="M5 17a3 3 0 0 1 3-3h10M9 8h5" /></>),
  skull: (<><path d="M5 12a7 7 0 0 1 14 0v3l-2 1.5V19H7v-2.5L5 15z" /><circle cx="9.5" cy="12" r="1.3" /><circle cx="14.5" cy="12" r="1.3" /></>),
};
export function Glyph({ name, size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {PATHS[name]}
    </svg>
  );
}

export function Pips({ d }) {
  return (
    <div className="pips" title={`Danger ${d} of 10`} role="img" aria-label={`Danger ${d} of 10`}>
      {Array.from({ length: 10 }, (_, i) => <i key={i} className={i < d ? 'on' : ''} />)}
    </div>
  );
}

export function OddsBar({ c }) {
  const p = Math.round(c * 100), k = oddsClass(c);
  return (
    <div className="odds">
      <div className="obar"><i className={k} style={{ width: p + '%' }} /></div>
      <b className={k}>{p}%</b>
    </div>
  );
}

/** A number that counts toward its new value and flashes green (gain) or red (loss). */
export function AnimatedNumber({ value, className = '' }) {
  const [shown, setShown] = useState(value);
  const [flash, setFlash] = useState('');
  const cur = useRef(value), prev = useRef(value);
  useEffect(() => {
    const to = value, from = cur.current;
    if (prev.current === to) return undefined;
    setFlash(to > prev.current ? 'up' : 'down');
    prev.current = to;
    const off = document.documentElement.dataset.motion === 'off';
    const clear = setTimeout(() => setFlash(''), 900);
    if (off) { cur.current = to; setShown(to); return () => clearTimeout(clear); }
    let raf; const t0 = performance.now(), dur = 650;
    const step = (now) => {
      const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      cur.current = Math.round(from + (to - from) * e); setShown(cur.current);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => { cancelAnimationFrame(raf); clearTimeout(clear); };
  }, [value]);
  return <b className={className + ' ' + flash}>{shown}</b>;
}
