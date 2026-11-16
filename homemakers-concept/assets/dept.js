/* Homemakers concept: one catalogue page per department (department.html?d=<slug>).
   Products come from catalog-data.js (built from the homemakers.sc feed by _src/catalog.py). No prices: the store
   quotes on request, so every product goes on the same list as the 3D house and is emailed to a branch. */
import { DEPTS, PRODUCTS } from "./catalog-data.js";

const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const MAIL = "sales@pnjsupplies.sc";
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const STAGE_TITLES = ["Foundations", "Frame & roof", "Walls & floors", "Bathroom & fittings", "Furnishing", "Kitchen & everyday", "Outside"];

const slug = new URLSearchParams(location.search).get("d");
const di = Math.max(0, DEPTS.findIndex((d) => d.slug === slug));
const D = DEPTS[di];
const items = PRODUCTS.filter((p) => p.depts.includes(D.slug));
const label = (p) => p.name + (p.model ? ` (${p.model})` : p.sku ? ` (item ${p.sku})` : "");
const nice = (t) => t.charAt(0) + t.slice(1).toLowerCase();

/* ---------- Header, hero, siblings, next ---------- */
document.title = `${D.name} | Homemakers by P&J Supplies`;
$("[data-step]").textContent = `Stage ${D.stage}, ${D.stageTitle}`;
$("[data-title]").textContent = D.name;
$("[data-line]").textContent = D.line;
$("[data-meta]").textContent = items.length
  ? `${items.length} ${items.length === 1 ? "product" : "products"} online, and more in store`
  : "Our full range is in store. Tell us what you need below.";
const pic = $("[data-pic]"); pic.src = `assets/img/${D.pic}.webp`;
$$("[data-house]").forEach((a) => (a.href = `index.html#stage-${D.stage}`));
$("[data-back-text]").textContent = `Back to ${D.stageTitle.toLowerCase()}`;

const sibs = DEPTS.filter((d) => d.stage === D.stage);
$("[data-sibs]").innerHTML = sibs.length > 1
  ? sibs.map((d) => `<a href="department.html?d=${d.slug}"${d.slug === D.slug ? ' aria-current="page"' : ""}>${esc(d.name)}${d.count ? ` <small>${d.count}</small>` : ""}</a>`).join("")
  : "";
const N = DEPTS[(di + 1) % DEPTS.length];
$("[data-next]").href = `department.html?d=${N.slug}`;
$("[data-next-t]").textContent = N.name;

$("[data-deptlist]").innerHTML = STAGE_TITLES.map((t, i) =>
  `<li><span>${esc(t)}</span>${DEPTS.filter((d) => d.stage === i + 1).map((d) => `<a href="department.html?d=${d.slug}"${d.slug === D.slug ? ' aria-current="page"' : ""}>${esc(d.name)}</a>`).join("")}</li>`).join("");

/* ---------- Filters ---------- */
const subs = [...new Set(items.map((p) => p.sub).filter(Boolean))];
const hasNew = items.some((p) => p.new);
let sub = "", q = "";
const subBtn = (val, text, n) => `<button type="button" class="sub" data-sub="${esc(val)}" aria-pressed="${val === sub}">${esc(text)} <small>${n}</small></button>`;
function drawSubs() {
  if (!items.length) { $("[data-bar]").hidden = true; $(".grid-wrap").hidden = true; return; }
  $("[data-subs]").innerHTML = subBtn("", "All", items.length)
    + (subs.length > 1 ? subs.map((s) => subBtn(s, nice(s), items.filter((p) => p.sub === s).length)).join("") : "")
    + (hasNew ? subBtn("__new", "New arrivals", items.filter((p) => p.new).length) : "");
}
$("[data-subs]").addEventListener("click", (e) => {
  const b = e.target.closest("[data-sub]"); if (!b) return;
  sub = b.dataset.sub; drawSubs(); draw();
});
$("[data-find]").placeholder = `Search ${D.name.toLowerCase()}`;
$("[data-find]").addEventListener("input", (e) => { q = e.target.value.trim().toLowerCase(); draw(); });

/* ---------- Grid ---------- */
let list = [];
const load = () => { try { list = JSON.parse(localStorage.getItem("pj-list") || "[]"); } catch (e) { list = []; } };
const save = () => { try { localStorage.setItem("pj-list", JSON.stringify(list)); } catch (e) {} };
load();
const inList = (name) => list.find((i) => i.name === name);

function control(p) {
  const n = label(p), it = inList(n);
  if (it) return `<span class="step-q" role="group" aria-label="Quantity of ${esc(p.name)}"><button type="button" data-dq="${p.id}" data-d="-1" aria-label="One less">−</button><b>${it.qty}</b><button type="button" data-dq="${p.id}" data-d="1" aria-label="One more">+</button></span>`;
  return `<button type="button" class="add" data-add="${p.id}">${p.stock ? "Add to list" : "Ask when it’s back"}</button>`;
}
function card(p) {
  return `<li class="card${p.stock ? "" : " out"}" data-id="${p.id}">
    <button type="button" class="pic" data-open="${p.id}" aria-label="More about ${esc(p.name)}">
      ${p.img ? `<img src="assets/img/p/${p.id}.webp" alt="" loading="lazy" width="520" height="520">` : `<span class="noimg">${esc(p.name)}</span>`}
      ${!p.stock ? '<span class="tag sold">Sold out</span>' : p.new ? '<span class="tag">New</span>' : ""}
    </button>
    <div class="ctxt">
      ${p.brand ? `<p class="brandname">${esc(p.brand)}</p>` : ""}
      <h3><button type="button" data-open="${p.id}">${esc(p.name)}</button></h3>
      ${p.model ? `<p class="model">${esc(p.model)}</p>` : ""}
    </div>
    <div class="ctrl" data-ctrl="${p.id}">${control(p)}</div>
  </li>`;
}
function draw() {
  const show = items.filter((p) =>
    (!sub || (sub === "__new" ? p.new : p.sub === sub)) &&
    (!q || `${p.name} ${p.brand} ${p.model} ${p.sub}`.toLowerCase().includes(q)));
  $("[data-grid]").innerHTML = show.map(card).join("");
  $("[data-none]").hidden = show.length > 0 || !items.length;
  $("[data-shown]").textContent = items.length ? `Showing ${show.length} of ${items.length}` : "";
}
const refreshCtrl = (id) => {
  const p = PRODUCTS.find((x) => x.id === id);
  $$(`[data-ctrl="${id}"]`).forEach((el) => (el.innerHTML = control(p)));
};

/* ---------- Popular requests (items we can't show yet) ---------- */
const pop = D.popular.map((i) => `<button type="button" class="chip" data-item="${esc(i)}" aria-pressed="${!!inList(i)}">${esc(i)}</button>`).join("");
$("[data-popular]").innerHTML = pop;
if (items.length) $("[data-asks-title]").textContent = "Can’t see it here?";
else $("[data-asks-title]").textContent = `Popular in ${D.name.toLowerCase()}`;
$("[data-other]").addEventListener("submit", (e) => {
  e.preventDefault();
  const v = e.target.other.value.trim(); if (!v) return;
  add(`${D.name}: ${v}`); e.target.reset();
});

/* ---------- List ---------- */
const toast = (t) => { const el = $(".toast"); el.textContent = t; el.classList.add("on"); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove("on"), 2000); };
const bump = () => { const b = $(".count"); b.classList.remove("pop"); void b.offsetWidth; b.classList.add("pop"); };
function add(name, short = name) { const it = inList(name); if (it) it.qty++; else list.push({ name, qty: 1 }); save(); render(); toast(`Added: ${short}`); bump(); }
function change(name, d) {
  const k = list.findIndex((i) => i.name === name); if (k < 0) return;
  list[k].qty += d; if (list[k].qty < 1) { list.splice(k, 1); toast(`Removed: ${name.replace(/ \((item )?[^)]*\)$/, "")}`); }
  save(); render();
}
function render() {
  $(".count").textContent = list.reduce((a, i) => a + i.qty, 0);
  $("[data-empty]").hidden = list.length > 0;
  $("[data-send]").hidden = list.length === 0;
  $("[data-mini]").hidden = list.length === 0;
  $("[data-mini-text]").textContent = `${list.length} ${list.length === 1 ? "item" : "items"} on your list`;
  $("[data-items]").innerHTML = list.map((i, k) => `<li><span class="iname">${esc(i.name)}</span>
    <span class="qty"><button type="button" data-q="${k}" data-d="-1" aria-label="One less ${esc(i.name)}">−</button><b>${i.qty}</b><button type="button" data-q="${k}" data-d="1" aria-label="One more ${esc(i.name)}">+</button></span></li>`).join("");
  $$("[data-item]").forEach((c) => c.setAttribute("aria-pressed", !!inList(c.dataset.item)));
  items.forEach((p) => refreshCtrl(p.id));
}

document.addEventListener("click", (ev) => {
  const a = ev.target.closest("[data-add]");
  if (a) { const p = PRODUCTS.find((x) => x.id === +a.dataset.add); add(label(p), p.name); return; }
  const s = ev.target.closest("[data-dq]");
  if (s) { const p = PRODUCTS.find((x) => x.id === +s.dataset.dq); change(label(p), +s.dataset.d); return; }
  const c = ev.target.closest("[data-item]");
  if (c) { const n = c.dataset.item; if (inList(n)) change(n, -inList(n).qty); else add(n); return; }
  const o = ev.target.closest("[data-open]");
  if (o) openQV(+o.dataset.open);
});
$("[data-items]").addEventListener("click", (ev) => {
  const b = ev.target.closest("[data-q]"); if (!b) return;
  change(list[+b.dataset.q].name, +b.dataset.d);
});

/* ---------- Quick view ---------- */
const qv = $("[data-qv]");
function openQV(id) {
  const p = PRODUCTS.find((x) => x.id === id);
  $("[data-qv-in]").innerHTML = `
    <button type="button" class="x" data-qv-close aria-label="Close">×</button>
    <div class="qv-pic">${p.img ? `<img src="assets/img/p/${p.id}.webp" alt="${esc(p.name)}" width="520" height="520">` : ""}</div>
    <div class="qv-txt">
      ${p.brand ? `<p class="brandname">${esc(p.brand)}</p>` : ""}
      <h2 id="qv-h">${esc(p.name)}</h2>
      ${p.model ? `<p class="model">Model ${esc(p.model)}</p>` : p.sku ? `<p class="model">Item code ${esc(p.sku)}</p>` : ""}
      <p class="avail ${p.stock ? "in" : "outs"}">${p.stock ? "In stock online. Ask the store to confirm your branch." : "Sold out for now. Add it and we’ll tell you when it’s back."}</p>
      ${p.feat.length ? `<ul class="feat">${p.feat.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>` : ""}
      <div class="ctrl qvctrl" data-ctrl="${p.id}">${control(p)}</div>
      <p class="small">No prices online: add it to your list and the store sends you a quote.</p>
    </div>`;
  qv.showModal();
  $(".x", qv).focus();
}
qv.addEventListener("click", (e) => { if (e.target === qv || e.target.closest("[data-qv-close]")) qv.close(); });

/* ---------- Menu, drawer ---------- */
const menu = $("#menu"), menuBtns = $$("[data-menu-open]");
function openMenu() { menu.hidden = false; requestAnimationFrame(() => menu.classList.add("on")); menuBtns.forEach((b) => b.setAttribute("aria-expanded", "true")); $(".x", menu).focus({ preventScroll: true }); }
function closeMenu() { menu.classList.remove("on"); setTimeout(() => (menu.hidden = true), 300); menuBtns.forEach((b) => b.setAttribute("aria-expanded", "false")); }
menuBtns.forEach((b) => b.addEventListener("click", openMenu));
$$("[data-menu-close]").forEach((b) => b.addEventListener("click", closeMenu));

const drawer = $("#drawer"), lb = $(".listbtn");
const openDrawer = (on) => {
  if (on) { if (qv.open) qv.close(); drawer.hidden = false; requestAnimationFrame(() => drawer.classList.add("on")); $(".x", drawer).focus({ preventScroll: true }); }
  else { drawer.classList.remove("on"); setTimeout(() => (drawer.hidden = true), 250); lb.focus({ preventScroll: true }); }
  lb.setAttribute("aria-expanded", on);
};
lb.addEventListener("click", () => openDrawer(drawer.hidden));
document.addEventListener("click", (ev) => { if (ev.target.closest("[data-open-list]")) openDrawer(true); });
$(".x", drawer).addEventListener("click", () => openDrawer(false));
drawer.addEventListener("click", (ev) => { if (ev.target === drawer) openDrawer(false); });
document.addEventListener("keydown", (ev) => {
  if (ev.key !== "Escape") return;
  if (!drawer.hidden) openDrawer(false); else if (!menu.hidden) closeMenu();
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

drawSubs(); draw(); render(); status(); setInterval(status, 60000);
addEventListener("pageshow", () => { load(); render(); });
