/* Home page: the drawing-to-handover journey, then the project register, credentials and testimonials. */
import { chrome } from "./chrome.js";
import { PROJECTS, SECTORS, QUOTES, ARCHITECTS, NOW } from "./data.js";

const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const calm = matchMedia("(prefers-reduced-motion: reduce)").matches || /[?&]still\b/.test(location.search); // ?still: no easing, for test shots
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
chrome();

/* ---------- The six sheets ---------- */
const SHEETS = [
  { title: "Survey & site plan", h: "Built from the drawing up",
    lede: "Mahé Design & Build is a Class One building contractor. Since 2002 we've built resorts, villas, offices, factories and churches across Seychelles, turnkey or one stage at a time.",
    acts: true, note: "Scroll to watch a building go up." },
  { title: "Foundations", h: "Set out, dug and poured",
    lede: "Footings and ground beams sized to the site, whether it's reclaimed land at Providence or granite on a hillside." },
  { title: "Structure & frame", h: "A frame built to last",
    lede: "Reinforced concrete columns, beams and slabs, poured floor by floor and checked against the engineer's drawings." },
  { title: "Roof", h: "Under cover",
    lede: "Trusses, roof sheets and deep overhangs that keep the sun and the monsoon rain off the walls." },
  { title: "Finishes", h: "The part everyone sees",
    lede: "Glazing, timber, render, stone and landscaping, run by one team from start to finish." },
  { title: "Handover", h: "Keys in your hand",
    lede: "Turnkey means one contract, from the first drawing to a finished building.", end: true },
];
const N = SHEETS.length, D = 6.8; // journey height in screens (see .journey in site.css)
const pad = (n) => String(n).padStart(2, "0");

$("[data-sheets]").innerHTML = SHEETS.map((s, i) => `<li><button type="button" data-go="${i}" aria-label="Sheet ${i + 1}, ${s.title}">${pad(i + 1)}</button></li>`).join("");

let shown = -1;
function caption(i) {
  if (i === shown) return; shown = i;
  const s = SHEETS[i], c = $("[data-caption]");
  const head = i === 0 ? `<h1>${s.h}</h1>` : `<h2>${s.h}</h2>`;
  const acts = s.acts
    ? `<div class="acts"><a class="btn" href="start.html">Start a project</a><a class="btn line" href="#projects">See our projects</a></div>`
    : s.end ? `<div class="acts"><a class="btn line" href="#projects">See what we've built</a></div>` : "";
  c.innerHTML = `<p class="sheet">Sheet ${pad(i + 1)} of ${pad(N)}, ${s.title}</p>${head}<p class="lede">${s.lede}</p>${acts}${s.note ? `<p class="note">${s.note}</p>` : ""}`;
  c.classList.remove("in"); void c.offsetWidth; c.classList.add("in");
  $("[data-tb-sheet]").textContent = `${pad(i + 1)} of ${pad(N)}`;
  $("[data-tb-title]").textContent = s.title;
  $$("[data-sheets] button").forEach((b) => b.toggleAttribute("aria-current", +b.dataset.go === i));
}
caption(0);

/* ---------- Scroll ---------- */
let lenis = null;
if (!calm && window.Lenis) {
  lenis = new Lenis({ lerp: 0.085 });
  const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
}
const unit = () => $(".journey").offsetHeight / D;
const scrollToY = (y) => (lenis ? lenis.scrollTo(y, { duration: 1.6 }) : scrollTo({ top: y, behavior: calm ? "auto" : "smooth" }));
document.addEventListener("click", (e) => {
  const g = e.target.closest("[data-go]");
  if (g) { e.preventDefault(); scrollToY(+g.dataset.go * unit()); return; }
  const sec = e.target.closest("[data-sector]");
  if (sec) filter(sec.dataset.sector);
  const a = e.target.closest('a[href^="#"]');
  if (a && a.getAttribute("href").length > 1 && lenis) { e.preventDefault(); lenis.scrollTo(a.getAttribute("href"), { duration: 1.6, offset: 0 }); }
});

let scene = null;
function onScroll() {
  const u = scrollY / unit();
  if (scene) scene.set(u);
  caption(clamp(Math.round(u), 0, N - 1));
  $("[data-rail]").style.height = `${clamp(u / (N - 1)) * 100}%`;
  $("[data-cue]").classList.toggle("off", u > 0.08);
  $("[data-hud]").classList.toggle("gone", u > N - 0.25);
  $("[data-hud]").classList.toggle("day", u > 4.5);
  $(".top").classList.toggle("bar", scrollY + 70 > $(".after").offsetTop);
}
addEventListener("scroll", onScroll, { passive: true });

/* 3D: wait for the drafting font so the grid bubbles and dimensions draw in it */
(async () => {
  try { await Promise.race([document.fonts.load('500 40px "Barlow Semi Condensed"'), new Promise((r) => setTimeout(r, 1500))]); } catch (e) {}
  try {
    const { createScene } = await import("./scene.js");
    const boxes = [$("[data-caption]"), $(".tblock")];
    scene = createScene($("#scene"), { calm, avoid: () => boxes.filter((b) => b.offsetParent).map((b) => b.getBoundingClientRect()) });
  } catch (e) { console.error(e); }
  if (!scene) document.documentElement.classList.add("no3d");
  else addEventListener("resize", () => scene.resize());
  onScroll();
})();

/* ---------- Project register ---------- */
const reg = $("[data-register]"), peek = $("[data-peek]");
const sectorName = Object.fromEntries(SECTORS.map((s) => [s.id, s.name]));
reg.innerHTML = PROJECTS.map((p) => `<li data-s="${p.sector}"><a href="project.html?p=${p.slug}" data-cover="${p.cover}">
  <img class="th" src="assets/img/p/${p.cover}-t.webp" alt="" loading="lazy" width="84" height="64">
  <span class="yr">${p.year}</span>
  <span class="nm">${p.name}<small>${p.team[0] ? `${p.team[0][0]}: ${p.team[0][1]}` : p.client}</small></span>
  <span class="sc">${sectorName[p.sector]}</span></a></li>`).join("");
const count = (id) => PROJECTS.filter((p) => id === "all" || p.sector === id).length;
$("[data-filters]").innerHTML = [{ id: "all", name: "All" }, ...SECTORS].map((s) => `<button type="button" data-sector="${s.id}" aria-pressed="${s.id === "all"}">${s.name}<span class="n">${count(s.id)}</span></button>`).join("");
function filter(id) {
  $$("[data-filters] button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.sector === id)));
  $$("li", reg).forEach((li) => (li.hidden = id !== "all" && li.dataset.s !== id));
  const first = $("li:not([hidden]) a", reg); if (first) show(first);
}
function show(a) { const src = `assets/img/p/${a.dataset.cover}.webp`; if (peek.getAttribute("src") !== src) peek.src = src; }
reg.addEventListener("pointerover", (e) => { const a = e.target.closest("a"); if (a) show(a); });
reg.addEventListener("focusin", (e) => { const a = e.target.closest("a"); if (a) show(a); });
show($("a", reg));
$("[data-now-name]").textContent = NOW.name;
$("[data-now-note]").textContent = `${NOW.role}. ${NOW.note}`;

/* ---------- Credentials and quotes ---------- */
$("[data-architects]").textContent = ARCHITECTS.join(", ");
$("[data-quotes]").innerHTML = QUOTES.map((q) => `<figure><blockquote>“${q.q}”</blockquote><figcaption><b>${q.who}</b>${q.role}</figcaption></figure>`).join("");
