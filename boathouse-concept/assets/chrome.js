/* Shared page chrome: the pill menu (always visible), the full-screen menu sheet, contact facts and the open-now line. */
import { MENU, PHONE, PHONE_TXT, WA, WA_TXT, EMAIL, FB, IG, MAP, HOURS, HOURS_TXT, fromPrice, money } from "./data.js";

export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const waLink = (text = "Hello Boat House Spa, ") => `https://wa.me/${WA}?text=${encodeURIComponent(text)}`;

const page = document.body.classList.contains("home") ? "home" : document.body.dataset.page || "";

export function chrome() {
  const top = $("[data-top]");
  if (top) top.innerHTML = `
    <a class="brand" href="index.html" aria-label="Boat House Spa, home"><img src="assets/img/logo.png" alt="Boat House Spa" width="84" height="79"></a>
    <nav class="pill" aria-label="Main">
      <a href="menu.html"${page === "menu" ? ' aria-current="page"' : ""}>Treatments</a>
      <a href="${page === "home" ? "#visit" : "index.html#visit"}" class="wide">Visit</a>
      <button type="button" class="more" data-menu-open aria-controls="menu" aria-expanded="false">Menu</button>
      <a href="book.html" class="book"${page === "book" ? ' aria-current="page"' : ""}>Book</a>
    </nav>`;

  const sheet = $("[data-menu]");
  if (sheet) {
    sheet.innerHTML = `
      <div class="sheet-in" role="dialog" aria-modal="true" aria-label="Menu">
        <button type="button" class="close" data-menu-close>Close</button>
        <ul class="cats">${MENU.map((c) => `<li><a href="menu.html#${c.slug}"><span>${c.name}</span><small>from ${money(fromPrice(c))}</small></a></li>`).join("")}</ul>
        <div class="sheet-links">
          <a class="btn" href="book.html">Book a treatment</a>
          <a class="btn line" href="${waLink()}" target="_blank" rel="noopener">WhatsApp ${WA_TXT}</a>
          <a class="btn line" href="tel:${PHONE}">Call ${PHONE_TXT}</a>
          <a href="${page === "home" ? "#visit" : "index.html#visit"}" data-menu-close>Hours and directions</a>
        </div>
      </div>`;
    const open = (v) => {
      sheet.hidden = !v; document.documentElement.classList.toggle("locked", v);
      $$("[data-menu-open]").forEach((b) => b.setAttribute("aria-expanded", v));
      if (v) $("[data-menu-close]", sheet).focus();
    };
    document.addEventListener("click", (e) => {
      if (e.target.closest("[data-menu-open]")) open(true);
      else if (e.target.closest("[data-menu-close]") || e.target === sheet) open(false);
    });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !sheet.hidden) open(false); });
  }

  $$("[data-wa]").forEach((a) => (a.href = waLink()));
  $$("[data-map]").forEach((a) => (a.href = MAP));
  $$("[data-fb]").forEach((a) => (a.href = FB));
  $$("[data-ig]").forEach((a) => (a.href = IG));
  const f = $("[data-facts]");
  if (f) f.innerHTML = `
    <div><dt>Open</dt><dd>${HOURS_TXT.map(([d, h]) => `${d}<br>${h}`).join("<br>")}</dd></div>
    <div><dt>Call</dt><dd><a href="tel:${PHONE}">${PHONE_TXT}</a></dd></div>
    <div><dt>WhatsApp</dt><dd><a href="${waLink()}" target="_blank" rel="noopener">${WA_TXT}</a></dd></div>
    <div><dt>Email</dt><dd><a href="mailto:${EMAIL}">${EMAIL}</a></dd></div>`;
  const st = $("[data-status]");
  if (st) { const s = status(); st.classList.toggle("open", s.open); $("[data-status-text]", st).textContent = s.text; }
}

const fmt = (m) => { const h = Math.floor(m / 60), mm = m % 60, ap = h >= 12 ? "pm" : "am"; return `${((h + 11) % 12) + 1}${mm ? "." + String(mm).padStart(2, "0") : ""} ${ap}`; };
export const fmtTime = fmt;

/* Open now? Uses Seychelles time (UTC+4) whatever the visitor's clock says. */
export function status(now = new Date()) {
  const sc = new Date(now.getTime() + (now.getTimezoneOffset() + 240) * 60000);
  const d = sc.getDay(), m = sc.getHours() * 60 + sc.getMinutes(), [o, c] = HOURS[d];
  if (m >= o && m < c) return { open: true, text: `Open now, until ${fmt(c)}` };
  const nd = m < o ? d : (d + 1) % 7, day = m < o ? "today" : "tomorrow";
  return { open: false, text: `Closed now. Opens ${day} at ${fmt(HOURS[nd][0])}` };
}
