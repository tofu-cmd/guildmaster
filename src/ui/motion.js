const KEY = 'guildmaster-motion';

/** 'on' | 'off'. A saved choice wins; otherwise follow the device's reduced-motion setting. */
export function motionSetting() {
  try {
    const v = localStorage.getItem(KEY);
    if (v === 'on' || v === 'off') return v;
  } catch (e) { /* storage blocked */ }
  return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'off' : 'on';
}
export function applyMotion(v) {
  const val = v || motionSetting();
  document.documentElement.dataset.motion = val;
  return val;
}
export function saveMotion(v) {
  try { localStorage.setItem(KEY, v); } catch (e) { /* storage blocked */ }
  return applyMotion(v);
}
