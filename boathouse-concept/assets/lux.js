/* Boat House Spa, high-end home page. No 3D: type and photos do the work.
   Letters rise in from behind masks, a pebble-shaped window opens to full screen, words light up as you read,
   one slow breath, a treatment index with a photo that follows the cursor, a marquee that answers your scroll
   speed, a pinned sideways gallery, live free times from the booking diary, and a wordmark that rises at the end. */
import { MENU, fromPrice, money, find } from "./data.js";
import { chrome, $, $$, fmtTime } from "./chrome.js";
import { DAYS, key, dayLabel, availability } from "./slots.js";

chrome();

const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
document.documentElement.classList.toggle("calm", calm);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const mix = (a, b, t) => a + (b - a) * t;
const ease = (t) => t * t * (3 - 2 * t);
const easeOut = (t) => 1 - Math.pow(1 - t, 3);

/* ---------- Text splitting (screen readers get the plain text) ---------- */
function splitChars(el, start = 0) {
  let i = start;
  const walk = (node) => {
    for (const n of [...node.childNodes]) {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.append(" "); return; }
          const w = document.createElement("span"); w.className = "w"; w.setAttribute("aria-hidden", "true");
          for (const c of part) { const s = document.createElement("span"); s.className = "ch"; s.style.setProperty("--i", i++); s.textContent = c; w.append(s); }
          frag.append(w);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) walk(n);
    }
  };
  const label = el.textContent.replace(/\s+/g, " ").trim();
  walk(el); el.setAttribute("aria-label", label);
  return i;
}
function splitWords(el) {
  const label = el.textContent.trim(), words = label.split(/\s+/);
  el.innerHTML = words.map((w) => `<span class="sw" aria-hidden="true">${w}</span>`).join(" ");
  el.setAttribute("aria-label", label);
  return $$(".sw", el);
}

/* Things that animate once when they come into view */
const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: 0.18 });
$$("[data-split]").forEach((el) => { splitChars(el); io.observe(el); });

/* ---------- 1. Hero ---------- */
const hero = $("[data-hero]"), h1 = $("[data-hero-h]"), peb = $("[data-pebble]"), pimg = $("[data-pebble-img]"), pcap = $("[data-pebble-cap]"), sub = $("[data-hero-sub]");
splitChars(h1);
const h1copy = h1.cloneNode(true); h1copy.removeAttribute("id"); h1copy.removeAttribute("aria-label"); h1copy.setAttribute("aria-hidden", "true"); peb.append(h1copy);
$$(".ch", hero).forEach((c) => c.style.setProperty("--d", "120ms"));
const reveal = () => { hero.classList.add("in"); h1.classList.add("in"); h1copy.classList.add("in"); };
requestAnimationFrame(() => requestAnimationFrame(reveal)); setTimeout(reveal, 120); // the timer covers tabs that hold back animation frames

function pebbleBox(w, h) { return w / h < 0.9 ? { t: 0.225 * h, r: 0.07 * w, b: 0.31 * h, l: 0.34 * w } : { t: 0.17 * h, r: 0.06 * w, b: 0.08 * h, l: 0.55 * w }; }
function heroFrame() {
  const w = innerWidth, h = innerHeight, span = hero.offsetHeight - h, p = calm ? 0 : clamp(-hero.getBoundingClientRect().top / span);
  const o = ease(clamp(p / 0.72)), k = 1 - o, B = pebbleBox(w, h);
  const t = B.t * k, r = B.r * k, b = B.b * k, l = B.l * k, rw = w - l - r, rh = h - t - b;
  peb.style.clipPath = `inset(${t}px ${r}px ${b}px ${l}px round ${rw * 0.5 * k}px ${rw * 0.47 * k}px ${rw * 0.42 * k}px ${rw * 0.53 * k}px / ${rh * 0.36 * k}px ${rh * 0.34 * k}px ${rh * 0.4 * k}px ${rh * 0.42 * k}px)`;
  pimg.style.transform = `scale(${mix(1.25, 1, o).toFixed(4)})`; peb.style.setProperty("--tint", k.toFixed(3));
  // the headline drifts up, its letters open out, and it is gone before the caption arrives
  const hp = easeOut(clamp((p - 0.03) / 0.38));
  for (const el of [h1, h1copy]) { el.style.transform = `translate3d(0, ${(-hp * h * 0.2).toFixed(1)}px, 0)`; el.style.opacity = (1 - hp).toFixed(3); el.style.letterSpacing = `${(-0.04 + hp * 0.1).toFixed(4)}em`; }
  const so = 1 - clamp(p / 0.16); sub.style.opacity = so.toFixed(3); sub.style.visibility = so < 0.02 ? "hidden" : "";
  const c = ease(clamp((p - 0.7) / 0.14)); peb.style.setProperty("--cap", c.toFixed(3)); pcap.style.opacity = c.toFixed(3); pcap.style.transform = `translateY(${((1 - c) * 24).toFixed(1)}px)`;
}

/* ---------- 2 + 7. Words that light up as you read ---------- */
const scrubs = $$("[data-scrub-words]").map((el) => ({ el, words: splitWords(el) }));
function scrubFrame() {
  const vh = innerHeight;
  for (const s of scrubs) {
    const r = s.el.getBoundingClientRect(); if (r.bottom < -100 || r.top > vh + 100) continue;
    const lit = clamp((vh * 0.88 - r.top) / (r.height + vh * 0.36)) * (s.words.length + 2);
    s.words.forEach((w, i) => { w.style.opacity = (0.16 + 0.84 * clamp(lit - i)).toFixed(3); });
  }
}

/* ---------- 3. One slow breath: in for 4, hold for 2, out for 6 ---------- */
const br = $("[data-breathe]"), bword = $("[data-breath-word]");
const PH = [["Breathe in", 4000], ["Hold", 2000], ["Let go", 6000]];
let bTimer = null, bi = 0;
function breath() {
  const [txt, ms] = PH[bi];
  if (bword.textContent !== txt) { bword.classList.add("out"); setTimeout(() => { bword.textContent = txt; bword.classList.remove("out"); }, 350); }
  br.dataset.phase = bi; bi = (bi + 1) % PH.length; bTimer = setTimeout(breath, ms);
}
if (!calm) new IntersectionObserver(([e]) => {
  if (e.isIntersecting && !bTimer) { bi = 0; breath(); }
  else if (!e.isIntersecting && bTimer) { clearTimeout(bTimer); bTimer = null; delete br.dataset.phase; bword.textContent = PH[0][0]; }
}, { threshold: 0.4 }).observe(br);

/* ---------- 4. Treatments index, with a photo that follows the cursor ---------- */
const tl = $("[data-tlist]");
tl.innerHTML = MENU.map((c, i) => `<li><a href="menu.html#${c.slug}" data-photo="${c.photo}" style="--i:${i}"><span class="t-n">${c.name}</span><span class="t-m"><span>${c.line}</span><b>from ${money(fromPrice(c))}</b></span><img class="t-th" src="assets/img/sm/${c.photo}.jpg" alt="" loading="lazy" width="560" height="672"></a></li>`).join("");
io.observe(tl);
const fl = $("[data-float]"), flImg = $("[data-float-img]"), fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
const fp = { x: 0, y: 0, tx: 0, ty: 0, on: false };
MENU.forEach((c) => { const im = new Image(); im.src = `assets/img/fb/${c.photo}.jpg`; });
if (fine && !calm) {
  tl.addEventListener("pointermove", (e) => { fp.tx = e.clientX; fp.ty = e.clientY; if (!fp.on) { fp.x = fp.tx; fp.y = fp.ty; } });
  tl.addEventListener("pointerover", (e) => { const a = e.target.closest("[data-photo]"); if (!a) return; flImg.src = `assets/img/fb/${a.dataset.photo}.jpg`; fp.on = true; fl.classList.add("on"); });
  tl.addEventListener("pointerleave", () => { fp.on = false; fl.classList.remove("on"); });
}
function floatFrame() {
  if (!fp.on && !fl.classList.contains("on")) return;
  const vx = fp.tx - fp.x; fp.x += vx * 0.14; fp.y += (fp.ty - fp.y) * 0.14;
  fl.style.transform = `translate3d(${fp.x.toFixed(1)}px, ${fp.y.toFixed(1)}px, 0) translate(-50%, -50%) rotate(${clamp(vx * 0.06, -10, 10).toFixed(2)}deg) scale(${fp.on ? 1 : 0.6})`;
}

/* ---------- 5. Marquee ---------- */
const FLOWER = `<svg viewBox="0 0 40 40" aria-hidden="true">${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="20" cy="10" rx="7" ry="10" transform="rotate(${a} 20 20)"/>`).join("")}<circle cx="20" cy="20" r="3.4" fill="#f2b22a"/></svg>`;
const mq = $("[data-mq]"), seq = ["Unwind", "Polish", "Restore", "Glow", "Exhale", "Soften"].map((w) => `<span>${w}</span>${FLOWER}`).join("");
mq.innerHTML = `<div class="mq-seq">${seq}</div>`.repeat(3);
let mqX = 0, mqDir = 1, vel = 0;
function marqueeFrame(dt, dy) {
  if (calm) return;
  if (Math.abs(dy) > 0.5) mqDir = Math.sign(dy);
  vel += (dy - vel) * 0.12;
  const seqW = mq.firstElementChild.offsetWidth || 1;
  mqX -= (0.55 + Math.min(14, Math.abs(vel) * 0.35)) * mqDir * dt * 60;
  mqX = ((mqX % seqW) - seqW) % seqW;
  mq.style.transform = `translate3d(${mqX.toFixed(1)}px, 0, 0) skewX(${clamp(-vel * 0.25, -9, 9).toFixed(2)}deg)`;
}

/* ---------- 6. Pinned sideways gallery ---------- */
const HG = [["balcony", "The balcony, in the trees"], ["lounge", "The pedicure lounge"], ["polish-cart", "The colour cart"], ["balcony-tea", "Iced tea before you start"], ["couple-deck", "Choosing treatments on the deck"], ["massage", "Massage, with a hibiscus"], ["spritz-pedi", "A pedicure, feet up"], ["arrive", "Up the steps from the road"]];
const hg = $("[data-hgallery]"), track = $("[data-hg-track]");
track.innerHTML = HG.map(([f, c]) => `<figure><img src="assets/img/fb/${f}.jpg" alt="${c}" loading="lazy" width="1080" height="1294"><figcaption>${c}</figcaption></figure>`).join("");
let hgMove = 0;
function sizeGallery() { if (calm) return; hgMove = Math.max(0, track.scrollWidth - innerWidth); hg.style.height = `${innerHeight + hgMove}px`; }
function galleryFrame() {
  if (calm) return;
  const r = hg.getBoundingClientRect(), p = clamp(-r.top / Math.max(1, hg.offsetHeight - innerHeight));
  track.style.transform = `translate3d(${(-p * hgMove).toFixed(1)}px, 0, 0)`;
}

/* ---------- 8. Free soon: the next open times from the booking diary ---------- */
const PICKS = ["gpedi", "boathouse", "cfacial", "cmani", "balinese", "mcut"];
const lenTxt = (m) => (m >= 60 ? `${Math.floor(m / 60)} hr${m % 60 ? " " + (m % 60) + " min" : ""}` : `${m} min`);
const free = [];
PICKS.forEach((id, n) => {
  const f = find(id); if (!f) return; const mins = f.it.opts[0][0];
  for (let i = 0; i < 10; i++) {
    const d = DAYS[i], a = availability(d, f.cat.slug, mins, "any"); if (!a.length) continue;
    const s = a[Math.min(a.length - 1, Math.floor(a.length * (0.25 + 0.12 * n)))];
    if (free.some((x) => key(x.d) === key(d) && x.t === s.t)) continue;
    free.push({ id, name: f.it.name, mins, d, t: s.t, i }); break;
  }
});
free.sort((a, b) => a.i - b.i || a.t - b.t);
const fr = $("[data-free]");
fr.innerHTML = free.map((x, j) => `<li><a href="book.html?t=${x.id}&d=${key(x.d)}&at=${x.t}" style="--i:${j}"><small>${x.i === 0 ? "Today" : x.i === 1 ? "Tomorrow" : dayLabel(x.d, true)}</small><b>${fmtTime(x.t)}</b><span>${x.name}, ${lenTxt(x.mins)}</span></a></li>`).join("");
io.observe(fr);

/* ---------- 10. The wordmark rises letter by letter as the foot comes up ---------- */
const wm = $("[data-wordmark]"), foot = $("[data-foot]");
const wmN = splitChars(wm), wmCh = $$(".ch", wm);
// size the wordmark so it runs exactly edge to edge
function fitWordmark() { wm.style.fontSize = "100px"; wm.style.display = "inline-block"; const pad = parseFloat(getComputedStyle(wm).paddingLeft) || 0, w = wm.getBoundingClientRect().width - pad; wm.style.display = ""; wm.style.fontSize = `${Math.floor(((innerWidth - pad * 1.6) / Math.max(1, w)) * 100)}px`; }
fitWordmark(); document.fonts && document.fonts.ready.then(fitWordmark);
function wordmarkFrame() {
  if (calm) return;
  const r = foot.getBoundingClientRect(), p = clamp((innerHeight - r.top) / Math.min(r.height, innerHeight * 0.9));
  wmCh.forEach((c, i) => { const t = easeOut(clamp(p * 1.7 - (i / wmN) * 0.7)); c.style.transform = `translateY(${((1 - t) * 105).toFixed(1)}%)`; });
}

/* ---------- Scroll ---------- */
let lenis = null;
if (!calm && window.Lenis) { lenis = new Lenis({ lerp: 0.09 }); }
document.addEventListener("click", (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (a && a.getAttribute("href").length > 1 && lenis) { e.preventDefault(); lenis.scrollTo(a.getAttribute("href"), { duration: 1.6, offset: -70 }); }
});
const topEl = $("[data-top]");
let last = 0, lastY = scrollY;
function frame(time) {
  const dt = Math.min(0.1, (time - last) / 1000 || 0.016); last = time;
  if (lenis) lenis.raf(time);
  const y = scrollY, dy = y - lastY; lastY = y;
  topEl.classList.toggle("solid", y > hero.offsetHeight - innerHeight * 0.6);
  heroFrame(); scrubFrame(); floatFrame(); marqueeFrame(dt, dy); galleryFrame(); wordmarkFrame();
  requestAnimationFrame(frame);
}
sizeGallery();
let rw = innerWidth;
addEventListener("resize", () => { if (innerWidth !== rw) { rw = innerWidth; sizeGallery(); fitWordmark(); } });
addEventListener("load", sizeGallery);
requestAnimationFrame(frame);
