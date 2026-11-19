/* Header, full menu and footer, shared by every page. */
import { CONTACT, SECTORS } from "./data.js";

const $ = (s, r = document) => r.querySelector(s);
const home = document.body.classList.contains("home");
const h = (id) => (home ? `#${id}` : `index.html#${id}`);

export function chrome() {
  const top = $("[data-chrome]");
  if (top) top.innerHTML = `
    <a class="brand" href="${home ? "#top" : "index.html"}" ${home ? 'data-go="0"' : ""} aria-label="Mahé Design &amp; Build, home"><img src="assets/img/logo.png" alt="Mahé Design &amp; Build" width="520" height="180"></a>
    <nav class="pill" aria-label="Main">
      <a href="${h("projects")}">Projects</a>
      <a href="${h("about")}">About</a>
      <a href="${h("contact")}">Contact</a>
      <a class="pill-cta" href="start.html">Start a project</a>
    </nav>
    <a class="startbtn" href="start.html">Start a project</a>
    <button class="menubtn" type="button" aria-controls="menu" aria-expanded="false">Menu</button>`;

  const menu = $("[data-menu]");
  if (menu) {
    menu.innerHTML = `<div class="menu-in">
      <div class="menu-head"><span>Menu</span><button type="button" class="x" data-menu-close aria-label="Close the menu">Close</button></div>
      <div class="menu-grid">
        <div><h2 class="menu-k">Projects</h2><ul>${SECTORS.map((s) => `<li><a href="${h("projects")}" data-sector="${s.id}" data-menu-close>${s.name}</a></li>`).join("")}<li><a href="${h("projects")}" data-sector="all" data-menu-close>All projects</a></li></ul></div>
        <div><h2 class="menu-k">Company</h2><ul><li><a href="${h("about")}" data-menu-close>About us</a></li><li><a href="${h("contact")}" data-menu-close>Contact</a></li><li><a href="start.html">Start a project</a></li></ul></div>
        <div class="menu-contact"><a href="tel:${CONTACT.tel}">${CONTACT.phone}</a><a href="mailto:${CONTACT.email}">${CONTACT.email}</a><p>${CONTACT.hours}</p></div>
      </div></div>`;
    const btn = $(".menubtn");
    const open = (v) => { menu.hidden = !v; btn && btn.setAttribute("aria-expanded", String(v)); document.documentElement.classList.toggle("menu-open", v); if (v) $(".x", menu).focus(); };
    btn && btn.addEventListener("click", () => open(true));
    menu.addEventListener("click", (e) => { if (e.target.closest("[data-menu-close]") || e.target === menu) open(false); });
    addEventListener("keydown", (e) => { if (e.key === "Escape" && !menu.hidden) { open(false); btn && btn.focus(); } });
  }

  const foot = $("[data-foot]");
  if (foot) foot.innerHTML = `<div class="wrap foot-in">
      <img src="assets/img/logo.png" alt="Mahé Design &amp; Build" width="520" height="180" loading="lazy">
      <div><h2 class="menu-k">Office</h2><p>${CONTACT.address}</p><p><a href="${CONTACT.map}" target="_blank" rel="noopener">Directions</a></p></div>
      <div><h2 class="menu-k">Talk to us</h2><p><a href="tel:${CONTACT.tel}">${CONTACT.phone}</a><br><a href="mailto:${CONTACT.email}">${CONTACT.email}</a></p><p>${CONTACT.hours}</p></div>
      <p class="small">© 2026 Mahé Design &amp; Build Co. Ltd. Class One building contractor.</p>
    </div>`;
}
