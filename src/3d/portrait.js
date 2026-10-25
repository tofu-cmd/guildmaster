import * as THREE from 'three';
import { buildHero } from './heroModel.js';

/* Hero portraits are rendered once with a single shared WebGL context, then cached as
   images. The roster can show dozens of heroes without dozens of live canvases. */

const SIZE = 192;
const cache = new Map();
let rig = null, failed = false;

function init() {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = SIZE;
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(1);
    renderer.setSize(SIZE, SIZE, false);
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xb7c3e8, 0x4a3320, 1.15));
    const key = new THREE.DirectionalLight(0xffe0b0, 3.1);
    key.position.set(-2.4, 3.2, 3.2);
    const rim = new THREE.DirectionalLight(0xff8a4a, 1.6);
    rim.position.set(2.8, 1.6, -2.4);
    scene.add(key, rim);
    const camera = new THREE.PerspectiveCamera(27, 1, 0.1, 20);
    camera.position.set(0, 0.9, 3.5);
    camera.lookAt(0, 0.82, 0);
    rig = { renderer, scene, camera };
  } catch (e) {
    failed = true;
  }
}

/** Returns a data URL for the hero's portrait, or '' when WebGL is unavailable. */
export function portrait(cls, tier = 0, look = {}) {
  const lk = look || {};
  const key = `${cls}|${tier}|${lk.skin || 0}|${lk.cloth || 0}|${lk.hair || 0}`;
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  if (!rig && !failed) init();
  if (!rig) { cache.set(key, ''); return ''; }
  const { renderer, scene, camera } = rig;
  let url = '';
  try {
    const hero = buildHero(cls, tier, lk);
    hero.rotation.y = -0.55;
    scene.add(hero);
    renderer.render(scene, camera);
    url = renderer.domElement.toDataURL('image/png');
    scene.remove(hero);
  } catch (e) {
    failed = true;
  }
  cache.set(key, url);
  return url;
}

export function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch (e) {
    return false;
  }
}
