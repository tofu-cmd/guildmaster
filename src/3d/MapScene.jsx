import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, Line, OrbitControls, Sparkles } from '@react-three/drei';
import { Bloom, EffectComposer, SMAA, ToneMapping, Vignette } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import * as THREE from 'three';
import { MAPW, MAPH } from '../engine/data.js';
import { PCOL, GUILD, LOC, locOf, route, bez, hashStr } from '../engine/map.js';
import { S, ui, dispatch, members, foundTowns, progress, partyPos, atHome } from '../engine/game.js';
import { useTick } from '../ui/hooks.js';
import { K, makeTerrain } from './terrain.js';
import { buildHero, poseHero } from './heroModel.js';
import { mapApi } from './mapApi.js';
import { buildTown, buildGuild, buildRuin, buildThrone, buildPin } from './buildings.js';


const CENTER = new THREE.Vector3((MAPW / 2) * K, 0.4, (MAPH / 2) * K);
const MIN_D = 7, MAX_D = 100;
const UP = new THREE.Vector3(0, 1, 0);
const MOVE_KEYS = new Set(['w', 'a', 's', 'd', 'q', 'e', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright']);
const setCursor = (c) => { document.body.style.cursor = c; };
const hover = { onPointerOver: (e) => { e.stopPropagation(); setCursor('pointer'); }, onPointerOut: () => setCursor('') };
const keyAct = (fn) => (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); } };

/* ---------- ground, water, forest ---------- */
function Ground({ T }) {
  const water = useRef();
  useFrame(({ clock }) => { if (water.current) water.current.material.opacity = 0.8 + Math.sin(clock.elapsedTime * 0.8) * 0.04; });
  return (
    <>
      <mesh geometry={T.geometry} receiveShadow castShadow>
        <meshStandardMaterial vertexColors flatShading roughness={0.95} />
      </mesh>
      <mesh ref={water} rotation-x={-Math.PI / 2} position={[(MAPW / 2) * K, -0.04, (MAPH / 2) * K]}>
        <planeGeometry args={[(MAPW + 300) * K, (MAPH + 300) * K]} />
        <meshStandardMaterial color="#2b6a78" transparent opacity={0.82} roughness={0.18} metalness={0.25} />
      </mesh>
    </>
  );
}

const PINES = ['#2f4a2a', '#3a5a30', '#27402a', '#46602f', '#35502f'];
function Forest({ T }) {
  const trunk = useRef(), low = useRef(), high = useRef();
  const g = useMemo(() => ({
    trunk: new THREE.CylinderGeometry(0.05, 0.075, 0.45, 5).translate(0, 0.22, 0),
    low: new THREE.ConeGeometry(0.4, 0.75, 6).translate(0, 0.68, 0),
    high: new THREE.ConeGeometry(0.28, 0.65, 6).translate(0, 1.08, 0),
  }), []);
  useLayoutEffect(() => {
    const d = new THREE.Object3D(), c = new THREE.Color(), c2 = new THREE.Color();
    T.trees.forEach((t, i) => {
      d.position.set(t.x * K, t.h - 0.03, t.y * K);
      d.rotation.set(0, t.r, 0);
      d.scale.setScalar(t.s * 0.95);
      d.updateMatrix();
      [trunk, low, high].forEach((r) => r.current.setMatrixAt(i, d.matrix));
      c.set(t.v > 0.92 ? '#9a5a22' : PINES[Math.floor(t.v * 5) % 5]);
      low.current.setColorAt(i, c);
      high.current.setColorAt(i, c2.copy(c).offsetHSL(0, 0, 0.05));
    });
    [trunk, low, high].forEach((r) => { r.current.instanceMatrix.needsUpdate = true; if (r.current.instanceColor) r.current.instanceColor.needsUpdate = true; });
  }, [T]);
  const n = T.trees.length;
  return (
    <group key={n}>
      <instancedMesh ref={trunk} args={[g.trunk, undefined, n]} castShadow><meshStandardMaterial color="#4a3322" flatShading /></instancedMesh>
      <instancedMesh ref={low} args={[g.low, undefined, n]} castShadow receiveShadow><meshStandardMaterial color="#ffffff" flatShading roughness={0.9} /></instancedMesh>
      <instancedMesh ref={high} args={[g.high, undefined, n]} castShadow><meshStandardMaterial color="#ffffff" flatShading roughness={0.9} /></instancedMesh>
    </group>
  );
}
function Rocks({ T }) {
  const ref = useRef();
  const geo = useMemo(() => new THREE.DodecahedronGeometry(0.5, 0), []);
  useLayoutEffect(() => {
    const d = new THREE.Object3D();
    T.rocks.forEach((t, i) => {
      d.position.set(t.x * K, t.h + 0.05, t.y * K);
      d.rotation.set(t.r, t.r * 2, 0);
      d.scale.set(t.s, t.s * 0.7, t.s);
      d.updateMatrix();
      ref.current.setMatrixAt(i, d.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  }, [T]);
  return <instancedMesh key={T.rocks.length} ref={ref} args={[geo, undefined, T.rocks.length]} castShadow receiveShadow><meshStandardMaterial color="#7a6d5d" flatShading roughness={1} /></instancedMesh>;
}

/* ---------- places ---------- */
function Guild({ T }) {
  const obj = useMemo(() => buildGuild(), []);
  const light = useRef();
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (light.current) light.current.intensity = 6 + Math.sin(t * 9) * 1.2 + Math.sin(t * 23) * 0.8;
    const f = obj.getObjectByName('flag');
    if (f) { f.rotation.y = Math.sin(t * 2.2) * 0.25; f.scale.x = 1 + Math.sin(t * 4) * 0.05; }
  });
  const y = T.heightAt(GUILD.x, GUILD.y);
  return (
    <group position={[GUILD.x * K, y, GUILD.y * K]}>
      <primitive object={obj} />
      <pointLight ref={light} position={[1.7, 0.8, 1.95]} color="#ff8a3a" distance={9} decay={2} />
      <Html position={[0, 4.3, 0]} center zIndexRange={[5, 0]} pointerEvents="none"><div className="m3d-label guild">{S.guildName || 'Your guild'}</div></Html>
    </group>
  );
}

function Town({ t, T }) {
  const obj = useMemo(() => buildTown(t.kind, hashStr(t.name), t.id), [t.kind, t.name, t.id]);
  const open = () => dispatch('drawer', 'towns');
  return (
    <group position={[t.x * K, T.heightAt(t.x, t.y), t.y * K]}>
      <primitive object={obj} onClick={(e) => { e.stopPropagation(); open(); }} {...hover} />
      <Html position={[0, t.kind === 'town' ? 2.5 : 1.7, 0]} center zIndexRange={[5, 0]}>
        <button className="m3d-label town" onClick={open} onKeyDown={keyAct(open)}
          aria-label={`${t.name}, a ${t.kind} with the inn ${t.tavern}. Open town list.`} title={`${t.tavern}: beds ${t.inn}g per hero.`}>{t.name}</button>
      </Html>
    </group>
  );
}

function Site({ name, T, active }) {
  const l = LOC[name], throne = name === 'the Drowned Throne';
  const obj = useMemo(() => (throne ? buildThrone() : buildRuin(hashStr(name))), [name, throne]);
  return (
    <group position={[l.x * K, T.heightAt(l.x, l.y), l.y * K]}>
      <primitive object={obj} />
      {throne && <pointLight position={[0, 3.3, 0]} color="#ff3b2e" intensity={9} distance={9} decay={2} />}
      {(active || throne) && <Html position={[0, throne ? 4 : 1.2, 0]} center zIndexRange={[5, 0]} pointerEvents="none"><div className={'m3d-label site' + (throne ? ' throne' : '')}>{name}</div></Html>}
    </group>
  );
}

function PinModel({ hot }) {
  const obj = useMemo(() => buildPin(hot), [hot]);
  useFrame(({ clock }) => {
    const g = obj.getObjectByName('gem');
    if (g) { g.rotation.y = clock.elapsedTime * 1.6; g.position.y = 1.55 + Math.sin(clock.elapsedTime * 2 + obj.id) * 0.06; }
  });
  return <primitive object={obj} />;
}
function Pins({ T, groups }) {
  return Object.keys(groups).flatMap((pl) => {
    const l = locOf(pl), arr = groups[pl];
    return arr.map((q, i) => {
      const hot = q.crisis || q.boss, px = l.x + (i - (arr.length - 1) / 2) * 30, py = l.y - 14;
      const go = () => dispatch('assign', q.id);
      return (
        <group key={q.id} position={[px * K, T.heightAt(px, py), py * K]}>
          <group onClick={(e) => { e.stopPropagation(); go(); }} {...hover}><PinModel hot={!!hot} /></group>
          <Html position={[0, 2.1, 0]} center zIndexRange={[5, 0]}>
            <button className={'m3d-pin' + (hot ? ' hot' : '')} onClick={go} onKeyDown={keyAct(go)}
              aria-label={`${q.title} at ${pl}. Danger ${q.d}. Send a party.`} title={`${q.title} at ${pl}. Danger ${q.d}. Click to send a party.`}>{q.d}</button>
          </Html>
        </group>
      );
    });
  });
}

/* ---------- parties ---------- */
const lift = (T, x, y, h = 0.14) => [x * K, T.heightAt(x, y) + h, y * K];
const tokenTarget = (p, homeIdx) => (homeIdx[p.id] !== undefined
  ? { x: GUILD.x + (homeIdx[p.id].i - (homeIdx[p.id].n - 1) / 2) * 76, y: GUILD.y + 62 }
  : partyPos(p));
const moving = () => ui.advancing || (ui.mode === 'live' && !ui.paused && !ui.modal && !S.over);
const isLeg = (p) => p.leg && Math.hypot(p.leg.to.x - p.leg.from.x, p.leg.to.y - p.leg.from.y) > 1;

function PartyToken({ p, c, T, homeIdx }) {
  const root = useRef(), ring = useRef(), first = useRef(true), heading = useRef(0), prev = useRef({ x: 0, z: 0 });
  const ms = members(p), n = ms.length, sel = ui.selectedParty === p.id;
  const sig = ms.map((h) => `${h.id}${h.cls}${h.tier}${JSON.stringify(h.look || {})}`).join('|');
  const models = useMemo(() => ms.map((h) => buildHero(h.cls, h.tier, h.look)), [sig]);
  const phase = useRef(Math.random() * 6);
  const state = p.mission ? `on "${p.mission.quest.title}"` : p.recall ? 'returning to the tavern' : atHome(p) ? 'at the tavern' : p.auto ? 'roaming' : 'heading home';
  const pick = () => dispatch('selectparty', p.id);

  useFrame(({ clock }, dt) => {
    const g = root.current;
    if (!g) return;
    const tg = tokenTarget(p, homeIdx), gx = tg.x * K, gz = tg.y * K;
    if (first.current) { g.position.set(gx, 0, gz); first.current = false; }
    const k = 1 - Math.exp(-7 * Math.min(dt, 0.1)), dx = gx - g.position.x, dz = gz - g.position.z;
    g.position.x += dx * k; g.position.z += dz * k;
    g.position.y = T.heightAt(g.position.x / K, g.position.z / K) + 0.02;
    const vx = g.position.x - prev.current.x, vz = g.position.z - prev.current.z;
    prev.current = { x: g.position.x, z: g.position.z };
    const walking = moving() && (p.mission || isLeg(p)) && Math.hypot(dx, dz) > 0.03;
    if (walking && Math.hypot(vx, vz) > 1e-4) heading.current = Math.atan2(vx, vz);
    else if (!walking) heading.current += (0 - heading.current) * 0.08;
    const t = clock.elapsedTime + phase.current;
    models.forEach((m, i) => {
      let d = heading.current - m.rotation.y;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      m.rotation.y += d * 0.15;
      poseHero(m, t + i * 0.35, walking ? 1 : 0);
    });
    if (ring.current) ring.current.rotation.z = clock.elapsedTime * 0.8;
  });

  return (
    <group ref={root}>
      <group onClick={(e) => { e.stopPropagation(); pick(); }} {...hover}>
        {models.map((m, i) => <primitive key={ms[i].id} object={m} position={[(i - (n - 1) / 2) * 0.95, 0, 0]} scale={0.95} />)}
        <mesh position={[0, 0.7, 0]} visible={false}><boxGeometry args={[n * 1 + 0.6, 1.6, 1.2]} /></mesh>
      </group>
      {sel && (
        <mesh ref={ring} rotation-x={-Math.PI / 2} position={[0, 0.06, 0]}>
          <ringGeometry args={[n * 0.5 + 0.55, n * 0.5 + 0.7, 40, 1]} />
          <meshBasicMaterial color="#f5c56f" transparent opacity={0.95} toneMapped={false} />
        </mesh>
      )}
      <Html position={[0, 1.95, 0]} center zIndexRange={[5, 0]}>
        <button className={'m3d-party' + (sel ? ' sel' : '')} style={{ '--c': c }} onClick={pick} onKeyDown={keyAct(pick)}
          aria-label={`${p.name}, ${state}. Open orders.`} title={`${p.name}: ${state}`}>{p.name}</button>
      </Html>
    </group>
  );
}

function Beacon({ at, color, T, label }) {
  const ring = useRef(), beam = useRef();
  useFrame(({ clock }) => {
    const t = (clock.elapsedTime * 0.7) % 1;
    if (ring.current) { ring.current.scale.setScalar(0.6 + t * 1.4); ring.current.material.opacity = 1 - t; }
    if (beam.current) beam.current.material.opacity = 0.18 + Math.sin(clock.elapsedTime * 3) * 0.05;
  });
  const pos = lift(T, at.x, at.y, 0.1);
  return (
    <group position={pos}>
      <mesh ref={ring} rotation-x={-Math.PI / 2}><ringGeometry args={[0.9, 1.0, 40]} /><meshBasicMaterial color={color} transparent toneMapped={false} depthWrite={false} /></mesh>
      <mesh ref={beam} position={[0, 1.6, 0]}><cylinderGeometry args={[0.35, 0.35, 3.2, 14, 1, true]} /><meshBasicMaterial color={color} transparent opacity={0.2} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} toneMapped={false} /></mesh>
      <Html position={[0, 3.4, 0]} center zIndexRange={[5, 0]} pointerEvents="none"><div className="m3d-label dest">{label}</div></Html>
    </group>
  );
}

function Routes({ T, act }) {
  return (
    <>
      {act.map(({ p, c }) => {
        const m = p.mission, q = m.quest, t = m.total || q.days, e = t - m.daysLeft, r = route(q.place, m.origin), pf = Math.round(progress(p)) / 100;
        const pts = Array.from({ length: 49 }, (_, i) => lift(T, bez(r, i / 48).x, bez(r, i / 48).y, 0.2));
        const done = pts.slice(0, Math.max(2, Math.round(pf * 48) + 1));
        const marks = [];
        for (let k = 1; k < t; k++) {
          const pt = bez(r, k / t), ev = (m.ev || []).find((x) => x.day === k);
          const shown = k <= e && ev && !ev.pending;
          const col = !shown ? '#bba98d' : ev.tone === 'good' ? '#86b86b' : ev.tone === 'bad' ? '#dc6a4e' : '#bba98d';
          marks.push(
            <mesh key={k} position={lift(T, pt.x, pt.y, shown ? 0.32 : 0.2)} scale={shown ? 1 : 0.55}>
              <octahedronGeometry args={[0.2]} />
              <meshStandardMaterial color={col} emissive={col} emissiveIntensity={shown ? 1.8 : 0.2} flatShading />
            </mesh>,
          );
        }
        return (
          <group key={p.id}>
            <Line points={pts} color="#f1dfbd" lineWidth={1.6} dashed dashSize={0.3} gapSize={0.25} transparent opacity={0.55} depthTest={false} renderOrder={4} />
            <Line points={done} color={c} lineWidth={4} depthTest={false} renderOrder={5} />
            {marks}
            <Beacon at={r.L} color={c} T={T} label={q.place} />
          </group>
        );
      })}
      {S.parties.map((p, i) => {
        if (p.mission || !members(p).length) return null;
        const c = PCOL[i % PCOL.length], here = isLeg(p);
        if (atHome(p) && here) return null;
        const target = p.recall || !p.auto ? GUILD : p.dest;
        if (!target || atHome(p)) return null;
        const o = partyPos(p);
        return (
          <group key={'w' + p.id}>
            <Line points={[lift(T, o.x, o.y, 0.2), lift(T, target.x, target.y, 0.2)]} color={c} lineWidth={2} dashed dashSize={0.12} gapSize={0.3} transparent opacity={0.7} depthTest={false} renderOrder={4} />
            {target !== GUILD && <Beacon at={target} color={c} T={T} label="" />}
          </group>
        );
      })}
    </>
  );
}

/* ---------- camera and light ---------- */
function Rig() {
  const ctl = useRef(), goal = useRef(null), keys = useRef(new Set()), fast = useRef(false), tmp = useRef({ f: new THREE.Vector3(), r: new THREE.Vector3(), o: new THREE.Vector3() });
  const { camera, size } = useThree();
  const view = useCallback((close) => {
    const asp = size.width / Math.max(1, size.height), vf = THREE.MathUtils.degToRad(camera.fov), phi = 0.92;
    const target = close ? new THREE.Vector3(GUILD.x * K, 0.4, GUILD.y * K) : CENTER.clone();
    const d = close ? (window.innerWidth < 700 ? 18 : 26) : THREE.MathUtils.clamp(Math.max(((MAPW * K) / 2 / (Math.tan(vf / 2) * asp)) * 0.86, (MAPH * K * 0.37) / Math.tan(vf / 2)), 12, MAX_D - 4);
    camera.position.set(target.x, target.y + d * Math.cos(phi), target.z + d * Math.sin(phi));
    ctl.current.target.copy(target);
    ctl.current.update();
  }, [camera, size.width, size.height]);

  useLayoutEffect(() => {
    view(true);
    mapApi.fit = () => { view(false); };
    mapApi.zoom = (f) => {
      const d = camera.position.distanceTo(ctl.current.target);
      goal.current = THREE.MathUtils.clamp((goal.current || d) / f, MIN_D, MAX_D);
    };
    // fit once on mount; later resizes keep the player's view
  }, []);

  useEffect(() => {
    const typing = (e) => { const t = e.target; return t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable); };
    const dn = (e) => {
      const k = e.key.toLowerCase();
      if (!MOVE_KEYS.has(k) || e.ctrlKey || e.metaKey || e.altKey || typing(e) || ui.modal) return;
      keys.current.add(k); fast.current = e.shiftKey;
      if (k.startsWith('arrow')) e.preventDefault();
    };
    const up = (e) => { keys.current.delete(e.key.toLowerCase()); fast.current = e.shiftKey; };
    const clear = () => keys.current.clear();
    window.addEventListener('keydown', dn); window.addEventListener('keyup', up); window.addEventListener('blur', clear);
    return () => { window.removeEventListener('keydown', dn); window.removeEventListener('keyup', up); window.removeEventListener('blur', clear); };
  }, []);

  useFrame((_, dt) => {
    const c = ctl.current;
    if (!c) return;
    const held = keys.current;
    if (held.size && !ui.modal) {
      const f = (held.has('w') || held.has('arrowup') ? 1 : 0) - (held.has('s') || held.has('arrowdown') ? 1 : 0);
      const r = (held.has('d') || held.has('arrowright') ? 1 : 0) - (held.has('a') || held.has('arrowleft') ? 1 : 0);
      const rot = (held.has('e') ? 1 : 0) - (held.has('q') ? 1 : 0), { f: fw, r: rt, o } = tmp.current, step = Math.min(dt, 0.1);
      if (f || r) {
        camera.getWorldDirection(fw); fw.y = 0; fw.normalize(); rt.crossVectors(fw, UP);
        const sp = (0.8 * camera.position.distanceTo(c.target) + 5) * (fast.current ? 2.2 : 1) * step;
        o.set(0, 0, 0).addScaledVector(fw, f).addScaledVector(rt, r).normalize().multiplyScalar(sp);
        camera.position.add(o); c.target.add(o);
      }
      if (rot) { o.copy(camera.position).sub(c.target).applyAxisAngle(UP, rot * step * 1.4); camera.position.copy(c.target).add(o); }
    }
    const t = c.target, cx = THREE.MathUtils.clamp(t.x, 0, MAPW * K), cz = THREE.MathUtils.clamp(t.z, 0, MAPH * K);
    if (cx !== t.x || cz !== t.z) { camera.position.x += cx - t.x; camera.position.z += cz - t.z; t.x = cx; t.z = cz; }
    if (goal.current != null) {
      const off = camera.position.clone().sub(t), d = off.length(), nd = d + (goal.current - d) * 0.18;
      camera.position.copy(t).add(off.setLength(nd));
      if (Math.abs(goal.current - nd) < 0.05) goal.current = null;
    }
  });
  return (
    <OrbitControls ref={ctl} makeDefault enableDamping dampingFactor={0.09} screenSpacePanning={false} zoomToCursor
      minDistance={MIN_D} maxDistance={MAX_D} minPolarAngle={0.3} maxPolarAngle={1.22} minAzimuthAngle={-1.1} maxAzimuthAngle={1.1}
      panSpeed={1.1} rotateSpeed={0.55} zoomSpeed={0.9}
      mouseButtons={{ LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE }}
      touches={{ ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_ROTATE }} />
  );
}

function Lights() {
  const sun = useRef();
  useFrame(({ controls }) => {
    const s = sun.current, t = controls ? controls.target : CENTER;
    if (!s) return;
    s.position.set(t.x - 16, 30, t.z + 14);
    s.target.position.copy(t);
    s.target.updateMatrixWorld();
  });
  return (
    <>
      <hemisphereLight args={['#9fb0d8', '#3b2a1c', 1.05]} />
      <directionalLight ref={sun} position={[CENTER.x - 16, 30, CENTER.z + 14]} intensity={2.9} color="#ffd9a3" castShadow
        shadow-mapSize={[2048, 2048]} shadow-bias={-0.0006} shadow-normalBias={0.05}
        shadow-camera-left={-36} shadow-camera-right={36} shadow-camera-top={30} shadow-camera-bottom={-30} shadow-camera-near={1} shadow-camera-far={90} />
      <directionalLight position={[CENTER.x + 20, 12, CENTER.z - 20]} intensity={0.9} color="#7f8fd0" />
    </>
  );
}

function Embers() {
  const g = useRef();
  useFrame(({ controls }) => { if (g.current && controls) g.current.position.set(controls.target.x, 3.5, controls.target.z); });
  return <group ref={g}><Sparkles count={130} scale={[44, 6, 30]} size={3.2} speed={0.35} opacity={0.7} color="#ff9a4a" /></group>;
}

function World() {
  useTick();
  const T = useMemo(() => makeTerrain(S.world), [S.world && S.world.seed]);
  const groups = {};
  S.board.forEach((q) => { (groups[q.place] = groups[q.place] || []).push(q); });
  const act = S.parties.map((p, i) => ({ p, c: PCOL[i % PCOL.length] })).filter((x) => x.p.mission);
  const homeIdx = {};
  let hc = 0;
  S.parties.forEach((p) => { if (members(p).length && !p.mission && atHome(p) && !isLeg(p)) hc++; });
  let hi = 0;
  S.parties.forEach((p) => { if (members(p).length && !p.mission && atHome(p) && !isLeg(p)) homeIdx[p.id] = { i: hi++, n: hc }; });
  return (
    <>
      <color attach="background" args={['#120c08']} />
      <fog attach="fog" args={['#150e09', 80, 210]} />
      <Lights />
      <Ground T={T} />
      <Forest T={T} />
      <Rocks T={T} />
      <Guild T={T} />
      {foundTowns().map((t) => <Town key={t.id} t={t} T={T} />)}
      {Object.keys(LOC).map((n) => <Site key={n} name={n} T={T} active={!!groups[n]} />)}
      <Pins T={T} groups={groups} />
      <Routes T={T} act={act} />
      {S.parties.map((p, i) => (members(p).length ? <PartyToken key={p.id} p={p} c={PCOL[i % PCOL.length]} T={T} homeIdx={homeIdx} /> : null))}
      <Embers />
      <Rig />
      <EffectComposer multisampling={0}>
        <Bloom intensity={0.55} luminanceThreshold={0.85} luminanceSmoothing={0.3} mipmapBlur />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        <Vignette eskil={false} offset={0.25} darkness={0.6} />
        <SMAA />
      </EffectComposer>
    </>
  );
}

export default function MapScene() {
  useEffect(() => () => setCursor(''), []);
  return (
    <Canvas shadows flat dpr={[1, 1.75]} camera={{ fov: 38, near: 0.5, far: 420, position: [20, 20, 30] }}
      gl={{ antialias: false, powerPreference: 'high-performance' }} aria-label="3D map of the realm" role="img">
      <World />
    </Canvas>
  );
}
