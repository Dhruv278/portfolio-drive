// Scene script for The Drive preview, model-based version (Kenney CC0 kits).
// Injected into preview.html after _shell.html by build_preview.py.
const canvas = document.getElementById('scene');
const nogl = document.getElementById('nogl');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobile = innerWidth < 720;
let THREE, GLTFLoader;
try {
  THREE = await import('three');
  ({ GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js'));
  if (!canvas.getContext('webgl2') && !canvas.getContext('webgl')) throw new Error('no webgl');
} catch (e) {
  console.error(e);
  canvas.style.display = 'none'; nogl.style.display = 'flex';
}

// ---------- scroll model ----------
const sections = [...document.querySelectorAll('section.stop')];
const notes = document.getElementById('notes');
const stopName = document.getElementById('stopName');
const trackFill = document.getElementById('trackFill');
const hint = document.getElementById('hint');
const T_STOPS = [0.035, 0.21, 0.39, 0.57, 0.75, 0.955];
let zones = [];
function measure() {
  const H = innerHeight;
  const maxScroll = Math.max(1, notes.offsetTop - H * 0.35);
  zones = sections.map((s) => {
    const center = s.offsetTop + s.offsetHeight * 0.34;
    const half = s.offsetHeight * 0.13;
    return { a: Math.max(0, (center - half) / maxScroll), b: Math.min(1, (center + half) / maxScroll) };
  });
  return maxScroll;
}
let maxScroll = measure();
addEventListener('resize', () => { maxScroll = measure(); });
const startAt = parseFloat(new URLSearchParams(location.search).get('s') || '');
if (!Number.isNaN(startAt)) { requestAnimationFrame(() => scrollTo(0, Math.max(0, Math.min(1, startAt)) * measure())); }

function roadT(s) {
  let prevB = 0, prevT = 0;
  for (let i = 0; i < zones.length; i++) {
    const { a, b } = zones[i];
    if (s < a) return prevT + (T_STOPS[i] - prevT) * ((s - prevB) / Math.max(1e-6, a - prevB));
    if (s <= b) return T_STOPS[i];
    prevB = b; prevT = T_STOPS[i];
  }
  const T_END = 0.972;
  return prevT + (T_END - prevT) * ((s - prevB) / Math.max(1e-6, 1 - prevB));
}
function currentStop(s) { let best = 0; for (let i = 0; i < zones.length; i++) { if (s >= zones[i].a - 0.03) best = i; } return best; }
function updateHud(s) {
  const i = currentStop(s);
  stopName.textContent = `Stop ${i + 1} of 6, ${sections[i].dataset.name}`;
  trackFill.style.width = (s * 100).toFixed(1) + '%';
  hint.classList.toggle('gone', s > 0.02);
}

if (!THREE) {
  const tick = () => { updateHud(Math.min(1, scrollY / maxScroll)); requestAnimationFrame(tick); };
  tick();
} else {
  // ---------- renderer, scene, lights ----------
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.25 : 1.75));
  renderer.shadowMap.enabled = !mobile;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setSize(innerWidth, innerHeight);
  const scene = new THREE.Scene();
  const SKY_DAY = new THREE.Color(0xDCEAF4), SKY_DUSK = new THREE.Color(0xF3D9C4);
  const FOG_DAY = new THREE.Color(0xE6EDF1), FOG_DUSK = new THREE.Color(0xF4E0CE);
  scene.background = SKY_DAY.clone();
  scene.fog = new THREE.Fog(FOG_DAY.clone(), 50, 170);

  const camera = new THREE.PerspectiveCamera(mobile ? 54 : 36, innerWidth / innerHeight, 0.1, 500);
  const CAM_BACK = mobile ? 12.5 : 14.5, CAM_SIDE = mobile ? -1.6 : -6.5, CAM_UP = mobile ? 12.5 : 8.2, LOOK_SIDE = mobile ? 0.3 : 1.5, LOOK_AHEAD = mobile ? 1.5 : 11, LOOK_Y = mobile ? -4.5 : 0.6;
  addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });

  const hemi = new THREE.HemisphereLight(0xE8F1F8, 0xFFFDF8, 1.05); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xFFF6E8, 2.2);
  sun.position.set(30, 50, 20); sun.castShadow = !mobile;
  sun.shadow.mapSize.set(2048, 2048); sun.shadow.camera.near = 1; sun.shadow.camera.far = 200;
  sun.shadow.camera.left = -70; sun.shadow.camera.right = 70; sun.shadow.camera.top = 70; sun.shadow.camera.bottom = -70;
  sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.02;
  scene.add(sun); scene.add(sun.target);

  const mat = (c, opts = {}) => new THREE.MeshLambertMaterial({ color: c, flatShading: true, ...opts });
  const GROUND = 0xE3E6D6, PAPER = 0xF6F2EA, INK = 0x1E2A38, COBALT = 0x2F5BEA, ROAD = 0x9EA4AC, WATER = 0xBBD7E6, WOOD = 0xC9B48F, LEAF = 0x7FB069, LEAF2 = 0x6A9C57;

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400), mat(GROUND));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);

  // ---------- road ----------
  const pts = [
    [0, 0, 0], [0, 0, -40], [10, 0, -80], [30, 0, -110], [34, 0, -150], [20, 0, -190],
    [-4, 0, -220], [-20, 0, -260], [-14, 0, -300], [8, 0, -335], [30, 0, -370], [38, 0, -410], [26, 0, -450], [0, 0, -480]
  ].map(p => new THREE.Vector3(...p));
  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal', 0.6);
  const up = new THREE.Vector3(0, 1, 0);
  {
    const N = 700, W = 3.2, pos = [], idx = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N, p = curve.getPointAt(t), tan = curve.getTangentAt(t);
      const right = new THREE.Vector3().crossVectors(up, tan).normalize();
      const l = p.clone().addScaledVector(right, -W), r = p.clone().addScaledVector(right, W);
      pos.push(l.x, 0.03, l.z, r.x, 0.03, r.z);
      if (i < N) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
    }
    const roadGeo = new THREE.BufferGeometry();
    roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    roadGeo.setIndex(idx); roadGeo.computeVertexNormals();
    const road = new THREE.Mesh(roadGeo, mat(ROAD, { side: THREE.DoubleSide })); road.receiveShadow = true; scene.add(road);
    // kerbs
    for (const side of [-1, 1]) {
      const kp = [], ki = [];
      for (let i = 0; i <= N; i++) {
        const t = i / N, p = curve.getPointAt(t), tan = curve.getTangentAt(t);
        const right = new THREE.Vector3().crossVectors(up, tan).normalize();
        const a = p.clone().addScaledVector(right, side * W), b = p.clone().addScaledVector(right, side * (W + 0.35));
        kp.push(a.x, 0.06, a.z, b.x, 0.06, b.z);
        if (i < N) { const k = i * 2; ki.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(kp, 3)); g.setIndex(ki); g.computeVertexNormals();
      scene.add(new THREE.Mesh(g, mat(0xD8DCE0, { side: THREE.DoubleSide })));
    }
    const dashes = new THREE.InstancedMesh(new THREE.BoxGeometry(0.22, 0.02, 1.4), mat(PAPER), 260);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion();
    for (let i = 0; i < 260; i++) {
      const t = i / 260, p = curve.getPointAt(t), tan = curve.getTangentAt(t);
      q.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tan.clone().setY(0).normalize());
      m4.compose(p.clone().setY(0.05), q, new THREE.Vector3(1, 1, 1));
      dashes.setMatrixAt(i, m4);
    }
    scene.add(dashes);
  }

  // ---------- model loading ----------
  const loader = new GLTFLoader();
  const cache = new Map();
  const status = document.getElementById('loadStatus');
  let pending = 0, failed = [];
  function load(path) {
    if (!cache.has(path)) {
      pending++;
      cache.set(path, new Promise((res) => {
        loader.load(`assets/${path}.glb`, (g) => {
          g.scene.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; if (o.material && o.material.map) o.material.map.anisotropy = 4; } });
          res(g.scene);
        }, undefined, () => { failed.push(path); res(null); });
      }).finally(() => { pending--; if (status) status.textContent = pending > 0 ? `Loading models (${pending})` : (failed.length ? `Missing: ${failed.join(', ')}` : ''); }));
    }
    return cache.get(path);
  }
  // clone a loaded model and size it: fit = { w | d | h | len }, footprint centred, base on the ground
  const box = new THREE.Box3(), size = new THREE.Vector3(), center = new THREE.Vector3();
  function instance(src, fit) {
    const m = src.clone(true);
    box.setFromObject(m); box.getSize(size);
    let s = 1;
    if (fit.h) s = fit.h / size.y; else if (fit.w) s = fit.w / size.x; else if (fit.d) s = fit.d / size.z; else if (fit.len) s = fit.len / Math.max(size.x, size.z);
    m.scale.setScalar(s);
    box.setFromObject(m); box.getCenter(center);
    m.position.set(-center.x, -box.min.y, -center.z);
    const g = new THREE.Group(); g.add(m); return g;
  }

  // ---------- placement ----------
  const placed = [];
  const LAT = mobile ? 0.72 : 1;
  function frameAt(t, lateral) {
    const p = curve.getPointAt(t), tan = curve.getTangentAt(t).setY(0).normalize();
    const right = new THREE.Vector3().crossVectors(up, tan).normalize();
    const g = new THREE.Group();
    g.position.copy(p).addScaledVector(right, lateral * LAT);
    g.lookAt(g.position.clone().sub(right.clone().multiplyScalar(Math.sign(lateral) || 1)));
    g.scale.y = 0.001;
    scene.add(g); placed.push({ group: g, t, k: 0 });
    return g;
  }
  // model placement: path in assets, fit spec, optional rotation (radians) and local offset
  async function put(t, lateral, path, fit, opts = {}) {
    const g = frameAt(t, lateral);
    const src = await load(path);
    if (!src) return g;
    const inst = instance(src, fit);
    if (opts.rot) inst.rotation.y = opts.rot;
    if (opts.dx || opts.dz) inst.position.set(opts.dx || 0, 0, opts.dz || 0);
    g.add(inst);
    return g;
  }
  // primitive helpers for what the kits do not cover (billboards, pier)
  const bx = (w, h, d, c, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(c)); m.position.set(x, y + h / 2, z); m.castShadow = true; m.receiveShadow = true; return m; };
  const cyl = (r, h, c, x = 0, y = 0, z = 0, seg = 10) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), mat(c)); m.position.set(x, y + h / 2, z); m.castShadow = true; return m; };
  function billboard(t, lateral) {
    const g = frameAt(t, lateral);
    g.add(cyl(0.14, 3.6, INK, -1.8, 0, 0, 6)); g.add(cyl(0.14, 3.6, INK, 1.8, 0, 0, 6));
    g.add(bx(5.2, 2.8, 0.2, 0xffffff, 0, 3.4, 0)); g.add(bx(4.2, 0.4, 0.05, COBALT, 0, 5.2, 0.12)); g.add(bx(3.4, 0.25, 0.05, INK, -0.4, 4.5, 0.12)); g.add(bx(2.6, 0.25, 0.05, INK, -0.8, 4.0, 0.12));
  }
  const TREES = ['nature/tree_default', 'nature/tree_detailed', 'nature/tree_oak', 'nature/tree_pineDefaultA', 'nature/tree_pineRoundA', 'nature/tree_fat', 'nature/tree_tall', 'nature/tree_simple'];
  let ti = 0;
  const tree = (t, lateral, h = 5.5) => put(t, lateral, TREES[(ti++) % TREES.length], { h }, { rot: Math.random() * Math.PI * 2 });

  // stop 1: start. house across the road, trees and a sign on the near side
  put(0.03, -12, 'suburban/building-type-a', { len: 8 });
  put(0.065, -14, 'suburban/building-type-c', { len: 7 });
  put(0.02, 7.5, 'nature/sign', { h: 2.4 }, { rot: Math.PI * 0.1 });
  tree(0.045, 9, 5.5); tree(0.05, 12, 6.5); tree(0.035, 14, 5);
  for (let i = 0; i < 5; i++) put(0.005 + i * 0.008, -7.6, 'nature/fence_simple', { w: 2.6 });
  // milestones between stop 1 and 2
  put(0.115, 8, 'nature/sign', { h: 2.8 }); put(0.15, -8, 'nature/sign', { h: 2.8 });
  for (let i = 0; i < 14; i++) tree(0.06 + i * 0.011, (i % 2 ? 1 : -1) * (8 + Math.random() * 6), 4.5 + Math.random() * 2.5);

  // stop 2: town. courthouse-like building, clinic, records tower
  put(0.215, 16, 'commercial/building-e', { len: 12 });
  put(0.232, -12, 'commercial/building-c', { len: 8 });
  put(0.235, 13, 'commercial/building-skyscraper-a', { h: 22 });
  put(0.252, 18, 'commercial/building-b', { len: 10 });
  put(0.255, -14, 'suburban/building-type-e', { len: 7 });
  tree(0.245, -9, 5); tree(0.2, 10, 6); tree(0.265, -10, 5.5); tree(0.225, 9, 5);

  // stop 3: workshop, containers, billboard
  put(0.395, 16, 'industrial/building-a', { len: 14 });
  put(0.405, -11, 'industrial/shipping-container-a', { len: 6 }); put(0.412, -11.5, 'industrial/shipping-container-b', { len: 6 }, { dx: 1.2 });
  put(0.41, 21, 'industrial/detail-tank', { h: 7 });
  billboard(0.405, 12);
  for (let i = 0; i < 10; i++) tree(0.28 + i * 0.012, (i % 2 ? 1 : -1) * (8 + Math.random() * 5), 4.5 + Math.random() * 2.5);

  // stop 4: harbour and industry
  const water1 = new THREE.Mesh(new THREE.PlaneGeometry(90, 70), mat(WATER)); water1.rotation.x = -Math.PI / 2; water1.position.set(-64, 0.01, -296); scene.add(water1);
  put(0.56, 18, 'industrial/building-c', { len: 16 });
  put(0.585, -12, 'industrial/shipping-container-c', { len: 6 }); put(0.593, -13, 'industrial/detail-tank-large', { h: 6 });
  put(0.575, 14, 'industrial/water-tower', { h: 14 });
  put(0.6, -13, 'commercial/building-skyscraper-c', { h: 20 });
  put(0.61, 15, 'commercial/building-skyscraper-b', { h: 24 });
  put(0.565, 23, 'industrial/chimney-large', { h: 16 });
  for (let i = 0; i < 6; i++) { const g = frameAt(0.52 + i * 0.02, -7.5); g.add(cyl(0.16, 1.4, WOOD, 0, 0, 0, 6)); g.add(cyl(0.16, 1.4, WOOD, 0, 0, -2.2, 6)); }

  // stop 5: hills, windmills, solar, billboards
  const hill = (x, z, r, h, c) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 9, 6, 0, Math.PI * 2, 0, Math.PI / 2), mat(c)); m.scale.y = h / r; m.position.set(x, 0, z); m.castShadow = true; m.receiveShadow = true; scene.add(m); };
  hill(40, -390, 22, 9, LEAF); hill(62, -420, 30, 12, LEAF2); hill(-30, -400, 26, 10, LEAF2); hill(-52, -360, 20, 7, LEAF); hill(70, -350, 24, 8, LEAF);
  put(0.70, 18, 'industrial/windmill', { h: 16 }); put(0.735, 24, 'industrial/windmill', { h: 14 }); put(0.77, 19, 'industrial/windmill', { h: 15 });
  put(0.75, 12, 'industrial/solar-panel-landscape-group', { w: 8 });
  for (let i = 0; i < 3; i++) billboard(0.715 + i * 0.024, 11.5 + (i % 2) * 3);
  for (let i = 0; i < 16; i++) tree(0.66 + i * 0.014, (i % 2 ? 1 : -1) * (7 + Math.random() * 8), 4 + Math.random() * 3);

  // stop 6: coast, cottage, pier
  const water2 = new THREE.Mesh(new THREE.PlaneGeometry(260, 140), mat(WATER)); water2.rotation.x = -Math.PI / 2; water2.position.set(0, 0.01, -560); scene.add(water2);
  put(0.957, 11, 'suburban/building-type-b', { len: 7 });
  put(0.948, 15, 'nature/tree_palmDetailedTall', { h: 8 }); put(0.968, 14, 'nature/tree_palm', { h: 7 });
  tree(0.972, -9, 5); put(0.978, -8, 'nature/rock_largeA', { len: 4 });
  {
    const g = frameAt(1.0, 0); g.rotation.set(0, 0, 0); // pier straight ahead of the road end
    const p = curve.getPointAt(1), tan = curve.getTangentAt(1).setY(0).normalize();
    g.position.copy(p); g.lookAt(p.clone().add(tan));
    for (let i = 0; i < 12; i++) g.add(bx(6, 0.25, 1.6, WOOD, 0, 0.3, i * 1.8 + 1));
    for (let i = 0; i < 6; i++) { g.add(cyl(0.16, 1.0, WOOD, -2.8, 0, i * 3.6 + 1, 6)); g.add(cyl(0.16, 1.0, WOOD, 2.8, 0, i * 3.6 + 1, 6)); }
    g.add(bx(1.2, 2.4, 0.2, COBALT, 2.2, 0.55, 21)); g.add(cyl(0.6, 0.3, 0xffffff, 2.2, 2.95, 21, 10));
  }

  // ---------- car: Kenney sedan, wheels driven by node name ----------
  const car = new THREE.Group(), chassis = new THREE.Group(); car.add(chassis); scene.add(car);
  let wheels = [], frontWheels = [], beams = [], lampMat = null, tailMat = null;
  load('car/sedan').then((src) => {
    if (!src) return;
    const inst = instance(src, { len: 4.4 });
    chassis.add(inst);
    inst.traverse((o) => {
      if (/^wheel/.test(o.name)) { wheels.push(o); if (/front/.test(o.name)) frontWheels.push(o); }
    });
    // repaint: the kit colours the body through a shared palette texture, so swap its red cells for cobalt
    inst.traverse((o) => {
      if (!o.isMesh || !o.material || !o.material.map || o.material.userData.repainted) return;
      const img = o.material.map.image;
      if (!img || !img.width) return;
      const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
      const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0);
      const d = ctx.getImageData(0, 0, c.width, c.height), px = d.data;
      for (let i = 0; i < px.length; i += 4) {
        const r = px[i], g = px[i + 1], b = px[i + 2];
        const max = Math.max(r, g, b), min = Math.min(r, g, b), sat = max ? (max - min) / max : 0;
        const isRedOrange = sat > 0.45 && r > 120 && r > g * 1.35 && r > b * 1.6;
        if (isRedOrange) { const l = max / 255; px[i] = Math.round(47 * l + 20); px[i + 1] = Math.round(91 * l + 20); px[i + 2] = Math.round(234 * l + 15); }
      }
      ctx.putImageData(d, 0, 0);
      const tex = new THREE.CanvasTexture(c); tex.flipY = o.material.map.flipY; tex.colorSpace = THREE.SRGBColorSpace; tex.magFilter = THREE.NearestFilter;
      const m = o.material.clone(); m.map = tex; m.userData.repainted = true; o.material = m;
    });
    // measure the fitted car to hang lights on it
    box.setFromObject(inst); box.getSize(size);
    lampMat = new THREE.MeshStandardMaterial({ color: 0xFFF3C4, emissive: 0xFFE9A8, emissiveIntensity: 0.5, roughness: 0.4 });
    tailMat = new THREE.MeshStandardMaterial({ color: 0xD9463F, emissive: 0xB0231D, emissiveIntensity: 0.6, roughness: 0.4 });
    const halfW = size.x / 2, front = box.max.z, back = box.min.z, lampY = size.y * 0.38;
    for (const sx of [1, -1]) {
      const hl = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.14, 0.06), lampMat); hl.position.set(sx * (halfW - 0.45), lampY, front + 0.02); chassis.add(hl);
      const tl = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.12, 0.05), tailMat); tl.position.set(sx * (halfW - 0.45), lampY + 0.1, back - 0.02); chassis.add(tl);
      const sp = new THREE.SpotLight(0xFFF1C8, 0, 38, 0.42, 0.55, 1.3);
      sp.position.set(sx * (halfW - 0.45), lampY, front); sp.target.position.set(sx * 0.9, 0.1, 12); chassis.add(sp); chassis.add(sp.target); beams.push(sp);
    }
  });
  const puffs = [], puffGeo = new THREE.SphereGeometry(0.2, 6, 5);
  function puff(p) { const m = new THREE.Mesh(puffGeo, new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.8, flatShading: true })); m.position.copy(p); scene.add(m); puffs.push({ m, life: 1 }); }

  // ---------- loop ----------
  const camPos = new THREE.Vector3(), camLook = new THREE.Vector3();
  let firstFrame = true, prevT = 0, prevSpeed = 0, wheelSpin = 0, lastPuff = 0, roll = 0, pitch = 0, steer = 0;
  const tmpTan = new THREE.Vector3(), tmpRight = new THREE.Vector3(), tmpPos = new THREE.Vector3(), tanAhead = new THREE.Vector3();
  function frame(now) {
    const s = Math.min(1, Math.max(0, scrollY / maxScroll));
    updateHud(s);
    const t = roadT(s);
    const speed = t - prevT; prevT = t;
    const accel = speed - prevSpeed; prevSpeed = speed;

    curve.getPointAt(t, tmpPos); curve.getTangentAt(t, tmpTan).setY(0).normalize();
    tmpRight.crossVectors(up, tmpTan).normalize();
    car.position.copy(tmpPos); car.position.y = 0.03 + Math.sin(now * 0.02) * 0.01;
    car.lookAt(tmpPos.clone().add(tmpTan));
    curve.getTangentAt(Math.min(1, t + 0.01), tanAhead).setY(0).normalize();
    const turn = Math.atan2(tmpTan.x * tanAhead.z - tmpTan.z * tanAhead.x, tmpTan.dot(tanAhead));
    const targetSteer = Math.max(-0.45, Math.min(0.45, -turn * 6));
    steer += (targetSteer - steer) * 0.15;
    for (const w of frontWheels) w.rotation.y = steer;
    const sp = Math.min(1, Math.abs(speed) * 2600);
    roll += ((-steer * 0.3 * sp) - roll) * 0.1;
    pitch += ((-accel * 1400) - pitch) * 0.12;
    chassis.rotation.set(Math.max(-0.07, Math.min(0.07, pitch)), 0, roll);
    wheelSpin += speed * 900; for (const w of wheels) w.rotation.x = wheelSpin;
    if (Math.abs(speed) > 0.00008 && now - lastPuff > 90) { lastPuff = now; puff(tmpPos.clone().addScaledVector(tmpTan, -2.3).add(new THREE.Vector3(0.6, 0.45, 0))); }
    for (let i = puffs.length - 1; i >= 0; i--) { const p = puffs[i]; p.life -= 0.02; p.m.position.y += 0.03; p.m.scale.setScalar(1 + (1 - p.life) * 1.6); p.m.material.opacity = p.life * 0.75; if (p.life <= 0) { scene.remove(p.m); p.m.material.dispose(); puffs.splice(i, 1); } }

    // on phones the hero panel sits at the top, so the hero stop uses a low forward camera; later stops lift the car above the bottom sheet
    const heroCam = mobile && s < zones[1].a * 0.6;
    const cBack = heroCam ? 14 : CAM_BACK, cUp = heroCam ? 8.5 : CAM_UP, lAhead = heroCam ? 9 : LOOK_AHEAD, lY = heroCam ? 0.4 : LOOK_Y;
    const desired = tmpPos.clone().addScaledVector(tmpTan, -cBack).addScaledVector(tmpRight, CAM_SIDE).add(new THREE.Vector3(0, cUp, 0));
    const look = tmpPos.clone().addScaledVector(tmpTan, lAhead).addScaledVector(tmpRight, LOOK_SIDE).add(new THREE.Vector3(0, lY, 0));
    if (firstFrame || reduced) { camPos.copy(desired); camLook.copy(look); firstFrame = false; }
    else { camPos.lerp(desired, 0.07); camLook.lerp(look, 0.09); }
    camera.position.copy(camPos); camera.lookAt(camLook);
    sun.position.copy(tmpPos).add(new THREE.Vector3(30, 50, 20)); sun.target.position.copy(tmpPos);

    for (const o of placed) {
      const target = t > o.t - 0.085 ? 1 : 0;
      if (reduced) o.k = target; else o.k += (target - o.k) * 0.09;
      const e = o.k < 0.5 ? 4 * o.k * o.k * o.k : 1 - Math.pow(-2 * o.k + 2, 3) / 2;
      o.group.scale.y = Math.max(0.001, e);
    }

    const dusk = Math.min(1, Math.max(0, (t - 0.8) / 0.18));
    scene.background.copy(SKY_DAY).lerp(SKY_DUSK, dusk);
    scene.fog.color.copy(FOG_DAY).lerp(FOG_DUSK, dusk);
    sun.intensity = 2.2 - dusk * 0.9; hemi.intensity = 1.05 - dusk * 0.25;
    for (const b of beams) b.intensity = dusk > 0.25 ? (dusk - 0.25) * 160 : 0;
    if (lampMat) { lampMat.emissiveIntensity = 0.5 + dusk * 1.8; tailMat.emissiveIntensity = 0.6 + dusk * 1.2; }

    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
