/* project.html?p=<slug>: one project, its team, scope and archive photos. */
import { chrome } from "./chrome.js";
import { PROJECTS, SECTORS } from "./data.js";

const $ = (s, r = document) => r.querySelector(s);
chrome();

const slug = new URLSearchParams(location.search).get("p");
const i = Math.max(0, PROJECTS.findIndex((p) => p.slug === slug));
const p = PROJECTS[i], next = PROJECTS[(i + 1) % PROJECTS.length];
const sector = SECTORS.find((s) => s.id === p.sector).name;
document.title = `${p.name} | Mahé Design & Build`;

const rows = [["Client", p.client], ["Year", p.year], ["Sector", sector], ...p.team, ["Our role", "Building contractor"]];
const img = (stem, n) => `<button type="button" class="ph" data-i="${n}" aria-label="Open photo ${n + 1} of ${p.photos.length}"><img src="assets/img/p/${stem}.webp" alt="${p.name}, photo ${n + 1}" loading="${n < 2 ? "eager" : "lazy"}"></button>`;

$("[data-project]").innerHTML = `
  <div class="wrap">
    <a class="back" href="index.html#projects">All projects</a>
    <div class="proj-head">
      <div>
        <p class="proj-meta">${sector}, ${p.year}</p>
        <h1>${p.name}</h1>
        <p class="proj-scope">${p.scope}</p>
      </div>
      <dl class="spec">${rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("")}</dl>
    </div>
    <div class="gallery">${p.photos.map(img).join("")}</div>
    <p class="small archive">Photos from our project archive.</p>
    <a class="nextp" href="project.html?p=${next.slug}">
      <span class="np-k">Next project</span>
      <span class="np-n">${next.name}</span>
      <img src="assets/img/p/${next.cover}-t.webp" alt="" loading="lazy">
    </a>
  </div>`;

/* Photo viewer */
const dlg = $("[data-viewer]");
let at = 0;
const show = (n) => {
  at = (n + p.photos.length) % p.photos.length;
  $("[data-v-img]").src = `assets/img/p/${p.photos[at]}.webp`;
  $("[data-v-img]").alt = `${p.name}, photo ${at + 1}`;
  $("[data-v-cap]").textContent = `${p.name}, ${at + 1} of ${p.photos.length}`;
};
document.addEventListener("click", (e) => {
  const b = e.target.closest(".ph");
  if (b) { show(+b.dataset.i); dlg.showModal(); return; }
  if (e.target.closest("[data-v-prev]")) show(at - 1);
  if (e.target.closest("[data-v-next]")) show(at + 1);
  if (e.target.closest("[data-v-close]") || e.target === dlg) dlg.close();
});
dlg.addEventListener("keydown", (e) => { if (e.key === "ArrowLeft") show(at - 1); if (e.key === "ArrowRight") show(at + 1); });
