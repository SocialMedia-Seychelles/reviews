import { MENU, money, fromPrice } from "./data.js";
import { chrome, $, $$ } from "./chrome.js";

chrome();

const len = (m) => (m >= 60 ? `${Math.floor(m / 60)} hr${m % 60 ? " " + (m % 60) + " min" : ""}` : `${m} min`);
const priceLine = (it) => {
  if (it.from) return `<span class="p">from ${money(it.opts[0][1])}</span>`;
  return it.opts.map((o, i) => `<span class="p">${it.lab ? it.lab[i] + " " : (it.opts.length > 1 || !it.est ? len(o[0]) + " " : "")}<b>${money(o[1])}</b></span>`).join("");
};

$("[data-chips]").innerHTML = `<div class="chips-in">${MENU.map((c) => `<a href="#${c.slug}">${c.name}</a>`).join("")}</div>`;
$("[data-cats]").innerHTML = MENU.map((c) => `
  <section class="cat" id="${c.slug}" aria-labelledby="h-${c.slug}">
    <div class="wrap cat-in">
      <figure class="cat-photo"><img src="assets/img/fb/${c.photo}.jpg" alt="" loading="lazy" width="1080" height="1294"></figure>
      <div class="cat-body">
        <h2 id="h-${c.slug}">${c.name}</h2>
        <p class="lede">${c.line}</p>
        <ul class="items">${c.items.map((it) => `
          <li>
            <div class="it-text"><h3>${it.name}</h3>${it.d ? `<p>${it.d}</p>` : ""}</div>
            <div class="it-price">${priceLine(it)}</div>
            <a class="it-book" href="book.html?t=${it.id}" aria-label="Book ${it.name}">Book</a>
          </li>`).join("")}
        </ul>
      </div>
    </div>
  </section>`).join("");

// highlight the chip for the section in view
const chips = $$(".chips a");
const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) chips.forEach((a) => a.toggleAttribute("aria-current", a.getAttribute("href") === "#" + e.target.id)); }), { rootMargin: "-40% 0px -55% 0px" });
$$(".cat").forEach((s) => io.observe(s));
