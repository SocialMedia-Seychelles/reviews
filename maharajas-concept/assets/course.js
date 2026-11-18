/* One page per course: menu.html?c=<slug>. Dishes come from menu-data.js; Add puts them in the shared takeaway order.
   Real photos from their Facebook page (photos-data.js) run along the top. */
import { COURSES } from "./menu-data.js";
import { $, $$, courseUrl, render, inOrder } from "./order.js";
import { PHOTOS, FB_PAGE } from "./photos-data.js";

const LINES = {
  "soups": "Three warm bowls to start: tomato and coriander, lentil, or a creamy potato.",
  "street-food": "The snacks North India eats on its feet, served at the table.",
  "salads": "Something cool and crunchy for alongside the heat.",
  "tandoor": "Marinated in yoghurt and spice and cooked in the clay oven. Starters, or a meal on their own.",
  "curries": "From Delhi's butter chicken to a Kerala-style fish moilee, with plenty for vegetarians.",
  "rice": "Biryanis layered and slow-cooked, and plain basmati for the curries.",
  "breads": "From the clay oven, hot. Naan, kulcha, paratha and roti.",
  "desserts": "Warm, cold or both.",
  "kids": "Smaller plates for younger guests.",
};
const slug = new URLSearchParams(location.search).get("c");
const i = Math.max(0, COURSES.findIndex((c) => c.slug === slug)), c = COURSES[i], next = COURSES[(i + 1) % COURSES.length];
document.title = `${c.name} | The Maharajas menu, Eden Island`;
const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;

$("[data-tabs]").innerHTML = COURSES.map((k) => `<a href="${courseUrl(k.slug)}"${k === c ? ' aria-current="page"' : ""}>${k.name}</a>`).join("");
const dish = ([name, price, veg, desc]) => `<li class="dish">
  <h3><span class="mark${veg ? "" : " nv"}" role="img" aria-label="${veg ? "Vegetarian" : "Contains meat or seafood"}"></span>${name}</h3>
  <p>${desc}</p>
  <span class="price">SR ${price.toLocaleString("en")}</span>
  <button type="button" class="add" data-add="${name}" aria-pressed="${inOrder(name)}" aria-label="Add ${name} to your order">Add</button>
</li>`;

/* The photo row: the first photo in an arched frame like the niches in their dining room, the rest in a row you can swipe.
   Any photo opens full size, with a link to its post. A course with no photo yet (soups) simply goes without. */
const pics = PHOTOS[c.slug] || [];
const pic = (p, k) => `<figure class="pic${k ? "" : " lead"}" style="--i:${k};--a:${(p.w / p.h).toFixed(3)}">
  <button type="button" class="pic-open" data-pic="${k}" aria-label="${p.cap}: see it full size">
    <img src="${p.s}" srcset="${p.s} ${p.sw}w, ${p.l} ${p.lw}w" sizes="(max-width: 899px) 90vw, 46vw" alt="${p.cap}, at The Maharajas" width="${p.w}" height="${p.h}"${k === 0 ? ' fetchpriority="high"' : k > 2 ? ' loading="lazy"' : ""} decoding="async">
  </button>
  <figcaption>${p.cap}</figcaption>
</figure>`;
const gallery = pics.length ? `
  <section class="pics" aria-label="Photos of ${c.name.toLowerCase()} at The Maharajas">
    <div class="pics-track" data-track>${pics.map(pic).join("")}</div>
    <div class="pics-foot">
      <p>Photos from <a href="${FB_PAGE}" target="_blank" rel="noopener">The Maharajas on Facebook</a></p>
      <div class="pics-nav" data-picsnav hidden><button type="button" data-step="-1" aria-label="Previous photos"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button><button type="button" data-step="1" aria-label="More photos"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div>
    </div>
  </section>` : "";

$("[data-course]").innerHTML = `${gallery}
  <div class="course-intro">
    <h1>${c.name}</h1>
    <p>${LINES[c.slug] || ""}</p>
    <div class="row"><button type="button" class="btn" data-book>Book a table</button><a class="btn ghost" href="index.html#course-${c.stage - 1 > 0 ? c.stage - 1 : 1}">Back to the table</a></div>
    <p class="legend"><span><span class="mark"></span>Vegetarian</span><span><span class="mark nv"></span>Meat or seafood</span></p>
  </div>
  <div class="dishes">
    ${c.groups.map((g) => `${g.name ? `<h2>${g.name}</h2>` : ""}<ul>${g.items.map(dish).join("")}</ul>`).join("")}
    <a class="nextcourse" href="${courseUrl(next.slug)}"><span>Next on the menu</span><b>${next.name}</b></a>
  </div>`;
render();

/* ---------- The photo row and the full-size view ---------- */
const track = $("[data-track]");
if (track) {
  const nav = $("[data-picsnav]"), [prev, fwd] = $$("button", nav);
  const sync = () => {
    const room = track.scrollWidth - track.clientWidth;
    nav.hidden = room < 8;
    prev.disabled = track.scrollLeft < 8;
    fwd.disabled = track.scrollLeft > room - 8;
  };
  track.addEventListener("scroll", sync, { passive: true });
  addEventListener("resize", sync);
  $$("img", track).forEach((im) => im.addEventListener("load", sync));
  sync();
  nav.addEventListener("click", (ev) => {
    const b = ev.target.closest("[data-step]");
    if (b) track.scrollBy({ left: +b.dataset.step * track.clientWidth * 0.75, behavior: calm ? "auto" : "smooth" });
  });

  const lb = document.createElement("dialog");
  lb.className = "lb";
  lb.setAttribute("aria-label", `Photos of ${c.name.toLowerCase()}`);
  lb.innerHTML = `<div class="lb-in">
    <figure><img alt="" data-lbimg><figcaption><span class="lb-cap" data-lbcap></span><span class="lb-meta"><span data-lbcount></span><a data-lbpost target="_blank" rel="noopener">See the post on Facebook</a></span></figcaption></figure>
    <button type="button" class="x" data-lbclose aria-label="Close the photo">×</button>
    <button type="button" class="lb-step prev" data-lbstep="-1" aria-label="Previous photo"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
    <button type="button" class="lb-step next" data-lbstep="1" aria-label="Next photo"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
  </div>`;
  document.body.appendChild(lb);
  const img = $("[data-lbimg]", lb);
  let at = 0;
  const show = (k) => {
    at = (k + pics.length) % pics.length;
    const p = pics[at];
    img.src = p.l; img.width = p.w; img.height = p.h; img.alt = `${p.cap}, at The Maharajas`;
    $("[data-lbcap]", lb).textContent = p.cap;
    $("[data-lbcount]", lb).textContent = `${at + 1} of ${pics.length}`;
    $("[data-lbpost]", lb).href = p.post;
    $$(".lb-step", lb).forEach((b) => (b.hidden = pics.length < 2));
  };
  track.addEventListener("click", (ev) => {
    const b = ev.target.closest("[data-pic]");
    if (!b) return;
    show(+b.dataset.pic);
    lb.showModal();
    document.documentElement.classList.add("locked");
  });
  lb.addEventListener("close", () => {
    document.documentElement.classList.toggle("locked", false);
    $$("[data-pic]", track)[at]?.focus();
  });
  lb.addEventListener("click", (ev) => {
    if (ev.target.closest("[data-lbclose]") || ev.target === lb) { lb.close(); return; }
    const s = ev.target.closest("[data-lbstep]");
    if (s) show(at + +s.dataset.lbstep);
  });
  lb.addEventListener("keydown", (ev) => {
    if (ev.key === "ArrowRight") show(at + 1);
    else if (ev.key === "ArrowLeft") show(at - 1);
  });
  let x0 = null; // swipe between photos on touch screens
  img.addEventListener("pointerdown", (ev) => { x0 = ev.clientX; });
  img.addEventListener("pointerup", (ev) => {
    if (x0 !== null && Math.abs(ev.clientX - x0) > 50) show(at + (ev.clientX < x0 ? 1 : -1));
    x0 = null;
  });
}
