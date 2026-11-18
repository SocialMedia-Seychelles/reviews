/* Modelling kit for the thali: noise, textures painted in code (hammered brass, wood, linen, curry surfaces) and organic food shapes.
   Nothing here is a photo: every surface is generated, so it stays light and needs no image files. */
import * as THREE from "three";
import { mergeVertices, mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

/* ---------- Noise ---------- */
const fract = (x) => x - Math.floor(x);
const mod = (a, n) => ((a % n) + n) % n;
const hash3 = (x, y, z) => fract(Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453);
const sm = (t) => t * t * (3 - 2 * t);
export function noise3(x, y, z = 0, P = 0) {
  // the corner hashes written out (same values as before, without making a closure on every call: this runs millions of times)
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), u = sm(x - xi), v = sm(y - yi), w = sm(z - zi);
  let x0 = xi, x1 = xi + 1, y0 = yi, y1 = yi + 1; const z0 = zi, z1 = zi + 1;
  if (P) { x0 = mod(x0, P); x1 = mod(x1, P); y0 = mod(y0, P); y1 = mod(y1, P); }
  const h000 = hash3(x0, y0, z0), h100 = hash3(x1, y0, z0), h010 = hash3(x0, y1, z0), h110 = hash3(x1, y1, z0);
  const h001 = hash3(x0, y0, z1), h101 = hash3(x1, y0, z1), h011 = hash3(x0, y1, z1), h111 = hash3(x1, y1, z1);
  const a0 = h000 + (h100 - h000) * u, a1 = h010 + (h110 - h010) * u, b0 = h001 + (h101 - h001) * u, b1 = h011 + (h111 - h011) * u;
  const c0 = a0 + (a1 - a0) * v, c1 = b0 + (b1 - b0) * v; return c0 + (c1 - c0) * w;
}
/* fbm; with P > 0 it tiles every P units in x and y (for repeating textures) */
export function fbm(x, y, z = 0, o = 4, P = 0) {
  let a = .5, f = 1, s = 0, n = 0;
  for (let i = 0; i < o; i++) { s += a * noise3(x * f, y * f, z * f, P ? P * f : 0); n += a; f *= 2; a *= .5; }
  return s / n;
}
/* Cellular noise (distance to the nearest scattered point), tiling every N cells: hammer dimples */
function worley(u, v, N) {
  const x = u * N, y = v * N, xi = Math.floor(x), yi = Math.floor(y); let d = 9;
  for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
    const cx = xi + i, cy = yi + j, px = cx + hash3(mod(cx, N), mod(cy, N), 1), py = cy + hash3(mod(cx, N), mod(cy, N), 2);
    d = Math.min(d, (px - x) ** 2 + (py - y) ** 2);
  }
  return Math.sqrt(d);
}
let seed = 11;
export const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

/* ---------- Textures ---------- */
function canvasTex(size, fn, srgb = true, rep = [1, 1]) {
  const c = document.createElement("canvas"); c.width = c.height = size;
  const x = c.getContext("2d"), img = x.createImageData(size, size), d = img.data, col = [0, 0, 0];
  for (let j = 0; j < size; j++) for (let i = 0; i < size; i++) { fn(i / size, j / size, col, i, j); const o = (j * size + i) * 4; d[o] = col[0]; d[o + 1] = col[1]; d[o + 2] = col[2]; d[o + 3] = 255; }
  x.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); t.anisotropy = 8;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.userData.ctx = x; return t;
}
function normalFromHeight(size, H, k, rep) {
  return canvasTex(size, (u, v, c, i, j) => {
    const g = (a, b) => H[mod(b, size) * size + mod(a, size)];
    const dx = (g(i + 1, j) - g(i - 1, j)) * k, dy = (g(i, j + 1) - g(i, j - 1)) * k, l = Math.hypot(dx, dy, 1);
    c[0] = (-dx / l * .5 + .5) * 255; c[1] = (dy / l * .5 + .5) * 255; c[2] = (1 / l * .5 + .5) * 255;
  }, false, rep);
}
const heights = (size, fn) => { const H = new Float32Array(size * size); for (let j = 0; j < size; j++) for (let i = 0; i < size; i++) H[j * size + i] = fn(i / size, j / size); return H; };
const hex = (h) => [(h >> 16) & 255, (h >> 8) & 255, h & 255];
const mix3 = (a, b, t, c) => { c[0] = a[0] + (b[0] - a[0]) * t; c[1] = a[1] + (b[1] - a[1]) * t; c[2] = a[2] + (b[2] - a[2]) * t; };

/* Hand-hammered brass: shallow overlapping dimples, fine spun rings, uneven polish */
export function brassMaps(size = 512) {
  const H = heights(size, (u, v) => worley(u, v, 22) ** 2 * 0.9 + fbm(u * 40, v * 40, 0, 2, 40) * 0.04);
  const normalMap = normalFromHeight(size, H, 5.5);
  const roughnessMap = canvasTex(size, (u, v, c, i, j) => { const r = 0.16 + fbm(u * 5, v * 5, 3, 4, 5) * 0.3 + H[j * size + i] * 0.12; c[0] = c[1] = c[2] = r * 255; }, false);
  const map = canvasTex(size, (u, v, c) => { const t = fbm(u * 4, v * 4, 7, 4, 4); const k = 0.82 + t * 0.2; c[0] = 255 * k; c[1] = 238 * k; c[2] = 205 * k; });
  return { normalMap, roughnessMap, map };
}
export const repeatOf = (t, x, y) => { const c = t.clone(); c.repeat.set(x, y); c.needsUpdate = true; return c; };

/* Dark oiled walnut, planks running across the table */
export function woodMaps(size = 512) {
  const A = hex(0x1e0f08), B = hex(0x4a2814), C = hex(0x6b3d1f);
  const map = canvasTex(size, (u, v, c) => {
    const w = fbm(u * 3, v * 24, 1, 4, 3) * 5, g = 0.5 + 0.5 * Math.sin((v * 34 + w) * Math.PI * 2);
    const plank = hash3(Math.floor(v * 6), 3, 3) * 0.25, fine = fbm(u * 60, v * 8, 2, 3, 0);
    mix3(A, B, Math.min(1, g * 0.8 + plank), c); if (fine > .62) mix3(c, C, (fine - .62) * 1.5, c);
    if (fract(v * 6) < 0.008) mix3(c, [8, 4, 2], 0.8, c);
  }, true, [1.5, 1.5]);
  const roughnessMap = canvasTex(size, (u, v, c) => { const r = 0.45 + fbm(u * 8, v * 30, 4, 3, 8) * 0.3; c[0] = c[1] = c[2] = r * 255; }, false, [1.5, 1.5]);
  return { map, roughnessMap };
}
/* Woven linen for the runner */
export function linenMaps(size = 256) {
  const H = heights(size, (u, v) => Math.sin(u * Math.PI * 2 * 64) * 0.5 + Math.sin(v * Math.PI * 2 * 64) * 0.5 + fbm(u * 16, v * 16, 5, 3, 16) * 0.8);
  const normalMap = normalFromHeight(size, H, 0.9, [6, 6]);
  const map = canvasTex(size, (u, v, c, i, j) => { const k = 0.82 + H[j * size + i] * 0.08 + fbm(u * 40, v * 3, 9, 2, 0) * 0.1; c[0] = 255 * k; c[1] = 255 * k; c[2] = 255 * k; }, true, [6, 6]);
  return { normalMap, map };
}
/* The top of a curry, seen from above: colour drift, darker spice flecks and glossy pools of oil or butter */
export function curryMaps(base, oil, fleck, { cream = 0, size = 256, oilAmt = 26 } = {}) {
  const B = hex(base), O = hex(oil), F = hex(fleck);
  const map = canvasTex(size, (u, v, c) => {
    const t = fbm(u * 6, v * 6, base % 97, 4); mix3(B, F, Math.max(0, t - .5) * 1.6, c);
    const s = fbm(u * 40, v * 40, 3, 2); if (s > .7) mix3(c, F, (s - .7) * 2.5, c);
    if (cream) { const k = fbm(u * 3 + 9, v * 3, 4, 3); if (k > .58) mix3(c, [246, 234, 210], Math.min(.8, (k - .58) * 4 * cream), c); }
  });
  const rough = canvasTex(size, (u, v, c) => { c[0] = c[1] = c[2] = (0.32 + fbm(u * 8, v * 8, 6, 3) * 0.2) * 255; }, false);
  const ctx = map.userData.ctx, rctx = rough.userData.ctx;
  for (let i = 0; i < oilAmt; i++) {
    const a = rnd() * 6.28, r = Math.sqrt(rnd()) * 0.46, x = (0.5 + Math.cos(a) * r) * size, y = (0.5 + Math.sin(a) * r) * size, rad = (2 + rnd() * 9) * size / 256;
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad); g.addColorStop(0, `rgba(${O[0]},${O[1]},${O[2]},.95)`); g.addColorStop(.75, `rgba(${O[0]},${O[1]},${O[2]},.6)`); g.addColorStop(1, `rgba(${O[0]},${O[1]},${O[2]},0)`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, rad, 0, 7); ctx.fill();
    rctx.fillStyle = "rgb(20,20,20)"; rctx.beginPath(); rctx.arc(x, y, rad * .8, 0, 7); rctx.fill();
  }
  // a ring of oil where the curry meets the bowl
  const g = ctx.createRadialGradient(size / 2, size / 2, size * .38, size / 2, size / 2, size * .5); g.addColorStop(0, `rgba(${O[0]},${O[1]},${O[2]},0)`); g.addColorStop(1, `rgba(${O[0]},${O[1]},${O[2]},.75)`);
  ctx.fillStyle = g; ctx.fillRect(0, 0, size, size);
  map.needsUpdate = rough.needsUpdate = true;
  map.wrapS = map.wrapT = rough.wrapS = rough.wrapT = THREE.ClampToEdgeWrapping;
  return { map, roughnessMap: rough };
}

/* ---------- Geometry helpers ---------- */
const smooth = (g) => { g.deleteAttribute("normal"); if (g.attributes.uv) g.deleteAttribute("uv"); return mergeVertices(g); };
export function paint(g, fn) {
  const p = g.attributes.position, arr = new Float32Array(p.count * 3), c = new THREE.Color();
  for (let i = 0; i < p.count; i++) { fn(p.getX(i), p.getY(i), p.getZ(i), c); arr[i * 3] = c.r; arr[i * 3 + 1] = c.g; arr[i * 3 + 2] = c.b; }
  g.setAttribute("color", new THREE.BufferAttribute(arr, 3)); return g;
}
/* An organic lump: a sphere pushed in and out by noise, then squashed */
export function blob(r, amp, freq, sd, sx = 1, sy = 1, sz = 1, detail = 3) {
  const g = smooth(new THREE.IcosahedronGeometry(r, detail)), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i), k = 1 + (fbm(x * freq + sd, y * freq + sd * 1.7, z * freq - sd, 3) - .5) * amp;
    p.setXYZ(i, x * k * sx, y * k * sy, z * k * sz);
  }
  g.computeVertexNormals(); return g;
}
export function rounded(w, h, d, r = 0.02, seg = 3) { return new RoundedBoxGeometry(w, h, d, seg, r); }
/* A disc made of rings, so every point can be lifted (curry surfaces, naan, papad). fn(x, z, r) returns the height. */
export function disc(rings, segs, fn, outline = null) {
  const pos = [0, fn(0, 0, 0), 0], uv = [.5, .5], idx = [];
  for (let i = 1; i <= rings; i++) {
    const r = i / rings;
    for (let s = 0; s < segs; s++) {
      const a = (s / segs) * Math.PI * 2; let x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (outline) [x, z] = outline(x, z);
      pos.push(x, fn(x, z, r), z); uv.push(Math.cos(a) * r * .5 + .5, Math.sin(a) * r * .5 + .5);
    }
  }
  const at = (i, s) => (i === 0 ? 0 : 1 + (i - 1) * segs + (s % segs));
  for (let s = 0; s < segs; s++) idx.push(0, at(1, s + 1), at(1, s));
  for (let i = 1; i < rings; i++) for (let s = 0; s < segs; s++) {
    const a = at(i, s), b = at(i, s + 1), c = at(i + 1, s), d = at(i + 1, s + 1);
    idx.push(a, b, d, a, d, c);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals(); return g;
}
/* A closed flat bread: a puffy top and flatter underside meeting at the rim */
export function lens(rings, segs, top, bottom, outline) {
  const a = disc(rings, segs, top, outline), b = disc(rings, segs, bottom, outline), ix = b.index.array;
  for (let i = 0; i < ix.length; i += 3) { const t = ix[i + 1]; ix[i + 1] = ix[i + 2]; ix[i + 2] = t; }
  b.computeVertexNormals();
  const g = mergeGeometries([a, b]); g.computeVertexNormals(); return g;
}

/* ---------- Food ---------- */
const C = (h) => new THREE.Color(h);

/* Tandoori prawn: a curled, tapering, segmented body with a tail fan */
export function prawnGeo(size = 1, sd = 1) {
  const pts = []; for (let k = 0; k <= 10; k++) { const a = -0.3 + (k / 10) * Math.PI * 1.3; pts.push(new THREE.Vector3(Math.cos(a) * .16, (k / 10) * .03, Math.sin(a) * .16)); }
  const curve = new THREE.CatmullRomCurve3(pts), T = 56, R = 14;
  const g = new THREE.TubeGeometry(curve, T, 0.075, R, false), p = g.attributes.position, c = new THREE.Vector3();
  for (let i = 0; i <= T; i++) {
    const t = i / T, rad = (1 - 0.68 * t) * (1 + 0.09 * Math.cos(t * Math.PI * 16)); curve.getPointAt(t, c);
    for (let j = 0; j <= R; j++) { const k = i * (R + 1) + j; p.setXYZ(k, c.x + (p.getX(k) - c.x) * rad, c.y + (p.getY(k) - c.y) * rad * 0.85, c.z + (p.getZ(k) - c.z) * rad); }
  }
  const head = new THREE.SphereGeometry(0.074, 16, 12); head.translate(pts[0].x, pts[0].y, pts[0].z);
  const tail = new THREE.ConeGeometry(0.06, 0.12, 8); tail.scale(1.6, 1, 0.35); tail.rotateZ(Math.PI / 2); tail.rotateY(-0.4); const e = pts[10]; tail.translate(e.x - 0.03, e.y, e.z + 0.05);
  [g, head, tail].forEach((q) => q.deleteAttribute("uv"));
  const all = mergeGeometries([g.toNonIndexed(), head.toNonIndexed(), tail.toNonIndexed()]); all.computeVertexNormals();
  const deep = C(0xd2401f), mid = C(0xf07a3c), pale = C(0xf9c9a0), charc = C(0x3a1608);
  paint(all, (x, y, z, col) => {
    const out = clamp01((Math.hypot(x, z) - 0.12) / 0.1);
    col.copy(pale).lerp(mid, Math.min(1, out * 1.4)).lerp(deep, Math.max(0, out - .5));
    const n = fbm(x * 30 + sd, y * 30, z * 30, 2); if (n > .66) col.lerp(charc, Math.min(.85, (n - .66) * 4));
  });
  all.scale(size, size, size); return all;
}
const clamp01 = (v) => Math.min(1, Math.max(0, v));

/* Chicken or lamb tikka: a lumpy chunk, the marinade red-orange with yoghurt paler in the creases, charred on its edges */
export function tikkaGeo(r, sd, sauce = null) {
  const g = chunk(r * 2.2, r * 1.7, r * 2, sd, { lump: .16, sharp: 3.2, detail: 5 }), base = C(0xa8401a), hot = C(0xd06428), yog = C(0xdc9a58), charc = C(0x221006);
  return paint(g, (x, y, z, col) => {
    const n = fbm(x * 22 + sd, y * 22, z * 22, 3); col.copy(base).lerp(hot, clamp01((n - .35) * 2)); if (n < .34) col.lerp(yog, .4);
    const e = Math.max(Math.abs(x) / (r * 1.1), Math.abs(y) / (r * .85), Math.abs(z) / r);
    if (e > .8) col.lerp(charc, clamp01((e - .8) * 5) * (0.45 + n)); if (n > .6) col.lerp(charc, clamp01((n - .6) * 4));
    if (sauce) col.lerp(C(sauce), 0.55 + 0.3 * clamp01(1 - n));
  });
}
/* Paneer: a soft, slightly uneven cube, golden where it was fried, with grill marks off the tandoor; in a curry (sauce = its
   colour) the lower half is coated and flecked with it */
export function paneerGeo(s, sd, grill = true, sauce = null) {
  const g = chunk(s, s * .82, s, sd, { lump: .05, sharp: 6, detail: 6 }), cream = C(0xebdfc0), gold = C(0xd49a50), charc = C(0x3e200e), sc = sauce && C(sauce);
  return paint(g, (x, y, z, col) => {
    col.copy(cream); const n = fbm(x * 50 + sd, y * 50, z * 50, 2); col.lerp(gold, clamp01((n - .45) * 1.6) * (grill ? .85 : .3));
    if (grill && y > 0 && Math.abs(fract((x + z * .4) * 9 + sd) - .5) < .09) col.lerp(charc, .85);
    if (sc) { if (y < s * .08) col.lerp(sc, clamp01((s * .08 - y) / (s * .25)) * .92); if (fbm(x * 30, y * 30 + sd, z * 30, 2) > .63) col.lerp(sc, .7); }
  });
}
/* Samosa: a plump three-sided pyramid. Its surface is found along rays from inside a soft-edged pyramid blended with a round
   pillow, then blistered from the frying; golden on the faces, browner on the blisters and underneath. */
export function samosaGeo(sd, detail = 36) {
  const h = 0.42, Rb = 0.31, k = 0.017, C0 = [0, -0.09, 0], planes = [[0, -1, 0, h / 2]];
  for (let j = 0; j < 3; j++) {
    const a = -Math.PI / 2 + j * 2 * Math.PI / 3 + Math.PI / 3, mx = Math.cos(a), mz = Math.sin(a), L = Math.hypot(h, Rb / 2);
    const n = [mx * h / L, (Rb / 2) / L, mz * h / L], M = [mx * Rb / 2, -h / 2, mz * Rb / 2];
    planes.push([...n, n[0] * M[0] + n[1] * M[1] + n[2] * M[2]]);
  }
  const sdf = (x, y, z) => {
    let s = 0; for (const [a, b, c, o] of planes) s += Math.exp((a * x + b * y + c * z - o) / k);
    return k * Math.log(s) * 0.82 + (Math.hypot(x / 0.21, (y + 0.02) / 0.2, z / 0.21) - 1) * 0.21 * 0.18;
  };
  // a UV sphere welded at its seam: far quicker to weld than an icosphere, and densest at the tip, where the shape is sharpest
  const g = smooth(new THREE.SphereGeometry(1, detail * 4, Math.round(detail * 2.8))), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const dx = p.getX(i), dy = p.getY(i), dz = p.getZ(i); let lo = 0, hi = 0.6;
    for (let it = 0; it < 22; it++) { const m = (lo + hi) / 2; if (sdf(C0[0] + dx * m, C0[1] + dy * m, C0[2] + dz * m) < 0) lo = m; else hi = m; }
    p.setXYZ(i, C0[0] + dx * lo, C0[1] + dy * lo, C0[2] + dz * lo);
  }
  g.computeVertexNormals();
  const nr = g.attributes.normal, B = new Float32Array(p.count);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const b = Math.max(0, fbm(x * 24 + sd, y * 24, z * 24, 2) - 0.54) * 0.03, f = (noise3(x * 60, y * 60, z * 60 + sd) - .5) * 0.0012; B[i] = b;
    p.setXYZ(i, x + nr.getX(i) * (b + f), y + nr.getY(i) * (b + f), z + nr.getZ(i) * (b + f));
  }
  g.computeVertexNormals();
  const gold = C(0xc8822f), pale = C(0xdca554), brown = C(0x99521c), deep = C(0x66300e);
  let i = 0;
  return paint(g, (x, y, z, col) => {
    const n = fbm(x * 6 + sd, y * 6, z * 6, 3); col.copy(gold).lerp(pale, clamp01((n - .45) * 2));
    col.lerp(brown, clamp01(B[i] * 70) * .8); if (B[i] > .008) col.lerp(deep, clamp01((B[i] - .008) * 90) * .45);
    if (y < -0.17) col.lerp(brown, clamp01((-0.17 - y) * 20) * .8); i++;
  });
}
/* Naan: a teardrop of dough, softly domed and bent over the plate. The blisters, char, butter and herbs are in the baked naan
   textures (_work/bake_food.py): the height map lifts the blisters, so the geometry is fine and evenly spread. rot turns the
   textures, so two naans differ. */
export function naanGeo(rot = 0) {
  const outline = (x, z) => [x * (0.62 - z * 0.14), z * 0.88];
  const top = (x, z, r) => 0.03 * Math.sqrt(Math.max(0, 1 - r * r)) + (fbm(x * 3 + rot, z * 3, 1, 2) - .5) * 0.02;
  const bot = (x, z, r) => -0.012 * Math.sqrt(Math.max(0, 1 - r * r));
  const g = lens(56, 150, top, bot, outline), p = g.attributes.position, uv = g.attributes.uv, c = Math.cos(rot), s = Math.sin(rot);
  for (let i = 0; i < uv.count; i++) { const u = uv.getX(i) - .5, v = uv.getY(i) - .5; uv.setXY(i, .5 + u * c - v * s, .5 + u * s + v * c); }
  for (let i = 0; i < p.count; i++) { const x = p.getX(i); p.setY(i, p.getY(i) + x * x * 0.18); }
  g.computeVertexNormals(); return g;
}
/* Papad: thin and slightly cupped, its edge rippled; the blisters and pepper are in the baked papad textures */
export function papadGeo(sd) {
  return disc(48, 160, (x, z, r) => r * r * 0.07 + Math.sin(Math.atan2(z, x) * 5 + sd) * 0.014 * r * r + (fbm(x * 2 + sd, z * 2, 2, 2) - .5) * 0.03);
}
const r2 = (x, z) => x * x + z * z;
/* A coriander or mint leaf: a small rounded lobe, bent */
export function leafGeo() {
  const s = new THREE.Shape(); s.moveTo(0, 0); s.bezierCurveTo(0.05, 0.02, 0.06, 0.07, 0, 0.1); s.bezierCurveTo(-0.06, 0.07, -0.05, 0.02, 0, 0);
  const g = new THREE.ShapeGeometry(s, 8); g.rotateX(-Math.PI / 2); const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) p.setY(i, Math.abs(p.getX(i)) * 0.4); g.computeVertexNormals(); return g;
}
/* A swirl of cream on a curry */
export function swirlGeo(r = 0.3, turns = 1.25) {
  const pts = []; for (let k = 0; k <= 60; k++) { const t = k / 60, a = t * Math.PI * 2 * turns; pts.push(new THREE.Vector3(Math.cos(a) * (0.04 + r * t), 0.005 * Math.sin(t * 20), Math.sin(a) * (0.04 + r * t))); }
  const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 160, 0.014, 8, false); g.scale(1, 0.4, 1); return g;
}
/* Basmati: thousands of long grains lying over a dome, some stained with saffron */
export function riceMesh(count, mat, rx = 0.95, ry = 0.62) {
  const grain = new THREE.CapsuleGeometry(0.0125, 0.075, 2, 6); grain.rotateZ(Math.PI / 2);
  const m = new THREE.InstancedMesh(grain, mat, count), d = new THREE.Object3D(), c = new THREE.Color(), n = new THREE.Vector3(), t = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  const white = C(0xf7f0de), cream = C(0xeee0bd), saff = C(0xf2a12e), deep = C(0xe2731f);
  for (let i = 0; i < count; i++) {
    const a = rnd() * 6.28, el = Math.acos(1 - rnd() * 0.98), k = 0.97 + rnd() * 0.05;
    const x = Math.sin(el) * Math.cos(a) * rx * k, y = Math.cos(el) * ry * k, z = Math.sin(el) * Math.sin(a) * rx * k;
    n.set(x / (rx * rx), y / (ry * ry), z / (rx * rx)).normalize();
    t.set(rnd() - .5, rnd() - .5, rnd() - .5).cross(n).normalize();
    d.position.set(x, y, z); d.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), t); d.rotateOnAxis(new THREE.Vector3(1, 0, 0), rnd() * 6);
    d.updateMatrix(); m.setMatrixAt(i, d.matrix);
    const s = fbm(x * 3.2 + 4, y * 3.2, z * 3.2, 3);
    c.copy(rnd() < .5 ? white : cream); if (s > .56) c.lerp(rnd() < .6 ? saff : deep, clamp01((s - .56) * 5) * (0.6 + rnd() * .4));
    m.setColorAt(i, c);
  }
  m.castShadow = m.receiveShadow = true; return m;
}
/* Re-lay the grains of a riceMesh over a heap instead of a dome (riceMesh is still called first, so the main random sequence
   is drawn exactly as before): heap(x, z) gives the height (0..1) for x, z in -1..1, and the mound is rx wide and ry high.
   Grains lie along the surface pointing every way, a few tipped up, in the cream of cooked basmati with saffron streaks
   gathered in patches (as in their biryani photos), not sprinkled evenly. */
export function layRice(m, heap, R, rx = 0.93, ry = 0.6) {
  const d = new THREE.Object3D(), c = new THREE.Color(), n = new THREE.Vector3(), t = new THREE.Vector3(), q = new THREE.Vector3(), e = 0.02;
  const white = C(0xf6f0de), cream = C(0xebdcb6), tints = [C(0xf1a632), C(0xe9832a), C(0xf4cf72), C(0xd9661f)];
  for (let i = 0; i < m.count; i++) {
    const a = R() * 6.28, r = Math.sqrt(R()) * 0.97, x = Math.cos(a) * r, z = Math.sin(a) * r;
    const y = heap(x, z) * ry;
    n.set(-(heap(x + e, z) - heap(x - e, z)) / (2 * e) * ry / rx, 1, -(heap(x, z + e) - heap(x, z - e)) / (2 * e) * ry / rx).normalize();
    q.set(R() - .5, R() * .3 - .15, R() - .5); t.copy(q).cross(n).normalize();
    d.position.set(x * rx, y + 0.004 + R() * 0.012, z * rx); d.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), t);
    d.rotateOnAxis(new THREE.Vector3(0, 0, 1), (R() - .5) * (R() < .15 ? 1.2 : .3)); d.scale.setScalar(0.85 + R() * 0.3);
    d.updateMatrix(); m.setMatrixAt(i, d.matrix);
    const s = fbm(x * 2.6 + 9, z * 2.6, y * 2 + 1, 3) + (fbm(x * 9, z * 9, 3, 2) - .5) * .3;
    c.copy(white).lerp(cream, R()); if (s > .53) c.lerp(tints[Math.floor(R() * 4)], clamp01((s - .53) * 5.5) * (0.55 + R() * .45));
    m.setColorAt(i, c);
  }
  m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; return m;
}
/* ---------- Detail added in the third take ---------- */
/* A separate random sequence for it, so the seeded placements above stay as they were; burn(n) skips the main sequence on by
   as many draws as the code it replaced used to take */
export function seeded(a) { return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
export const burn = (n) => { for (let i = 0; i < n; i++) rnd(); };
/* A rounded, slightly lumpy cube: an icosphere pulled out to a superellipsoid (sharp: higher is boxier), then roughened */
export function chunk(w, h, d, sd, { lump = 0.06, sharp = 5, detail = 4 } = {}) {
  const g = smooth(new THREE.IcosahedronGeometry(1, detail)), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i), y = p.getY(i), z = p.getZ(i); const k = Math.pow(Math.abs(x) ** sharp + Math.abs(y) ** sharp + Math.abs(z) ** sharp, 1 / sharp);
    x /= k; y /= k; z /= k; const n = 1 + (fbm(x * 3 + sd, y * 3 - sd, z * 3, 3) - .5) * lump * 2;
    p.setXYZ(i, x * n * w / 2, y * n * h / 2, z * n * d / 2);
  }
  g.computeVertexNormals(); return g;
}
/* Kachumber: diced tomato (skin on one side, seeds inside), cucumber (dark skin on top, pale flesh) and curved bits of red onion */
export function tomatoBit(sd) {
  const s = 0.1, skin = C(0xa82416), flesh = C(0xbf3b24), seedc = C(0xd99a5c);
  return paint(chunk(s, s * .72, s, sd, { lump: .12, sharp: 4 }), (x, y, z, col) => {
    if (y > s * .26) col.copy(skin); else { col.copy(flesh); const n = fbm(x * 60 + sd, y * 60, z * 60, 2); if (n > .58) col.lerp(seedc, clamp01((n - .58) * 5)); }
  });
}
export function cucumberBit(sd) {
  const s = 0.1, skin = C(0x22431a), flesh = C(0x8fa858), seedc = C(0xb3c47f);
  return paint(chunk(s, s * .7, s, sd, { lump: .08, sharp: 5 }), (x, y, z, col) => {
    if (y > s * .16) col.copy(skin).lerp(C(0x3a6e26), clamp01(fbm(x * 40 + sd, z * 40, 1, 2) * 1.2 - .3)); else { col.copy(flesh); if (Math.hypot(x, z) < s * .22) col.lerp(seedc, .8); }
  });
}
export function onionBit(sd) {
  const g = new THREE.CylinderGeometry(0.085, 0.085, 0.05, 10, 2, true, sd, 1.1); g.deleteAttribute("uv");
  const purple = C(0x8a2a5e), white = C(0xe8cfdc);
  return paint(g, (x, y, z, col) => col.copy(white).lerp(purple, clamp01(0.35 + Math.abs(y) / 0.025 * 0.65)));
}
/* Lamb chop off the tandoor: a charred, flattened lump of meat with its rib bone sticking out */
export function lambChopGeo(sd) {
  const meat = blob(0.17, 0.45, 5, sd, 1.25, 0.42, 0.9, 4), dark = C(0x7a3218), red = C(0xb0522a), charc = C(0x221006);
  paint(meat, (x, y, z, col) => {
    col.copy(dark).lerp(red, clamp01((fbm(x * 20 + sd, y * 20, z * 20, 3) - .35) * 2)); const n = fbm(x * 30, y * 30 + sd, z * 30, 2);
    if (n > .56) col.lerp(charc, clamp01((n - .56) * 3.5) * .9); if (y > .04) col.lerp(charc, clamp01((y - .04) * 12) * .5);
  });
  const bone = new THREE.CylinderGeometry(0.022, 0.03, 0.34, 12); bone.rotateZ(Math.PI / 2); bone.translate(0.3, 0.01, 0); bone.deleteAttribute("uv");
  paint(bone, (x, y, z, col) => col.copy(C(0xe6d9bf)).lerp(C(0x8a6a4a), clamp01((x - .36) * 8)));
  const g = mergeGeometries([meat, bone]); g.computeVertexNormals(); return g;
}
/* Seekh kebab: minced lamb shaped round a skewer and slid off it, lumpy and long, browned with charred ridges and green herb flecks */
export function seekhGeo(sd, len = 0.62) {
  const g = chunk(len + 0.11, 0.11, 0.11, sd, { lump: .12, sharp: 2.4, detail: 9 }), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), k = 1 + Math.sin(x * 38 + sd) * 0.05; p.setY(i, p.getY(i) * k); p.setZ(i, p.getZ(i) * k); }
  g.computeVertexNormals();
  return paint(g, (x, y, z, col) => {
    const n = fbm(x * 25 + sd, y * 25, z * 25, 3); col.set(0x74361a).lerp(C(0xa8582a), clamp01((n - .35) * 2));
    if (y > .015 || n > .6) col.lerp(C(0x241008), clamp01((n - .48) * 3) * .85 * (y > .015 ? 1 : .6));
    if (hash3(Math.floor(x * 90), Math.floor(y * 90), Math.floor(z * 90)) > .975) col.set(0x3a6a24);
  });
}
export { mergeGeometries };
