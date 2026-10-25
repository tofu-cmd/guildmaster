import * as THREE from 'three';
import { CPAL, TCOL, SKINS, CLOTHS, HAIRS } from '../engine/art.js';

/* Low-poly heroes built from shared primitives. The same builder feeds the live map
   and the offscreen portrait renderer, so a hero looks identical everywhere. */

const geoCache = new Map(), matCache = new Map();
const geo = (key, make) => {
  let g = geoCache.get(key);
  if (!g) { g = make(); geoCache.set(key, g); }
  return g;
};
export const mat = (color, o = {}) => {
  const key = color + JSON.stringify(o);
  let m = matCache.get(key);
  if (!m) { m = new THREE.MeshStandardMaterial({ color, roughness: 0.78, metalness: 0, flatShading: true, ...o }); matCache.set(key, m); }
  return m;
};
export const box = (w, h, d) => geo(`b${w},${h},${d}`, () => new THREE.BoxGeometry(w, h, d));
export const sph = (r, ws = 12, hs = 9) => geo(`s${r},${ws},${hs}`, () => new THREE.SphereGeometry(r, ws, hs));
export const cap = (r, t = 0.55, ws = 12, hs = 8) => geo(`c${r},${t}`, () => new THREE.SphereGeometry(r, ws, hs, 0, Math.PI * 2, 0, Math.PI * t));
export const cyl = (rt, rb, h, s = 8) => geo(`y${rt},${rb},${h},${s}`, () => new THREE.CylinderGeometry(rt, rb, h, s));
export const cone = (r, h, s = 8) => geo(`n${r},${h},${s}`, () => new THREE.ConeGeometry(r, h, s));
export const tor = (r, t, a = Math.PI * 2, s = 20) => geo(`t${r},${t},${a}`, () => new THREE.TorusGeometry(r, t, 6, s, a));

export function part(g, m, x = 0, y = 0, z = 0, parent) {
  const o = new THREE.Mesh(g, m);
  o.position.set(x, y, z);
  o.castShadow = true;
  if (parent) parent.add(o);
  return o;
}

const STEEL = { color: '#aab4bd', metalness: 0.55, roughness: 0.38 };
const steel = () => mat(STEEL.color, STEEL);
const gold = () => mat('#d4aa4f', { metalness: 0.6, roughness: 0.35 });
const wood = () => mat('#7a5530');
const leather = () => mat('#4a3322');

function weapon(cls, hand, off, torso, back, tcol) {
  const W = (g, m, x, y, z, p = hand) => part(g, m, x, y, z, p);
  switch (cls) {
    case 'warrior': {
      W(box(0.07, 0.62, 0.02), steel(), 0, 0.42, 0); W(box(0.26, 0.05, 0.06), gold(), 0, 0.1, 0); W(cyl(0.025, 0.025, 0.14), leather(), 0, 0, 0);
      W(cyl(0.2, 0.2, 0.05, 14), mat('#8a3a2c'), 0, -0.04, 0, off).rotation.z = Math.PI / 2;
      off.children[off.children.length - 1].position.set(-0.1, -0.2, 0.02);
      W(cyl(0.07, 0.07, 0.07, 10), steel(), -0.14, -0.2, 0.02, off).rotation.z = Math.PI / 2;
      break;
    }
    case 'mage': {
      W(cyl(0.022, 0.03, 1.35), wood(), 0, 0.28, 0);
      W(sph(0.085, 12, 9), mat('#7ad7ff', { emissive: '#3fc0ff', emissiveIntensity: 2.2, roughness: 0.2 }), 0, 1.0, 0);
      W(tor(0.1, 0.014), gold(), 0, 1.0, 0).rotation.x = Math.PI / 2.4;
      break;
    }
    case 'rogue': {
      W(box(0.05, 0.3, 0.015), steel(), 0, 0.22, 0); W(box(0.14, 0.03, 0.04), leather(), 0, 0.06, 0);
      W(box(0.05, 0.26, 0.015), steel(), 0, -0.2, 0.0, off).rotation.x = Math.PI;
      off.children[off.children.length - 1].position.set(0, -0.3, 0.1);
      break;
    }
    case 'cleric': {
      W(cyl(0.025, 0.03, 0.8), wood(), 0, 0.2, 0);
      W(sph(0.1, 10, 8), gold(), 0, 0.64, 0);
      W(tor(0.09, 0.016, Math.PI * 2, 14), gold(), 0, 0.2, 0, torso).position.set(0, 0.07, 0.15);
      break;
    }
    case 'ranger': {
      const bow = part(tor(0.42, 0.02, Math.PI, 20), wood(), 0, 0.1, 0, off);
      bow.rotation.set(0, Math.PI / 2, -Math.PI / 2); bow.position.set(-0.08, -0.3, 0.05);
      const str = part(cyl(0.005, 0.005, 0.84, 4), mat('#d8d0b8'), -0.08, -0.3, 0.05, off);
      str.position.set(-0.08, -0.3, 0.05);
      const q = part(cyl(0.08, 0.07, 0.36, 8), leather(), 0.0, 0.6, -0.18, back);
      q.rotation.x = 0.25;
      for (let i = 0; i < 3; i++) part(box(0.012, 0.16, 0.012), mat('#d8d0b8'), (i - 1) * 0.035, 0.28, 0, q);
      W(box(0.012, 0.26, 0.012), wood(), 0, 0.1, 0);
      break;
    }
    case 'paladin': {
      W(box(0.09, 0.62, 0.025), steel(), 0, 0.42, 0); W(box(0.3, 0.06, 0.07), gold(), 0, 0.1, 0); W(cyl(0.03, 0.03, 0.14), leather(), 0, 0, 0);
      const sh = part(cone(0.22, 0.46, 3), mat('#2f4f9a'), -0.12, -0.14, 0.04, off);
      sh.rotation.set(Math.PI, 0, Math.PI / 2 * 0); sh.scale.set(1, 1, 0.22); sh.rotation.y = Math.PI / 2;
      part(box(0.05, 0.3, 0.03), gold(), -0.14, -0.14, 0.04, off).rotation.y = 0;
      part(box(0.26, 0.05, 0.03), gold(), -0.14, -0.1, 0.04, off);
      break;
    }
    case 'bard': {
      const lute = new THREE.Group();
      part(sph(0.15, 12, 9), mat('#b7793c'), 0, 0, 0, lute).scale.set(1, 1.15, 0.5);
      part(cyl(0.012, 0.012, 0.3, 6), mat('#2b1d12'), 0, 0.3, 0, lute);
      part(box(0.07, 0.1, 0.03), mat('#2b1d12'), 0, 0.5, 0, lute);
      part(cyl(0.05, 0.05, 0.01, 10), mat('#2b1d12'), 0, 0, 0.08, lute).rotation.x = Math.PI / 2;
      lute.position.set(-0.05, 0.02, 0.17); lute.rotation.z = -0.8; torso.add(lute);
      W(box(0.01, 0.01, 0.01), wood(), 0, 0, 0);
      break;
    }
    default:
  }
}

function headgear(cls, head, pal, cloth, hairC, tcol) {
  const H = (g, m, x, y, z) => part(g, m, x, y, z, head);
  const hairBack = () => { H(box(0.3, 0.2, 0.1), mat(hairC), 0, -0.02, -0.15); };
  switch (cls) {
    case 'warrior': {
      const h = H(cap(0.235, 0.6), steel(), 0, 0.0, 0); h.rotation.x = -0.1;
      H(box(0.045, 0.16, 0.03), steel(), 0, 0.0, 0.2);
      H(box(0.05, 0.1, 0.28), mat(pal.b), 0, 0.23, -0.02);
      break;
    }
    case 'mage': {
      hairBack();
      H(cyl(0.34, 0.34, 0.03, 14), mat(pal.h), 0, 0.12, 0);
      const c = H(cone(0.21, 0.55, 8), mat(pal.h), 0, 0.42, -0.04); c.rotation.x = -0.18;
      H(cyl(0.215, 0.215, 0.06, 10), gold(), 0, 0.17, 0);
      break;
    }
    case 'rogue': {
      H(cap(0.26, 0.56), mat(pal.h), 0, 0.02, -0.04).rotation.x = -0.4;
      H(box(0.34, 0.1, 0.32), mat('#6a4a8a'), 0, -0.2, 0);
      break;
    }
    case 'cleric': {
      hairBack();
      H(cap(0.24, 0.5), mat('#e8e2d0'), 0, 0.0, -0.01).rotation.x = -0.15;
      H(tor(0.2, 0.017, Math.PI * 2, 18), gold(), 0, 0.12, 0).rotation.x = Math.PI / 2 - 0.1;
      break;
    }
    case 'ranger': {
      hairBack();
      H(cap(0.24, 0.5), mat(pal.h), 0, 0.02, 0).rotation.x = -0.15;
      H(cyl(0.3, 0.3, 0.025, 12), mat(pal.h), 0, 0.12, 0.02);
      const f = H(box(0.03, 0.04, 0.3), mat('#b0463a'), 0.16, 0.2, -0.05); f.rotation.set(0.5, 0, -0.35);
      break;
    }
    case 'paladin': {
      const h = H(cap(0.24, 0.7), steel(), 0, -0.01, 0); h.rotation.x = -0.05;
      H(box(0.2, 0.03, 0.04), mat('#16181d'), 0, 0.02, 0.21);
      H(box(0.045, 0.2, 0.03), steel(), 0, -0.05, 0.215);
      H(cone(0.05, 0.3, 6), mat(tcol, { emissive: tcol, emissiveIntensity: 0.25 }), 0, 0.33, -0.05).rotation.x = -0.25;
      break;
    }
    case 'bard': {
      hairBack();
      const b = H(sph(0.25, 12, 8), mat(pal.h), 0.03, 0.14, -0.02); b.scale.set(1, 0.42, 1.05); b.rotation.z = -0.25;
      const f = H(box(0.03, 0.04, 0.34), mat('#f3c13c'), 0.2, 0.28, -0.05); f.rotation.set(0.5, 0, -0.6);
      break;
    }
    default: break;
  }
}

/** Builds one hero. Origin is at the feet, facing +Z, about 1.35 units tall. */
export function buildHero(cls, tier = 0, look = {}) {
  const lk = look || {};
  const pal = CPAL[cls] || CPAL.warrior;
  const skin = SKINS[lk.skin || 0], cloth = CLOTHS[lk.cloth || 0] || pal.b, hairC = HAIRS[lk.hair || 0] || pal.h;
  const tcol = TCOL[tier] || TCOL[0];
  const root = new THREE.Group();
  root.name = 'hero';
  const body = new THREE.Group();
  body.name = 'body';
  root.add(body);

  const robed = cls === 'mage' || cls === 'cleric';
  for (const s of [-1, 1]) {
    const leg = new THREE.Group();
    leg.name = s < 0 ? 'legL' : 'legR';
    leg.position.set(s * 0.1, 0.38, 0);
    part(box(0.15, 0.3, 0.17), mat(robed ? '#2b2530' : '#3a3a48'), 0, -0.15, 0, leg);
    part(box(0.17, 0.11, 0.24), mat('#2a1f18'), 0, -0.33, 0.03, leg);
    body.add(leg);
  }
  if (robed) part(cyl(0.22, 0.3, 0.42, 9), mat(cloth), 0, 0.31, 0, body);

  const torso = new THREE.Group();
  torso.position.y = 0.6;
  body.add(torso);
  part(box(0.44, 0.42, 0.27), mat(cloth), 0, 0, 0, torso);
  part(box(0.46, 0.07, 0.29), leather(), 0, -0.17, 0, torso);
  part(box(0.07, 0.06, 0.02), gold(), 0, -0.17, 0.15, torso);
  if (cls === 'paladin' || cls === 'warrior') part(box(0.4, 0.2, 0.3), steel(), 0, 0.08, 0, torso);
  if (tier >= 2) part(box(0.15, 0.15, 0.02), mat(tcol, { emissive: tcol, emissiveIntensity: 0.5 }), 0, 0.06, 0.15, torso);
  if (tier >= 1) for (const s of [-1, 1]) part(sph(0.115, 8, 6), mat(tcol, { metalness: 0.4, roughness: 0.45 }), s * 0.28, 0.2, 0, torso);
  if (cls === 'rogue' || cls === 'paladin' || cls === 'mage') {
    const cape = part(box(0.4, 0.62, 0.035), mat(cls === 'rogue' ? '#2b2336' : cls === 'paladin' ? '#8aa0d8' : '#2f356e'), 0, -0.1, -0.16, torso);
    cape.rotation.x = 0.1;
  }

  const arms = {};
  for (const s of [-1, 1]) {
    const arm = new THREE.Group();
    arm.name = s < 0 ? 'armL' : 'armR';
    arm.position.set(s * 0.29, 0.17, 0);
    part(box(0.12, 0.34, 0.13), mat(cloth), 0, -0.17, 0, arm);
    part(sph(0.07, 8, 6), mat(skin), 0, -0.37, 0, arm);
    torso.add(arm);
    arms[s] = arm;
  }
  const back = new THREE.Group();
  torso.add(back);
  weapon(cls, arms[1], arms[-1], torso, back, tcol);

  const head = new THREE.Group();
  head.name = 'head';
  head.position.y = 0.97;
  part(sph(0.21, 14, 10), mat(skin), 0, 0, 0, head);
  for (const s of [-1, 1]) part(box(0.045, 0.06, 0.02), mat('#16181d'), s * 0.075, 0.0, 0.195, head);
  part(sph(0.03, 6, 5), mat(skin, { roughness: 0.9 }), 0, -0.03, 0.21, head);
  if (!['warrior', 'rogue', 'paladin'].includes(cls)) {
    const hr = part(cap(0.225, 0.52), mat(hairC), 0, 0.005, -0.015, head);
    hr.rotation.x = -0.2;
    part(box(0.05, 0.18, 0.2), mat(hairC), -0.2, -0.02, 0, head);
    part(box(0.05, 0.18, 0.2), mat(hairC), 0.2, -0.02, 0, head);
  }
  headgear(cls, head, pal, cloth, hairC, tcol);
  body.add(head);

  const ring = part(tor(0.42, 0.025, Math.PI * 2, 28), mat(tcol, { emissive: tcol, emissiveIntensity: tier ? 0.9 : 0.25, roughness: 0.4 }), 0, 0.02, 0, root);
  ring.rotation.x = Math.PI / 2;
  ring.castShadow = false;
  ring.name = 'ring';

  root.userData = { armL: arms[-1], armR: arms[1], legL: body.getObjectByName('legL'), legR: body.getObjectByName('legR'), body, head };
  return root;
}

/** Walk cycle / idle breathing. `t` is seconds, `walk` 0..1 blends between the two. */
export function poseHero(root, t, walk) {
  const u = root.userData, s = Math.sin(t * 9), idle = Math.sin(t * 1.8);
  u.legL.rotation.x = s * 0.7 * walk;
  u.legR.rotation.x = -s * 0.7 * walk;
  u.armL.rotation.x = -s * 0.6 * walk + idle * 0.03;
  u.armR.rotation.x = s * 0.5 * walk - idle * 0.03;
  u.body.position.y = Math.abs(Math.sin(t * 9)) * 0.07 * walk + idle * 0.008;
  u.head.rotation.y = Math.sin(t * 0.7) * 0.25 * (1 - walk);
}
