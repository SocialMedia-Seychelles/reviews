/* Homemakers concept v4: a 3D house that builds itself as you scroll.
   It starts as a flat floor plan, the camera flies to each of the seven stages (foundations to garden), gold points on the
   model open each department, and photo cards float beside the house. Three.js + Lenis, no build step. */
import * as THREE from "three";

const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const MAIL = "pnjsupplies@seychelles.net";
const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
const rec = /[?&]rec\b/.test(location.search); // recording mode: camera follows the scroll exactly
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = (t) => t * t * (3 - 2 * t);
const easeIO = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/* ---------- Content ---------- */
const STAGES = [
  { n: 1, title: "Foundations", line: "Start with what holds it all up.", pic: "builder",
    groups: [{ name: "Building materials", img: "d-building", at: [-3.4, 0.45, 2.7], items: ["Cement (50 kg bags)", "Steel bars", "Welded mesh", "Sand and aggregate", "Blocks"] }] },
  { n: 2, title: "Frame & roof", line: "Timber in the sizes builders ask for, and a roof over it.", pic: "timber-stack",
    groups: [{ name: "Timber", img: "d-timber", at: [0, 4.45, 1.2], items: ["Timber 2×2", "Timber 4×2", "Timber 6×2", "Timber 9×2", "Roofing timber", "Decking boards", "Fencing panels", "Sheds"] }] },
  { n: 3, title: "Walls & floors", line: "Tiles to walk on and paint to live with.", pic: "paint-room",
    groups: [
      { name: "Floor & wall tiles", img: "d-tiles", at: [-1.8, 0.45, 1.7], items: ["Matt floor tiles", "Shiny floor tiles", "Granular tiles", "Slip-resistant outdoor tiles", "Textured wall tiles", "Tile adhesive and grout"] },
      { name: "Paint & varnish", img: "d-paint", at: [-3.7, 1.8, 1.0], items: ["Exterior paint", "Interior paint", "Wood varnish", "Fence and shed stain", "Brushes and rollers"] }] },
  { n: 4, title: "Bathroom & fittings", line: "Sanitary ware, plus the pipes and wires behind the walls.", pic: "bathroom",
    groups: [
      { name: "Bathroom & sanitary ware", img: "d-bathroom", at: [3.1, 1.0, -2.5], items: ["Toilet", "Wash basin", "Bath", "Taps and mixers", "Bathroom accessories"] },
      { name: "Plumbing & electrical", img: "d-electrical", at: [1.75, 1.9, -1.7], items: ["Plumbing fittings", "Breakers", "Sockets and switches", "Cable", "Light fittings", "Silicone sealant"] }] },
  { n: 5, title: "Furnishing", line: "Rooms you want to come home to.", pic: "sofa-room",
    groups: [
      { name: "Furniture", img: "d-furniture", at: [-2.3, 1.2, 2.5], items: ["Sofa", "Dining set", "Bedroom set", "Office furniture", "Outdoor furniture"] },
      { name: "Mattresses & foam", img: "d-mattress", photo: true, at: [-2.3, 0.95, -1.9], items: ["Single mattress", "Double mattress", "Queen mattress", "Foam cut to size"] },
      { name: "Home appliances", img: "d-appliances", at: [3.55, 2.3, 0.0], items: ["Washing machine", "Fridge", "Dishwasher", "Cooker hood", "Microwave"] }] },
  { n: 6, title: "Kitchen & everyday", line: "Everything a busy house goes through in a week.", pic: "kitchen",
    groups: [
      { name: "Kitchen & tableware", img: "d-kitchen", at: [3.6, 1.45, 1.7], items: ["Cookware set", "Knife block", "Dinner set", "Oven dishes", "Luminarc glassware"] },
      { name: "Plastic ware", img: "d-plastic", at: [2.95, 0.85, 0.45], items: ["Storage containers", "Bins", "Water bottles", "Basins"] },
      { name: "Household supplies", img: "d-household", at: [1.2, 0.9, -0.2], items: ["Mop and bucket", "Brooms", "Dustpan and brush", "Cleaning products"] }] },
  { n: 7, title: "Outside", line: "The garden, the deck and the tools that keep it all going.", pic: "garden",
    groups: [
      { name: "Garden", img: "d-garden", at: [-4.9, 0.5, 4.7], items: ["Garden hose", "Watering can", "Spade and fork", "Rake", "Wheelbarrow"] },
      { name: "Tools & power tools", img: "d-tools", at: [-2.6, 0.95, 6.0], items: ["Drill", "Jigsaw", "Hand tools set", "Drill bits and hole saws"] }] },
];
const END = 8; // scroll units (screen heights) in the journey

/* ---------- Page chrome ---------- */
$("[data-stagelist]").innerHTML = STAGES.map((s) => `<li><button type="button" data-go="${s.n}">${s.title}</button></li>`).join("");
$("[data-deptlist]").innerHTML = STAGES.map((s) => `<li><span>${s.title}</span>${s.groups.map((g, i) => `<button type="button" data-dept="${s.n}:${i}">${g.name}</button>`).join("")}</li>`).join("");
$("[data-hotspots]").innerHTML =
  STAGES.flatMap((s) => s.groups.map((g, i) => `<button type="button" class="hs" data-dept="${s.n}:${i}" data-hs="${s.n}" tabindex="-1"><i></i><span>${g.name}</span></button>`)).join("") +
  [["Living", -2.3, 1.5], ["Kitchen", 2.4, 1.5], ["Bath", 2.8, -1.8], ["Bedroom", -2.3, -1.8]].map(([t, x, z]) => `<span class="plan-label" data-plan="${x},${z}">${t}</span>`).join("");

let lenis = null;
if (!calm && !rec && window.Lenis) {
  lenis = new Lenis({ lerp: 0.09 });
  const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
}
const scrollToY = (y) => (lenis ? lenis.scrollTo(y, { duration: 1.6 }) : window.scrollTo({ top: y, behavior: calm ? "auto" : "smooth" }));
const go = (n) => scrollToY(n * innerHeight);
document.addEventListener("click", (ev) => {
  const g = ev.target.closest("[data-go]");
  if (g) { ev.preventDefault(); go(+g.dataset.go); return; }
  const a = ev.target.closest('a[href^="#"]');
  if (a && a.getAttribute("href").length > 1 && lenis) { ev.preventDefault(); lenis.scrollTo(a.getAttribute("href"), { duration: 1.6 }); }
});

/* Caption for the current stage */
let shown = -1;
function caption(i) {
  if (i === shown) return; shown = i;
  const c = $("[data-caption]");
  if (i === 0) {
    c.innerHTML = `<h1 class="title">Homemakers</h1>
      <p class="lede">Your total home store in Seychelles. Scroll to build a house, from the plan to the garden, and find everything it needs on the way.</p>
      <p class="status" data-status><span class="dot"></span><span data-status-text>Mon to Fri, 8am to 6pm</span></p>`;
    status();
  } else {
    const s = STAGES[i - 1];
    c.innerHTML = `<img class="cap-pic" src="assets/img/${s.pic}.webp" alt="">
      <p class="step">Stage ${s.n} of 7</p><h2>${s.title}</h2><p class="lede">${s.line}</p>
      <div class="cap-groups">${s.groups.map((g, k) => `<button type="button" class="btn light" data-dept="${s.n}:${k}">${g.name}</button>`).join("")}</div>`;
  }
  c.classList.remove("in"); void c.offsetWidth; c.classList.add("in");
  $$("[data-stagelist] button").forEach((b) => b.toggleAttribute("aria-current", +b.dataset.go === i));
}

/* ---------- 3D scene ---------- */
const canvas = $("#scene");
let renderer = null;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" }); } catch (e) { renderer = null; }
if (!renderer) document.documentElement.classList.add("no3d");

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(38, innerWidth / innerHeight, 0.1, 200);
const anim = [], cards = [];
let roof, roofMats = [], wallMat, gableMat, planMat, tiles, tileData = [], gridMat;
const FY = 0.3, H = 2.6;

if (renderer) build();

function build() {
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  scene.background = new THREE.Color(0x0b1d3a);
  scene.fog = new THREE.Fog(0x0b1d3a, 30, 80);

  scene.add(new THREE.HemisphereLight(0xc4dcff, 0x14284a, 1.1));
  const sun = new THREE.DirectionalLight(0xfff1dc, 2.4);
  sun.position.set(9, 15, 7); sun.castShadow = true;
  Object.assign(sun.shadow.camera, { left: -15, right: 15, top: 15, bottom: -15, near: 1, far: 50 });
  sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02;
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0x86b4ff, 0.6); fill.position.set(-10, 6, -8); scene.add(fill);

  const std = (c, r = 0.85, m = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
  const M = {
    ground: std(0x0f2546, 1), slab: std(0xa9b0ba, .95), timber: std(0xd8b37f, .75), dark: std(0x7b5030, .7),
    white: std(0xf7f9fc, .45), steel: std(0xcfd6de, .35, .4), fabric: std(0x2a4f86, .95), mattress: std(0xffffff, .9),
    tile: std(0xe2e8ef, .35), floorWood: std(0xc79a63, .7), granite: std(0x28313d, .4),
    lawn: std(0x5a8d4e, 1), leaf: std(0x3d7d45, .9), trunk: std(0x8a6a48, .9), gold: std(0xc1b452, .6), red: std(0xc8473b, .5),
    blueP: std(0x2f7fd0, .5), greenP: std(0x2e9e5b, .5), sand: std(0xd8bf8d, 1), cement: std(0xdde1e6, .9), steelBar: std(0x6b7380, .5, .5),
    accent: std(0x4d86c6, .9), concrete: std(0xbfc5cc, .95), copper: std(0xb87333, .35, .6),
    water: new THREE.MeshStandardMaterial({ color: 0x9fd0ff, roughness: .05, transparent: true, opacity: .7 }),
    glass: new THREE.MeshStandardMaterial({ color: 0xa8d4ff, roughness: .05, transparent: true, opacity: .32 }),
    bulb: new THREE.MeshStandardMaterial({ color: 0xffe9a8, emissive: 0xffd87a, emissiveIntensity: 1.4 }),
  };
  wallMat = std(0xb9bec6, .9); gableMat = wallMat.clone(); gableMat.transparent = true;
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x0a5fae, roughness: .45, metalness: .15, transparent: true });
  const ridgeMat = new THREE.MeshStandardMaterial({ color: 0x07427a, roughness: .5, transparent: true });
  const trussMat = M.timber.clone(); trussMat.transparent = true;
  roofMats = [roofMat, ridgeMat, trussMat, gableMat];

  const box = (w, h, d, m) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  const bbox = (w, h, d, m) => { const g = new THREE.BoxGeometry(w, h, d); g.translate(0, h / 2, 0); return new THREE.Mesh(g, m); };
  const cyl = (rt, rb, h, m, seg = 16) => { const g = new THREE.CylinderGeometry(rt, rb, h, seg); g.translate(0, h / 2, 0); return new THREE.Mesh(g, m); };
  const shadow = (o) => o.traverse((c) => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
  function add(o, n, opt = {}, parent = scene) {
    if (opt.shadow !== false) shadow(o);
    o.userData.base = { y: o.position.y, s: o.scale.clone() };
    anim.push({ o, n, d: opt.d || 0, mode: opt.mode || "pop", out: opt.out });
    parent.add(o); return o;
  }
  const at = (o, x, y, z) => { o.position.set(x, y, z); return o; };

  // Ground, blueprint grid and the floor plan
  const ground = new THREE.Mesh(new THREE.CircleGeometry(70, 64), M.ground);
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.1; ground.receiveShadow = true; scene.add(ground);
  const grid = new THREE.GridHelper(70, 70, 0x2f6fb5, 0x1c4579); grid.position.y = -0.09;
  gridMat = grid.material; gridMat.transparent = true; gridMat.opacity = .55; scene.add(grid);

  const plan = [];
  const rect = (x0, z0, x1, z1) => plan.push(x0, 0, z0, x1, 0, z0, x1, 0, z0, x1, 0, z1, x1, 0, z1, x0, 0, z1, x0, 0, z1, x0, 0, z0);
  rect(-4.1, -3.1, 4.1, 3.1); rect(-3.9, -2.9, 3.9, 2.9);
  rect(1.54, -2.9, 1.66, -0.6); rect(1.6, -0.66, 3.9, -0.54); rect(-0.66, -2.9, -0.54, -0.6); rect(-3.9, -0.66, -0.6, -0.54);
  const arc = (cx, cz, r, a0, a1) => { const N = 14; for (let i = 0; i < N; i++) { const a = a0 + (a1 - a0) * i / N, b = a0 + (a1 - a0) * (i + 1) / N; plan.push(cx + Math.cos(a) * r, 0, cz + Math.sin(a) * r, cx + Math.cos(b) * r, 0, cz + Math.sin(b) * r); } };
  arc(-0.8, 3, 1.0, -Math.PI / 2, 0); arc(1.8, -0.6, 0.8, 0, Math.PI / 2); arc(-1.6, -0.6, 0.8, Math.PI / 2, Math.PI);
  for (const [a, b] of [[-3, -1.6], [1.4, 3]]) plan.push(a, 0, 3.25, b, 0, 3.25);
  const pg = new THREE.BufferGeometry(); pg.setAttribute("position", new THREE.Float32BufferAttribute(plan, 3));
  planMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1 });
  const planLines = new THREE.LineSegments(pg, planMat); planLines.position.y = 0.02; scene.add(planLines);

  /* Stage 1: slab and building supplies */
  add(at(bbox(8.4, FY, 6.4, M.slab), 0, 0, 0), 1, { mode: "rise", d: 0 });
  for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) for (let k = 0; k < 3; k++)
    add(at(box(0.42, 0.2, 0.2, M.concrete), -6.6 + j * 0.44, 0.1 + k * 0.21, 2.2 + i * 0.22), 1, { d: .25 + k * .12 + i * .03, out: 4 });
  add(at(bbox(1.3, 0.12, 1.0, M.dark), 6.0, 0, 2.6), 1, { d: .3, out: 4 });
  for (let k = 0; k < 3; k++) for (let i = 0; i < 2; i++)
    add(at(box(0.58, 0.18, 0.42, M.cement), 5.7 + i * 0.62, 0.21 + k * 0.19, 2.6 + (k % 2) * 0.05), 1, { d: .45 + k * .12, out: 4 });
  for (let i = 0; i < 7; i++) { const r = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, 4.2, 6), M.steelBar); r.rotation.z = Math.PI / 2; add(at(r, 5.6, 0.05 + (i % 2) * 0.06, -2.2 + i * 0.08), 1, { d: .55 + i * .02, out: 4 }); }
  add(at(new THREE.Mesh(new THREE.ConeGeometry(1.1, 0.8, 18), M.sand), -6.2, 0.3, -2.4), 1, { d: .5, out: 4 });

  /* Stage 2: timber frame and the roof */
  const posts = [];
  for (const x of [-4, -2, 0, 2, 4]) posts.push([x, -3], [x, 3]);
  posts.push([-4, -1], [-4, 1], [4, -1], [4, 1]);
  posts.forEach(([x, z], i) => add(at(bbox(0.16, H, 0.16, M.timber), x, FY, z), 2, { mode: "rise", d: i * 0.02 }));
  for (const z of [-3, 3]) add(at(bbox(8.2, 0.14, 0.18, M.timber), 0, FY + H - 0.14, z), 2, { d: .3 });
  for (const x of [-4, 4]) add(at(bbox(0.18, 0.14, 6.2, M.timber), x, FY + H - 0.14, 0), 2, { d: .32 });
  roof = new THREE.Group(); scene.add(roof);
  const RISE = 1.5, HZ = 3.35, A = Math.atan2(RISE, HZ), SL = Math.hypot(HZ, RISE);
  [-4, -2, 0, 2, 4].forEach((x, i) => {
    add(at(box(0.1, 0.12, 6.7, trussMat), x, FY + H + 0.06, 0), 2, { d: .38 + i * .04 }, roof);
    add(at(bbox(0.1, RISE, 0.1, trussMat), x, FY + H, 0), 2, { mode: "rise", d: .42 + i * .04 }, roof);
    for (const s of [1, -1]) { const r = box(0.1, 0.12, SL, trussMat); r.rotation.x = s * A; add(at(r, x, FY + H + RISE / 2 - 0.08, s * HZ / 2), 2, { d: .45 + i * .04 }, roof); }
  });
  for (const s of [1, -1]) for (let k = 0; k < 4; k++) {
    const seg = box(2.22, 0.07, SL + 0.12, roofMat); seg.rotation.x = s * A;
    add(at(seg, -3.33 + k * 2.22, FY + H + RISE / 2 + 0.03, s * HZ / 2), 2, { mode: "drop", d: .7 + k * .06 + (s > 0 ? 0 : .03) }, roof);
  }
  add(at(box(8.9, 0.12, 0.3, ridgeMat), 0, FY + H + RISE + 0.04, 0), 2, { mode: "drop", d: .98 }, roof);

  /* Stage 3: walls, windows, tiles and paint */
  function wall(axis, fixed, from, to, holes, T, d) {
    const L = to - from; let c = 0, i = 0;
    const seg = (a, b, y0, y1) => {
      if (b - a < 0.01 || y1 - y0 < 0.01) return;
      const m = bbox(axis === "x" ? b - a : T, y1 - y0, axis === "x" ? T : b - a, wallMat), mid = from + (a + b) / 2;
      if (axis === "x") m.position.set(mid, FY + y0, fixed); else m.position.set(fixed, FY + y0, mid);
      add(m, 3, { mode: "rise", d: d + (i++) * 0.03 });
    };
    holes.sort((p, q) => p[0] - q[0]);
    for (const [a, b, bot, top] of holes) { seg(c, a, 0, H); seg(a, b, 0, bot); seg(a, b, top, H); c = b; }
    seg(c, L, 0, H);
    for (const [a, b, bot, top] of holes) {
      if (bot < 0.1) continue;
      const g = box(axis === "x" ? b - a : 0.03, top - bot, axis === "x" ? 0.03 : b - a, M.glass), mid = from + (a + b) / 2;
      if (axis === "x") g.position.set(mid, FY + (bot + top) / 2, fixed); else g.position.set(fixed, FY + (bot + top) / 2, mid);
      add(g, 3, { d: .95, shadow: false });
    }
  }
  wall("x", 3, -4, 4, [[3.2, 4.2, 0, 2.1], [1.0, 2.4, 0.9, 2.1], [5.4, 7.0, 0.9, 2.1]], 0.2, 0);
  wall("x", -3, -4, 4, [[1.0, 2.4, 0.9, 2.1], [6.0, 7.0, 1.5, 2.1]], 0.2, .05);
  wall("z", -4, -3, 3, [[1.2, 2.4, 0.9, 2.1], [3.8, 5.0, 0.9, 2.1]], 0.2, .1);
  wall("z", 4, -3, 3, [[3.6, 5.2, 0.9, 2.1]], 0.2, .12);
  wall("x", -0.6, 1.6, 4, [[0.2, 1.0, 0, 2.05]], 0.12, .2);
  wall("z", 1.6, -3, -0.6, [], 0.12, .22);
  wall("z", -0.6, -3, -0.6, [], 0.12, .24);
  wall("x", -0.6, -4, -0.6, [[2.2, 3.0, 0, 2.05]], 0.12, .26);
  const door = bbox(0.06, 2.05, 0.95, M.dark); door.rotation.y = -0.9; add(at(door, -0.78, FY, 3.05), 3, { d: .9 });
  const tri = new THREE.Shape(); tri.moveTo(-3.1, 0); tri.lineTo(3.1, 0); tri.lineTo(0, RISE); tri.closePath();
  for (const x of [-4.1, 3.9]) { const gg = new THREE.ExtrudeGeometry(tri, { depth: 0.2, bevelEnabled: false }); gg.rotateY(Math.PI / 2); add(at(new THREE.Mesh(gg, gableMat), x, FY + H, 0), 3, { mode: "rise", d: .5 }, roof); }
  // tiles: one instanced mesh, laid from the front door inwards
  const spots = [];
  for (let x = -3.65; x < 3.9; x += 0.5) for (let z = -0.3; z < 2.95; z += 0.5) spots.push([x, z, 0]);
  for (let x = 1.9; x < 3.9; x += 0.5) for (let z = -2.65; z < -0.65; z += 0.5) spots.push([x, z, 1]);
  tiles = new THREE.InstancedMesh(new THREE.BoxGeometry(0.47, 0.03, 0.47), M.tile, spots.length);
  tiles.receiveShadow = true; tiles.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const cA = new THREE.Color(0xe6ecf2), cB = new THREE.Color(0xd3dce6), cBath = new THREE.Color(0x8fb9e0);
  spots.forEach(([x, z, bath], i) => {
    tiles.setColorAt(i, bath ? cBath : ((Math.round(x * 2) + Math.round(z * 2)) % 2 ? cA : cB));
    tileData.push({ x, z, d: clamp(Math.hypot(x + 0.3, z - 3) / 7) });
  });
  scene.add(tiles);
  for (let i = 0; i < 6; i++) add(at(bbox(3.2, 0.03, 0.38, M.floorWood), -2.25, FY, -2.68 + i * 0.4), 3, { d: .55 + i * .05 });
  add(at(box(0.02, 2.2, 2.6, M.accent), -3.885, FY + 1.2, 1.45), 3, { d: .97 });
  add(at(cyl(.16, .16, .22, M.blueP), -3.3, FY, 2.4), 3, { d: .9, out: 4.6 });
  const roller = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, .3, 10), M.gold); roller.rotation.z = Math.PI / 2; add(at(roller, -2.9, FY + .05, 2.5), 3, { d: .92, out: 4.6 });

  /* Stage 4: bathroom, plumbing, lights */
  add(at(bbox(1.6, 0.55, 0.75, M.white), 3.1, FY, -2.55), 4, { d: .1 });
  add(at(box(1.4, 0.04, 0.55, M.water), 3.1, FY + 0.53, -2.55), 4, { d: .3 });
  const wc = new THREE.Group(); wc.add(cyl(.17, .2, .42, M.white)); wc.add(at(bbox(.42, .36, .18, M.white), 0, .38, -.2)); wc.add(at(box(.38, .04, .46, M.white), 0, .44, .04));
  add(at(wc, 2.05, FY, -2.55), 4, { d: .2 });
  const basin = new THREE.Group(); basin.add(cyl(.08, .1, .72, M.white)); basin.add(at(box(.55, .14, .42, M.white), 0, .78, 0)); basin.add(at(cyl(.015, .015, .14, M.steel), 0, .85, -.14));
  add(at(basin, 3.5, FY, -0.95), 4, { d: .3 });
  add(at(box(.02, .7, .5, M.glass), 3.88, FY + 1.5, -0.95), 4, { d: .45, shadow: false });
  add(at(cyl(.03, .03, 2.2, M.copper), 1.75, FY, -1.7), 4, { mode: "rise", d: .4 });
  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, 1.2, 8), M.copper); pipe.rotation.x = Math.PI / 2; add(at(pipe, 1.75, FY + 0.5, -2.3), 4, { d: .5 });
  add(at(box(.08, .5, .35, std(0x3a4554, .5)), -3.86, FY + 1.6, 2.4), 4, { d: .55 });
  [[-2.3, 0.6], [2.4, 1.0], [-2.3, -1.9], [3.0, -1.7]].forEach(([x, z], k) => {
    const lamp = new THREE.Group(); lamp.add(cyl(.01, .01, .7, M.dark)); lamp.add(at(new THREE.Mesh(new THREE.SphereGeometry(.12, 14, 10), M.bulb), 0, -.05, 0));
    add(at(lamp, x, FY + 1.9, z), 4, { d: .6 + k * .05 });
  });

  /* Stage 5: furniture, mattress, appliances */
  const sofa = new THREE.Group();
  sofa.add(bbox(2.2, .42, .85, M.fabric)); sofa.add(at(bbox(2.2, .5, .22, M.fabric), 0, .42, .32));
  sofa.add(at(bbox(.22, .25, .85, M.fabric), -1.0, .42, 0)); sofa.add(at(bbox(.22, .25, .85, M.fabric), 1.0, .42, 0));
  add(at(sofa, -2.3, FY, 2.45), 5, { mode: "drop", d: .05 });
  add(at(box(2.4, .02, 1.6, M.gold), -2.3, FY + .04, 1.5), 5, { d: 0 });
  add(at(bbox(1.0, .36, .55, M.dark), -2.3, FY + .05, 1.3), 5, { mode: "drop", d: .15 });
  const bed = new THREE.Group(); bed.add(bbox(1.65, .3, 2.0, M.dark)); bed.add(at(bbox(1.55, .24, 1.9, M.mattress), 0, .3, .02)); bed.add(at(bbox(1.65, .85, .1, M.dark), 0, 0, -1.0));
  bed.add(at(bbox(.55, .12, .3, M.white), -.4, .54, -.75)); bed.add(at(bbox(.55, .12, .3, M.white), .4, .54, -.75)); bed.add(at(bbox(1.56, .06, 1.1, M.accent), 0, .54, .4));
  add(at(bed, -2.3, FY, -1.85), 5, { mode: "drop", d: .2 });
  const fridge = new THREE.Group(); fridge.add(bbox(.72, 1.85, .66, M.steel)); fridge.add(at(box(.02, .5, .03, M.dark), -.37, 1.3, .2));
  add(at(fridge, 3.5, FY, 0.0), 5, { mode: "drop", d: .3 });
  const wm = new THREE.Group(); wm.add(bbox(.62, .85, .6, M.white)); const drum = new THREE.Mesh(new THREE.CylinderGeometry(.2, .2, .03, 20), M.granite); drum.rotation.z = Math.PI / 2; wm.add(at(drum, .31, .45, 0));
  add(at(wm, 2.0, FY, -1.55), 5, { mode: "drop", d: .4 });
  add(at(bbox(1.3, .76, .85, M.dark), 2.0, FY, 1.9), 5, { mode: "drop", d: .5 });
  for (const [x, z] of [[1.55, 1.25], [2.45, 1.25], [1.55, 2.55], [2.45, 2.55]]) {
    const ch = new THREE.Group(); ch.add(bbox(.4, .46, .4, M.timber)); ch.add(at(bbox(.4, .5, .06, M.timber), 0, .46, z < 2 ? -.17 : .17));
    add(at(ch, x, FY, z), 5, { mode: "drop", d: .6 + x * .05 });
  }

  /* Stage 6: kitchen, tableware, plastics, household */
  add(at(bbox(.62, .9, 2.4, M.white), 3.58, FY, 1.75), 6, { mode: "rise", d: .05 });
  add(at(box(.66, .05, 2.44, M.granite), 3.58, FY + .925, 1.75), 6, { d: .2 });
  add(at(box(.5, .02, .5, std(0x11161d, .3)), 3.58, FY + .96, 1.6), 6, { d: .3 });
  add(at(bbox(.5, .32, .5, M.steel), 3.62, FY + 1.75, 1.6), 6, { mode: "drop", d: .35 });
  add(at(cyl(.13, .13, .16, M.red), 3.5, FY + .97, 1.48), 6, { mode: "drop", d: .5 });
  add(at(bbox(.2, .25, .1, M.dark), 3.6, FY + .95, 2.55), 6, { mode: "drop", d: .55 });
  for (const [x, z] of [[1.65, 1.62], [2.35, 1.62], [1.65, 2.18], [2.35, 2.18]]) {
    add(at(cyl(.14, .12, .02, M.white, 20), x, FY + .76, z), 6, { d: .55 + x * .04 });
    add(at(cyl(.04, .035, .12, M.glass, 10), x + .14, FY + .76, z + (z < 2 ? -.06 : .06)), 6, { d: .7 + x * .04, shadow: false });
  }
  add(at(cyl(.11, .09, .14, M.white, 18), 2.0, FY + .76, 1.9), 6, { d: .75 });
  add(at(cyl(.16, .14, .5, M.blueP), 2.95, FY, 0.45), 6, { mode: "drop", d: .6 });
  for (let k = 0; k < 3; k++) add(at(bbox(.3 - k * .04, .1, .22 - k * .03, [M.greenP, M.red, M.blueP][k]), 3.55, FY + .95 + k * .1, 2.2), 6, { mode: "drop", d: .65 + k * .06 });
  add(at(cyl(.17, .14, .3, M.greenP), 1.2, FY, -0.2), 6, { mode: "drop", d: .7 });
  const mop = new THREE.Mesh(new THREE.CylinderGeometry(.015, .015, 1.3, 6), M.timber); mop.rotation.z = .25; add(at(mop, 1.35, FY + .62, -0.2), 6, { d: .8 });

  /* Stage 7: garden, deck, palms, fence, tools */
  add(at(bbox(22, 0.06, 18, M.lawn), 0, -0.06, 0), 7, { mode: "pop", d: 0 });
  for (let i = 0; i < 7; i++) add(at(bbox(3.0, .08, .2, M.timber), 2.4, 0, 3.35 + i * .23), 7, { mode: "rise", d: .15 + i * .03 });
  for (let i = 0; i < 4; i++) add(at(bbox(.8, .05, .5, M.concrete), -0.3 + (i % 2) * .12, 0, 3.7 + i * .75), 7, { d: .2 + i * .05 });
  function palm(x, z, h, lean, d) {
    const p = new THREE.Group();
    const tr = new THREE.Mesh(new THREE.CylinderGeometry(.09, .17, h, 8), M.trunk); tr.position.y = h / 2; p.add(tr);
    for (let i = 0; i < 8; i++) {
      const f = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 6), M.leaf); f.scale.set(1.25, .06, .28);
      const a = i / 8 * Math.PI * 2; f.position.set(Math.cos(a) * .9, h - .15, Math.sin(a) * .9); f.rotation.y = -a; f.rotation.z = -.38; p.add(f);
    }
    p.rotation.z = lean; add(at(p, x, 0, z), 7, { mode: "pop", d });
  }
  palm(-6.4, 4.2, 4.2, .12, .3); palm(-7.4, -1.5, 5.0, -.06, .4); palm(6.8, -3.6, 4.6, -.1, .5);
  for (const [x, z, s] of [[-4.7, 3.6, .5], [-3.6, 3.7, .38], [4.6, 3.4, .45], [4.8, -2.0, .55], [-4.6, -2.6, .5]])
    add(at(new THREE.Mesh(new THREE.IcosahedronGeometry(s, 0), M.leaf), x, s * .7, z), 7, { d: .35 + s * .3 });
  let fi = 0;
  for (let x = -10; x <= 10; x += 2) for (const z of [-8, 8]) add(at(bbox(.12, .9, .12, M.timber), x, 0, z), 7, { mode: "rise", d: .45 + (fi++) * .004 });
  for (let z = -6; z <= 6; z += 2) for (const x of [-10, 10]) add(at(bbox(.12, .9, .12, M.timber), x, 0, z), 7, { mode: "rise", d: .45 + (fi++) * .004 });
  for (const z of [-8, 8]) for (const y of [.35, .75]) add(at(bbox(20.1, .07, .05, M.timber), 0, y, z), 7, { mode: "rise", d: .62 });
  for (const x of [-10, 10]) for (const y of [.35, .75]) add(at(bbox(.05, .07, 16, M.timber), x, y, 0), 7, { mode: "rise", d: .62 });
  const hose = new THREE.Mesh(new THREE.TorusGeometry(.35, .035, 8, 28), M.greenP); hose.rotation.x = Math.PI / 2; add(at(hose, -4.9, .05, 4.7), 7, { d: .6 });
  add(at(cyl(.12, .14, .28, M.gold), -4.3, 0, 4.9), 7, { d: .65 });
  const barrow = new THREE.Group(); const tray = bbox(.9, .3, .6, M.red); tray.rotation.z = -.15; barrow.add(at(tray, 0, .3, 0));
  barrow.add(at(new THREE.Mesh(new THREE.TorusGeometry(.17, .05, 8, 18), M.granite), .5, .2, 0));
  add(at(barrow, -1.3, 0, 6.6), 7, { mode: "drop", d: .7 });
  add(at(bbox(.6, .32, .3, M.red), -2.6, 0, 6.0), 7, { mode: "drop", d: .75 });
  add(at(bbox(.25, .18, .08, std(0x1f2a36, .5)), -2.6, .32, 6.0), 7, { d: .8 });

  /* Photo cards that float beside the house at each stage */
  const tl = new THREE.TextureLoader();
  const alpha = (() => { const c = document.createElement("canvas"); c.width = 256; c.height = 176; const x = c.getContext("2d"); x.fillStyle = "#000"; x.fillRect(0, 0, 256, 176); x.fillStyle = "#fff"; x.beginPath(); x.roundRect(0, 0, 256, 176, 22); x.fill(); return new THREE.CanvasTexture(c); })();
  STAGES.forEach((s) => {
    const tex = tl.load(`assets/img/${s.pic}.webp`, (t) => {
      const ia = t.image.width / t.image.height, pa = 3.2 / 2.2;
      if (ia > pa) { t.repeat.set(pa / ia, 1); t.offset.set((1 - pa / ia) / 2, 0); } else { t.repeat.set(1, ia / pa); t.offset.set(0, (1 - ia / pa) / 2); }
    });
    tex.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2.2), new THREE.MeshBasicMaterial({ map: tex, alphaMap: alpha, transparent: true, side: THREE.DoubleSide, toneMapped: false, fog: false, depthWrite: false, depthTest: false }));
    m.renderOrder = 5; m.userData.stage = s.n; scene.add(m); cards.push(m);
  });
}

/* Camera route: one key point per stage, plus the plan view and the final pull-out */
const K = [
  [[0, 25, 0.01], [0, 0, 0]],
  [[10, 8.5, 12], [0, 0.4, 0]],
  [[-11, 6.6, 10.5], [0, 2.1, 0]],
  [[11.5, 5.4, 9], [0, 1.4, 0]],
  [[8.0, 13.2, 7.4], [0.8, 0.4, -1.3]],
  [[-8.6, 11.6, 9.2], [-1.5, 0.3, 0.3]],
  [[9.0, 9.6, 10.2], [0.7, 0.6, 1.0]],
  [[-15, 7.4, 16], [0, 1.4, 0]],
  [[17, 15, 21], [0, 1, 0]],
].map(([p, t]) => [new THREE.Vector3(...p), new THREE.Vector3(...t)]);

const vA = new THREE.Vector3(), vB = new THREE.Vector3(), cam = new THREE.Vector3(), tgt = new THREE.Vector3(), tmp = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
let portrait = false, distK = 1, shiftX = 0;
function keyAt(i, out, outT) {
  const [p, t] = K[i];
  outT.copy(t); if (portrait) outT.y -= 1.0;
  out.copy(p).sub(t).multiplyScalar(distK).add(t);
}
function placeCards() {
  cards.forEach((m) => {
    keyAt(m.userData.stage, vA, vB);
    const f = tmp.copy(vB).sub(vA); const dist = f.length(); f.normalize();
    const right = new THREE.Vector3().crossVectors(f, up).normalize();
    m.userData.home = vA.clone().addScaledVector(f, dist * .56).addScaledVector(right, dist * .2).addScaledVector(up, dist * .1);
    m.userData.right = right;
    m.scale.setScalar(dist / 17);
  });
}
function resize() {
  const w = innerWidth, h = innerHeight; portrait = w / h < 0.9;
  distK = w / h < 0.7 ? 1.75 : w / h < 1.1 ? 1.35 : 1;
  camera.aspect = w / h; camera.fov = portrait ? 50 : 38; camera.updateProjectionMatrix();
  // on wide screens, push the house right so the caption has room on the left
  shiftX = portrait ? 0 : -0.16;
  camera.setViewOffset(w, h, shiftX * w, 0, w, h);
  if (renderer) { renderer.setSize(w, h, false); placeCards(); }
}
addEventListener("resize", resize); resize();

let mx = 0, my = 0;
addEventListener("pointermove", (e) => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; });

/* Raycast clicks on the photo cards */
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
function cardAt(e) {
  if (!renderer) return null;
  ndc.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera);
  const hit = ray.intersectObjects(cards.filter((c) => c.visible && c.material.opacity > .5))[0]; return hit && hit.object;
}
canvas.addEventListener("click", (e) => { const c = cardAt(e); if (c) openDept(c.userData.stage, 0); });
canvas.addEventListener("pointermove", (e) => { canvas.style.cursor = cardAt(e) ? "pointer" : ""; });

/* ---------- Frame loop ---------- */
let P = scrollY / innerHeight;
const hsEls = $$(".hs"), planEls = $$(".plan-label"), hsPos = hsEls.map((b) => { const [n, g] = b.dataset.dept.split(":").map(Number); return new THREE.Vector3(...STAGES[n - 1].groups[g].at); });
const cardTilt = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.05, -0.32, 0.03)), dummy = new THREE.Object3D(), cBlock = new THREE.Color(0xb9bec6), cPaint = new THREE.Color(0xf2f5f9);
const hud = $("[data-hud]"), rail = $("[data-rail]"), cue = $("[data-cue]");

let last = 0;
function frame(time) {
  const dt = Math.min(0.1, (time - last) / 1000 || 0.016); last = time;
  const goal = clamp(scrollY / innerHeight, 0, END);
  P += (goal - P) * (calm || rec ? 1 : 1 - Math.exp(-dt * 5));
  if (Math.abs(goal - P) < 0.0005) P = goal;

  const idx = P < 0.5 ? 0 : Math.min(7, Math.round(P));
  caption(idx);
  hud.classList.toggle("gone", P > 7.55);
  cue.classList.toggle("gone", P > 0.15);
  rail.style.transform = `scaleY(${clamp(P / 7)})`;

  if (renderer) {
    const i = Math.min(Math.floor(P), K.length - 2), t = easeIO(clamp(P - i));
    keyAt(i, vA, tmp); keyAt(i + 1, vB, cam);
    tgt.copy(tmp).lerp(cam, t); cam.copy(vA).lerp(vB, t);
    if (!calm && !rec) { const s = Math.sin(time * 0.00018) * 0.35; cam.x += mx * 1.4 + s; cam.y -= my * 0.9; }
    camera.position.copy(cam); camera.lookAt(tgt);

    for (const a of anim) {
      const s0 = a.n - 0.82 + a.d * 0.45;
      let v = ease(clamp((P - s0) / 0.36));
      if (a.out) v *= 1 - ease(clamp((P - (a.out - 0.55)) / 0.4));
      const o = a.o, b = o.userData.base;
      o.visible = v > 0.002;
      if (!o.visible) continue;
      if (a.mode === "rise") o.scale.set(b.s.x, b.s.y * v, b.s.z);
      else if (a.mode === "drop") { o.position.y = b.y + (1 - v) * 3.5; o.scale.copy(b.s).multiplyScalar(0.5 + v * 0.5); }
      else { const k = v < 1 ? v * (1 + 0.35 * Math.sin(v * Math.PI)) : 1; o.scale.copy(b.s).multiplyScalar(k); }
    }
    tileData.forEach((d, k) => {
      const v = ease(clamp((P - (2.35 + d.d * 0.45)) / 0.2));
      dummy.position.set(d.x, FY + 0.015 + (1 - v) * 0.6, d.z); dummy.scale.setScalar(Math.max(v, 0.0001)); dummy.rotation.y = (1 - v) * 0.8;
      dummy.updateMatrix(); tiles.setMatrixAt(k, dummy.matrix);
    });
    tiles.instanceMatrix.needsUpdate = true;
    const paint = ease(clamp((P - 2.72) / 0.3));
    wallMat.color.copy(cBlock).lerp(cPaint, paint); gableMat.color.copy(wallMat.color);
    planMat.opacity = 1 - ease(clamp((P - 0.3) / 0.55));
    const lift = ease(clamp((P - 3.3) / 0.5)) * (1 - ease(clamp((P - 6.25) / 0.6)));
    roof.position.y = lift * 4; roof.visible = lift < 0.99;
    roofMats.forEach((m) => { m.opacity = 1 - lift; m.depthWrite = lift < 0.5; });
    gridMat.opacity = .55 * (1 - ease(clamp((P - 6.3) / 0.6)) * .7);
    // photo cards float in the top-right of the view and slide past as you scroll
    const D = 9, hh = D * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)), hw = hh * camera.aspect;
    cards.forEach((m) => {
      const off = P - m.userData.stage, v = 1 - ease(clamp(Math.abs(off) / 0.55));
      m.visible = !portrait && v > 0.01; if (!m.visible) return;
      m.material.opacity = v;
      tmp.set(hw * 0.36 - off * hw * 0.5, hh * 0.34 + Math.sin(time * 0.0011 + m.userData.stage) * 0.05 - Math.abs(off) * 0.6, -D);
      m.position.copy(camera.localToWorld(tmp));
      m.quaternion.copy(camera.quaternion).multiply(cardTilt);
      m.scale.setScalar((hw * 0.4) / 3.2);
    });
    renderer.render(scene, camera);

    const w = innerWidth, h = innerHeight;
    const toScreen = (v) => `translate(${((v.x + 1) / 2) * w}px, ${(1 - v.y) / 2 * h}px)`;
    layoutHotspots(w, h);
    planEls.forEach((el) => {
      const [x, z] = el.dataset.plan.split(",").map(Number); tmp.set(x, 0, z).project(camera);
      el.style.transform = toScreen(tmp); el.style.opacity = planMat.opacity;
    });
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

/* ---------- Keep labels, cards and text from covering each other ---------- */
const capEl = $("[data-caption]"), stageEl = $(".stagelist"), miniEl = $("[data-mini]"), topEl = $(".top");
const R = (r, pad = 0) => ({ l: r.left - pad, t: r.top - pad, r: r.right + pad, b: r.bottom + pad });
const hit = (a, b) => a.l < b.r && a.r > b.l && a.t < b.b && a.b > b.t;
const inside = (x, y, b) => x > b.l && x < b.r && y > b.t && y < b.b;
const corners = [[-1.6, -1.1], [1.6, -1.1], [1.6, 1.1], [-1.6, 1.1]].map(([x, y]) => new THREE.Vector3(x, y, 0));
function layoutHotspots(w, h) {
  // obstacles: the caption, the stage list, the header, the mini list bar and any photo card on screen
  // the caption box is wider than its words, so measure what is actually in it
  const capBox = [...capEl.children].filter((c) => c.offsetWidth).map((c) => c.getBoundingClientRect())
    .reduce((a, r) => ({ l: Math.min(a.l, r.left), t: Math.min(a.t, r.top), r: Math.max(a.r, r.right), b: Math.max(a.b, r.bottom) }), { l: 1e9, t: 1e9, r: -1e9, b: -1e9 });
  const obs = [portrait ? R(capEl.getBoundingClientRect(), 10) : { l: capBox.l - 12, t: capBox.t - 12, r: capBox.r + 12, b: capBox.b + 12 }, { l: 0, t: 0, r: w, b: topEl.offsetHeight + 6 }];
  const sl = stageEl.getBoundingClientRect(); if (sl.width && !stageEl.classList.contains("tight")) obs.push(R(sl, 8));
  if (!miniEl.hidden) obs.push(R(miniEl.getBoundingClientRect(), 8));
  // hide the stage list when the caption grows down into it
  const cap = capEl.getBoundingClientRect();
  if (sl.width || stageEl.classList.contains("tight")) stageEl.classList.toggle("tight", !portrait && cap.bottom > innerHeight - stageEl.scrollHeight - 50);
  const hideObs = obs.slice();
  cards.forEach((m) => {
    if (!m.visible || m.material.opacity < .3) return;
    let l = 1e9, t = 1e9, r = -1e9, b = -1e9;
    corners.forEach((c) => { tmp.copy(c); m.localToWorld(tmp).project(camera); const x = (tmp.x + 1) / 2 * w, y = (1 - tmp.y) / 2 * h; l = Math.min(l, x); r = Math.max(r, x); t = Math.min(t, y); b = Math.max(b, y); });
    obs.push({ l: l - 8, t: t - 8, r: r + 8, b: b + 8 });
  });
  const placed = [], items = [];
  hsEls.forEach((el, k) => {
    const n = +el.dataset.hs;
    tmp.copy(hsPos[k]); if (n === 2) tmp.y += roof.position.y;
    tmp.project(camera);
    const x = (tmp.x + 1) / 2 * w, y = (1 - tmp.y) / 2 * h;
    let on = Math.abs(P - n) < 0.4 && tmp.z < 1 && x > 14 && x < w - 14 && y > 14 && y < h - 14;
    if (on && hideObs.some((o) => inside(x, y, o))) on = false;
    items.push({ el, x, y, on });
  });
  items.filter((i) => i.on).sort((a, b) => a.y - b.y).forEach((i) => placed.push({ l: i.x - 13, t: i.y - 13, r: i.x + 13, b: i.y + 13 }));
  items.forEach((i) => {
    const { el, x, y } = i;
    el.style.transform = `translate(${x}px, ${y}px)`;
    if (i.on) {
      const sp = el.lastElementChild, lw = sp.offsetWidth, lh = sp.offsetHeight;
      const opts = [[18, -lh / 2], [-18 - lw, -lh / 2], [-lw / 2, -lh - 18], [-lw / 2, 18], [14, 12], [-14 - lw, 12], [14, -lh - 12], [-14 - lw, -lh - 12]];
      let pick = opts[0];
      for (const o of opts) {
        const box = { l: x + o[0], t: y + o[1], r: x + o[0] + lw, b: y + o[1] + lh };
        if (box.l < 6 || box.r > w - 6 || box.t < 6 || box.b > h - 6) continue;
        if (obs.some((q) => hit(box, q)) || placed.some((q) => hit(box, q))) continue;
        pick = o; break;
      }
      placed.push({ l: x + pick[0] - 4, t: y + pick[1] - 4, r: x + pick[0] + lw + 4, b: y + pick[1] + lh + 4 });
      sp.style.transform = `translate(${pick[0]}px, ${pick[1]}px)`;
    }
    if (el.classList.contains("on") !== i.on) { el.classList.toggle("on", i.on); el.tabIndex = i.on ? 0 : -1; }
  });
}

/* ---------- List (kept in this browser only) ---------- */
let list = [];
try { list = JSON.parse(localStorage.getItem("pj-list") || "[]"); } catch (e) { list = []; }
const save = () => { try { localStorage.setItem("pj-list", JSON.stringify(list)); } catch (e) {} };

/* ---------- Department sheet ---------- */
const sheet = $("#sheet");
let lastFocus = null;
const chip = (i, label = i, cls = "chip") => `<button type="button" class="${cls}" data-item="${i}" aria-pressed="${list.some((x) => x.name === i)}">${label}</button>`;
function openDept(n, g) {
  const s = STAGES[n - 1], grp = s.groups[g];
  if (sheet.hidden) lastFocus = document.activeElement;
  $("[data-sheet]").innerHTML = `
    <button type="button" class="x" data-sheet-close aria-label="Close ${grp.name}">×</button>
    <div class="sheet-pic"><img src="assets/img/${s.pic}.webp" alt=""><span class="disc${grp.photo ? " ph" : ""}"><img src="assets/img/${grp.img}.webp" alt=""></span></div>
    <p class="step">Stage ${s.n}, ${s.title}</p>
    <h2 id="sheet-h">${grp.name}</h2>
    <p>Tap what you need. It goes on your list, and you send the list to the store for prices and stock.</p>
    <div class="chips">${grp.items.map((i) => chip(i)).join("")}${chip(`${grp.name}: something else (I'll describe it)`, "Something else", "chip ask")}</div>
    ${s.groups.length > 1 ? `<div class="more"><p>Also at this stage</p>${s.groups.map((o, k) => (k === g ? "" : `<button type="button" class="btn line" data-dept="${n}:${k}">${o.name}</button>`)).join("")}</div>` : ""}
    <button type="button" class="btn" data-open-list>See my list</button>`;
  sheet.hidden = false; requestAnimationFrame(() => sheet.classList.add("on"));
  $(".x", sheet).focus({ preventScroll: true });
  if (Math.abs(P - n) > 0.3) go(n);
}
function closeSheet() { sheet.classList.remove("on"); setTimeout(() => (sheet.hidden = true), 300); if (lastFocus) lastFocus.focus({ preventScroll: true }); }

/* ---------- Menu ---------- */
const menu = $("#menu"), menuBtns = $$("[data-menu-open]");
function openMenu() { menu.hidden = false; requestAnimationFrame(() => menu.classList.add("on")); menuBtns.forEach((b) => b.setAttribute("aria-expanded", "true")); $(".x", menu).focus({ preventScroll: true }); }
function closeMenu() { menu.classList.remove("on"); setTimeout(() => (menu.hidden = true), 300); menuBtns.forEach((b) => b.setAttribute("aria-expanded", "false")); }
menuBtns.forEach((b) => b.addEventListener("click", openMenu));
$$("[data-menu-close]").forEach((b) => b.addEventListener("click", closeMenu));

document.addEventListener("click", (ev) => {
  const d = ev.target.closest("[data-dept]");
  if (d) { const [n, g] = d.dataset.dept.split(":").map(Number); if (!menu.hidden) closeMenu(); openDept(n, g); return; }
  if (ev.target.closest("[data-sheet-close]") || ev.target === sheet) closeSheet();
});

/* ---------- List UI ---------- */
const toast = (t) => { const el = $(".toast"); el.textContent = t; el.classList.add("on"); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove("on"), 2000); };
function toggle(name) {
  const k = list.findIndex((i) => i.name === name);
  if (k > -1) { list.splice(k, 1); toast(`Removed: ${name}`); } else { list.push({ name, qty: 1 }); toast(`Added: ${name}`); }
  save(); render();
  const b = $(".count"); b.classList.remove("pop"); void b.offsetWidth; b.classList.add("pop");
}
function render() {
  $(".count").textContent = list.reduce((a, i) => a + i.qty, 0);
  $("[data-empty]").hidden = list.length > 0;
  $("[data-send]").hidden = list.length === 0;
  $("[data-mini]").hidden = list.length === 0;
  $("[data-mini-text]").textContent = `${list.length} ${list.length === 1 ? "item" : "items"} on your list`;
  $("[data-items]").innerHTML = list.map((i, k) => `<li><span class="iname">${i.name}</span>
    <span class="qty"><button type="button" data-q="${k}" data-d="-1" aria-label="One less ${i.name}">−</button><b>${i.qty}</b><button type="button" data-q="${k}" data-d="1" aria-label="One more ${i.name}">+</button></span></li>`).join("");
  $$("[data-item]").forEach((c) => c.setAttribute("aria-pressed", list.some((i) => i.name === c.dataset.item)));
}
document.addEventListener("click", (ev) => { const c = ev.target.closest("[data-item]"); if (c) toggle(c.dataset.item); });
$("[data-items]").addEventListener("click", (ev) => {
  const b = ev.target.closest("[data-q]"); if (!b) return;
  const it = list[+b.dataset.q]; it.qty += +b.dataset.d;
  if (it.qty < 1) list.splice(+b.dataset.q, 1);
  save(); render();
});
const drawer = $("#drawer"), lb = $(".listbtn");
const openDrawer = (on) => {
  if (on) { if (!sheet.hidden) closeSheet(); drawer.hidden = false; requestAnimationFrame(() => drawer.classList.add("on")); $(".x", drawer).focus({ preventScroll: true }); }
  else { drawer.classList.remove("on"); setTimeout(() => (drawer.hidden = true), 250); lb.focus({ preventScroll: true }); }
  lb.setAttribute("aria-expanded", on);
};
lb.addEventListener("click", () => openDrawer(drawer.hidden));
document.addEventListener("click", (ev) => { if (ev.target.closest("[data-open-list]")) openDrawer(true); });
$(".x", drawer).addEventListener("click", () => openDrawer(false));
drawer.addEventListener("click", (ev) => { if (ev.target === drawer) openDrawer(false); });
document.addEventListener("keydown", (ev) => {
  if (ev.key !== "Escape") return;
  if (!drawer.hidden) openDrawer(false); else if (!sheet.hidden) closeSheet(); else if (!menu.hidden) closeMenu();
});
$("[data-send]").addEventListener("submit", (ev) => {
  ev.preventDefault();
  const f = new FormData(ev.target);
  const lines = list.map((i) => `- ${i.qty} × ${i.name}`).join("\n");
  const body = `Hello Homemakers ${f.get("branch")},\n\nPlease send me a quote for:\n${lines}\n\n${f.get("note") ? f.get("note") + "\n\n" : ""}${f.get("name")}\n${f.get("phone")}`;
  location.href = `mailto:${MAIL}?subject=${encodeURIComponent("Quote request from the website")}&body=${encodeURIComponent(body)}`;
});

/* Open now, Seychelles time (UTC+4), Mon to Fri 8:00 to 18:00 */
function status() {
  const now = new Date(Date.now() + (new Date().getTimezoneOffset() + 240) * 60000);
  const d = now.getDay(), m = now.getHours() * 60 + now.getMinutes();
  const wk = d >= 1 && d <= 5, open = wk && m >= 480 && m < 1080;
  const t = open ? (m >= 1020 ? "Open now, closing at 6pm" : "Open now until 6pm")
    : wk && m < 480 ? "Closed, opens today at 8am" : d === 5 || d === 6 || d === 0 ? "Closed, opens Monday at 8am" : "Closed, opens tomorrow at 8am";
  $$("[data-status]").forEach((el) => { el.classList.toggle("open", open); $("[data-status-text]", el).textContent = t; });
}
status(); setInterval(status, 60000);
render();
