/* The hero: an architect's site plan that rises, stage by stage, into a finished building.
   Every part is drawn three ways: graphite edge lines (the drawing), a screen-space hatch (the section fill) and a lit solid.
   Before its stage a part lies flat on the sheet as plan lines; during its stage it rises, gets hatched, then turns solid.
   u = scroll position in screens: sheet 01 (survey) at u=0, sheet 06 (handover) at u=5, pull-back at u=6. */
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = (t) => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;
const INK = [30 / 255, 34 / 255, 38 / 255], FILM = [228 / 255, 230 / 255, 225 / 255];

export function createScene(canvas, { calm = false, avoid = () => [] } = {}) {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" }); } catch (e) { return null; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const film = new THREE.Color(0xe4e6e1), sky = new THREE.Color(0xd5e1e3);
  scene.background = film.clone();
  scene.fog = new THREE.Fog(film.clone(), 160, 420);
  const camera = new THREE.PerspectiveCamera(30, 1, 0.5, 400);

  const hemi = new THREE.HemisphereLight(0xf4f6f2, 0x8c8580, 1.25);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff3e2, 2.2);
  sun.position.set(18, 30, 14); sun.castShadow = true;
  Object.assign(sun.shadow.camera, { left: -26, right: 26, top: 26, bottom: -26, near: 2, far: 90 });
  sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.03;
  scene.add(sun);

  /* Ground: the sheet itself is the background; a shadow catcher sits on it, and a lawn fades in at handover */
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), new THREE.ShadowMaterial({ opacity: 0.16 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  const radial = (inner, outer) => {
    const c = document.createElement("canvas"); c.width = c.height = 256;
    const g = c.getContext("2d"), gr = g.createRadialGradient(128, 128, 128 * inner, 128, 128, 128 * outer);
    gr.addColorStop(0, "#fff"); gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
    const t = new THREE.CanvasTexture(c); return t;
  };
  const lawnMat = new THREE.MeshStandardMaterial({ color: 0x8aa27a, roughness: 1, transparent: true, opacity: 0, alphaMap: radial(0.04, 1), depthWrite: false });
  const lawn = new THREE.Mesh(new THREE.CircleGeometry(72, 72), lawnMat);
  lawn.rotation.x = -Math.PI / 2; lawn.position.set(0, 0.01, 1.5); lawn.receiveShadow = true; scene.add(lawn);

  /* ---------- Materials ---------- */
  const hatchMat = () => new THREE.ShaderMaterial({
    uniforms: { uOp: { value: 0 }, uPx: { value: renderer.getPixelRatio() } },
    vertexShader: "void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: `uniform float uOp; uniform float uPx;
      void main(){ float d = mod(gl_FragCoord.x - gl_FragCoord.y, 7.0 * uPx); float a = 1.0 - smoothstep(0.9 * uPx, 1.6 * uPx, d);
        vec3 c = mix(vec3(${FILM.join(",")}), vec3(${INK.join(",")}), a * 0.8); gl_FragColor = vec4(c, uOp * 0.92); }`,
    transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1,
  });
  const lineMat = () => new THREE.LineBasicMaterial({ color: 0x1e2226, transparent: true, opacity: 0, toneMapped: false });
  const SOLID = {
    concrete: { color: 0xb9bbb5, roughness: 0.92 },
    footing: { color: 0xa3a69f, roughness: 0.95 },
    render: { color: 0xefede7, roughness: 0.85 },
    granite: { color: 0x8c8580, roughness: 0.9, flatShading: true },
    timber: { color: 0x94643c, roughness: 0.7 },
    roof: { color: 0x3b4f45, roughness: 0.5, metalness: 0.25 },
    frame: { color: 0x2b3034, roughness: 0.45, metalness: 0.3 },
    glass: { color: 0x9fbcc4, roughness: 0.06, metalness: 0.2 },
    paving: { color: 0xcfcbc2, roughness: 0.95 },
    trunk: { color: 0x8a7a66, roughness: 0.95 },
    leaf: { color: 0x4f6f45, roughness: 0.8, side: THREE.DoubleSide },
  };
  const glassMats = [];

  /* ---------- Geometry helpers (bottom of each piece at local y) ---------- */
  const B = (w, h, d, x = 0, y = 0, z = 0) => new THREE.BoxGeometry(w, h, d).translate(x, y + h / 2, z);
  const M = (...g) => mergeGeometries(g.flat().map((x) => { x = x.index ? x.toNonIndexed() : x; for (const k of Object.keys(x.attributes)) if (k !== "position" && k !== "normal") x.deleteAttribute(k); if (!x.attributes.normal) x.computeVertexNormals(); return x; }));
  const between = (a, b, w) => {
    const A = new THREE.Vector3(...a), Bv = new THREE.Vector3(...b), len = A.distanceTo(Bv);
    const g = new THREE.BoxGeometry(w, w, len), m = new THREE.Matrix4();
    m.lookAt(Bv, A, new THREE.Vector3(0, 1, 0)); m.setPosition(A.clone().add(Bv).multiplyScalar(0.5));
    return g.applyMatrix4(m);
  };

  /* ---------- Parts ---------- */
  const parts = [];
  function part(geo, mat, { s, d = 0, base = 0, plan = true, maxOp = 1, edge = 25, shadow = true }) {
    const g = new THREE.Group(); g.position.y = base;
    const solid = new THREE.MeshStandardMaterial({ ...SOLID[mat], transparent: true, opacity: 0, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
    if (mat === "glass") { solid.depthWrite = false; glassMats.push(solid); }
    const mesh = new THREE.Mesh(geo, solid); mesh.castShadow = shadow && mat !== "glass"; mesh.receiveShadow = true;
    const hm = hatchMat(), hatch = new THREE.Mesh(geo, hm); hatch.renderOrder = 1;
    const lm = lineMat(), lines = new THREE.LineSegments(new THREE.EdgesGeometry(geo, edge), lm); lines.renderOrder = 2;
    g.add(mesh, hatch, lines); scene.add(g);
    parts.push({ g, solid, hm, lm, s, d, base, plan, maxOp, glass: mat === "glass" });
  }

  const XS = [-9, -3, 3, 9], ZS = [-5, 0, 5];
  const FL0 = 0.6, FL1 = 4.0, EAVE = 7.0;

  // Sheet 02, foundations
  let i = 0;
  for (const z of ZS) for (const x of XS) part(B(1.7, 0.4, 1.7, x, 0, z), "footing", { s: 1, d: 0.02 * i++ });
  part(M(ZS.map((z) => B(18.4, 0.5, 0.4, 0, 0.1, z)), XS.map((x) => B(0.4, 0.5, 10.4, x, 0.1, 0))), "concrete", { s: 1, d: 0.27 });
  part(B(18.6, 0.15, 10.6, 0, 0.45, 0), "concrete", { s: 1, d: 0.45 });

  // Sheet 03, structure and frame
  i = 0;
  for (const z of ZS) for (const x of XS) part(B(0.4, FL1 - 0.25 - FL0, 0.4, x, 0, z), "concrete", { s: 2, d: 0.012 * i++, base: FL0 });
  part(M(ZS.map((z) => B(18.4, 0.45, 0.35, 0, 0, z)), XS.map((x) => B(0.35, 0.45, 10.4, x, 0, 0))), "concrete", { s: 2, d: 0.2, base: FL1 - 0.7, plan: false });
  part(B(18.6, 0.25, 12.5, 0, 0, 0.95), "concrete", { s: 2, d: 0.28, base: FL1 - 0.25, plan: false });
  i = 0;
  for (const z of ZS) for (const x of XS) part(B(0.36, EAVE - 0.4 - FL1, 0.36, x, 0, z), "concrete", { s: 2, d: 0.34 + 0.008 * i++, base: FL1, plan: false });
  part(M(B(18.4, 0.4, 0.35, 0, 0, -5), B(18.4, 0.4, 0.35, 0, 0, 5), B(0.35, 0.4, 10.4, -9, 0, 0), B(0.35, 0.4, 10.4, 9, 0, 0)), "concrete", { s: 2, d: 0.48, base: EAVE - 0.4, plan: false });
  // stair tower on the left end, a little taller than the eaves
  part(M(B(0.22, 7.8, 4.2, -11.8, 0, -1), B(2.4, 7.8, 0.22, -10.6, 0, -3), B(2.4, 1.2, 0.22, -10.6, 6.6, 1), B(0.9, 6.6, 0.22, -11.15, 0, 1)), "concrete", { s: 2, d: 0.1, base: FL0 });

  // Sheet 04, roof (hipped, deep overhangs, covering the veranda)
  const A = 10.7, Z0 = -6.7, Z1 = 8.6, ZC = (Z0 + Z1) / 2, HB = (Z1 - Z0) / 2, HR = 2.5, RX = A - HB;
  const roofH = (x, z) => Math.max(0, Math.min(HR * (1 - Math.abs(z - ZC) / HB), HR * (A - Math.abs(x)) / HB));
  [-9, -6, -3, 0, 3, 6, 9].forEach((x, k) => {
    const zs = [-5.2, -3, -1, ZC, 3, 5, 7.2], top = zs.map((z) => [x, roofH(x, z) * 0.9, z]);
    const g = [between([x, 0, -5.2], [x, 0, 7.2], 0.12)];
    for (let j = 0; j < top.length - 1; j++) g.push(between(top[j], top[j + 1], 0.12));
    for (let j = 1; j < top.length - 1; j++) g.push(between([x, 0, zs[j]], top[j], 0.08));
    part(M(g), "timber", { s: 3, d: 0.03 * k, base: EAVE, plan: false, edge: 40 });
  });
  {
    const v = (x, y, z) => [x, y, z];
    const tri = [
      v(-A, 0, Z1), v(A, 0, Z1), v(RX, HR, ZC), v(-A, 0, Z1), v(RX, HR, ZC), v(-RX, HR, ZC),
      v(A, 0, Z0), v(-A, 0, Z0), v(-RX, HR, ZC), v(A, 0, Z0), v(-RX, HR, ZC), v(RX, HR, ZC),
      v(-A, 0, Z0), v(-A, 0, Z1), v(-RX, HR, ZC), v(A, 0, Z1), v(A, 0, Z0), v(RX, HR, ZC),
    ].flat();
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(tri, 3)); g.computeVertexNormals();
    part(M(g.translate(0, 0.25, 0).toNonIndexed(), B(2 * A, 0.25, 0.08, 0, 0, Z1), B(2 * A, 0.25, 0.08, 0, 0, Z0), B(0.08, 0.25, Z1 - Z0, -A, 0, ZC), B(0.08, 0.25, Z1 - Z0, A, 0, ZC)), "roof", { s: 3, d: 0.36, base: EAVE });
  }
  part(B(2.8, 0.2, 4.6, -10.6, 0, -1), "concrete", { s: 3, d: 0.3, base: FL0 + 7.8, plan: false });

  // Sheet 05, finishes
  const wallX = (x, h, y0) => B(0.2, h, 10, x, y0, 0);
  part(M(wallX(-9, 2.75, 0), wallX(9, 2.75, 0), B(18, 2.75, 0.2, 0, 0, -5)), "render", { s: 4, d: 0, base: FL0 });
  part(M([-6, 0, 6].map((x) => B(5.7, 2.75, 0.06, x, 0, 5))), "glass", { s: 4, d: 0.04, base: FL0, maxOp: 0.62 });
  part(M([-7.5, -4.5, -1.5, 1.5, 4.5, 7.5].map((x) => B(0.08, 2.75, 0.12, x, 0, 5)), B(18, 0.1, 0.12, 0, 2.3, 5)), "frame", { s: 4, d: 0.08, base: FL0, plan: false });
  part(M(wallX(-9, 2.6, 0), wallX(9, 2.6, 0), B(18, 0.9, 0.2, 0, 0, -5), B(18, 0.5, 0.2, 0, 2.1, -5)), "render", { s: 4, d: 0.12, base: FL1, plan: false });
  part(M(B(18, 1.2, 0.06, 0, 0.9, -5), [-6, 0, 6].map((x) => B(5.7, 2.6, 0.06, x, 0, 5))), "glass", { s: 4, d: 0.16, base: FL1, plan: false, maxOp: 0.62 });
  part(M([-7.5, -4.5, -1.5, 1.5, 4.5, 7.5].map((x) => B(0.08, 2.6, 0.12, x, 0, 5))), "frame", { s: 4, d: 0.18, base: FL1, plan: false });
  part(B(5.8, 1.05, 0.05, 0, 0, 7.1), "glass", { s: 4, d: 0.28, base: FL1, plan: false, maxOp: 0.5 });
  part(M(B(5.9, 0.07, 0.12, 0, 1.05, 7.1)), "timber", { s: 4, d: 0.3, base: FL1, plan: false });
  {
    const fins = [];
    for (const x0 of [-9.1, 3.1]) for (let k = 0; k < 20; k++) fins.push(B(0.06, 2.6, 0.26, x0 + 0.15 + k * 0.3, 0, 7.12));
    part(M(fins, B(6, 0.12, 0.3, -6, 2.6, 7.12), B(6, 0.12, 0.3, 6, 2.6, 7.12)), "timber", { s: 4, d: 0.33, base: FL1, plan: false, edge: 60 });
  }
  part(M(B(18.9, 0.6, 0.15, 0, 0, 5.38), B(18.9, 0.6, 0.15, 0, 0, -5.38), B(0.15, 0.6, 10.9, -9.38, 0, 0), B(0.15, 0.6, 10.9, 9.38, 0, 0)), "granite", { s: 4, d: 0.2 });
  part(M(B(5.6, 0.2, 1.2, 0, 0, 6.05), B(5.6, 0.2, 0.8, 0, 0.2, 5.85), B(5.6, 0.2, 0.4, 0, 0.4, 5.65)), "granite", { s: 4, d: 0.22 });
  part(B(22, 0.04, 8, 0, 0, 10.6), "paving", { s: 4, d: 0.4, shadow: false });

  // boulders: granite already on the site, drawn on the survey and made solid with the landscaping
  const rocks = [];
  const rnd = ((a) => () => ((a = (a * 16807) % 2147483647) / 2147483647))(7);
  [[-15.5, 7.5, 2.4], [-13.4, 11.2, 1.3], [16.2, -6.5, 2.8], [14.6, 9.8, 1.2], [-16.5, -6, 1.7]].forEach(([x, z, r], k) => {
    const g = new THREE.IcosahedronGeometry(r, 1); const p = g.attributes.position;
    for (let j = 0; j < p.count; j++) { const f = 0.78 + rnd() * 0.36; p.setXYZ(j, p.getX(j) * f * 1.15, Math.max(-0.2 * r, p.getY(j) * f * 0.72), p.getZ(j) * f); }
    g.computeVertexNormals(); g.translate(x, 0.1 * r, z);
    part(g, "granite", { s: 4, d: 0.36 + 0.02 * k, edge: 32, plan: false });
    rocks.push([x, z, r]);
  });

  // coconut palms
  [[-13, 3.5, 9.5, 0.3], [13.5, 4, 8.8, -0.4], [-6, 14.5, 7.8, 0.6]].forEach(([x, z, h, lean], k) => {
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(lean * 0.6, h * 0.5, 0.2), new THREE.Vector3(lean * 1.6, h, 0.5)]);
    const trunk = new THREE.TubeGeometry(curve, 12, 0.17, 6, false).translate(x, 0, z);
    const top = curve.getPoint(1).add(new THREE.Vector3(x, 0, z));
    const leaves = [];
    for (let f = 0; f < 9; f++) {
      const L = 3.2 + rnd() * 0.8, g = new THREE.PlaneGeometry(0.7, L, 1, 8).translate(0, L / 2, 0); const p = g.attributes.position;
      for (let j = 0; j < p.count; j++) { const t = p.getY(j) / L; p.setZ(j, -t * t * 2.2); p.setX(j, p.getX(j) * (1 - t * 0.7)); }
      g.rotateX(-1.1 + rnd() * 0.3); g.rotateY((f / 9) * Math.PI * 2 + rnd() * 0.3); g.translate(top.x, top.y, top.z);
      leaves.push(g);
    }
    part(trunk, "trunk", { s: 4, d: 0.42 + k * 0.02, edge: 50 });
    part(M(leaves), "leaf", { s: 4, d: 0.46 + k * 0.02, edge: 80 });
  });

  /* ---------- Survey layer (sheet 01): paper grid, contours, boundary, grid lines, setting-out strings, pegs ---------- */
  const survey = [];
  const addLine = (pts, mat, loop = false) => {
    const g = new THREE.BufferGeometry().setFromPoints(pts.map((p) => new THREE.Vector3(...p)));
    const l = loop ? new THREE.LineLoop(g, mat) : new THREE.Line(g, mat); l.computeLineDistances(); scene.add(l); return l;
  };
  const segs = (arr, mat) => { const g = new THREE.BufferGeometry().setFromPoints(arr.map((p) => new THREE.Vector3(...p))); const l = new THREE.LineSegments(g, mat); scene.add(l); return l; };
  const gridFine = new THREE.LineBasicMaterial({ color: 0x1e2226, transparent: true, opacity: 0.07, toneMapped: false });
  const gridBold = new THREE.LineBasicMaterial({ color: 0x1e2226, transparent: true, opacity: 0.13, toneMapped: false });
  { const f = [], b = []; for (let k = -60; k <= 60; k++) { (k % 5 ? f : b).push([k, 0.004, -60], [k, 0.004, 60], [-60, 0.004, k], [60, 0.004, k]); } segs(f, gridFine); segs(b, gridBold); }
  survey.push({ m: gridFine, op: 0.07, keep: 0.45 }, { m: gridBold, op: 0.13, keep: 0.45 });

  const draw = []; // lines that draw themselves on at load
  for (let k = 0; k < 11; k++) {
    const r = 21 + k * 4.4, pts = [];
    for (let j = 0; j <= 180; j++) {
      const a = (j / 180) * Math.PI * 2, w = 1 + 0.07 * Math.sin(a * 3 + k * 0.7) + 0.04 * Math.sin(a * 7 - k);
      pts.push([-34 + Math.cos(a) * r * w * 1.25, 0.008, -30 + Math.sin(a) * r * w]);
    }
    const m = new THREE.LineDashedMaterial({ color: 0x1e2226, transparent: true, opacity: k % 5 === 0 ? 0.42 : 0.24, dashSize: 0, gapSize: 1e4, toneMapped: false });
    const l = addLine(pts, m); const len = l.geometry.attributes.lineDistance.array.at(-1);
    draw.push({ m, len, delay: k * 0.07 }); survey.push({ m, op: m.opacity, keep: 0.35 });
  }
  const orange = (op = 0.95) => new THREE.LineBasicMaterial({ color: 0xff5b14, transparent: true, opacity: op, toneMapped: false });
  const bound = new THREE.LineDashedMaterial({ color: 0xff5b14, transparent: true, opacity: 0.9, dashSize: 0.9, gapSize: 0.45, toneMapped: false });
  addLine([[-18, 0.01, -12], [18.5, 0.01, -13], [20.5, 0.01, 15.5], [-17, 0.01, 17]], bound, true);
  survey.push({ m: bound, op: 0.9, keep: 0, out: [3.2, 4.2] });

  const axisMat = new THREE.LineDashedMaterial({ color: 0x1e2226, transparent: true, opacity: 0.5, dashSize: 1.6, gapSize: 0.35, toneMapped: false });
  XS.forEach((x) => addLine([[x, 0.012, -8.5], [x, 0.012, 9.6]], axisMat));
  ZS.forEach((z) => addLine([[-13.3, 0.012, z], [12.6, 0.012, z]], axisMat));
  survey.push({ m: axisMat, op: 0.5, keep: 0, out: [1.2, 2.2] });

  // setting-out strings between profile boards, and pegs
  const strMat = orange(0.85), boardMat = new THREE.MeshStandardMaterial({ color: 0xc9a77c, roughness: 0.8, transparent: true });
  const tipMat = new THREE.MeshStandardMaterial({ color: 0xff5b14, roughness: 0.6, transparent: true, emissive: 0x501a00 });
  const str = [], boards = [], pegs = [];
  XS.forEach((x) => str.push([x, 0.5, -7.4], [x, 0.5, 7.4]));
  ZS.forEach((z) => str.push([-11.4, 0.5, z], [11.4, 0.5, z]));
  segs(str, strMat);
  XS.forEach((x) => [-7.4, 7.4].forEach((z) => boards.push(B(1.1, 0.12, 0.05, x, 0.44, z), B(0.06, 0.56, 0.06, x - 0.5, 0, z), B(0.06, 0.56, 0.06, x + 0.5, 0, z))));
  ZS.forEach((z) => [-11.4, 11.4].forEach((x) => boards.push(B(0.05, 0.12, 1.1, x, 0.44, z), B(0.06, 0.56, 0.06, x, 0, z - 0.5), B(0.06, 0.56, 0.06, x, 0, z + 0.5))));
  [[-9.6, -5.6], [9.6, -5.6], [9.6, 5.6], [-9.6, 5.6]].forEach(([x, z]) => pegs.push(B(0.07, 0.42, 0.07, x, 0, z)));
  const bMesh = new THREE.Mesh(M(boards), boardMat); bMesh.castShadow = true; scene.add(bMesh);
  const pMesh = new THREE.Mesh(M(pegs, [[-9.6, -5.6], [9.6, -5.6], [9.6, 5.6], [-9.6, 5.6]].map(([x, z]) => B(0.1, 0.1, 0.1, x, 0.42, z))), tipMat); scene.add(pMesh);
  survey.push({ m: strMat, op: 0.85, keep: 0, out: [3.0, 3.9] }, { m: boardMat, op: 1, keep: 0, out: [3.0, 3.9] }, { m: tipMat, op: 1, keep: 0, out: [3.0, 3.9] });

  // dimension lines with ticks, grid bubbles: sprites with drafting lettering
  const dimMat = orange(0.9);
  const tick = (x, z, ax) => (ax === "x" ? [[x - 0.25, 0.012, z + 0.25], [x + 0.25, 0.012, z - 0.25]] : [[x - 0.25, 0.012, z - 0.25], [x + 0.25, 0.012, z + 0.25]]);
  segs([[-9, 0.012, 10.8], [9, 0.012, 10.8], ...tick(-9, 10.8, "x"), ...tick(9, 10.8, "x"), ...tick(-3, 10.8, "x"), ...tick(3, 10.8, "x"),
    [14, 0.012, -5], [14, 0.012, 5], ...tick(14, -5, "z"), ...tick(14, 5, "z"), ...tick(14, 0, "z")], dimMat);
  survey.push({ m: dimMat, op: 0.9, keep: 0, out: [1.2, 2.2] });
  const label = (text, { bubble = false, size = 1.5, color = "#1E2226" } = {}) => {
    const c = document.createElement("canvas"); c.width = 256; c.height = 128; const g = c.getContext("2d");
    g.fillStyle = color; g.strokeStyle = color; g.lineWidth = 5; g.textAlign = "center"; g.textBaseline = "middle";
    g.font = `500 ${bubble ? 64 : 56}px "Barlow Semi Condensed", sans-serif`;
    if (bubble) { g.beginPath(); g.arc(128, 64, 50, 0, Math.PI * 2); g.stroke(); }
    g.fillText(text, 128, 66);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    const m = new THREE.SpriteMaterial({ map: t, transparent: true, toneMapped: false, depthWrite: false });
    const s = new THREE.Sprite(m); s.scale.set(size * 2, size, 1); scene.add(s); return { s, m };
  };
  const labels = [];
  const lab = (t, p, o) => { const L = label(t, o); L.s.position.set(...p); L.vis = 1; labels.push(L); survey.push({ m: L.m, op: 1, keep: 0, out: [1.2, 2.2], label: L }); };
  ["A", "B", "C", "D"].forEach((t, k) => lab(t, [XS[k], 0.9, -9.6], { bubble: true }));
  ["1", "2", "3"].forEach((t, k) => lab(t, [-14.4, 0.9, ZS[k]], { bubble: true }));
  lab("18 000", [0, 0.6, 11.7], { color: "#C63E00" });
  lab("10 000", [15.6, 0.6, 0], { color: "#C63E00" });
  lab("Boundary", [17.2, 0.6, 15.6], { color: "#C63E00", size: 1.2 });

  // boulders on the survey: irregular outlines with a stipple ring
  const rockMat = new THREE.LineBasicMaterial({ color: 0x1e2226, transparent: true, opacity: 0.6, toneMapped: false });
  rocks.forEach(([x, z, r], k) => {
    const pts = [], inner = [];
    for (let j = 0; j <= 14; j++) { const a = (j / 14) * Math.PI * 2, f = 1 + 0.16 * Math.sin(a * 3 + k) + 0.08 * Math.cos(a * 5 - k);
      pts.push([x + Math.cos(a) * r * 1.15 * f, 0.015, z + Math.sin(a) * r * f]); inner.push([x + Math.cos(a) * r * 0.75 * f, 0.015, z + Math.sin(a) * r * 0.62 * f]); }
    addLine(pts, rockMat); addLine(inner.slice(2, 9), rockMat);
  });
  survey.push({ m: rockMat, op: 0.6, keep: 0, out: [3.7, 4.4] });

  /* ---------- Camera path ---------- */
  const P = [[0.5, 74, 15], [30, 20, 38], [-38, 21, 36], [-21, 46, 44], [34, 10, 46], [42, 16, 54], [8, 60, 85]];
  const T = [[0, 0, 1.5], [-4, 1, 1], [-1, 3.2, 1], [0, 4.5, 1], [-4, 4.6, 2], [-2, 4, 1.5], [0, 2, 2]];
  const camPath = new THREE.CatmullRomCurve3(P.map((p) => new THREE.Vector3(...p)), false, "centripetal");
  const tgtPath = new THREE.CatmullRomCurve3(T.map((p) => new THREE.Vector3(...p)), false, "centripetal");
  const tmp = new THREE.Vector3(), want = new THREE.Vector3(), wantT = new THREE.Vector3(), cur = new THREE.Vector3(), curT = new THREE.Vector3();
  let distK = 1, started = false;

  function resize() {
    const w = innerWidth, h = innerHeight, phone = w <= 860;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    if (phone) camera.setViewOffset(w, h, 0, h * 0.2, w, h); else camera.setViewOffset(w, h, -w * 0.2, h * 0.04, w, h);
    camera.updateProjectionMatrix();
    const a = w / h; camera.fov = a < 1 ? 40 : 30; camera.updateProjectionMatrix();
    const hv = Math.tan((camera.fov * Math.PI) / 360) * a; distK = Math.max(1, (Math.tan((30 * Math.PI) / 360) * 1.3) / hv) * (a < 1 ? 0.74 : 1);
    parts.forEach((p) => (p.hm.uniforms.uPx.value = renderer.getPixelRatio()));
  }
  resize();

  /* ---------- Per-frame ---------- */
  const t0 = performance.now();
  let u = 0, su = 0, last = performance.now();
  const col = new THREE.Color();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    su = calm ? u : lerp(su, u, 1 - Math.exp(-dt * 7));
    const v = su;

    // load moment: contours draw themselves on
    const lt = calm ? 9 : (now - t0) / 1000;
    for (const d of draw) d.m.dashSize = d.len * ease(clamp((lt - 0.2 - d.delay) / 1.6));

    const hand = ease(clamp((v - 4.15) / 0.8));
    const lineOp = lerp(1, 0.16, hand), planOp = 0.7;
    for (const p of parts) {
      const st = clamp((v - (p.s - 1) - 0.08) / 0.84), q = clamp((st - p.d) / 0.5);
      const rise = ease(clamp(q / 0.5)), hatch = clamp(q / 0.3) * (1 - ease(clamp((q - 0.6) / 0.35)));
      const sol = ease(clamp((q - 0.4) / 0.55));
      p.g.scale.y = Math.max(0.002, rise);
      p.g.position.y = lerp(0.02, p.base, rise);
      const pre = p.plan ? planOp : 0;
      p.lm.opacity = rise <= 0 ? pre : lerp(p.plan ? pre : 0, lineOp, clamp(rise * 3));
      p.hm.uniforms.uOp.value = hatch * (p.glass ? 0.4 : 1);
      p.hm.visible = hatch > 0.001;
      p.solid.opacity = sol * p.maxOp;
      p.solid.visible = sol > 0.001;
      const opaque = sol >= 0.999 && !p.glass;
      if (p.solid.transparent === opaque) { p.solid.transparent = !opaque; p.solid.needsUpdate = true; }
    }
    for (const sv of survey) {
      const out = sv.out ? 1 - ease(clamp((v - sv.out[0]) / (sv.out[1] - sv.out[0]))) : lerp(1, sv.keep, hand);
      sv.m.opacity = sv.op * out * (sv.label ? sv.label.vis : 1);
      sv.m.visible = sv.m.opacity > 0.002;
    }
    for (const g of glassMats) { g.emissive.setHex(0xffd49a); g.emissiveIntensity = hand * 0.55; }
    lawnMat.opacity = hand * 0.9;
    col.copy(film).lerp(sky, hand); scene.background.copy(col); scene.fog.color.copy(col);
    sun.intensity = lerp(2.2, 2.8, hand); hemi.intensity = lerp(1.25, 1.05, hand);
    ground.material.opacity = lerp(0.14, 0.22, clamp(v - 1));

    camPath.getPoint(clamp(v / 6), want); tgtPath.getPoint(clamp(v / 6), wantT);
    if (innerWidth <= 860) { want.x -= wantT.x; wantT.x = 0; } // the sideways nudges are for the desktop text column only
    want.sub(wantT).multiplyScalar(distK).add(wantT);
    if (!started || calm) { cur.copy(want); curT.copy(wantT); started = true; }
    else { const k = 1 - Math.exp(-dt * 5); cur.lerp(want, k); curT.lerp(wantT, k); }
    camera.position.copy(cur); camera.lookAt(curT);
    camera.updateMatrixWorld();

    // 3D labels never sit under the caption or the title block
    const rects = avoid(), W = innerWidth, Hh = innerHeight;
    for (const L of labels) {
      tmp.copy(L.s.position).project(camera);
      const x = (tmp.x + 1) / 2 * W, y = (1 - tmp.y) / 2 * Hh, r = 70;
      const hit = tmp.z > 1 || x < 0 || x > W || y < 60 || y > Hh || rects.some((b) => x > b.left - r && x < b.right + r && y > b.top - 30 && y < b.bottom + 30);
      L.vis = calm ? (hit ? 0 : 1) : lerp(L.vis, hit ? 0 : 1, 1 - Math.exp(-dt * 12));
    }

    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  return { set: (x) => (u = x), resize };
}
