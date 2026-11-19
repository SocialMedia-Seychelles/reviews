/* start.html: the enquiry flow. Answers fill a project brief beside the form; it is sent by email or WhatsApp. */
import { chrome } from "./chrome.js";
import { CONTACT } from "./data.js";

const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
chrome();

const WHATSAPP = ""; // their WhatsApp number, digits only (e.g. 2482xxxxxx). To confirm. Empty = WhatsApp lets you pick the chat.
const OPTS = {
  type: ["Resort or hotel", "Private villa or home", "Commercial building", "Industrial or warehouse", "Community or public building", "Renovation or extension"],
  island: ["Mahé", "Praslin", "La Digue", "Another island"],
  stage: [["I have the land", "No drawings yet"], ["I have drawings", "From an architect or designer"], ["Waiting on approvals", "Plans are with Planning"], ["Approved, ready to build", "Looking for a contractor"]],
  budget: ["Under SCR 2 million", "SCR 2 to 10 million", "SCR 10 to 50 million", "Over SCR 50 million", "Not sure yet"],
};
for (const [k, list] of Object.entries(OPTS)) {
  $(`[data-opts="${k}"]`).innerHTML = list.map((o) => {
    const [t, sub] = Array.isArray(o) ? o : [o];
    return `<label class="opt-card"><input type="radio" name="${k}" value="${t}"><span>${t}${sub ? `<small>${sub}</small>` : ""}</span></label>`;
  }).join("");
}

const STEPS = ["type", "where", "stage", "budget", "you"];
const NEED = { type: "type", where: "island", stage: "stage", budget: "budget" };
const form = $("[data-form]");
let step = 0;
const val = (n) => (form.elements[n] ? (form.elements[n].value || "").trim() : "");

function brief() {
  const where = [val("area"), val("island")].filter(Boolean).join(", ");
  const rows = [["Building", val("type")], ["Site", where], ["Stage", val("stage")], ["Budget", val("budget")], ["Name", val("name")], ["Phone", val("phone")], ["Email", val("email")]];
  $("[data-brief]").innerHTML = rows.map(([k, v]) => `<div class="${v ? "" : "blank"}"><dt>${k}</dt><dd>${v || "&nbsp;"}</dd></div>`).join("");
  return rows;
}
function go(n) {
  step = Math.max(0, Math.min(STEPS.length - 1, n));
  $$("[data-q]").forEach((f) => (f.hidden = f.dataset.q !== STEPS[step]));
  $("[data-step-n]").textContent = `Step ${step + 1} of ${STEPS.length}`;
  $("[data-bar]").style.width = `${((step + 1) / STEPS.length) * 100}%`;
  $("[data-back]").hidden = step === 0;
  $("[data-next]").hidden = step === STEPS.length - 1;
  updateNext();
  const first = $(`[data-q="${STEPS[step]}"] input`); if (first && step > 0) first.focus({ preventScroll: true });
}
function updateNext() { const need = NEED[STEPS[step]]; $("[data-next]").disabled = !!need && !val(need); }

form.addEventListener("change", (e) => {
  brief(); updateNext();
  if (e.target.type === "radio" && STEPS[step] !== "where") setTimeout(() => go(step + 1), 260);
});
form.addEventListener("input", () => { brief(); updateNext(); });
$("[data-next]").addEventListener("click", () => go(step + 1));
$("[data-back]").addEventListener("click", () => go(step - 1));

function message() {
  const lines = brief().filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`);
  if (val("note")) lines.push("", val("note"));
  return `Hello Mahé Design & Build, I'd like to talk about a project.\n\n${lines.join("\n")}`;
}
$$("[data-send]").forEach((b) => b.addEventListener("click", () => {
  const err = $("[data-err]");
  if (!val("name") || !val("phone")) { err.textContent = "Add your name and phone number so our team can call you back."; err.hidden = false; (val("name") ? form.elements.phone : form.elements.name).focus(); return; }
  err.hidden = true;
  const text = message();
  if (b.dataset.send === "email") location.href = `mailto:${CONTACT.email}?subject=${encodeURIComponent(`New project: ${val("type") || "enquiry"}`)}&body=${encodeURIComponent(text)}`;
  else window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
}));

$("[data-brief-date]").textContent = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
brief(); go(0);
