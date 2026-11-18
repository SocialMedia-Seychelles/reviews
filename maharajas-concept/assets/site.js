/* The Maharajas concept: a hammered brass thali on a table above the Eden Island marina fills course by course as you scroll.
   Built like the Homemakers concept (Three.js r160 + Lenis, no build step), lit and finished like a food photograph:
   a pendant spotlight, dusk reflections, shallow depth of field, glow and grain. Every dish is modelled in code (kit.js). */
import * as THREE from "three";
import { FullScreenQuad } from "three/addons/postprocessing/Pass.js";
import { repeatOf, blob, rounded, disc, paint, fbm, rnd, prawnGeo, tikkaGeo, paneerGeo, samosaGeo, naanGeo, papadGeo, leafGeo, riceMesh, layRice, seeded, burn, tomatoBit, cucumberBit, onionBit, lambChopGeo, seekhGeo } from "./kit.js";
import { COURSES } from "./menu-data.js";
import { $, $$, courseUrl } from "./order.js";
import { stageListHTML, fillCaption } from "./stages.js";

const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
const rec = /[?&]rec\b/.test(location.search);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = (t) => t * t * (3 - 2 * t);
const easeIO = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const backOut = (t, s = 1.3) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2);
const mix = (a, b, t) => a + (b - a) * t;
// when something is served, as a slice of the scroll towards its course. Serving happens over the last 63% of the way, when the
// camera has nearly arrived (it eases in and out of each view): win(3, 0, 1) runs from 2.35 to 2.98
const win = (n, a, b) => [n - 0.65 + a * 0.63, n - 0.65 + b * 0.63];

/* How each dish arrives. t runs 0 to 1 over its window; the object starts from its resting pose each frame. */
const qA = new THREE.Quaternion(), eA = new THREE.Euler(), vX = new THREE.Vector3();
const MODES = {
  pop(o, t) { const v = ease(t); o.scale.multiplyScalar(v < 1 ? v * (1 + 0.25 * Math.sin(v * Math.PI)) : 1); },
  rise(o, t) { o.scale.y *= ease(t); },
  drop(o, t) { const v = ease(t); o.position.y += (1 - v) * 2.2; o.scale.multiplyScalar(0.7 + v * 0.3); },
  // a sauce poured into its bowl: the surface rises and turns as it settles
  pour(o, t, b) { const v = easeOut(t); o.position.y = b.y0 + (b.p.y - b.y0) * v; const k = 0.55 + 0.45 * v; o.scale.x *= k; o.scale.z *= k; o.rotateY((1 - v) * 2.4); },
  // a cream swirl drawn in: grows from the centre while it turns
  draw(o, t) { const v = easeOut(t); o.scale.multiplyScalar(Math.max(0.001, v)); o.rotateY(-(1 - v) * 3.5); },
  // thrown on: an arc from `from`, turning `spin` times on the way, then a small bounce and squash (nob: lands softly, for garnish)
  toss(o, t, b, opt) {
    const L = opt.nob ? 1 : 0.72, f = opt.from || [0, 2.4, 0], sp = opt.spin || [0, 0, 0];
    if (t < L) {
      const u = t / L, r = (1 - easeOut(u)) * Math.PI * 2;
      o.position.x += f[0] * (1 - u); o.position.z += f[2] * (1 - u); o.position.y += f[1] * (1 - u * u);
      eA.set(sp[0] * r, sp[1] * r, sp[2] * r); o.quaternion.multiply(qA.setFromEuler(eA));
    } else {
      const u = (t - L) / (1 - L), sq = u < 0.3 ? Math.sin((u / 0.3) * Math.PI) * 0.2 : 0;
      o.position.y += Math.max(0, Math.sin(Math.min(1, u / 0.6) * Math.PI)) * f[1] * 0.05;
      o.scale.y *= 1 - sq; o.scale.x *= 1 + sq * 0.5; o.scale.z *= 1 + sq * 0.5;
    }
  },
  // slid across the table, overshooting a touch before it settles
  slide(o, t, b, opt) { const e = backOut(t), f = opt.from; o.position.x += f[0] * (1 - e); o.position.z += f[2] * (1 - e); o.rotateY((opt.turn || 0) * (1 - e)); },
  // rolled along the table to the bowl's rim, then a hop in
  roll(o, t, b, opt) {
    const r = opt.r, f = opt.from, len = Math.hypot(f[0], f[2]), ux = f[0] / len, uz = f[2] / len, R = 0.62;
    let d, ang;
    if (t < 0.75) { d = len - (len - R) * easeOut(t / 0.75); o.position.set(b.p.x + ux * d, r, b.p.z + uz * d); ang = (len - d) / r; }
    else { const u = (t - 0.75) / 0.25; o.position.set(b.p.x + ux * R * (1 - u), mix(r, b.p.y, u) + Math.sin(u * Math.PI) * 0.35, b.p.z + uz * R * (1 - u)); ang = (len - R + R * u) / r; }
    o.quaternion.premultiply(qA.setFromAxisAngle(vX.set(-uz, 0, ux), ang));
  },
  // butter: drops on, then slumps and spreads as it melts
  melt(o, t) {
    if (t < 0.3) { const u = t / 0.3; o.position.y += (1 - u) * (1 - u) * 0.8; }
    else { const m = ease((t - 0.3) / 0.7); o.scale.y *= 1 - 0.55 * m; o.scale.x *= 1 + 0.35 * m; o.scale.z *= 1 + 0.35 * m; o.position.y -= 0.02 * m; }
  },
};
const course = (slug) => COURSES.find((c) => c.slug === slug);

/* ---------- Content (course text lives in stages.js) ---------- */
const END = 8;
const HOT = [
  { slug: "soups", n: 1, at: [-1.95, 0.5, -0.55] },
  { slug: "street-food", n: 1, at: [-1.35, 0.45, 1.25] },
  { slug: "salads", n: 1, at: [1.95, 0.5, -0.55] },
  { slug: "tandoor", n: 2, at: [-4.6, 0.5, 0.95] },
  { slug: "curries", n: 3, at: [0, 0.5, -1.95] },
  { slug: "rice", n: 4, at: [0, 0.8, 0.15] },
  { slug: "breads", n: 5, at: [1.55, 0.4, 1.0] },
  { slug: "desserts", n: 6, at: [3.95, 0.55, -1.25] },
];

/* ---------- Page chrome ---------- */
$("[data-stagelist]").innerHTML = stageListHTML();
$("[data-hotspots]").innerHTML = HOT.map((h) => `<a class="hs" href="${courseUrl(h.slug)}" data-hs="${h.n}" tabindex="-1"><i></i><span>${course(h.slug).name}</span></a>`).join("");

let lenis = null;
if (!calm && !rec && window.Lenis) {
  lenis = new Lenis({ lerp: 0.09 });
  const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
}
const scrollToY = (y) => (lenis ? lenis.scrollTo(y, { duration: 1.6 }) : window.scrollTo({ top: y, behavior: calm ? "auto" : "smooth" }));
document.addEventListener("click", (ev) => {
  const g = ev.target.closest("[data-go]");
  if (g) { ev.preventDefault(); scrollToY(+g.dataset.go * innerHeight); return; }
  const a = ev.target.closest('a[href^="#"]');
  if (a && a.getAttribute("href").length > 1 && lenis) { ev.preventDefault(); lenis.scrollTo(a.getAttribute("href"), { duration: 1.6 }); }
});

let shown = -1;
function caption(i) {
  if (i === shown) return; shown = i;
  fillCaption($("[data-caption]"), i);
}

/* ---------- 3D scene ---------- */
const F0 = new URLSearchParams(location.search);
const canvas = $("#scene");
let renderer = null;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: "high-performance" }); } catch (e) { renderer = null; }
if (!renderer) document.documentElement.classList.add("no3d");

const lite = innerWidth < 900 || matchMedia("(pointer: coarse)").matches;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, innerWidth / innerHeight, 0.1, 900);
if (F0.has("debug")) window.__three = { scene: null, THREE }; // debug: ?debug exposes the scene for inspection
const anim = [], puffs = [], bulbs = [], halos = [], hideForDepth = [];
let flame, flameLight, glow, softTex = null, sceneRT, blurRT, quad, blurH, blurV, grain, lamp;
// the evening as you scroll: sky, fog and fill light move from the afterglow to blue hour, stars and town lights come out
let sky, skyA, skyB, rim, hemi, stars, town, embers, emberSeed = [], lastM = -1, burstT = -1e9, prevPF = 0, intro = null;
const ridgeMats = [], fogA = new THREE.Color(0x2a1c3d), fogB = new THREE.Color(0x14152e), hemiA = new THREE.Color(0x6f5a9a), hemiB = new THREE.Color(0x4a5a9a);
const SIZZLE = { x: -4.6, z: 0.95, p: 1.5 }; // where the tandoor platter lands, and the point in the scroll it lands (set in build)
const F = F0; if (F.has("bare")) document.documentElement.classList.add("bare"); let post = !F.has("nopost"); window.__log = [["module", Math.round(performance.now())]]; const mark = (l) => window.__log.push([l, Math.round(performance.now())]); // debug switches: ?nopost ?noshadow ?norice

/* Textures: painted once from the generators in kit.js by _work/bake.py and loaded as small images (painting them live took a minute) */
const TEX = { "brass-map": [1, 1], "brass-rough": [0, 1], "brass-normal.png": [0, 1], "wood-map": [1, 1, 1.5], "wood-rough": [0, 1, 1.5], "linen-map": [1, 1, 6], "linen-normal.png": [0, 1, 6],
  ...Object.fromEntries(["soup", "butter", "dal", "palak"].flatMap((k) => [[`${k}-map`, [1, 0]], [`${k}-rough`, [0, 0]]])),
  // close-up food surfaces from _work/bake_food.py
  "naan-map": [1, 0], "naan-normal": [0, 0], "naan-rough": [0, 0], "naan-height": [0, 0], "papad-map": [1, 0], "papad-normal": [0, 0], "sauce-normal": [0, 1, 3], "swirl.png": [0, 0], "wisp.png": [1, 0], "syrup-map": [1, 0], "syrup-rough": [0, 0], "rice-map": [1, 1, 3], "rice-normal": [0, 1, 3] }; // [sRGB, repeats, repeat count]
async function loadTextures() {
  const L = new THREE.TextureLoader(), T = {};
  await Promise.all(Object.entries(TEX).map(async ([f, [srgb, wrap, rep = 1]]) => {
    const t = await L.loadAsync(`assets/tex/${f.includes(".") ? f : f + ".jpg"}`);
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    if (wrap) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep); }
    t.anisotropy = 8; T[f.replace(".png", "")] = t;
  }));
  return T;
}
caption(0);
const T = renderer ? await loadTextures().catch(() => null) : null;
if (renderer && !T) { renderer = null; document.documentElement.classList.add("no3d"); }
if (renderer) build();

function build() {
  renderer.setPixelRatio(Math.min(devicePixelRatio, lite ? 1.5 : 1));
  renderer.shadowMap.enabled = !F.has("noshadow");
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false; // the lamp never moves: redraw its shadows only when a dish moves (see frame)
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  mark("build"); scene.environment = duskEnvironment(); mark("env");
  if (window.__three) window.__three.scene = scene;
  scene.fog = new THREE.Fog(0x2a1c3d, 70, 420);

  // Sky: two palettes, the afterglow just after the sun has gone behind Mahé and blue hour, mixed as you scroll (see night()).
  // The glow band sits high enough to show above the mountains.
  const skyG = new THREE.SphereGeometry(600, 48, 32), sp = skyG.attributes.position, col = new THREE.Color();
  const grade = (stops) => {
    const S = stops.map(([y, c]) => [y, new THREE.Color(c)]), out = new Float32Array(sp.count * 3);
    for (let i = 0; i < sp.count; i++) {
      const y = sp.getY(i) / 600; let k = 0; while (k < S.length - 2 && y > S[k + 1][0]) k++;
      const [y0, c0] = S[k], [y1, c1] = S[k + 1]; col.copy(c0).lerp(c1, clamp((y - y0) / (y1 - y0))); out.set([col.r, col.g, col.b], i * 3);
    }
    return out;
  };
  skyA = grade([[-1, 0x120c22], [-0.02, 0x2b1a40], [0, 0xffa24e], [0.09, 0xff8c46], [0.17, 0xf26a48], [0.25, 0xc8405e], [0.35, 0x7a2d6a], [0.5, 0x33204f], [0.72, 0x1b1436], [1, 0x0f0b20]]);
  skyB = grade([[-1, 0x0a0a1a], [-0.02, 0x14163a], [0, 0xa05e78], [0.09, 0x80507a], [0.17, 0x56427a], [0.25, 0x363672], [0.35, 0x232a60], [0.5, 0x161c48], [0.72, 0x0f1438], [1, 0x070816]]);
  skyG.setAttribute("color", new THREE.BufferAttribute(skyA.slice(), 3));
  sky = new THREE.Mesh(skyG, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false }));
  sky.position.y = -6; scene.add(sky);

  // Light: a warm pendant lamp straight over the thali (pool of light, soft shadows), dusk fill and a sunset rim
  hemi = new THREE.HemisphereLight(0x6f5a9a, 0x1a0e08, 0.35); scene.add(hemi);
  lamp = new THREE.SpotLight(0xffd6a0, 2.5, 0, 0.62, 0.85, 0);
  lamp.position.set(-1.8, 11, 3.2); lamp.target.position.set(0.2, 0, 0.2); scene.add(lamp.target);
  lamp.castShadow = true; lamp.shadow.mapSize.set(1024, 1024); lamp.shadow.bias = -0.0002; lamp.shadow.normalBias = 0.015; lamp.shadow.camera.near = 4; lamp.shadow.camera.far = 20;
  scene.add(lamp);
  rim = new THREE.DirectionalLight(0xff8c50, 1.1); rim.position.set(3, 3, -12); scene.add(rim);

  /* Materials */
  const brass = { map: T["brass-map"], roughnessMap: T["brass-rough"], normalMap: T["brass-normal"] }, wood = { map: T["wood-map"], roughnessMap: T["wood-rough"] }, linen = { map: T["linen-map"], normalMap: T["linen-normal"] };
  for (let i = 0; i < 312; i++) rnd(); // the oil drops on the baked curries used these: keeps every seeded placement as signed off
  mark("textures");
  const brassMat = (rx, ry, tint = 0xc4954a) => new THREE.MeshStandardMaterial({ color: tint, metalness: 1, roughness: 1, envMapIntensity: 0.95,
    map: repeatOf(brass.map, rx, ry), normalMap: repeatOf(brass.normalMap, rx, ry), roughnessMap: repeatOf(brass.roughnessMap, rx, ry), normalScale: new THREE.Vector2(0.32, 0.32), side: THREE.DoubleSide });
  // glossy food without a clearcoat layer: one shader family for the whole scene compiles and draws far faster
  const phys = ({ clearcoat = 0, clearcoatRoughness, ...o }) => new THREE.MeshStandardMaterial({ ...o, roughness: (o.roughness ?? 1) * (1 - clearcoat * 0.45) });
  // Glass without a refraction pass: clear where it faces you, brighter and more solid towards its edges (a Fresnel rim), with two
  // thin upright reflections of a window that stay put as the camera moves, the cue that makes a tumbler read as glass, not plastic.
  const glassMat = () => {
    const m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .04, metalness: .1, transparent: true, opacity: .07, envMapIntensity: 2.2, depthWrite: false });
    m.onBeforeCompile = (sh) => {
      sh.fragmentShader = sh.fragmentShader.replace("#include <opaque_fragment>", `
        float nv = abs(dot(normal, normalize(vViewPosition)));
        float rim = pow(1.0 - nv, 3.0);
        float band = (exp(-pow((normal.x + 0.6) / 0.08, 2.0)) + 0.65 * exp(-pow((normal.x - 0.5) / 0.035, 2.0))) * (1.0 - abs(normal.y));
        gl_FragColor = vec4(outgoingLight + vec3(rim * 0.45 + band * 0.85), clamp(diffuseColor.a + rim * 0.55 + band * 0.5, 0.0, 1.0));`);
    };
    m.customProgramCacheKey = () => "glass-rim";
    return m;
  };
  const M = {
    thali: brassMat(0.55, 0.55), katori: brassMat(1.1, 1.1), katoriD: brassMat(1.1, 1.1, 0xb0803a),
    table: new THREE.MeshStandardMaterial({ map: wood.map, roughnessMap: wood.roughnessMap, color: 0xffffff, envMapIntensity: .55 }),
    board: new THREE.MeshStandardMaterial({ map: repeatOf(wood.map, .5, .5), roughnessMap: wood.roughnessMap, color: 0xd9a27a, envMapIntensity: .5 }),
    runner: new THREE.MeshStandardMaterial({ color: 0x6d1633, map: linen.map, normalMap: linen.normalMap, roughness: .95, envMapIntensity: .3 }),
    floor: new THREE.MeshStandardMaterial({ color: 0x241a2c, roughness: .9, envMapIntensity: .3 }),
    rail: new THREE.MeshStandardMaterial({ color: 0x2a2026, metalness: .6, roughness: .4 }),
    food: phys({ vertexColors: true, roughness: .55, clearcoat: .35, clearcoatRoughness: .35 }),
    crisp: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .7 }),
    prawn: phys({ vertexColors: true, roughness: .45, clearcoat: .7, clearcoatRoughness: .2 }),
    cream: phys({ color: 0xf1e2c4, roughness: .35, clearcoat: .5 }),
    leaf: new THREE.MeshStandardMaterial({ color: 0x3f7f2b, roughness: .55, side: THREE.DoubleSide }),
    rice: new THREE.MeshStandardMaterial({ color: 0xf1e7cf, roughness: .5 }),
    // the heap itself is packed grains too (rice-map from _work/bake_food.py), so no gap between the loose grains reads as a smooth dome
    riceBed: new THREE.MeshStandardMaterial({ map: T["rice-map"], normalMap: T["rice-normal"], normalScale: new THREE.Vector2(.9, .9), roughness: .6, envMapIntensity: .6 }),
    iron: new THREE.MeshStandardMaterial({ color: 0x18151a, roughness: .45, metalness: .7 }),
    steel: new THREE.MeshStandardMaterial({ color: 0xdadde2, roughness: .22, metalness: 1 }),
    onion: new THREE.MeshStandardMaterial({ color: 0xe8bcd2, roughness: .35, side: THREE.DoubleSide }),
    pepper: phys({ color: 0x3e8a2c, roughness: .3, clearcoat: .8, side: THREE.DoubleSide }),
    redp: phys({ color: 0xc0281f, roughness: .3, clearcoat: .8, side: THREE.DoubleSide }),
    lemon: phys({ color: 0xf2d24a, roughness: .35, clearcoat: .5 }),
    jamun: phys({ vertexColors: true, roughness: .35, clearcoat: 1, clearcoatRoughness: .08 }),
    syrup: new THREE.MeshStandardMaterial({ map: T["syrup-map"], roughnessMap: T["syrup-rough"], roughness: .4, normalMap: T["sauce-normal"], normalScale: new THREE.Vector2(.2, .2), transparent: true, opacity: .93, envMapIntensity: 1.5 }),
    glass: glassMat(),
    // thick mango lassi: saturated and a little self-lit, as light scatters through it, rather than a flat beige paint
    lassi: new THREE.MeshStandardMaterial({ color: 0xffc72a, roughness: .55, emissive: 0xa86a00, envMapIntensity: .35 }),
    coat: new THREE.MeshStandardMaterial({ color: 0xffc23a, roughness: .5, emissive: 0x6a4000, transparent: true, opacity: .32, depthWrite: false, side: THREE.DoubleSide }),
    froth: new THREE.MeshStandardMaterial({ color: 0xf8cf7e, roughness: .8 }),
    pista: new THREE.MeshStandardMaterial({ color: 0x9cc25a, roughness: .6 }),
    saffron: new THREE.MeshStandardMaterial({ color: 0xd8401c, roughness: .6 }),
    rose: new THREE.MeshStandardMaterial({ color: 0xc8264a, roughness: .5, side: THREE.DoubleSide }),
    wax: new THREE.MeshStandardMaterial({ color: 0xf4e6cc, roughness: .55, emissive: 0x3a1c06 }),
    butter: phys({ color: 0xf5dc8c, roughness: .25, clearcoat: 1 }),
    hull: new THREE.MeshStandardMaterial({ color: 0x1c1630, roughness: .7 }),
    // see-through, so the mountains' reflection under it shows (drawn after the solid things)
    water: new THREE.MeshBasicMaterial({ map: waterGrad(), transparent: true, opacity: .84, fog: false }), // unlit: lit water caught the warm rim light as a flat brown slab
    hill: new THREE.MeshStandardMaterial({ color: 0x22183a, roughness: 1 }),
    glowBulb: new THREE.MeshBasicMaterial({ color: new THREE.Color(3.2, 2.2, 1.1) }),
    portLight: new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 1.6, .7) }),
    marigold: new THREE.MeshStandardMaterial({ vertexColors: false, color: 0xffffff, roughness: .65, side: THREE.DoubleSide }),
    // the blisters are lifted out of the surface by the height map; the normal map shades them, the roughness map is the brushed butter
    naan: new THREE.MeshStandardMaterial({ map: T["naan-map"], normalMap: T["naan-normal"], roughnessMap: T["naan-rough"], roughness: 1, displacementMap: T["naan-height"], displacementScale: 0.055, envMapIntensity: .7 }),
    papad: new THREE.MeshStandardMaterial({ map: T["papad-map"], normalMap: T["papad-normal"], normalScale: new THREE.Vector2(.8, .8), roughness: .5, side: THREE.DoubleSide, envMapIntensity: .7 }),
    veg: phys({ vertexColors: true, roughness: .6, clearcoat: .25 }),
    onionV: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .4, side: THREE.DoubleSide }),
  };
  const curryMat = (k) => phys({ map: T[`${k}-map`], roughnessMap: T[`${k}-rough`], roughness: 1, clearcoat: .55, clearcoatRoughness: .15, normalMap: T["sauce-normal"], normalScale: new THREE.Vector2(.35, .35) });
  const R3 = seeded(20261116); // placements for the detail added in the third take (kept off the main seeded sequence)
  M.soup = curryMat("soup"); M.butterChicken = curryMat("butter"); M.dal = curryMat("dal"); M.palak = curryMat("palak");

  const at = (o, x, y, z) => { o.position.set(x, y, z); return o; };
  const cast = (o) => o.traverse((c) => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
  // Serve o with course n. opt.W is its window in the scroll (see win()); opt.mode how it arrives (MODES); opt.parent if it sits in a group
  function add(o, n, opt = {}) {
    if (opt.shadow !== false) cast(o);
    o.userData.base = { p: o.position.clone(), q: o.quaternion.clone(), s: o.scale.clone(), y0: opt.y0 };
    const W = opt.W || [n - 0.82 + (opt.d || 0) * 0.45, n - 0.46 + (opt.d || 0) * 0.45];
    anim.push({ o, W, mode: opt.mode || "pop", opt, t: -1 });
    (opt.parent || scene).add(o); return o;
  }
  const mesh = (g, m) => new THREE.Mesh(g, m);
  // planar (top-down) texture coordinates, so the hammer marks stay round instead of streaking towards the centre
  const lathe = (pts, m, seg = 96) => { const g = new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg), p = g.attributes.position, uv = g.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) + p.getY(i) * 0.3, p.getZ(i)); return mesh(g, m); };
  const Y0 = 0.035; // the plate's inner surface

  /* Terrace: walnut table, linen runner, a dark railing, string lights; the marina, boats and the Mahé hills beyond */
  const table = mesh(new THREE.BoxGeometry(13, 0.14, 8.5), M.table); table.position.y = -0.07; table.receiveShadow = true; scene.add(table);
  const runner = mesh(new THREE.BoxGeometry(13.02, 0.012, 1.7), M.runner); runner.position.set(0, 0.004, -3.35); runner.receiveShadow = true; scene.add(runner);
  const floor = mesh(new THREE.PlaneGeometry(60, 26), M.floor); floor.rotation.x = -Math.PI / 2; floor.position.set(0, -0.8, 5); floor.receiveShadow = true; scene.add(floor);
  for (let x = -16; x <= 16; x += 2) scene.add(at(mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.15, 8), M.rail), x, -0.22, -7.6));
  scene.add(at(mesh(new THREE.BoxGeometry(32.4, 0.06, 0.12), M.rail), 0, 0.34, -7.6));
  const bulbG = new THREE.SphereGeometry(0.065, 12, 8);
  for (let span = 0; span < 5; span++) {
    const x0 = -16 + span * 6.4, wire = [];
    for (let k = 0; k <= 16; k++) { const t = k / 16, x = x0 + t * 6.4, y = 3.6 - Math.sin(t * Math.PI) * 0.8; wire.push(new THREE.Vector3(x, y, -7.6)); if (k % 2 === 1) { const b = at(mesh(bulbG, M.glowBulb.clone()), x, y - 0.1, -7.6); scene.add(b); bulbs.push(b); const h = halo(b.position, 0.75, 0xffb466); h.userData.bulb = true; b.userData = { wave: (x + 16) / 32, halo: h, k: -1 }; } }
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(wire), new THREE.LineBasicMaterial({ color: 0x120c18 })));
  }
  const water = mesh(new THREE.PlaneGeometry(1400, 700), M.water); water.rotation.x = -Math.PI / 2; water.position.set(0, -6, -360); scene.add(water);
  for (let i = 0; i < 14; i++) { // the sunset caught on the water
    const s = mesh(new THREE.PlaneGeometry(4 + rnd() * 18, 0.18 + rnd() * .2), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.8, .9, .35), transparent: true, opacity: .55 - i * .03, fog: false, depthWrite: false }));
    s.rotation.x = -Math.PI / 2; s.position.set((rnd() - .5) * 30, -5.97, -240 + i * 14); scene.add(s);
  }
  for (let i = 0; i < 22; i++) { // boats at their moorings: dark hulls, a few lit portholes, a light at the masthead
    const y = new THREE.Group(), L = 2.4 + rnd() * 3;
    const hullG = new THREE.CylinderGeometry(L * 0.5, L * 0.34, 0.6, 4, 1); hullG.rotateY(Math.PI / 4); hullG.scale(1, 1, 0.3);
    y.add(at(mesh(hullG, M.hull), 0, 0.3, 0)); y.add(at(mesh(new THREE.BoxGeometry(L * 0.45, 0.42, L * 0.2), M.hull), -L * 0.06, 0.78, 0));
    for (let k = 0; k < 3; k++) if (rnd() > .35) y.add(at(mesh(new THREE.BoxGeometry(0.16, 0.08, 0.02), M.portLight), -L * .2 + k * .3, 0.8, L * 0.1 + 0.02));
    const h = L * (1.05 + rnd() * 0.6); y.add(at(mesh(new THREE.CylinderGeometry(0.04, 0.05, h, 5), M.hull), L * 0.1, h / 2 + 0.6, 0));
    y.add(at(mesh(new THREE.SphereGeometry(0.1, 8, 6), M.glowBulb), L * 0.1, h + 0.65, 0));
    y.position.set(-90 + rnd() * 180, -6, -30 - rnd() * 80); y.rotation.y = rnd() * 0.5 - 0.25; scene.add(y);
    y.updateMatrixWorld(); const mp = new THREE.Vector3(L * 0.1, h + 0.65, 0).applyMatrix4(y.matrixWorld); halo(mp, 1.5, 0xffc070, .4);
    // the masthead light drawn out on the water below it
    halo(new THREE.Vector3(mp.x, -6.2 - h * 0.32, mp.z), 1, 0xffb060, .2).scale.set(0.5, h * 0.7, 1);
  }
  /* Mahé across the water: two ridges of granite mountains in an arc round the west, the main massif a little left of centre,
     each mirrored faintly under the marina's surface. Lit from behind by the afterglow, so they read as dark shapes. */
  for (const [R, peak, base, seed, top, bot] of [[545, 98, 36, 7.3, 0x3f2c5a, 0x2d2549], [445, 64, 16, 2.1, 0x1f1c38, 0x15172a]]) {
    const segs = 280, pos = [], ref = [], cols = [], rcols = [], idx = [], cT = new THREE.Color(top), cB = new THREE.Color(bot);
    for (let i = 0; i <= segs; i++) {
      const a = -1.9 + 3.8 * i / segs, x = Math.sin(a) * R, z = -Math.cos(a) * R;
      let h = base + peak * (Math.exp(-(((a + .16) / .42) ** 2)) + .5 * Math.exp(-(((a - .58) / .3) ** 2)) + .38 * Math.exp(-(((a + .98) / .34) ** 2)));
      h *= 0.72 + 0.56 * fbm(a * 3 + seed, seed, 0, 4); h += (fbm(a * 24 + seed * 2, 1.7, 0, 3) - .5) * peak * .22;
      pos.push(x, -16, z, x, -6 + h, z); ref.push(x, -6.05, z, x, -6 - h * 0.8, z);
      cols.push(cB.r, cB.g, cB.b, cT.r, cT.g, cT.b); rcols.push(cT.r * .55, cT.g * .55, cT.b * .7, cB.r * .3, cB.g * .3, cB.b * .4);
      if (i < segs) { const k = i * 2; idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); }
    }
    for (const [p, c] of [[pos, cols], [ref, rcols]]) {
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(p, 3)); g.setAttribute("color", new THREE.Float32BufferAttribute(c, 3)); g.setIndex(idx);
      const m = new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, side: THREE.DoubleSide }); ridgeMats.push(m); scene.add(mesh(g, m));
    }
  }
  // the lights of the shore and the hillsides, thickest round Victoria
  { const tp = [], tc = [], c1 = new THREE.Color(0xffd08a), c2 = new THREE.Color(0xfff0dc), cc = new THREE.Color();
    for (let i = 0; i < 560; i++) {
      const a = (Math.random() < .6 ? (Math.random() - .5) * 0.9 - .1 : (Math.random() - .5) * 3.2), R = 438 - Math.random() * 26, up = Math.pow(Math.random(), 3) * 24;
      tp.push(Math.sin(a) * R, -5.7 + up, -Math.cos(a) * R); cc.copy(Math.random() < .7 ? c1 : c2).multiplyScalar(.5 + Math.random() * .9); tc.push(cc.r, cc.g, cc.b);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(tp, 3)); g.setAttribute("color", new THREE.Float32BufferAttribute(tc, 3));
    town = new THREE.Points(g, new THREE.PointsMaterial({ size: 2.2, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: .45, depthWrite: false, fog: false })); scene.add(town); }
  // stars, which come out towards the end
  { const p = [];
    for (let i = 0; i < 340; i++) { const a = Math.random() * 6.28, y = 0.14 + Math.pow(Math.random(), 0.7) * 0.84, r = Math.sqrt(1 - y * y); p.push(Math.cos(a) * r * 570, y * 570 - 6, Math.sin(a) * r * 570); }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
    stars = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xfff4e0, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0, depthWrite: false, fog: false })); scene.add(stars); }

  /* The thali (rolled rim) and five katoris with real wall thickness */
  const thali = lathe([[0, 0], [2.5, 0], [2.76, 0.05], [2.94, 0.22], [3.06, 0.34], [3.14, 0.37], [3.17, 0.395], [3.14, 0.415], [3.08, 0.4], [2.97, 0.3], [2.83, 0.15], [2.6, 0.05], [2.45, Y0], [0, Y0]], M.thali, 128);
  cast(thali); scene.add(thali);
  for (const r of [2.38, 2.42]) { const ring = mesh(new THREE.TorusGeometry(r, 0.008, 6, 160), M.katoriD); ring.rotation.x = Math.PI / 2; ring.position.y = Y0 + 0.002; scene.add(ring); }
  const KAT = [[0, 0], [0.4, 0], [0.58, 0.06], [0.69, 0.3], [0.745, 0.41], [0.765, 0.425], [0.77, 0.443], [0.75, 0.45], [0.73, 0.432], [0.70, 0.38], [0.655, 0.3], [0.55, 0.1], [0.4, 0.05], [0, 0.05]];
  const katori = (x, z, s = 1, y = Y0, m = M.katori) => { const k = lathe(KAT, m, 64); k.scale.setScalar(s); k.position.set(x, y, z); cast(k); return k; };
  const SPOTS = { soup: [-1.95, -0.55], butter: [-1.15, -1.6], dal: [0, -1.98], palak: [1.15, -1.6], salad: [1.95, -0.55] };
  for (const [x, z] of Object.values(SPOTS)) scene.add(katori(x, z));
  const SURF = Y0 + 0.3;
  const curry = (x, z, mat, n, W) => {
    const g = disc(22, 80, (px, pz, r) => r ** 8 * 0.035 + (fbm(px * 5 + x, pz * 5 + z, 1, 3) - .5) * 0.02); g.scale(0.66, 1, 0.66);
    const m = at(mesh(g, mat), x, SURF, z); m.receiveShadow = true; return add(m, n, { mode: "pour", W, y0: Y0 + 0.08, shadow: false });
  };

  /* Pouring: a brass ladle (or jug) flies in, tips over each bowl in turn while a stream runs into it, then flies away */
  const Zax = new THREE.Vector3(0, 0, 1);
  const streamG = new THREE.CylinderGeometry(0.032, 0.024, 1, 12, 1, true); streamG.translate(0, -0.5, 0);
  const LADLE = { lip: new THREE.Vector3(-0.245, 0.165, 0), tilt: 1.95, gap: 0.42 }, JUG = { lip: new THREE.Vector3(-0.4, 0.88, 0), tilt: 1.2, gap: 0.3 };
  const ladle = () => {
    const g = new THREE.Group();
    g.add(lathe([[0, 0], [0.12, 0.005], [0.2, 0.05], [0.235, 0.12], [0.245, 0.165], [0.228, 0.165], [0.215, 0.125], [0.185, 0.06], [0.11, 0.025], [0, 0.02]], M.katori, 40));
    const h = mesh(new THREE.CylinderGeometry(0.02, 0.027, 1.5, 10), M.katori); h.rotation.z = 0.9 - Math.PI / 2; h.position.set(0.23 + 0.75 * Math.cos(0.9), 0.165 + 0.75 * Math.sin(0.9), 0); g.add(h);
    return g;
  };
  const jug = () => {
    const g = new THREE.Group();
    g.add(lathe([[0, 0], [0.2, 0], [0.28, 0.1], [0.31, 0.3], [0.27, 0.52], [0.19, 0.66], [0.2, 0.8], [0.225, 0.84], [0.205, 0.845], [0.18, 0.8], [0.17, 0.68], [0, 0.68]], M.katori, 48));
    const sp = mesh(new THREE.CylinderGeometry(0.022, 0.05, 0.26, 12, 1, true), M.katori); sp.rotation.z = 0.98; sp.position.set(-0.29, 0.81, 0); g.add(sp);
    const hd = mesh(new THREE.TorusGeometry(0.19, 0.028, 8, 24, Math.PI), M.katori); hd.rotation.z = -Math.PI / 2; hd.position.set(0.27, 0.46, 0); g.add(hd);
    return g;
  };
  // pours: [{ x, z, top: highest surface, surf(): current surface, w: when it pours (a win()), col }]
  function pourer(g, kind, col, W, pours) {
    cast(g); g.visible = false; scene.add(g);
    const st = mesh(streamG, phys({ color: col, roughness: .3, clearcoat: .6 })); st.visible = false; scene.add(st);
    const lp = kind.lip.clone().applyAxisAngle(Zax, kind.tilt), spot = (q) => [q.x - lp.x, q.top + kind.gap - lp.y, q.z];
    const first = spot(pours[0]), last = spot(pours[pours.length - 1]), keys = [[W[0], first[0] + 1, first[1] + 1.5, first[2] + .5, 0]];
    for (const q of pours) { [q.a, q.b] = q.w; const s = spot(q), d = q.b - q.a; keys.push([q.a - d * .25, ...s, 0], [q.a + d * .08, ...s, kind.tilt], [q.b - d * .08, ...s, kind.tilt], [q.b + d * .15, ...s, 0]); }
    keys.push([W[1], last[0] + 1, last[1] + 1.7, last[2] + .5, 0]);
    const lipW = new THREE.Vector3();
    anim.push({ mode: "prop", W, fn: (t) => {
      const p = mix(W[0], W[1], t), on = t > 0 && t < 1; g.visible = on; if (!on) { st.visible = false; return; }
      let k = 0; while (k < keys.length - 2 && p > keys[k + 1][0]) k++;
      const A = keys[k], B = keys[k + 1], u = ease(clamp((p - A[0]) / (B[0] - A[0]))), tilt = mix(A[4], B[4], u);
      g.position.set(mix(A[1], B[1], u), mix(A[2], B[2], u), mix(A[3], B[3], u)); g.rotation.set(0, 0, tilt);
      const q = pours.find((c) => p >= c.a && p <= c.b + (c.b - c.a) * .1);
      st.visible = !!q && tilt > kind.tilt * .75;
      if (st.visible) {
        lipW.copy(kind.lip).applyAxisAngle(Zax, tilt).add(g.position);
        st.position.copy(lipW); st.scale.set(1, Math.max(.01, lipW.y - q.surf()), 1); if (q.col) st.material.color.set(q.col);
      }
    } });
  }
  // a ripple where something lands in a sauce
  const ringG = new THREE.RingGeometry(0.05, 0.075, 32); ringG.rotateX(-Math.PI / 2);
  const landing = (W) => W[0] + 0.72 * (W[1] - W[0]);
  function ring(x, y, z, p) {
    const r = at(mesh(ringG, new THREE.MeshBasicMaterial({ color: 0xffe2b8, transparent: true, opacity: 0, depthWrite: false })), x, y, z); r.visible = false; scene.add(r);
    anim.push({ mode: "prop", W: [p, p + .1], fn: (t) => { r.visible = t > 0 && t < 1; if (r.visible) { r.scale.setScalar(1 + 5 * easeOut(t)); r.material.opacity = .6 * (1 - t); } } });
  }
  // basmati poured onto the plate: every grain falls into its place, the bottom of the mound first
  function rain(im, W) {
    im.frustumCulled = false; im.visible = false;
    const n = im.count, arr = im.instanceMatrix.array, base = arr.slice(), dl = new Float32Array(n), dx = new Float32Array(n), dz = new Float32Array(n);
    for (let i = 0; i < n; i++) { dl[i] = clamp(base[i * 16 + 13] / 0.62) * 0.5 + Math.random() * 0.12; dx[i] = (Math.random() - .5) * .9; dz[i] = (Math.random() - .5) * .9; }
    let state = -1;
    anim.push({ mode: "prop", W, fn: (t) => {
      if (t <= 0) { if (state !== -1) { im.visible = false; state = -1; } return; }
      im.visible = true;
      if (t >= 1) { if (state !== 1) { arr.set(base); im.instanceMatrix.needsUpdate = true; state = 1; } return; }
      state = 0;
      for (let i = 0; i < n; i++) {
        const u = clamp((t - dl[i]) / 0.36), o = i * 16;
        if (u <= 0) { arr.fill(0, o, o + 16); continue; }
        for (let j = 0; j < 16; j++) arr[o + j] = base[o + j];
        const f = 1 - u; arr[o + 12] += dx[i] * f; arr[o + 13] += 2.6 * f * f; arr[o + 14] += dz[i] * f;
      }
      im.instanceMatrix.needsUpdate = true;
    } });
  }
  // marigold petals that swirl down onto the table
  function confetti(im, W) {
    im.frustumCulled = false; im.visible = false; scene.add(im);
    const n = im.count, base = [], d = new THREE.Object3D(), mtx = new THREE.Matrix4();
    for (let i = 0; i < n; i++) { im.getMatrixAt(i, mtx); const b = { p: new THREE.Vector3(), q: new THREE.Quaternion(), s: new THREE.Vector3(), dl: Math.random() * .5, sw: Math.random() * 6.28, h: 2.5 + Math.random() * 2.5 }; mtx.decompose(b.p, b.q, b.s); base.push(b); }
    let state = -1;
    anim.push({ mode: "prop", W, fn: (t) => {
      if (t <= 0) { if (state !== -1) { im.visible = false; state = -1; } return; }
      im.visible = true; if (t >= 1 && state === 1) return; state = t >= 1 ? 1 : 0;
      for (let i = 0; i < n; i++) {
        const b = base[i], u = clamp((t - b.dl) / .5), f = 1 - u;
        d.position.set(b.p.x + Math.sin(b.sw + u * 5) * .8 * f, b.p.y + b.h * f * f, b.p.z + Math.cos(b.sw + u * 5) * .8 * f);
        d.quaternion.copy(b.q).multiply(qA.setFromEuler(eA.set(f * 7, f * 3, f * 5))); d.scale.copy(b.s).multiplyScalar(u > 0 ? 1 : 0);
        d.updateMatrix(); im.setMatrixAt(i, d.matrix);
      }
      im.instanceMatrix.needsUpdate = true;
    } });
  }
  const LEAF = leafGeo();
  const leaves = (x, z, y, n, spread = 0.42) => { const g = new THREE.Group(); for (let i = 0; i < n; i++) { const l = mesh(LEAF, M.leaf); const a = rnd() * 6.28, r = Math.sqrt(rnd()) * spread; l.position.set(Math.cos(a) * r, rnd() * .01, Math.sin(a) * r); l.rotation.set((rnd() - .5) * .5, rnd() * 6.28, (rnd() - .5) * .5); l.scale.setScalar(0.8 + rnd() * .6); g.add(l); } g.position.set(x, y, z); return g; };
  // a drizzle of cream drawn through a curry: a thin film lying on its surface (a copy of it, just above), revealed along the spiral.
  // swirl.png: green is how much cream, red how far along the drizzle. k sizes the spiral to the bowl, rot turns it.
  function cream(cm, W, k, rot) {
    const g = cm.geometry.clone(); g.translate(0, 0.005, 0);
    const uv = g.attributes.uv, c = Math.cos(rot), s = Math.sin(rot);
    for (let i = 0; i < uv.count; i++) { const u = (uv.getX(i) - .5) / k, v = (uv.getY(i) - .5) / k; uv.setXY(i, .5 + u * c - v * s, .5 + u * s + v * c); }
    const m = new THREE.MeshStandardMaterial({ color: 0xf4e8cf, roughness: .32, alphaMap: T.swirl, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }), draw = { value: 0 };
    m.onBeforeCompile = (sh) => { sh.uniforms.uDraw = draw; sh.fragmentShader = "uniform float uDraw;\n" + sh.fragmentShader.replace("#include <alphamap_fragment>", "#include <alphamap_fragment>\n  diffuseColor.a *= step(texture2D(alphaMap, vAlphaMapUv).r, uDraw);"); };
    const d = new THREE.Mesh(g, m); d.receiveShadow = true; d.visible = false; cm.add(d);
    anim.push({ mode: "prop", W, fn: (t) => { d.visible = t > 0; draw.value = easeOut(t) * 1.01 - 0.005; } });
  }

  /* 1. Soups & street food: a ladle pours the shorba and a swirl of cream is drawn through it; samosas, papad and chutneys are thrown on */
  const soupM = curry(...SPOTS.soup, M.soup, 1, win(1, .31, .52));
  pourer(ladle(), LADLE, 0xb8401e, win(1, .1, .66), [{ x: SPOTS.soup[0], z: SPOTS.soup[1], top: SURF, surf: () => soupM.position.y, w: win(1, .3, .52) }]);
  cream(soupM, win(1, .54, .7), .62, .4);
  add(leaves(SPOTS.soup[0], SPOTS.soup[1], SURF + 0.02, 7, .4), 1, { mode: "toss", W: win(1, .62, .78), from: [0, .9, 0], spin: [.2, .6, .1], nob: true, shadow: false });
  // kuchumber: diced tomato, cucumber and red onion heaped well above the rim over a bed of the same (so no brass shows between
  // the pieces), coriander and a lemon wedge on top. Pieces about 1 cm, three cuts of each so no two look stamped out.
  const salad = new THREE.Group(), RS = seeded(5150);
  for (let i = 0; i < 644; i++) R3(); // the draws the previous salad took from R3, so the detail placed after it lands where it did
  burn(432); // the draws the old diced salad took
  const sbed = mesh(paint(disc(8, 40, (x, z, r) => (1 - r * r) * 0.2 + (fbm(x * 6, z * 6, 4, 2) - .5) * 0.05), (x, y, z, c) => { const n = fbm(x * 9 + 2, z * 9, 1, 2); c.set(n < .46 ? 0x7a1a10 : n < .6 ? 0x3b5a22 : 0x5e2446); }), M.veg);
  sbed.scale.set(0.58, 1, 0.58); sbed.position.y = 0.1; salad.add(sbed);
  const heapS = (r) => 0.16 + (1 - (r / .6) ** 2) * 0.24;
  for (const [geos, n, mat] of [[[tomatoBit(1), tomatoBit(5), tomatoBit(9)], 30, M.veg], [[cucumberBit(2), cucumberBit(6), cucumberBit(8)], 30, M.veg], [[onionBit(.4), onionBit(2.2)], 16, M.onionV]]) for (const geo of geos) {
    const im = new THREE.InstancedMesh(geo, mat, n), d = new THREE.Object3D();
    for (let i = 0; i < n; i++) {
      const a = RS() * 6.28, r = Math.sqrt(RS()) * 0.55, s = 1.1 + RS() * .4;
      d.position.set(Math.cos(a) * r, heapS(r) + RS() * .05, Math.sin(a) * r); d.rotation.set(RS() * 6, RS() * 6, RS() * 6);
      d.scale.set(s * (0.85 + RS() * .3), s, s * (0.85 + RS() * .3)); d.updateMatrix(); im.setMatrixAt(i, d.matrix);
    }
    im.castShadow = true; salad.add(im);
  }
  const wedge = mesh(new THREE.SphereGeometry(0.16, 20, 12, 0, Math.PI / 2, 0, Math.PI / 2), M.lemon); wedge.rotation.set(0, .6, Math.PI / 2); wedge.position.set(0.1, 0.5, 0.05); salad.add(wedge);
  salad.add(leaves(0, 0, 0.5, 5, .3));
  for (let k = 0; k < 9; k++) { const l = mesh(LEAF, M.leaf), ang = RS() * 6.28, r = Math.sqrt(RS()) * .45; l.position.set(Math.cos(ang) * r, heapS(r) + .06, Math.sin(ang) * r); l.rotation.set(-1.2 + RS() * .6, RS() * 6, RS() * .5); l.scale.setScalar(.8 + RS() * .4); salad.add(l); }
  add(at(salad, SPOTS.salad[0], Y0, SPOTS.salad[1]), 1, { mode: "toss", W: win(1, .16, .44), from: [.8, 2.4, -.6], spin: [0, .3, 0] });
  const SAMOSA = samosaGeo(1, lite ? 20 : 30); // one shape for all three (it takes a moment to build), each turned and sized differently
  [[-1.55, 1.0, 0.4], [-1.0, 1.42, -0.5], [-1.85, 1.62, 1.4]].forEach(([x, z, ry], k) => { const s = mesh(SAMOSA, M.crisp); s.rotation.y = ry; s.scale.setScalar([1.18, 1.1, 1.24][k]); add(at(s, x, Y0 + 0.21 * s.scale.x, z), 1, { mode: "toss", W: win(1, .36 + k * .07, .62 + k * .07), from: [-1.4, 2.6, 1.8], spin: [.2, .7, 1] }); });
  // mint and tamarind chutney in two little brass bowls
  [[-0.98, 0.72, 0x4c8530, .55, win(1, .7, .82)], [-0.5, 1.2, 0x4a1a0c, .18, win(1, .74, .86)]].forEach(([x, z, col, ro, W]) => {
    const g = new THREE.Group(), k = .235; g.add(katori(0, 0, k, 0));
    const sf = mesh(disc(10, 40, (px, pz, r) => (fbm(px * 4 + x, pz * 4, 2, 2) - .5) * .05 + r ** 6 * .06), phys({ color: col, roughness: ro, clearcoat: .5, normalMap: T["sauce-normal"], normalScale: new THREE.Vector2(.5, .5) }));
    sf.scale.set(.66 * k, k, .66 * k); sf.position.y = .32 * k; sf.receiveShadow = true; g.add(sf);
    add(at(g, x, Y0, z), 1, { W });
  });
  const papad = mesh(papadGeo(2), M.papad);
  papad.scale.setScalar(0.62); papad.rotation.set(-0.42, 0.3, 0.12); papad.position.set(-0.25, Y0 + 0.22, 2.25);
  add(papad, 1, { mode: "toss", W: win(1, .46, .76), from: [.6, 3, 1.6], spin: [1, .15, 0] });

  /* 2. From the tandoor: a sizzling iron platter on a board */
  const sz = new THREE.Group();
  sz.add(at(mesh(rounded(2.7, 0.12, 2.0, 0.04, 3), M.board), 0, 0.06, 0));
  const iron = mesh(new THREE.CylinderGeometry(1, 0.96, 0.1, 64), M.iron); iron.scale.set(1.16, 1, 0.8); iron.position.y = 0.17; sz.add(iron);
  const lip = mesh(new THREE.TorusGeometry(1, 0.035, 8, 64), M.iron); lip.scale.set(1.16, 0.8, 1); lip.rotation.x = Math.PI / 2; lip.position.y = 0.23; sz.add(lip);
  // a bed of sliced onion and pepper under everything
  for (let k = 0; k < 26; k++) {
    const R = 0.06 + rnd() * .06, tg = new THREE.TorusGeometry(R, 0.012, 6, 28, Math.PI * (1 + rnd()));
    if (k % 4) paint(tg, (x, y, z, c) => { c.set(0xf1e3e8).lerp(new THREE.Color(0x8e3466), clamp((Math.hypot(x, y) - R) / 0.012 * .5 + .5)); const n = fbm(x * 40 + k, y * 40, 1, 2); if (n > .58) c.lerp(new THREE.Color(0x6a3414), clamp((n - .58) * 4) * .8); });
    const ring = mesh(tg, k % 4 ? M.onionV : M.pepper); ring.scale.z = 0.4; ring.rotation.set(-Math.PI / 2 + (rnd() - .5) * .4, 0, rnd() * 6); ring.position.set((rnd() - .5) * 1.8, 0.235, (rnd() - .5) * 1.1); sz.add(ring);
  }
  // served off the skewer, crowded the way it comes out of the kitchen: chicken tikka on the left, paneer tikka with charred
  // peppers and onion on the right, two seekh kebabs across the middle
  burn(38); // the draws the old skewers took
  const near = (x, z, r, list) => list.every(([a, b, q]) => Math.hypot(a - x, b - z) > r + q);
  const placed = [[-0.55, -0.6, .22], [0.3, -0.62, .22], [-0.6, .55, .12], [-0.18, .55, .12], [0.24, .55, .12], [0.66, .55, .12], [0.96, -0.58, .18]];
  const scatter = (n, x0, x1, z0, z1, r, make) => { for (let k = 0, tries = 0; k < n && tries < 400; tries++) { const x = mix(x0, x1, R3()), z = mix(z0, z1, R3()); if ((x / 1.08) ** 2 + (z / .72) ** 2 > 1 || !near(x, z, r, placed)) continue; placed.push([x, z, r]); sz.add(make(x, z, k++)); } };
  [[-0.12, -0.26, .12], [0.12, -0.02, -.1]].forEach(([x, z, ry], k) => { const m = mesh(seekhGeo(3 + k), M.food); m.rotation.set(0, ry, (R3() - .5) * .1); m.position.set(x, 0.275, z); sz.add(m); placed.push([x - .2, z, .07], [x, z, .07], [x + .2, z, .07]); });
  scatter(7, -1.0, -0.3, -0.35, 0.35, .1, (x, z, k) => { const m = mesh(tikkaGeo(0.1, k * 3 + 1), M.food); m.rotation.set((R3() - .5) * .6, R3() * 6, (R3() - .5) * .6); m.position.set(x, 0.3, z); return m; });
  scatter(5, 0.35, 1.0, -0.35, 0.3, .1, (x, z, k) => { const m = mesh(paneerGeo(0.15, k), M.food); m.rotation.set((R3() - .5) * .4, R3() * 6, (R3() - .5) * .4); m.position.set(x, 0.285, z); return m; });
  scatter(6, -0.9, 1.0, -0.45, 0.4, .06, (x, z, k) => {
    const m = k % 3 === 2 ? mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.09, 12, 1, true, 0, Math.PI), M.onion) : mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.1, 12, 1, true, 0, Math.PI * 0.8), k % 2 ? M.pepper : M.redp);
    m.rotation.set(R3() * .5, R3() * 6, Math.PI / 2); m.position.set(x, 0.27, z); return m; });
  // two lamb chops at the back of the platter, bones out
  [[-0.55, -0.6, 2.6], [0.3, -0.62, 0.4]].forEach(([x, z, ry], k) => { const c = mesh(lambChopGeo(7 + k), M.food); c.rotation.set((R3() - .5) * .2, ry, (R3() - .5) * .15); c.position.set(x, 0.29, z); sz.add(c); });
  for (let k = 0; k < 4; k++) { const pr = mesh(prawnGeo(1.05, k), M.prawn); pr.rotation.set(0, k * 1.3 + .3, 0); pr.position.set(-0.6 + k * 0.42, 0.25, 0.55); sz.add(pr); }
  for (let k = 0; k < 2; k++) { const lw = mesh(new THREE.SphereGeometry(0.16, 20, 12, 0, Math.PI / 2, 0, Math.PI / 2), M.lemon); lw.rotation.set(0, k * 1.4, Math.PI / 2); lw.position.set(0.85 + k * 0.22, 0.33, -0.58); sz.add(lw); }
  sz.add(leaves(0, 0, 0.36, 9, .9));
  sz.position.set(SIZZLE.x, 0, SIZZLE.z); sz.rotation.y = 0.35;
  // slid in hot along the table from the left; it lands with a hiss of smoke and a shower of embers (see frame)
  const szW = win(2, .1, .52); SIZZLE.p = szW[0] + 0.6 * (szW[1] - szW[0]);
  add(sz, 2, { mode: "slide", W: szW, from: [-5.5, 0, 2.8], turn: -.9 });
  puffs.push(...steam(-4.6, 0.45, 0.95, 2, 12, 1.1, 1.25));
  { const N = 70, g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(N * 3), 3)); g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(N * 3), 3));
    embers = new THREE.Points(g, new THREE.PointsMaterial({ size: 0.07, map: soft(), vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    embers.frustumCulled = false; scene.add(embers);
    for (let k = 0; k < N; k++) emberSeed.push([Math.random(), 0.22 + Math.random() * 0.3, (Math.random() - .5) * 1.7, (Math.random() - .5) * 1.0, (Math.random() - .5) * 0.7]); }

  /* 3. Curries: one ladle works along the bowls, butter chicken, then dal makhani, then palak paneer; chicken tikka and paneer
     are dropped in with a ripple, a pat of butter melts on the dal */
  const bcM = curry(...SPOTS.butter, M.butterChicken, 3, win(3, .21, .32));
  const dlM = curry(...SPOTS.dal, M.dal, 3, win(3, .39, .5));
  const pkM = curry(...SPOTS.palak, M.palak, 3, win(3, .57, .68));
  pourer(ladle(), LADLE, 0xc4561e, win(3, .08, .8), [
    { x: SPOTS.butter[0], z: SPOTS.butter[1], top: SURF, surf: () => bcM.position.y, w: win(3, .2, .32), col: 0xc4561e },
    { x: SPOTS.dal[0], z: SPOTS.dal[1], top: SURF, surf: () => dlM.position.y, w: win(3, .38, .5), col: 0x5c2a14 },
    { x: SPOTS.palak[0], z: SPOTS.palak[1], top: SURF, surf: () => pkM.position.y, w: win(3, .56, .68), col: 0x3d6b26 },
  ]);
  cream(bcM, win(3, .33, .46), .6, 2.1);
  add(leaves(SPOTS.butter[0], SPOTS.butter[1], SURF + 0.03, 8), 3, { mode: "toss", W: win(3, .8, .94), from: [0, .9, 0], spin: [.2, .6, .1], nob: true, shadow: false });
  for (let k = 0; k < 5; k++) {
    const x = SPOTS.butter[0] + Math.cos(k * 1.3) * 0.34, z = SPOTS.butter[1] + Math.sin(k * 1.3) * 0.34, W = win(3, .4 + k * .045, .52 + k * .045);
    add(at(mesh(tikkaGeo(0.09, 20 + k, 0xc4561e), M.food), x, SURF - 0.03, z), 3, { mode: "toss", W, from: [.3, 1.5, .8], spin: [.6, .9, .3] }); ring(x, SURF + .012, z, landing(W));
  }
  cream(dlM, win(3, .51, .62), .64, 4.0);
  add(at(mesh(rounded(0.15, 0.06, 0.15, 0.02, 2), M.butter), SPOTS.dal[0] + 0.1, SURF + 0.02, SPOTS.dal[1] + 0.05), 3, { mode: "melt", W: win(3, .6, .97) });
  for (let k = 0; k < 7; k++) {
    const p = mesh(paneerGeo(0.14, 40 + k, false, 0x3d6b26), M.food); p.rotation.y = rnd() * 3;
    const x = SPOTS.palak[0] + Math.cos(k * .9 + .3) * 0.34, z = SPOTS.palak[1] + Math.sin(k * .9 + .3) * 0.34, W = win(3, .7 + k * .025, .8 + k * .025);
    add(at(p, x, SURF - 0.06, z), 3, { mode: "toss", W, from: [.2, 1.3, .7], spin: [.4, .8, .5] }); ring(x, SURF + .012, z, landing(W));
  }
  cream(pkM, win(3, .88, .98), .42, 1.0);
  for (const k of ["soup", "butter", "dal", "palak"]) puffs.push(...steam(SPOTS[k][0], SURF + .1, SPOTS[k][1], k === "soup" ? 1 : 3, 6, 0.4, 1));

  /* 4. Rice & biryani: a mound of long basmati grains, saffron-stained, with prawns, mint and fried onion */
  // the plate stays put; its parts are served one by one: the rice rains on, then prawns, mint and crisp onion
  const mound = new THREE.Group(); mound.position.set(0, Y0, 0.15); scene.add(mound);
  // the heap: high in the middle and lumpy, the way biryani is spooned out, not a perfect dome; everything on it sits at its height
  const HEAP = (x, z) => { const r2 = Math.min(1, x * x + z * z); return Math.pow(1 - r2, 0.62) * (0.88 + (fbm(x * 2.1 + 3, z * 2.1, 0.5, 3) - .5) * 1.1 + (fbm(x * 6 + 1, z * 6, 2, 2) - .5) * 0.25); };
  const onHeap = (x, z) => HEAP(x / 0.93, z / 0.93) * 0.6;
  const bed = mesh(disc(26, 96, (x, z) => HEAP(x, z)), M.riceBed); bed.scale.set(0.93, 0.6, 0.93);
  add(bed, 4, { mode: "rise", W: win(4, .14, .6), parent: mound }); bed.receiveShadow = false; // lit evenly, so the gaps between grains don't read as dark holes
  if (!F.has("norice")) {
    const rice = riceMesh(lite ? 1800 : 2600, M.rice); // made at full count so the main random sequence is drawn as before, then
    rice.count = lite ? 520 : 820; layRice(rice, HEAP, seeded(5251)); // only a scatter of loose grains is drawn: the heap's own texture is the packed rice
    mound.add(rice); rain(rice, win(4, .1, .66));
  }
  const RB = seeded(5252); // extra crisp onion, off the main sequence
  for (let k = 0; k < 18; k++) { const o = mesh(new THREE.TorusGeometry(0.03 + RB() * .025, 0.007, 5, 12, Math.PI * (0.7 + RB())), M.crisp), oc = RB() < .5 ? 0x5a2a0e : 0x8a4a1c; paint(o.geometry, (x, y, z, c) => c.set(oc)); const a = RB() * 6.28, r = .1 + RB() * .55, x = Math.cos(a) * r, z = Math.sin(a) * r; o.position.set(x, onHeap(x, z) + 0.012, z); o.rotation.set(-Math.PI / 2 + (RB() - .5) * .6, 0, RB() * 6); add(o, 4, { mode: "toss", W: win(4, .7 + k * .008, .82 + k * .008), from: [0, .8, 0], spin: [.8, .5, .6], nob: true, parent: mound, shadow: false }); }
  for (let k = 0; k < 9; k++) { const l = mesh(LEAF, M.leaf); const a = k * .7, r = .15 + rnd() * .35; l.position.set(Math.cos(a) * r, onHeap(Math.cos(a) * r, Math.sin(a) * r) + 0.02, Math.sin(a) * r); l.rotation.set(-.3, a, 0); l.scale.setScalar(1.4); add(l, 4, { mode: "toss", W: win(4, .74 + k * .02, .86 + k * .02), from: [0, .7, 0], spin: [.3, .8, .2], nob: true, parent: mound, shadow: false }); }
  for (let k = 0; k < 16; k++) { const o = mesh(new THREE.TorusGeometry(0.035 + rnd() * .02, 0.008, 5, 12, Math.PI * (0.8 + rnd())), M.crisp); paint(o.geometry, (x, y, z, c) => c.set(0x6a3412)); const a = rnd() * 6.28, r = rnd() * .45; o.position.set(Math.cos(a) * r, onHeap(Math.cos(a) * r, Math.sin(a) * r) + 0.015, Math.sin(a) * r); o.rotation.set(rnd() * 3, rnd() * 3, 0); add(o, 4, { mode: "toss", W: win(4, .68 + k * .01, .8 + k * .01), from: [0, .8, 0], spin: [.8, .5, .6], nob: true, parent: mound, shadow: false }); }
  for (let k = 0; k < 3; k++) { const pr = mesh(prawnGeo(1.05, 10 + k), M.prawn); const a = k * 2.1 + .4, px = Math.cos(a) * 0.32, pz = Math.sin(a) * 0.32 + 0.1; pr.position.set(px, onHeap(px, pz) + 0.07, pz); pr.rotation.set(-0.12, a, 0.08); add(pr, 4, { mode: "toss", W: win(4, .56 + k * .05, .76 + k * .05), from: [.4, 1.8, .9], spin: [.3, 1, .2], parent: mound }); }
  puffs.push(...steam(0, 0.85, 0.15, 4, 8, 0.6, 1.2));

  /* 5. Breads: two blistered naans flipped onto the rim, a pat of butter melting */
  [[1.4, 1.2, -0.6, 0.18, -0.2], [1.95, 0.55, -1.15, 0.24, -0.35]].forEach(([x, z, ry, rx, rz], k) => {
    burn(120); // the draws the old naan blisters took
    const n = mesh(naanGeo(k * 2.4 + .7), M.naan); n.scale.setScalar(0.95); n.rotation.order = "YXZ"; n.rotation.set(rx, ry, rz); n.position.set(x, Y0 + 0.14 + k * 0.07, z);
    add(n, 5, { mode: "toss", W: win(5, .14 + k * .18, .5 + k * .18), from: [1.8, 3, 1.4], spin: [1, .2, 0] });
  });
  add(at(mesh(rounded(0.18, 0.07, 0.13, 0.025, 2), M.butter), 1.3, 0.34, 1.15), 5, { mode: "melt", W: win(5, .62, .98) });

  /* 6. Desserts & lassi: the bowl slides in and fills with syrup, three gulab jamun roll across the table and hop in; a brass jug
     pours the mango lassi */
  add(katori(3.95, -1.25, 0.95, 0, M.katoriD), 6, { mode: "slide", W: win(6, .06, .3), from: [1.6, 0, 1.4], turn: .6 });
  const syrup = mesh(disc(10, 48, () => 0), M.syrup); syrup.scale.set(0.62, 1, 0.62); syrup.position.set(3.95, 0.27, -1.25);
  add(syrup, 6, { mode: "pour", W: win(6, .22, .4), y0: 0.07, shadow: false });
  [[-0.17, 0.06, 1], [0.19, -0.08, 2], [0.02, 0.2, 3]].forEach(([dx, dz, sd], k) => {
    const g = paint(blob(0.19, .08, 4, sd), (x, y, z, c) => c.set(0x7a3214).lerp(new THREE.Color(0x48190a), clamp((fbm(x * 18 + sd, y * 18, z * 18, 2) - .45) * 2)));
    const W = win(6, .32 + k * .08, .6 + k * .08);
    add(at(mesh(g, M.jamun), 3.95 + dx, 0.36, -1.25 + dz), 6, { mode: "roll", W, from: [2.3 + k * .3, 0, 1.5 - k * .2], r: .19 }); ring(3.95 + dx, .28, -1.25 + dz, W[1] - .01);
  });
  for (let k = 0; k < 9; k++) { const s = mesh(new THREE.BoxGeometry(0.06, 0.012, 0.022), M.pista); s.rotation.set(0, rnd() * 3, 0); add(at(s, 3.95 + (rnd() - .5) * .38, 0.56, -1.25 + (rnd() - .5) * .3), 6, { mode: "toss", W: win(6, .66 + k * .015, .76 + k * .015), from: [0, .8, 0], spin: [.5, 1, .3], nob: true, shadow: false }); }
  const petal = mesh(disc(6, 24, (x, z, r) => r * r * 0.05), M.rose); petal.scale.set(0.09, 1, 0.12); petal.rotation.set(0.3, 0.5, 0); add(at(petal, 3.8, 0.58, -1.18), 6, { mode: "toss", W: win(6, .8, .97), from: [.4, 1.3, .3], spin: [.5, 1.6, .4], nob: true, shadow: false });
  const glassG = new THREE.LatheGeometry([[0, 0], [0.36, 0], [0.41, 1.55], [0.425, 1.56], [0.41, 1.57], [0.39, 1.55], [0.34, 0.08], [0, 0.08]].map(([r, y]) => new THREE.Vector2(r, y)), 64);
  const glass = at(mesh(glassG, M.glass), 4.75, 0, -2.75); add(glass, 6, { mode: "slide", W: win(6, .1, .32), from: [1.4, 0, 1], shadow: false });
  const lassiG = new THREE.CylinderGeometry(0.385, 0.345, 1.25, 48); lassiG.translate(0, 0.625, 0);
  const lassiM = add(at(mesh(lassiG, M.lassi), 4.75, 0.08, -2.75), 6, { mode: "rise", W: win(6, .4, .66) });
  pourer(jug(), JUG, 0xf7bd55, win(6, .26, .8), [{ x: 4.75, z: -2.75, top: 1.56, surf: () => 0.08 + 1.25 * lassiM.scale.y, w: win(6, .4, .66) }]);
  // thick lassi clings to the glass above the level it was poured to
  const coat = new THREE.CylinderGeometry(0.389, 0.384, 0.13, 48, 1, true); coat.translate(0, 0.065, 0); add(at(mesh(coat, M.coat), 4.75, 1.33, -2.75), 6, { W: win(6, .64, .74), shadow: false });
  const froth = mesh(disc(10, 48, (x, z, r) => (fbm(x * 8, z * 8, 2, 3) - .5) * 0.04 + (1 - r * r) * 0.03), M.froth); froth.scale.set(0.38, 1, 0.38); add(at(froth, 4.75, 1.33, -2.75), 6, { W: win(6, .66, .78), shadow: false });
  for (let k = 0; k < 10; k++) { const s = mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.08, 4), k % 3 ? M.saffron : M.pista); s.rotation.set(Math.PI / 2, rnd() * 3, 0); add(at(s, 4.75 + (rnd() - .5) * .4, 1.37, -2.75 + (rnd() - .5) * .4), 6, { mode: "toss", W: win(6, .74 + k * .012, .84 + k * .012), from: [0, .6, 0], spin: [.4, .8, .3], nob: true, shadow: false }); }

  /* 7. Your table: marigold petals swirl down round the thali, the string lights come on one after another */
  const petG = disc(4, 14, (x, z, r) => r * r * 0.012); petG.scale(0.08, 1, 0.05);
  const pets = new THREE.InstancedMesh(petG, M.marigold, 90), pd = new THREE.Object3D(), pc = new THREE.Color();
  for (let k = 0; k < 90; k++) {
    const a = rnd() * 6.28, r = 3.35 + Math.pow(rnd(), 1.6) * 2.2; pd.position.set(Math.cos(a) * r, 0.01, Math.sin(a) * r * 0.78); pd.rotation.set((rnd() - .5) * .6, rnd() * 6.28, (rnd() - .5) * .6); pd.scale.setScalar(0.8 + rnd() * .7); pd.updateMatrix();
    pets.setMatrixAt(k, pd.matrix); pets.setColorAt(k, pc.set([0xf6a81a, 0xef8a12, 0xe0620e, 0xf8c23a][k % 4]));
  }
  pets.receiveShadow = true; confetti(pets, win(7, .06, .8));

  /* The candle: a brass stand, a candle with a soft pool of melted wax, and a flame that blooms */
  const holder = lathe([[0, 0], [0.42, 0], [0.4, 0.05], [0.2, 0.1], [0.15, 0.32], [0.3, 0.38], [0.32, 0.42], [0.18, 0.43], [0, 0.43]], M.katori, 48); holder.position.set(-3.7, 0, -2.6); cast(holder); scene.add(holder);
  const waxG = new THREE.LatheGeometry([[0, 0], [0.16, 0], [0.165, 0.42], [0.15, 0.47], [0.1, 0.45], [0.02, 0.43], [0, 0.43]].map(([r, y]) => new THREE.Vector2(r, y)), 40);
  const wax = at(mesh(waxG, M.wax), -3.7, 0.43, -2.6); cast(wax); scene.add(wax);
  flame = mesh(new THREE.SphereGeometry(0.055, 16, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color(6, 3.6, 1.4) })); flame.scale.set(1, 2.6, 1); flame.position.set(-3.7, 1.0, -2.6); scene.add(flame);
  glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: soft(), color: 0xffa040, transparent: true, opacity: .4, depthWrite: false, blending: THREE.AdditiveBlending }));
  glow.scale.setScalar(0.9); glow.position.copy(flame.position); scene.add(glow); hideForDepth.push(glow);
  flameLight = new THREE.PointLight(0xff9a40, 2.2, 7, 1.4); flameLight.position.set(-3.7, 1.15, -2.6); scene.add(flameLight);

  /* Post-processing in three passes: the scene into an anti-aliased HDR buffer, a horizontal blur, then a vertical blur that also
     adds film grain and a vignette and writes the final colours to the screen (the lights glow with sprites, far cheaper than bloom).
     Depth of field, the cheap way: from these camera angles depth follows screen height, so blur grows with the distance from a
     sharp band around the dish in focus (more above it, where the marina is, than below). */
  mark("models");
  sceneRT = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: lite ? 0 : 4 });
  blurRT = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, depthBuffer: false });
  const blurMat = (final) => new THREE.ShaderMaterial({
    defines: final ? { FINAL: 1 } : {}, depthTest: false, depthWrite: false, toneMapped: final,
    uniforms: { tDiffuse: { value: final ? blurRT.texture : sceneRT.texture }, delta: { value: new THREE.Vector2() }, focusY: { value: .5 }, band: { value: .12 }, far: { value: 3.2 }, near: { value: 2.2 }, t: { value: 0 } },
    vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }",
    fragmentShader: `uniform sampler2D tDiffuse; uniform vec2 delta; uniform float focusY, band, far, near, t; varying vec2 vUv;
      float rnd(vec2 c){ return fract(sin(dot(c, vec2(12.9898, 78.233))) * 43758.5453); }
      void main(){
        float dy = vUv.y - focusY, d = max(0., abs(dy) - band), r = clamp(d * (dy > 0. ? far : near), 0., 1.);
        vec4 c;
        if (r < .02) { c = texture2D(tDiffuse, vUv);
          #ifdef FINAL
          vec2 o = (vUv - .5) * .0026; c.r = texture2D(tDiffuse, vUv + o).r; c.b = texture2D(tDiffuse, vUv - o).b;
          #endif
        }
        else { vec4 sum = vec4(0.); float tot = 0.;
          for (int i = -4; i <= 4; i++) { float fi = float(i), w = exp(-fi * fi / 8.); sum += texture2D(tDiffuse, vUv + delta * fi * r * 3.3) * w; tot += w; }
          c = sum / tot; }
        #ifdef FINAL
        vec2 q = vUv - .5; float v = smoothstep(.95, .3, length(q * vec2(1., 1.2)));
        c.rgb *= mix(.55, 1., v); c.rgb += (rnd(vUv * 731. + t) - .5) * .045 * (c.rgb + .05);
        #endif
        gl_FragColor = c;
        #ifdef FINAL
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #endif
      }`,
  });
  blurH = blurMat(false); blurV = blurMat(true); grain = blurV;
  quad = new FullScreenQuad(blurH);
}

/* A dusk environment for reflections: sunset band, indigo sky, a warm pendant overhead */
function duskEnvironment() {
  const s = new THREE.Scene(), g = new THREE.SphereGeometry(50, 48, 24), cols = [], p = g.attributes.position, c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i) / 50, zf = -p.getZ(i) / 50;
    if (y < 0) c.setRGB(0.06, 0.035, 0.03); else c.setRGB(0.25, 0.18, 0.4).lerp(new THREE.Color(1.6, 0.7, 0.35), Math.max(0, 1 - y * 4) * (0.5 + zf * 0.5));
    cols.push(c.r, c.g, c.b);
  }
  g.setAttribute("color", new THREE.Float32BufferAttribute(cols, 3));
  s.add(new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
  const lampM = new THREE.MeshBasicMaterial({ color: new THREE.Color(4.5, 3.2, 2), side: THREE.DoubleSide });
  const lamp = new THREE.Mesh(new THREE.CircleGeometry(7, 32), lampM); lamp.position.set(-8, 40, 12); lamp.lookAt(0, 0, 0); s.add(lamp);
  const sun = new THREE.Mesh(new THREE.PlaneGeometry(70, 5), new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 1.3, .45), side: THREE.DoubleSide })); sun.position.set(0, 2, -48); s.add(sun);
  const pm = new THREE.PMREMGenerator(renderer), t = pm.fromScene(s, 0.035).texture; pm.dispose(); return t;
}

/* Night water: dark under the terrace, picking up the mauve of the sky towards the far shore (the plane runs away from the camera,
   its far edge at the top of the texture; the ridges stand at about 60% of its depth) */
function waterGrad() {
  const c = document.createElement("canvas"); c.width = 4; c.height = 256;
  const g = c.getContext("2d"), gr = g.createLinearGradient(0, 256, 0, 0);
  [[0, "#060b16"], [.22, "#0b1224"], [.45, "#171a33"], [.6, "#2c2445"], [1, "#2c2445"]].forEach(([o, col]) => gr.addColorStop(o, col));
  g.fillStyle = gr; g.fillRect(0, 0, 4, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

/* A soft additive glow around a light (festoon bulbs, mast lights) */
function halo(pos, size, color, o = .5) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: soft(), color, transparent: true, opacity: o, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
  s.scale.setScalar(size); s.position.copy(pos); s.userData.o = o; scene.add(s); halos.push(s); return s;
}
/* Soft round sprite texture, for steam and the candle glow */
function soft() {
  if (softTex) return softTex;
  const c = document.createElement("canvas"); c.width = c.height = 64; const x = c.getContext("2d");
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(.4, "rgba(255,255,255,.45)"); g.addColorStop(1, "rgba(255,255,255,0)");
  x.fillStyle = g; x.fillRect(0, 0, 64, 64); return (softTex = new THREE.CanvasTexture(c));
}
function steam(x, y, z, n, count, spread, size) {
  const out = [];
  for (let i = 0; i < count; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: (T && T.wisp) || soft(), color: 0xfff1e0, transparent: true, opacity: 0, depthWrite: false }));
    s.userData = { x: x + (Math.random() - .5) * spread, y, z: z + (Math.random() - .5) * spread * .6, n, ph: i / count, sp: .12 + Math.random() * .08, size, rot: (Math.random() - .5) * .7, spin: (Math.random() - .5) * .8, flip: Math.random() < .5 ? -1 : 1 };
    scene.add(s); out.push(s); hideForDepth.push(s);
  }
  return out;
}

/* Camera route: the welcome view, one key per course, the table, then a pull-out over the marina */
const K = [
  [[0, 5.0, 11.5], [0, 0.3, -0.6]],
  [[-5.0, 4.4, 7.0], [-1.0, 0.25, 0.3]],
  [[-8.8, 3.6, 5.6], [-4.3, 0.3, 0.8]],
  [[2.0, 7.2, 6.4], [0, 0.25, -1.15]],
  [[0.3, 6.6, 5.4], [0, 0.35, 0.2]],
  [[5.6, 3.3, 6.4], [1.5, 0.35, 0.9]],
  [[9.4, 4.2, 1.2], [4.3, 0.6, -1.7]],
  [[0, 7.6, 14.5], [0, -0.2, -2.6]],
  [[0, 5.5, 15], [0, 5, -80]],
].map(([p, t]) => [new THREE.Vector3(...p), new THREE.Vector3(...t)]);
// how strong the depth of field is at each key (wide shots get less)
const APER = [1.1, 1.4, 1.4, 1.25, 1.35, 1.5, 1.45, 0.75, 0.6];

const vA = new THREE.Vector3(), vB = new THREE.Vector3(), cam = new THREE.Vector3(), tgt = new THREE.Vector3(), tmp = new THREE.Vector3();
let portrait = false, distK = 1, camPath = null, tgtPath = null;
// the marina view at the end is a fixed look-out, not pulled back on narrow screens like the table views
function keyAt(i, out, outT) { const [p, t] = K[i]; outT.copy(t); out.copy(p).sub(t).multiplyScalar(i === K.length - 1 ? 1 : distK * (portrait && i === 0 ? 0.8 : 1)).add(t); }
// the camera glides on curves through the course views rather than in straight lines between them
function paths() {
  const ps = [], ts = [];
  for (let i = 0; i < K.length; i++) { const p = new THREE.Vector3(), t = new THREE.Vector3(); keyAt(i, p, t); ps.push(p); ts.push(t); }
  camPath = new THREE.CatmullRomCurve3(ps, false, "centripetal"); tgtPath = new THREE.CatmullRomCurve3(ts, false, "centripetal");
}
function resize() {
  const w = innerWidth, h = innerHeight; portrait = w / h < 0.9;
  distK = w / h < 0.6 ? 1.5 : w / h < 0.9 ? 1.3 : w / h < 1.2 ? 1.2 : 1.1;
  camera.aspect = w / h; camera.fov = portrait ? 42 : 30; camera.updateProjectionMatrix();
  // wide screens: dishes sit right of the text. Phones: dishes sit in the top half, the text card below.
  if (portrait) camera.setViewOffset(w, h, 0, h * 0.2, w, h); else camera.setViewOffset(w, h, -0.17 * w, 0, w, h);
  paths();
  if (renderer) {
    renderer.setSize(w, h, false); const pr = renderer.getPixelRatio();
    sceneRT.setSize(Math.round(w * pr), Math.round(h * pr)); blurRT.setSize(Math.round(w * pr), Math.round(h * pr)); blurH.uniforms.delta.value.set(1 / (w * pr), 0); blurV.uniforms.delta.value.set(0, 1 / (h * pr));
  }
}
addEventListener("resize", resize); resize();

let mx = 0, my = 0;
addEventListener("pointermove", (e) => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; });

/* ---------- Frame loop ---------- */
const hm = location.hash.match(/^#course-([1-7])$/);
if (hm) {
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  const y = +hm[1] * innerHeight;
  if (lenis) lenis.scrollTo(y, { immediate: true }); else window.scrollTo(0, y);
  history.replaceState(null, "", location.pathname + location.search);
}
let P = scrollY / innerHeight;
// opening shot, on a fresh visit at the top of the page: looking out over the marina to Mahé, then craning up and down onto the table
if (!hm && !calm && !rec && P < 0.05) intro = { t0: -1, p: new THREE.Vector3(0, 2.6, 8.6), dir: new THREE.Vector3(0, 0.07, -1).normalize(), d: 300 };
const hsEls = $$(".hs"), hsPos = HOT.map((h) => new THREE.Vector3(...h.at));

/* The evening moves on as you scroll: afterglow at the welcome, blue hour by the end */
function night(m) {
  const arr = sky.geometry.attributes.color.array; for (let k = 0; k < arr.length; k++) arr[k] = skyA[k] + (skyB[k] - skyA[k]) * m;
  sky.geometry.attributes.color.needsUpdate = true;
  scene.fog.color.copy(fogA).lerp(fogB, m); hemi.color.copy(hemiA).lerp(hemiB, m); rim.intensity = 1.1 * (1 - 0.6 * m);
  stars.material.opacity = Math.pow(m, 1.6) * 0.85; town.material.opacity = 0.45 + 0.55 * m;
  for (const r of ridgeMats) r.color.setScalar(1 - 0.4 * m);
  for (const h of halos) if (!h.userData.bulb) h.material.opacity = h.userData.o * (0.8 + 0.7 * m);
}
const hud = $("[data-hud]"), rail = $("[data-rail]"), cue = $("[data-cue]");

// If this device struggles (under 30 fps for a while): first drop the anti-aliasing, then draw fewer pixels, then the photo effects
let last = 0, slow = 0, frames = 0, tier = 0, recP = -1, recIdle = 0, shadowP = -1;
function adapt(dt) {
  if (rec || document.hidden || !renderer) return;
  frames++; if (frames < 40) return;
  slow = slow * 0.95 + (dt > 0.034 ? 1 : 0) * 0.05;
  if (slow < 0.6 || tier > 2) return;
  slow = 0; tier++;
  if (tier === 1 && sceneRT.samples) { sceneRT.dispose(); sceneRT.samples = 0; }
  else if (tier <= 2) { tier = 2; renderer.setPixelRatio(Math.max(0.6, renderer.getPixelRatio() * 0.75)); resize(); }
  else post = false;
  window.__tier = tier;
}

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

  // recording/screenshot mode: stop drawing once the view has settled, so slow software renderers can keep up
  if (rec) { if (Math.abs(P - recP) > 1e-4) { recP = P; recIdle = 0; } else recIdle++; }
  if (renderer && !(rec && recIdle > 3)) {
    adapt(dt);
    const i = Math.min(Math.floor(P), K.length - 2), t = easeIO(clamp(P - i));
    camPath.getPoint((i + t) / (K.length - 1), cam); tgtPath.getPoint((i + t) / (K.length - 1), tgt);
    let apK = 1;
    if (intro) {
      if (intro.t0 < 0) intro.t0 = time;
      const e = easeIO(clamp((time - intro.t0) / 3400));
      if (e >= 1) intro = null;
      else {
        tmp.subVectors(tgt, cam); const d1 = tmp.length(); tmp.normalize();
        cam.lerpVectors(intro.p, cam, e); vB.copy(intro.dir).lerp(tmp, e).normalize(); tgt.copy(cam).addScaledVector(vB, mix(intro.d, d1, e)); apK = mix(0.25, 1, e);
      }
    }
    if (!calm && !rec) { const s = Math.sin(time * 0.00018) * 0.22; cam.x += mx * 0.8 + s; cam.y -= my * 0.5; }
    if (F.has("cam")) { const c = F.get("cam").split(",").map(Number); cam.set(c[0], c[1], c[2]); tgt.set(c[3], c[4], c[5]); apK = 0.25; } // debug: hold the camera
    camera.position.copy(cam); camera.lookAt(tgt);
    // keep the band of focus on the dish the camera is looking at
    tmp.copy(tgt).project(camera); const fy = (tmp.y + 1) / 2, ap = (APER[i] + (APER[i + 1] - APER[i]) * t) * apK;
    for (const b of [blurH, blurV]) { b.uniforms.focusY.value = fy; b.uniforms.band.value = 0.2 / ap; b.uniforms.far.value = 3.2 * ap; b.uniforms.near.value = 2.4 * ap; }

    const PF = F.has("fill") ? +F.get("fill") : P; // debug: ?fill=3 serves courses 1 to 3 whatever the camera shows
    for (const a of anim) {
      const v = clamp((PF - a.W[0]) / (a.W[1] - a.W[0]));
      if (a.mode === "prop") { a.fn(v); continue; }
      const o = a.o; o.visible = v > 0.002;
      if (!o.visible || v === a.t) continue; // not served yet, or nothing has moved since the last frame
      a.t = v; const b = o.userData.base;
      o.position.copy(b.p); o.quaternion.copy(b.q); o.scale.copy(b.s);
      MODES[a.mode](o, v, b, a.opt);
    }
    // the sizzler's landing: a puff of smoke and a shower of embers, then embers keep drifting up while it sizzles
    if (prevPF < SIZZLE.p && PF >= SIZZLE.p) burstT = time;
    prevPF = PF;
    const burst = calm ? 0 : 1.6 * Math.exp(-(time - burstT) / 450), eOn = calm ? 0 : clamp((PF - SIZZLE.p + 0.05) / 0.25);
    embers.visible = eOn > 0;
    if (embers.visible) {
      const pa = embers.geometry.attributes.position, ca = embers.geometry.attributes.color;
      emberSeed.forEach(([ph, sp, ox, oz, dr], k) => {
        const f = (time * 0.001 * sp + ph) % 1, br = eOn * Math.pow(Math.sin(f * Math.PI), 0.6) * (0.55 + burst);
        pa.setXYZ(k, SIZZLE.x + ox * 0.7 + dr * f + Math.sin(f * 9 + ph * 20) * 0.06, 0.42 + f * 1.7 * (1 + burst * 0.6), SIZZLE.z + oz * 0.6);
        ca.setXYZ(k, br, br * 0.42, br * 0.1);
      });
      pa.needsUpdate = ca.needsUpdate = true;
    }
    // steam drifts up from whatever has been served; it thins out in the wide shots at the end, where the blur turns it into grey balls
    const wide = 1 - 0.75 * ease(clamp((P - 6.4) / 0.9));
    for (const s of puffs) {
      const u = s.userData, on = clamp((PF - (u.n - 0.3)) / 0.4) || (u.n === 2 ? clamp(burst) : 0);
      const f = (time * 0.001 * u.sp + u.ph) % 1;
      s.position.set(u.x + Math.sin(f * 5 + u.ph * 9) * 0.1, u.y + f * 1.5 * u.size, u.z);
      const sc = (0.35 + f * 0.9) * u.size; s.scale.set(sc * 0.7 * u.flip, sc * 1.4, 1); s.material.rotation = u.rot + f * u.spin;
      s.material.opacity = calm ? 0 : on * Math.sin(f * Math.PI) * 0.13 * wide * (u.n === 2 ? 1 + burst * 0.9 : 1);
    }
    const fl = calm ? 1 : 0.88 + Math.sin(time * 0.013) * 0.07 + Math.sin(time * 0.031) * 0.05;
    flame.scale.set(1, 2.6 * fl, 1); flameLight.intensity = 2.2 * fl; glow.material.opacity = 0.35 * fl;
    const m = ease(clamp((P - 0.6) / 6.6));
    if (Math.abs(m - lastM) > 0.004 || (m !== lastM && (m === 0 || m === 1))) { lastM = m; night(m); }
    // the string lights come on in a wave, left to right, as you reach the table
    for (const b of bulbs) {
      const k = 0.5 + 1.1 * ease(clamp((P - 6.15 - b.userData.wave * 0.5) / 0.2));
      if (k !== b.userData.k) { b.userData.k = k; b.material.color.setRGB(3.2 * k, 2.2 * k, 1.1 * k); const h = b.userData.halo; h.material.opacity = h.userData.o * k; }
    }
    if (Math.abs(P - shadowP) > 1e-4) { shadowP = P; renderer.shadowMap.needsUpdate = true; }
    grain.uniforms.t.value = calm ? 0 : (time * 0.001) % 100;
    if (!post) renderer.render(scene, camera);
    else {
      renderer.setRenderTarget(sceneRT); renderer.render(scene, camera);
      renderer.setRenderTarget(blurRT); quad.material = blurH; quad.render(renderer);
      renderer.setRenderTarget(null); quad.material = blurV; quad.render(renderer);
    }
    window.__ft = (window.__ft || dt) * 0.95 + dt * 0.05; if (!window.__first) { window.__first = 1; mark("first frame"); document.documentElement.classList.add("ready"); }
    layoutHotspots(innerWidth, innerHeight);
  }
  requestAnimationFrame(frame);
}
const start = () => { mark("compiled"); requestAnimationFrame(frame); };
// compile the shaders before the first frame, but never wait more than 4 s for it (some drivers never report back)
if (renderer && renderer.compileAsync) Promise.race([renderer.compileAsync(scene, camera), new Promise((r) => setTimeout(r, 4000))]).then(start, start); else start();

/* ---------- Keep labels and text from covering each other ---------- */
const capEl = $("[data-caption]"), stageEl = $(".stagelist"), miniEl = $("[data-mini]"), topEl = $(".top");
const R = (r, pad = 0) => ({ l: r.left - pad, t: r.top - pad, r: r.right + pad, b: r.bottom + pad });
const hit = (a, b) => a.l < b.r && a.r > b.l && a.t < b.b && a.b > b.t;
const inside = (x, y, b) => x > b.l && x < b.r && y > b.t && y < b.b;
function layoutHotspots(w, h) {
  const capBox = [...capEl.children].filter((c) => c.offsetWidth).map((c) => c.getBoundingClientRect())
    .reduce((a, r) => ({ l: Math.min(a.l, r.left), t: Math.min(a.t, r.top), r: Math.max(a.r, r.right), b: Math.max(a.b, r.bottom) }), { l: 1e9, t: 1e9, r: -1e9, b: -1e9 });
  const obs = [portrait ? R(capEl.getBoundingClientRect(), 10) : { l: capBox.l - 14, t: capBox.t - 14, r: capBox.r + 14, b: capBox.b + 14 }, { l: 0, t: 0, r: w, b: topEl.offsetHeight + 6 }];
  const cap = capEl.getBoundingClientRect();
  stageEl.classList.toggle("tight", !portrait && cap.bottom > innerHeight - stageEl.scrollHeight - 40);
  const sl = stageEl.getBoundingClientRect(); if (sl.width && !stageEl.classList.contains("tight")) obs.push(R(sl, 8));
  if (!miniEl.hidden) obs.push(R(miniEl.getBoundingClientRect(), 8));
  const placed = [], items = [];
  hsEls.forEach((el, k) => {
    const n = +el.dataset.hs;
    tmp.copy(hsPos[k]).project(camera);
    const x = (tmp.x + 1) / 2 * w, y = (1 - tmp.y) / 2 * h;
    let on = Math.abs(P - n) < 0.4 && tmp.z < 1 && x > 14 && x < w - 14 && y > 14 && y < h - 14;
    if (on && obs.some((o) => inside(x, y, o))) on = false;
    items.push({ el, x, y, on });
  });
  items.filter((i) => i.on).forEach((i) => placed.push({ l: i.x - 13, t: i.y - 13, r: i.x + 13, b: i.y + 13 }));
  items.forEach((i) => {
    const { el, x, y } = i;
    el.style.transform = `translate(${x}px, ${y}px)`;
    if (i.on) {
      const sp = el.lastElementChild, lw = sp.offsetWidth, lh = sp.offsetHeight;
      const opts = [[18, -lh / 2], [-18 - lw, -lh / 2], [-lw / 2, -lh - 18], [-lw / 2, 18], [14, 12], [-14 - lw, 12], [14, -lh - 12], [-14 - lw, -lh - 12]];
      let pick = null;
      for (const o of opts) {
        const box = { l: x + o[0], t: y + o[1], r: x + o[0] + lw, b: y + o[1] + lh };
        if (box.l < 6 || box.r > w - 6 || box.t < 6 || box.b > h - 6) continue;
        if (obs.some((q) => hit(box, q)) || placed.some((q) => hit(box, q))) continue;
        pick = o; break;
      }
      if (!pick) i.on = false; // no clear spot: hide the point rather than let its label cover text
      else { placed.push({ l: x + pick[0] - 4, t: y + pick[1] - 4, r: x + pick[0] + lw + 4, b: y + pick[1] + lh + 4 }); sp.style.transform = `translate(${pick[0]}px, ${pick[1]}px)`; }
    }
    if (el.classList.contains("on") !== i.on) { el.classList.toggle("on", i.on); el.tabIndex = i.on ? 0 : -1; }
  });
}
