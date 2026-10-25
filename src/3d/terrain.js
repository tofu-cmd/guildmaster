import * as THREE from 'three';
import { MAPW, MAPH } from '../engine/data.js';
import { GUILD, LOC, TOWNLOC, terrainSeedValue } from '../engine/map.js';

/** Map pixels to world units. The whole realm is about 40 x 27 units across. */
export const K = 1 / 16;
export const MARGIN = 150;
export const toWorld = (x, y, h = 0) => [x * K, h, y * K];

const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

function noiser(seed) {
  const hash = (x, y) => {
    let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(seed | 0, 1274126177);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
  const n = (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y), u = smooth(0, 1, x - xi), v = smooth(0, 1, y - yi);
    const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
  const fbm = (x, y, o = 4) => {
    let s = 0, a = 0.5, f = 1, t = 0;
    for (let i = 0; i < o; i++) { s += a * n(x * f, y * f); t += a; a *= 0.5; f *= 2; }
    return s / t;
  };
  return { n, fbm };
}
function lcg(seed) {
  let s = (seed % 2147483646) + 1;
  return () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
}

/** Every place the map must keep dry and level: the guild, quest sites and towns. */
export function siteList(world) {
  const sites = [{ x: GUILD.x, y: GUILD.y, r: 42, k: 'guild' }, { x: GUILD.x, y: GUILD.y + 64, r: 34, k: 'yard' }];
  Object.keys(LOC).forEach((n) => sites.push({ x: LOC[n].x, y: LOC[n].y, r: 17, k: 'place', n }));
  Object.keys(TOWNLOC).forEach((n) => sites.push({ x: TOWNLOC[n].x, y: TOWNLOC[n].y, r: 26, k: 'town', n }));
  if (world) world.towns.forEach((t) => { if (!TOWNLOC[t.name]) sites.push({ x: t.x, y: t.y, r: 26, k: 'town', n: t.name }); });
  return sites;
}

export function makeTerrain(world) {
  const seed = terrainSeedValue();
  const { fbm } = noiser(seed), sites = siteList(world), rr = lcg(seed + 11);
  const lakes = [];
  for (let t = 0; t < 60 && lakes.length < 3; t++) {
    const x = 60 + rr() * (MAPW - 120), y = 110 + rr() * (MAPH - 150), s = 20 + rr() * 22;
    if (sites.every((p) => Math.hypot(p.x - x, p.y - y) > p.r + s * 1.7)) lakes.push({ x, y, s });
  }

  /** Terrain height in world units at a map pixel. */
  const heightAt = (x, y) => {
    let h = 0.55 + (fbm(x / 150, y / 150) - 0.5) * 1.5 + (fbm(x / 40 + 31, y / 40) - 0.5) * 0.28;
    for (const l of lakes) { const d = Math.hypot(x - l.x, y - l.y) / l.s; h -= Math.exp(-d * d * 1.3) * 1.5; }
    const north = smooth(120, 14, y);
    h += north * (0.9 + 3.2 * fbm(x / 62 + 50, y / 62));
    const out = Math.max(0, -x, x - MAPW, y - MAPH - 6, -y);
    h += smooth(0, 110, out) * (2.2 + 2.6 * fbm(x / 70 + 7, y / 70 + 7));
    for (const p of sites) {
      const d = Math.hypot(x - p.x, y - p.y), f = smooth(p.r + 16, p.r - 2, d);
      if (f > 0) h = h * (1 - f) + (p.k === 'guild' || p.k === 'yard' ? 0.5 : 0.42) * f;
    }
    return h;
  };

  const W = MAPW + MARGIN * 2, Hh = MAPH + MARGIN * 2, segX = 150, segY = 100;
  const geometry = new THREE.PlaneGeometry(W * K, Hh * K, segX, segY);
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(((MAPW / 2)) * K, 0, (MAPH / 2) * K);
  const pos = geometry.attributes.position, col = new Float32Array(pos.count * 3);
  const C = {
    bed: new THREE.Color('#1d3338'), sand: new THREE.Color('#8f7d55'), grass: new THREE.Color('#566a2e'), grass2: new THREE.Color('#3b4d24'),
    moss: new THREE.Color('#2e3a1f'), rock: new THREE.Color('#6d5e4e'), dark: new THREE.Color('#4b3f35'), snow: new THREE.Color('#eadfc4'),
  };
  const c = new THREE.Color(), jit = noiser(seed + 5).fbm;
  for (let i = 0; i < pos.count; i++) {
    const px = pos.getX(i) / K, py = pos.getZ(i) / K, h = heightAt(px, py);
    pos.setY(i, h);
    const sl = Math.abs(heightAt(px + 5, py) - h) + Math.abs(heightAt(px, py + 5) - h);
    const j = jit(px / 18, py / 18);
    c.copy(C.grass).lerp(C.grass2, smooth(0.3, 0.75, j));
    c.lerp(C.moss, smooth(1.0, 1.7, h) * 0.8);
    c.lerp(C.sand, smooth(0.2, -0.02, h));
    c.lerp(C.bed, smooth(0.0, -0.45, h));
    c.lerp(C.rock, Math.max(smooth(1.9, 2.8, h), smooth(0.35, 0.75, sl)));
    c.lerp(C.dark, smooth(0.5, 1.2, sl) * 0.6);
    c.lerp(C.snow, smooth(3.1 + j * 0.5, 4.0, h));
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geometry.computeVertexNormals();

  const trees = [], tr = lcg(seed + 99), tn = noiser(seed + 3).fbm;
  for (let t = 0; t < 4200 && trees.length < 640; t++) {
    const x = -60 + tr() * (MAPW + 120), y = 20 + tr() * (MAPH + 70), h = heightAt(x, y);
    if (h < 0.18 || h > 2.1 || tn(x / 55 + 9, y / 55) < 0.5) continue;
    if (sites.some((p) => Math.hypot(p.x - x, p.y - y) < p.r + 8)) continue;
    if (Math.abs(heightAt(x + 4, y) - h) + Math.abs(heightAt(x, y + 4) - h) > 0.5) continue;
    trees.push({ x, y, h, s: 0.7 + tr() * 0.8, r: tr() * 6.28, v: tr() });
  }
  const rocks = [], rk = lcg(seed + 7);
  for (let t = 0; t < 900 && rocks.length < 120; t++) {
    const x = rk() * MAPW, y = 30 + rk() * (MAPH - 30), h = heightAt(x, y);
    if (h < 0.2 || sites.some((p) => Math.hypot(p.x - x, p.y - y) < p.r + 4)) continue;
    rocks.push({ x, y, h, s: 0.3 + rk() * 0.55, r: rk() * 6.28 });
  }
  return {
    geometry, heightAt, trees, rocks, sites, lakes,
    extent: { x0: -MARGIN, y0: -MARGIN, w: W, h: Hh },
  };
}
