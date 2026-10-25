import * as THREE from 'three';
import { mat, box, cyl, cone, sph, part } from './heroModel.js';

const WALL = ['#a58a64', '#9a7d58', '#b39a74', '#8f7552'];
const ROOF = ['#9c4a34', '#7d3b2c', '#a85a36', '#6e4a38'];
const stone = () => mat('#7c766c', { roughness: 0.9 });
const glow = (c = '#ffc46b', i = 1.8) => mat(c, { emissive: c, emissiveIntensity: i, roughness: 0.4 });
const rnd = (seed) => { let s = (seed * 9301 + 49297) % 233280; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; };
const pyramid = (r, h) => cone(r, h, 4);

function house(r, w = 1, d = 1, h = 0.55) {
  const g = new THREE.Group();
  const wall = mat(WALL[Math.floor(r() * WALL.length)]), roof = mat(ROOF[Math.floor(r() * ROOF.length)]);
  part(box(w, h, d), wall, 0, h / 2, 0, g);
  const rf = part(pyramid(Math.max(w, d) * 0.82, 0.55), roof, 0, h + 0.27, 0, g);
  rf.rotation.y = Math.PI / 4; rf.scale.set(w / Math.max(w, d), 1, d / Math.max(w, d));
  part(box(0.16, 0.28, 0.03), mat('#3a2616'), 0, 0.14, d / 2 + 0.01, g);
  part(box(0.14, 0.14, 0.03), glow('#ffc46b', 1.6), w * 0.28, h * 0.62, d / 2 + 0.01, g);
  part(box(0.14, 0.14, 0.03), glow('#ffc46b', 1.6), -w * 0.28, h * 0.62, d / 2 + 0.01, g);
  if (r() < 0.6) part(box(0.12, 0.3, 0.12), stone(), w * 0.25, h + 0.35, -d * 0.15, g);
  return g;
}

function lantern(g, x, z) {
  part(cyl(0.015, 0.02, 0.5, 5), mat('#2a2018'), x, 0.25, z, g);
  part(sph(0.05, 7, 5), glow('#ffb454', 3), x, 0.52, z, g).castShadow = false;
}

/** A settlement: hamlet (few cottages), village, or town with a temple and wall. */
export function buildTown(kind, seed, id) {
  const r = rnd(seed + id * 17), g = new THREE.Group();
  const n = kind === 'town' ? 9 : kind === 'village' ? 6 : 3;
  part(cyl(1.55, 1.7, 0.06, 18), mat('#6d5a3c', { roughness: 1 }), 0, 0.01, 0, g).castShadow = false;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + r() * 0.5, rad = (kind === 'town' ? 0.65 : 0.5) + r() * 0.65;
    const h = house(r, 0.55 + r() * 0.45, 0.55 + r() * 0.35, 0.4 + r() * 0.3);
    h.position.set(Math.cos(a) * rad, 0.03, Math.sin(a) * rad);
    h.rotation.y = -a + Math.PI / 2 + (r() - 0.5) * 0.6;
    g.add(h);
  }
  const inn = house(r, 1.0, 0.8, 0.62);
  inn.position.set(0, 0.03, 0.15); inn.scale.setScalar(1.05); g.add(inn);
  part(box(0.03, 0.3, 0.03), mat('#3a2616'), 0.55, 0.45, 0.58, g);
  part(box(0.26, 0.17, 0.03), mat('#c9a24a'), 0.55, 0.62, 0.58, g);
  if (kind === 'town') {
    const t = new THREE.Group();
    part(box(0.5, 1.3, 0.5), stone(), 0, 0.65, 0, t);
    part(pyramid(0.45, 0.6), mat('#3d5a73'), 0, 1.6, 0, t).rotation.y = Math.PI / 4;
    part(box(0.14, 0.2, 0.03), glow('#ffd88a', 2), 0, 1.1, 0.26, t);
    t.position.set(-0.95, 0.03, -0.6); g.add(t);
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      part(box(0.5, 0.3, 0.08), stone(), Math.cos(a) * 1.6, 0.15, Math.sin(a) * 1.6, g).rotation.y = -a + Math.PI / 2;
    }
  }
  lantern(g, 0.9, 0.9); lantern(g, -0.9, 0.7); if (kind !== 'hamlet') lantern(g, 0.3, -1.0);
  return g;
}

/** The player's guild hall: a keep with four towers and a red banner. */
export function buildGuild() {
  const g = new THREE.Group();
  part(cyl(2.9, 3.1, 0.08, 24), mat('#6a5a46', { roughness: 1 }), 0, 0.02, 0, g).castShadow = false;
  const keep = new THREE.Group();
  part(box(2.0, 1.3, 1.7), stone(), 0, 0.65, 0, keep);
  for (let i = -4; i <= 4; i++) { part(box(0.14, 0.14, 0.14), stone(), i * 0.24, 1.37, 0.82, keep); part(box(0.14, 0.14, 0.14), stone(), i * 0.24, 1.37, -0.82, keep); }
  part(box(0.9, 0.8, 1.4), mat('#8a6a3a'), 0, 1.6, 0, keep);
  part(pyramid(1.05, 0.9), mat('#a4372c'), 0, 2.45, 0, keep).rotation.y = Math.PI / 4;
  part(box(0.5, 0.75, 0.06), mat('#241811'), 0, 0.38, 0.86, keep);
  part(box(0.4, 0.2, 0.06), glow('#ffc46b', 2.2), 0, 1.55, 0.72, keep);
  g.add(keep);
  for (const [sx, sz] of [[-1.35, -1.1], [1.35, -1.1], [-1.35, 1.1], [1.35, 1.1]]) {
    part(cyl(0.34, 0.4, 1.5, 10), stone(), sx, 0.75, sz, g);
    part(cone(0.46, 0.65, 10), mat('#a4372c'), sx, 1.82, sz, g);
    part(box(0.07, 0.14, 0.03), glow('#ffc46b', 2), sx, 1.1, sz + 0.38, g);
  }
  part(cyl(0.02, 0.02, 1.0, 5), mat('#3a2616'), 0, 3.2, 0, g);
  const flag = part(box(0.62, 0.38, 0.02), mat('#c2362b', { emissive: '#5a1008', emissiveIntensity: 0.4 }), 0.33, 3.5, 0, g);
  flag.name = 'flag';
  part(cyl(0.07, 0.07, 0.02, 8), gold2(), 0.33, 3.5, 0.02, g).rotation.x = Math.PI / 2;
  const fire = new THREE.Group();
  part(cone(0.16, 0.5, 6), glow('#ff7a2e', 3.5), 0, 0.25, 0, fire).castShadow = false;
  part(cone(0.1, 0.4, 6), glow('#ffd070', 4), 0, 0.22, 0, fire).castShadow = false;
  for (let i = 0; i < 5; i++) part(box(0.4, 0.07, 0.07), mat('#4a3322'), 0, 0.04, 0, fire).rotation.y = (i / 5) * Math.PI;
  fire.position.set(1.7, 0.05, 1.95); fire.name = 'fire'; g.add(fire);
  return g;
}
const gold2 = () => mat('#d4aa4f', { metalness: 0.6, roughness: 0.35 });

/** A quest site with no quest on it: a ring of standing stones. */
export function buildRuin(seed) {
  const r = rnd(seed), g = new THREE.Group();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + r() * 0.3, h = 0.4 + r() * 0.45;
    const s = part(box(0.2 + r() * 0.12, h, 0.16), stone(), Math.cos(a) * 0.6, h / 2, Math.sin(a) * 0.6, g);
    s.rotation.set((r() - 0.5) * 0.25, a, (r() - 0.5) * 0.2);
  }
  part(cyl(0.9, 0.95, 0.05, 12), mat('#4a4338', { roughness: 1 }), 0, 0.01, 0, g).castShadow = false;
  part(sph(0.07, 6, 5), glow('#e1a04b', 1.2), 0, 0.15, 0, g).castShadow = false;
  return g;
}

/** The final boss lair. */
export function buildThrone() {
  const g = new THREE.Group();
  const dark = mat('#2a2230', { roughness: 0.8 });
  part(cyl(1.5, 1.8, 0.35, 8), dark, 0, 0.17, 0, g);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2, h = 1.6 + (i % 2) * 0.8;
    part(cone(0.22, h, 5), dark, Math.cos(a) * 0.85, h / 2 + 0.3, Math.sin(a) * 0.85, g);
  }
  part(cone(0.35, 2.8, 6), dark, 0, 1.7, 0, g);
  part(sph(0.22, 12, 9), glow('#ff3b2e', 3.5), 0, 3.3, 0, g);
  return g;
}

/** A quest marker: pole, pennant and a hovering gem. */
export function buildPin(hot) {
  const g = new THREE.Group();
  const c = hot ? '#dc4a32' : '#e1a04b';
  part(cyl(0.025, 0.03, 1.3, 6), mat('#3a2616'), 0, 0.65, 0, g);
  part(box(0.46, 0.28, 0.02), mat(c, { emissive: c, emissiveIntensity: 0.35 }), 0.24, 1.15, 0, g);
  const gem = part(new THREE.OctahedronGeometry(0.13), glow(c, 2.6), 0, 1.55, 0, g);
  gem.name = 'gem'; gem.castShadow = false;
  return g;
}

/** Hidden landmarks, shown once a party stumbles on them. */
export function buildLandmark(kind, seed) {
  const g = new THREE.Group(), r = rnd(seed);
  const rune = glow('#7ad7ff', 2.4), flame = glow('#ffb454', 3);
  part(cyl(0.9, 1.0, 0.05, 12), mat('#4a4338', { roughness: 1 }), 0, 0.01, 0, g).castShadow = false;
  switch (kind) {
    case 'obelisk':
      part(box(0.5, 2.4, 0.5), mat('#3d3a44', { roughness: 0.7 }), 0, 1.2, 0, g);
      part(pyramid(0.36, 0.5), mat('#3d3a44'), 0, 2.65, 0, g).rotation.y = Math.PI / 4;
      for (let i = 0; i < 4; i++) part(box(0.08, 0.14, 0.02), rune, 0, 0.7 + i * 0.4, 0.26, g);
      break;
    case 'shrine':
      part(box(0.9, 0.18, 0.6), stone(), 0, 0.12, 0, g);
      part(box(0.5, 0.4, 0.3), stone(), 0, 0.4, 0, g);
      for (const s of [-1, 1]) part(cyl(0.07, 0.09, 0.9, 6), stone(), s * 0.5, 0.55, 0, g);
      part(cone(0.1, 0.28, 6), flame, 0, 0.74, 0, g).castShadow = false;
      break;
    case 'camp': {
      const t = part(pyramid(0.7, 0.8), mat('#8a7a5c'), -0.3, 0.4, 0, g); t.rotation.y = Math.PI / 4;
      part(box(0.28, 0.24, 0.28), mat('#6b4a2b'), 0.55, 0.12, 0.25, g);
      part(cone(0.1, 0.22, 5), flame, 0.3, 0.12, -0.35, g).castShadow = false;
      break;
    }
    case 'cave':
      part(new THREE.DodecahedronGeometry(0.9, 0), mat('#5e5448', { roughness: 1 }), 0, 0.45, 0, g).scale.set(1.3, 0.9, 1);
      part(box(0.5, 0.55, 0.3), mat('#0c0a0a'), 0, 0.28, 0.82, g);
      for (let i = 0; i < 4; i++) part(cone(0.07, 0.3 + r() * 0.2, 5), glow('#b57cef', 2.2), 0.45 + i * 0.12, 0.12, 0.5 - i * 0.15, g).castShadow = false;
      break;
    case 'tower':
      part(cyl(0.45, 0.55, 1.5, 8), stone(), 0, 0.75, 0, g);
      for (let i = 0; i < 4; i++) part(box(0.2, 0.3 + r() * 0.2, 0.16), stone(), Math.cos(i * 1.6) * 0.42, 1.6, Math.sin(i * 1.6) * 0.42, g);
      part(box(0.3, 0.3, 0.3), stone(), 0.8, 0.15, 0.5, g).rotation.y = 0.6;
      break;
    default:
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * Math.PI * 2;
        part(sph(0.09, 7, 5), glow(i % 2 ? '#f3e8d0' : '#e86a8a', 1.4), Math.cos(a) * 0.65, 0.1, Math.sin(a) * 0.65, g).scale.y = 0.7;
      }
      part(sph(0.07, 6, 5), glow('#9ff0c8', 2.6), 0, 0.5, 0, g).castShadow = false;
  }
  return g;
}
