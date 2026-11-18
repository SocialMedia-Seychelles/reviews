/* Shared by both pages: the full menu overlay, the takeaway order drawer, the booking sheet, open-now status and toasts.
   The order is kept in this browser (localStorage) so it follows you from page to page. */
import { COURSES, PHONE, PHONE_TXT, MOBILE, MAIL, HOURS } from "./menu-data.js";

export const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const KEY = "maharajas-order";
const price = (n) => `SR ${n.toLocaleString("en")}`;
export const courseUrl = (slug) => `menu.html?c=${slug}`;

/* ---------- Shared chrome injected into both pages ---------- */
const chrome = `
<div class="menu" id="menu" hidden>
  <div class="menu-in">
    <div class="menu-head"><img class="logo" src="assets/img/logo.png" alt="The Maharajas" width="288" height="120"><button type="button" class="x" data-menu-close aria-label="Close the menu">×</button></div>
    <div class="menu-grid">
      <nav aria-label="The menu, course by course">
        <h2>The menu</h2>
        <ul class="courselist">${COURSES.map((c) => `<li><a href="${courseUrl(c.slug)}">${c.name}</a></li>`).join("")}</ul>
      </nav>
      <div class="menu-side">
        <h2>Visit</h2>
        <button type="button" class="linkish" data-book>Book a table</button>
        <a href="index.html#visit" data-menu-close>Find us at Eden Island</a>
        <a href="tel:${PHONE}">Call ${PHONE_TXT}</a>
        <p class="status" data-status><span class="dot"></span><span data-status-text>${HOURS.text}</span></p>
      </div>
    </div>
  </div>
</div>

<aside class="drawer" id="order" aria-labelledby="order-h" hidden>
  <div class="drawer-in">
    <div class="drawer-head"><h2 id="order-h">Your order</h2><button type="button" class="x" data-order-close aria-label="Close your order">×</button></div>
    <p class="empty" data-empty>Nothing here yet. Open any course on the menu and tap Add.</p>
    <ul class="items" data-items></ul>
    <p class="total" data-total hidden></p>
    <form class="form" data-order-form hidden>
      <p class="note">Takeaway, for collection at the restaurant. We confirm your order and the time by message.</p>
      <label>Your name<input name="name" autocomplete="name" required></label>
      <label>Phone<input name="phone" type="tel" autocomplete="tel" required></label>
      <label>Collection time<input name="time" type="time" min="12:00" max="22:30" required></label>
      <label>Anything we should know?<textarea name="note" rows="2" placeholder="Spice level, allergies…"></textarea></label>
      <button class="btn" type="submit" name="via" value="wa">Send my order on WhatsApp</button>
      <button class="btn line" type="submit" name="via" value="mail">Email my order instead</button>
    </form>
  </div>
</aside>

<aside class="drawer" id="book" aria-labelledby="book-h" hidden>
  <div class="drawer-in">
    <div class="drawer-head"><h2 id="book-h">Book a table</h2><button type="button" class="x" data-book-close aria-label="Close booking">×</button></div>
    <p class="note">Tell us when you'd like to come. We reply to confirm your table, and ask for a marina-side one if you'd like the view.</p>
    <form class="form" data-book-form>
      <label>Your name<input name="name" autocomplete="name" required></label>
      <label>Phone<input name="phone" type="tel" autocomplete="tel" required></label>
      <div class="two">
        <label>Date<input name="date" type="date" required></label>
        <label>Time<input name="time" type="time" min="12:00" max="22:00" value="19:30" required></label>
      </div>
      <label>Guests<select name="guests">${[1, 2, 3, 4, 5, 6, 7, 8].map((n) => `<option${n === 2 ? " selected" : ""}>${n}</option>`).join("")}<option>9 or more</option></select></label>
      <label class="check"><input type="checkbox" name="view" checked> A table by the marina, if one is free</label>
      <label>Celebrating something?<textarea name="note" rows="2" placeholder="A birthday, an anniversary…"></textarea></label>
      <button class="btn" type="submit" name="via" value="wa">Send on WhatsApp</button>
      <button class="btn line" type="submit" name="via" value="mail">Send by email</button>
      <p class="small">Or call us on <a href="tel:${PHONE}">${PHONE_TXT}</a>. Private and corporate events welcome.</p>
    </form>
  </div>
</aside>

<div class="minibar" data-mini hidden><span data-mini-text></span><button type="button" class="btn" data-order-open>View order</button></div>
<div class="toast" role="status" aria-live="polite"></div>`;
document.body.insertAdjacentHTML("beforeend", chrome);

/* ---------- Order ---------- */
const ALL = new Map(COURSES.flatMap((c) => c.groups.flatMap((g) => g.items.map(([n, p]) => [n, p]))));
let order = [];
const load = () => { try { order = JSON.parse(localStorage.getItem(KEY) || "[]").filter((i) => ALL.has(i.name)); } catch (e) { order = []; } };
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(order)); } catch (e) {} };
load();

export const toast = (t) => { const el = $(".toast"); el.textContent = t; el.classList.add("on"); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove("on"), 2000); };
export const inOrder = (name) => order.some((i) => i.name === name);

function toggle(name) {
  const k = order.findIndex((i) => i.name === name);
  if (k > -1) { order.splice(k, 1); toast(`Removed ${name}`); } else { order.push({ name, qty: 1 }); toast(`Added ${name}`); }
  save(); render();
  $$(".count").forEach((b) => { b.classList.remove("pop"); void b.offsetWidth; b.classList.add("pop"); });
}
export function render() {
  const n = order.reduce((a, i) => a + i.qty, 0), sum = order.reduce((a, i) => a + i.qty * ALL.get(i.name), 0);
  $$(".count").forEach((c) => (c.textContent = n));
  $("[data-empty]").hidden = n > 0;
  $("[data-order-form]").hidden = n === 0;
  $("[data-total]").hidden = n === 0;
  $("[data-total]").innerHTML = `<span>Total</span><b>${price(sum)}</b>`;
  $("[data-mini]").hidden = n === 0;
  $("[data-mini-text]").textContent = `${n} ${n === 1 ? "dish" : "dishes"}, ${price(sum)}`;
  $("[data-items]").innerHTML = order.map((i, k) => `<li><span class="iname">${i.name}<small>${price(ALL.get(i.name))}</small></span>
    <span class="qty"><button type="button" data-q="${k}" data-d="-1" aria-label="One less ${i.name}">−</button><b>${i.qty}</b><button type="button" data-q="${k}" data-d="1" aria-label="One more ${i.name}">+</button></span></li>`).join("");
  $$("[data-add]").forEach((c) => { const on = inOrder(c.dataset.add); c.setAttribute("aria-pressed", on); c.textContent = on ? "Added" : "Add"; });
  document.body.classList.toggle("has-order", n > 0);
}
$("[data-items]").addEventListener("click", (ev) => {
  const b = ev.target.closest("[data-q]"); if (!b) return;
  const it = order[+b.dataset.q]; it.qty += +b.dataset.d;
  if (it.qty < 1) order.splice(+b.dataset.q, 1);
  save(); render();
});

/* ---------- Panels: menu overlay, order drawer, booking sheet ---------- */
let lastFocus = null;
function panel(el, on) {
  if (on) {
    lastFocus = document.activeElement;
    $$(".menu, .drawer").forEach((p) => { if (p !== el && !p.hidden) panel(p, false); });
    el.hidden = false; requestAnimationFrame(() => el.classList.add("on"));
    $(".x", el).focus({ preventScroll: true }); document.documentElement.classList.add("locked");
  } else {
    el.classList.remove("on"); setTimeout(() => (el.hidden = true), 280);
    document.documentElement.classList.remove("locked");
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  $$(`[aria-controls="${el.id}"]`).forEach((b) => b.setAttribute("aria-expanded", on));
}
const menu = $("#menu"), drawer = $("#order"), book = $("#book");
document.addEventListener("click", (ev) => {
  const t = ev.target;
  if (t.closest("[data-add]")) { toggle(t.closest("[data-add]").dataset.add); return; }
  if (t.closest("[data-menu-open]")) return panel(menu, true);
  if (t.closest("[data-menu-close]")) return panel(menu, false);
  if (t.closest("[data-order-open]")) return panel(drawer, true);
  if (t.closest("[data-order-close]")) return panel(drawer, false);
  if (t.closest("[data-book]")) { ev.preventDefault(); return panel(book, true); }
  if (t.closest("[data-book-close]")) return panel(book, false);
  if (t === drawer || t === book) panel(t, false);
});
document.addEventListener("keydown", (ev) => {
  if (ev.key !== "Escape") return;
  for (const p of [drawer, book, menu]) if (!p.hidden) { panel(p, false); break; }
});

/* WhatsApp or email, with the message written for them */
const send = (via, subject, body) => {
  if (via === "mail") location.href = `mailto:${MAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  else window.open(`https://wa.me/${MOBILE}?text=${encodeURIComponent(body)}`, "_blank", "noopener");
};
$("[data-order-form]").addEventListener("submit", (ev) => {
  ev.preventDefault();
  const f = new FormData(ev.target), via = ev.submitter ? ev.submitter.value : "wa";
  const sum = order.reduce((a, i) => a + i.qty * ALL.get(i.name), 0);
  const body = `Hello The Maharajas, I'd like to order for collection at ${f.get("time")}:\n${order.map((i) => `- ${i.qty} × ${i.name}`).join("\n")}\nTotal on the menu: ${price(sum)}\n${f.get("note") ? "\n" + f.get("note") + "\n" : ""}\n${f.get("name")}, ${f.get("phone")}`;
  send(via, "Takeaway order from the website", body);
});
const bf = $("[data-book-form]");
bf.date.min = new Date(Date.now() + 4 * 3600e3).toISOString().slice(0, 10);
bf.addEventListener("submit", (ev) => {
  ev.preventDefault();
  const f = new FormData(ev.target), via = ev.submitter ? ev.submitter.value : "wa";
  const d = new Date(f.get("date") + "T12:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
  const body = `Hello The Maharajas, I'd like to book a table for ${f.get("guests")} on ${d} at ${f.get("time")}${f.get("view") ? ", by the marina if possible" : ""}.${f.get("note") ? "\n" + f.get("note") : ""}\n\n${f.get("name")}, ${f.get("phone")}`;
  send(via, "Table booking from the website", body);
});

/* ---------- Open now, Seychelles time (UTC+4) ---------- */
export function status() {
  const now = new Date(Date.now() + (new Date().getTimezoneOffset() + 240) * 60000);
  const m = now.getHours() * 60 + now.getMinutes(), open = m >= HOURS.open && m < HOURS.close;
  const t = open ? (m >= HOURS.close - 60 ? "Open now, kitchen closes at 10.45 pm" : "Open now until 10.45 pm") : m < HOURS.open ? "Opens today at 12 noon" : "Closed now, opens tomorrow at 12 noon";
  $$("[data-status]").forEach((el) => { el.classList.toggle("open", open); $("[data-status-text]", el).textContent = t; });
}
status(); setInterval(status, 60000);
render();
addEventListener("pageshow", () => { load(); render(); });
addEventListener("storage", (e) => { if (e.key === KEY) { load(); render(); } });
