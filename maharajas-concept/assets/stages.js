/* The courses of the scroll journey and the text beside each one. Shared by the 3D page (site.js) and the photo page (photo.js). */
import { COURSES } from "./menu-data.js";
import { courseUrl, status } from "./order.js";

const course = (slug) => COURSES.find((c) => c.slug === slug);

export const STAGES = [
  { title: "Soups & street food", line: "Tomato and coriander shorba, samosa chaat and pani puri. Something to pick at while the sun goes down.", links: ["soups", "street-food", "salads"] },
  { title: "From the tandoor", line: "Prawns, lamb chops and paneer in yoghurt and spice, cooked in the clay oven until the edges char.", links: ["tandoor"] },
  { title: "Curries", line: "Butter chicken, black dal finished with cream, spinach with paneer. Rich, slow, and made to be mopped up.", links: ["curries"] },
  { title: "Rice & biryani", line: "Jhinga biryani: prawns and basmati, finished with saffron and rose water.", links: ["rice"] },
  { title: "Breads", line: "Naan, kulcha and paratha from the clay oven, blistered and hot. Order one more than you think.", links: ["breads"] },
  { title: "Desserts & lassi", line: "Gulab jamun in warm rose syrup, mango kulfi, and the mango lassi people write home about.", links: ["desserts", "kids"] },
  { title: "Your table by the marina", final: true },
];

export const stageListHTML = () => STAGES.map((s, i) => `<li><button type="button" data-go="${i + 1}">${s.title}</button></li>`).join("");

/* Fill the caption box for stage i (0 is the welcome) and mark that course in the side list. */
export function fillCaption(c, i) {
  if (i === 0) {
    c.innerHTML = `<h1 class="title">The Maharajas</h1>
      <p class="lede">North Indian cooking from the tandoor, by the marina at Eden Island.</p>
      <p class="laurel">Lonely Planet's pick for the best Indian restaurant in Seychelles</p>
      <p class="status" data-status><span class="dot"></span><span data-status-text></span></p>`;
    status();
  } else {
    const s = STAGES[i - 1];
    c.innerHTML = s.final
      ? `<h2>${s.title}</h2><p class="lede">Lunch and dinner every day from 12 noon. Book ahead and ask for a table by the water at sunset.</p>
         <div class="cap-links"><button type="button" class="btn" data-book>Book a table</button><button type="button" class="btn ghost" data-order-open>Order a takeaway</button></div>`
      : `<p class="step">Course ${i} of 6</p><h2>${s.title}</h2><p class="lede">${s.line}</p>
         <div class="cap-links">${s.links.map((l) => `<a class="btn ghost" href="${courseUrl(l)}">${course(l).name}</a>`).join("")}</div>`;
  }
  c.classList.remove("in"); void c.offsetWidth; c.classList.add("in");
  document.querySelectorAll("[data-stagelist] button").forEach((b) => b.toggleAttribute("aria-current", +b.dataset.go === i));
}
