/* Booking flow (front-end demo). Steps: treatment, therapist, time, your details, then a confirmation with
   add-to-calendar and a WhatsApp copy. Availability is sample data, seeded so it stays the same on every visit.
   Going live: replace `availability()` and `submit()` with calls to the booking system (see Site Plan.md). */
import { MENU, STAFF, HOURS, RESIDENT_OFF, money, find } from "./data.js";
import { chrome, $, $$, waLink, fmtTime } from "./chrome.js";
import { scNow, DAYS, key, WD, MO, WDL, dayLabel, rng, diaries, diary, who, freeAt, availability } from "./slots.js";

chrome();

const STEPS = ["Treatment", "Therapist", "Time", "Your details"];
const S = { step: 0, cat: MENU[0].slug, id: null, opt: 0, staff: "any", day: null, time: null, name: "", phone: "", email: "", note: "", resident: false, done: null };

const q = new URLSearchParams(location.search).get("t");
if (q && find(q)) { const f = find(q); S.id = q; S.cat = f.cat.slug; S.step = 1; }
// from the home page's free times: ?t=<treatment>&d=<yyyy-mm-dd>&at=<minutes> goes straight to your details
const qs = new URLSearchParams(location.search);
if (S.id && qs.get("d") && qs.get("at")) { S.day = qs.get("d"); S.time = +qs.get("at"); S.step = 3; }

/* ---------- Helpers ---------- */
const cur = () => (S.id ? find(S.id) : null);
const mins = () => (cur() ? cur().it.opts[S.opt][0] : 60);
const price = () => (cur() ? cur().it.opts[S.opt][1] : 0);
const len = (m) => (m >= 60 ? `${Math.floor(m / 60)} hr${m % 60 ? " " + (m % 60) + " min" : ""}` : `${m} min`);
const staffName = (ids) => ids.map((i) => STAFF.find((s) => s.id === i).name).join(" and ");
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const valid = () => [!!S.id, true, S.day && S.time != null, S.name.trim().length > 1 && /^[+\d\s]{7,}$/.test(S.phone.trim()) && /^\S+@\S+\.\S+$/.test(S.email.trim())][S.step];
const total = () => (S.resident ? price() * (1 - RESIDENT_OFF) : price());

function nextFree(staffId) {
  const c = cur(); if (!c) return null;
  for (const d of DAYS) { const a = availability(d, c.cat.slug, mins(), staffId); if (a.length) return `${dayLabel(d)}, ${fmtTime(a[0].t)}`; }
  return null;
}

/* ---------- Views ---------- */
function vTreatment() {
  const c = MENU.find((m) => m.slug === S.cat);
  return `<h1 class="vh">Choose a treatment</h1>
  <div class="chips mini" role="tablist" aria-label="Treatment types"><div class="chips-in">${MENU.map((m) => `<button type="button" role="tab" data-cat="${m.slug}" aria-selected="${m.slug === S.cat}">${m.name}</button>`).join("")}</div></div>
  <fieldset class="list"><legend class="sr">${c.name}</legend>
  ${c.items.map((it) => { const on = it.id === S.id; return `
    <label class="pick${on ? " on" : ""}">
      <input type="radio" name="t" value="${it.id}"${on ? " checked" : ""}>
      <span class="pick-main"><b>${it.name}</b>${it.d ? `<small>${it.d}</small>` : ""}</span>
      <span class="pick-side">${it.from ? "from " : ""}${money(it.opts[on ? S.opt : 0][1])}<small>${len(it.opts[on ? S.opt : 0][0])}</small></span>
      ${on && it.opts.length > 1 ? `<span class="lengths" role="radiogroup" aria-label="Length">${it.opts.map((o, i) => `<button type="button" data-opt="${i}" aria-pressed="${i === S.opt}">${it.lab ? it.lab[i] : len(o[0])}<small>${money(o[1])}</small></button>`).join("")}</span>` : ""}
    </label>`; }).join("")}
  </fieldset>`;
}

function vTherapist() {
  const c = cur(), ppl = who(c.cat.slug), couples = c.cat.slug === "couples";
  const card = (id, name, note) => { const nf = nextFree(id); return `
    <label class="pick person${S.staff === id ? " on" : ""}">
      <input type="radio" name="s" value="${id}"${S.staff === id ? " checked" : ""}>
      <span class="avatar" aria-hidden="true">${id === "any" ? "✿" : name[0]}</span>
      <span class="pick-main"><b>${name}</b><small>${note}</small></span>
      <span class="pick-side"><small>Next free</small>${nf || "No times in 3 weeks"}</span>
    </label>`; };
  return `<h1 class="vh">${couples ? "Your therapists" : "Who would you like?"}</h1>
  <p class="hint">${couples ? "A couples treatment needs two therapists at the same time, so we'll show times when both are free." : "Pick someone you know, or take the first free time with anyone."}</p>
  <fieldset class="list"><legend class="sr">Therapist</legend>
    ${card("any", couples ? "Two therapists" : "First available", couples ? "Side by side in the couples room" : "Shows the most times")}
    ${couples ? "" : ppl.map((p) => card(p.id, p.name, p.note)).join("")}
  </fieldset>`;
}

function vTime() {
  const c = cur(), m = mins();
  const days = DAYS.map((d) => ({ d, a: availability(d, c.cat.slug, m, S.staff) }));
  if (!S.day || !days.find((x) => key(x.d) === S.day && x.a.length)) { const f = days.find((x) => x.a.length); S.day = f ? key(f.d) : null; S.time = null; }
  const sel = days.find((x) => key(x.d) === S.day);
  const groups = [["Morning", 0, 720], ["Afternoon", 720, 1020], ["Evening", 1020, 1440]];
  return `<h1 class="vh">Pick a time</h1>
  <p class="hint">${c.it.name}, ${len(m)}${S.staff !== "any" ? ` with ${staffName([S.staff])}` : ""}. Times in Seychelles time.</p>
  <div class="days" role="radiogroup" aria-label="Day">${days.map(({ d, a }) => `
    <button type="button" class="day${key(d) === S.day ? " on" : ""}" data-day="${key(d)}" ${a.length ? "" : "disabled"} aria-pressed="${key(d) === S.day}">
      <small>${WD[d.getDay()]}</small><b>${d.getDate()}</b><small>${a.length ? (a.length < 4 ? "few left" : MO[d.getMonth()]) : "full"}</small>
    </button>`).join("")}</div>
  ${sel ? `<h2 class="dayname">${dayLabel(sel.d, true)}</h2>${groups.map(([g, a, b]) => { const s = sel.a.filter((x) => x.t >= a && x.t < b); return s.length ? `<div class="slotgroup"><h3>${g}</h3><div class="slots">${s.map((x) => `<button type="button" class="slot${S.time === x.t ? " on" : ""}" data-time="${x.t}" data-who="${x.staff.join(",")}" aria-pressed="${S.time === x.t}">${fmtTime(x.t)}</button>`).join("")}</div></div>` : ""; }).join("")}`
  : `<p class="empty">No free times in the next three weeks for this choice. Try "First available", or <a href="${waLink(`Hello Boat House Spa, I'd like to book ${c.it.name}. `)}" target="_blank" rel="noopener">message us on WhatsApp</a>.</p>`}`;
}

function vDetails() {
  const c = cur(), d = DAYS.find((x) => key(x) === S.day);
  return `<h1 class="vh">Your details</h1>
  <div class="recap"><b>${c.it.name}</b><span>${dayLabel(d, true)}, ${fmtTime(S.time)}${S.staff !== "any" ? ` with ${staffName([S.staff])}` : ""}</span><span>${c.it.from ? "from " : ""}${money(total())}${S.resident ? ", with resident discount" : ""}</span><button type="button" data-step="2">Change</button></div>
  <p class="hint">We'll use these to confirm your booking and remind you the day before.</p>
  <div class="fields">
    <label class="field"><span>Name</span><input name="name" autocomplete="name" value="${esc(S.name)}" required></label>
    <label class="field"><span>Mobile</span><input name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="+248" value="${esc(S.phone)}" required></label>
    <label class="field"><span>Email</span><input name="email" type="email" inputmode="email" autocomplete="email" value="${esc(S.email)}" required></label>
    <label class="field"><span>Anything we should know? <i>Optional</i></span><textarea name="note" rows="3" placeholder="Allergies, pregnancy, a nail colour you love">${esc(S.note)}</textarea></label>
    <label class="check"><input type="checkbox" name="resident"${S.resident ? " checked" : ""}><span>I live in Seychelles <small>20% resident discount, please bring your ID</small></span></label>
  </div>
  <p class="small">Need to change or cancel? Reply to your confirmation or WhatsApp us, ideally a day ahead.</p>`;
}

function vDone() {
  const b = S.done;
  return `<div class="done">
    <div class="tick" aria-hidden="true"><svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="24"/><path d="M15 27l7 7 15-16"/></svg></div>
    <h1 class="vh">You're booked, ${esc(b.name.split(" ")[0])}</h1>
    <p class="lede">${b.item} on <b>${b.when}</b>${b.staff ? ` with ${b.staff}` : ""}. A confirmation is on its way to ${esc(b.email)}.</p>
    <dl class="ref"><div><dt>Booking reference</dt><dd>${b.ref}</dd></div><div><dt>To pay at the spa</dt><dd>${money(b.total)}${b.resident ? " <small>with resident discount</small>" : ""}</dd></div></dl>
    <div class="row col">
      <button type="button" class="btn" data-ics>Add to my calendar</button>
      <a class="btn line" href="${b.gcal}" target="_blank" rel="noopener">Add to Google Calendar</a>
      <a class="btn line wa" href="${b.wa}" target="_blank" rel="noopener">Send these details on WhatsApp</a>
    </div>
    <p class="small">Find us on the North Coast Road in Beau Vallon, next to The Boat House restaurant. Please arrive five minutes early for a cold drink.</p>
    <p class="row"><a href="index.html">Back to the home page</a><a href="book.html" data-again>Book something else</a></p>
  </div>`;
}

function summaryHTML() {
  const c = cur();
  if (!c) return `<h2>Your booking</h2><p class="muted">Choose a treatment to start.</p><p class="small">Prefer to message? <a href="${waLink()}" target="_blank" rel="noopener">WhatsApp us</a>.</p>`;
  const d = S.day && DAYS.find((x) => key(x) === S.day);
  return `<h2>Your booking</h2>
  <dl>
    <div><dt>Treatment</dt><dd>${c.it.name}<small>${len(mins())}</small></dd></div>
    <div><dt>Therapist</dt><dd>${S.staff === "any" ? (c.cat.slug === "couples" ? "Two therapists" : "First available") : staffName([S.staff])}</dd></div>
    ${d && S.time != null ? `<div><dt>When</dt><dd>${dayLabel(d, true)}<small>${fmtTime(S.time)}</small></dd></div>` : ""}
    <div><dt>Price</dt><dd>${c.it.from ? "from " : ""}${money(total())}${S.resident ? "<small>after 20% resident discount</small>" : ""}</dd></div>
  </dl>
  <p class="small">Pay at the spa. Prefer to message? <a href="${waText()}" target="_blank" rel="noopener">Send this on WhatsApp</a>.</p>`;
}

function waText() {
  const c = cur(); if (!c) return waLink();
  const d = S.day && DAYS.find((x) => key(x) === S.day);
  return waLink(`Hello Boat House Spa, I'd like to book ${c.it.name} (${len(mins())})${d && S.time != null ? ` on ${dayLabel(d, true)} at ${fmtTime(S.time)}` : ""}${S.staff !== "any" ? ` with ${staffName([S.staff])}` : ""}.${S.name ? ` My name is ${S.name}.` : ""}`);
}

/* ---------- Render ---------- */
const view = $("[data-view]"), bar = $("[data-bar]"), sum = $("[data-summary]"), steps = $("[data-steps]");
function render(focus = false) {
  document.body.classList.toggle("finished", !!S.done);
  document.body.dataset.at = S.done ? "done" : S.step;
  steps.innerHTML = STEPS.map((s, i) => `<li class="${i < S.step ? "past" : i === S.step ? "now" : ""}"${i === S.step ? ' aria-current="step"' : ""}>${i < S.step && !S.done ? `<button type="button" data-step="${i}">${s}</button>` : `<span>${s}</span>`}</li>`).join("");
  view.innerHTML = S.done ? vDone() : [vTreatment, vTherapist, vTime, vDetails][S.step]();
  sum.innerHTML = summaryHTML(); sum.hidden = !!S.done;
  const c = cur();
  bar.hidden = !!S.done;
  bar.innerHTML = `<div class="bar-in">
    ${S.step > 0 ? `<button type="button" class="btn line back" data-back aria-label="Back">Back</button>` : ""}
    <div class="bar-sum">${c ? `<b>${c.it.name}</b><small>${S.step >= 2 && S.time != null ? `${dayLabel(DAYS.find((x) => key(x) === S.day))}, ${fmtTime(S.time)}, ` : ""}${money(total())}</small>` : `<small>Choose a treatment</small>`}</div>
    <button type="button" class="btn" data-next ${valid() ? "" : "aria-disabled=\"true\""}>${S.step === 3 ? "Confirm booking" : "Continue"}</button>
  </div>`;
  if (focus) { const h = $(".vh", view); if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }); } window.scrollTo({ top: 0, behavior: "smooth" }); }
  if (S.step === 2 && !S.done) { const on = $(".day.on", view); if (on) on.scrollIntoView({ inline: "center", block: "nearest" }); }
}

function go(n) { S.step = n; render(true); }
function next() {
  if (!valid()) { flag(); return; }
  if (S.step < 3) go(S.step + 1); else submit();
}
function flag() {
  if (S.step === 3) {
    $$("input[required]", view).forEach((i) => { const bad = i.name === "name" ? S.name.trim().length < 2 : i.name === "phone" ? !/^[+\d\s]{7,}$/.test(S.phone.trim()) : !/^\S+@\S+\.\S+$/.test(S.email.trim()); i.toggleAttribute("aria-invalid", bad); i.closest(".field").classList.toggle("bad", bad); });
    const f = $("[aria-invalid]", view); if (f) f.focus();
  } else {
    const msg = ["Choose a treatment first.", "", "Pick a day and a time first."][S.step];
    let e = $(".err", view); if (!e) { e = document.createElement("p"); e.className = "err"; e.setAttribute("role", "alert"); view.prepend(e); } e.textContent = msg;
  }
}

/* Demo submit. Live: POST to the booking system, wait for its confirmation, then show this screen. */
function submit() {
  const c = cur(), d = DAYS.find((x) => key(x) === S.day), slot = availability(d, c.cat.slug, mins(), S.staff).find((x) => x.t === S.time);
  const who = slot ? staffName(slot.staff) : "";
  const ref = "BH-" + (Date.now() % 46656).toString(36).toUpperCase().padStart(3, "0") + Math.floor(Math.random() * 90 + 10);
  // event times in UTC (Seychelles is UTC+4)
  const startUTC = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 0, S.time - 240)), endUTC = new Date(startUTC.getTime() + mins() * 60000);
  const z = (t) => t.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const title = `${c.it.name} at Boat House Spa`, where = "Boat House Spa, North Coast Road, Beau Vallon, Mahé, Seychelles";
  const details = `Booking ${ref}. ${len(mins())}${who ? " with " + who : ""}. Call 4247466 or WhatsApp +248 2734734 to change.`;
  S.done = {
    name: S.name, email: S.email, ref, item: c.it.name, staff: who, resident: S.resident, total: total(),
    when: `${dayLabel(d, true)} at ${fmtTime(S.time)}`,
    ics: ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Boat House Spa//Booking//EN", "BEGIN:VEVENT", `UID:${ref}@boathousespa.sc`, `DTSTAMP:${z(new Date())}`, `DTSTART:${z(startUTC)}`, `DTEND:${z(endUTC)}`, `SUMMARY:${title}`, `LOCATION:${where.replace(/,/g, "\\,")}`, `DESCRIPTION:${details.replace(/,/g, "\\,")}`, "BEGIN:VALARM", "TRIGGER:-PT2H", "ACTION:DISPLAY", "DESCRIPTION:Boat House Spa in 2 hours", "END:VALARM", "END:VEVENT", "END:VCALENDAR"].join("\r\n"),
    gcal: `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${z(startUTC)}/${z(endUTC)}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(where)}`,
    wa: waLink(`Hello Boat House Spa, I've just booked online: ${c.it.name} on ${dayLabel(d, true)} at ${fmtTime(S.time)}${who ? " with " + who : ""}. Reference ${ref}. Name: ${S.name}.`),
  };
  render(true);
}

/* ---------- Events ---------- */
const form = $("[data-form]");
form.addEventListener("submit", (e) => { e.preventDefault(); next(); });
document.addEventListener("click", (e) => {
  const t = e.target;
  if (t.closest("[data-next]")) return next();
  if (t.closest("[data-back]")) return go(Math.max(0, S.step - 1));
  const st = t.closest("[data-step]"); if (st) return go(+st.dataset.step);
  const ct = t.closest("[data-cat]"); if (ct) { S.cat = ct.dataset.cat; return render(); }
  const op = t.closest("[data-opt]"); if (op) { e.preventDefault(); S.opt = +op.dataset.opt; S.time = null; return render(); }
  const dy = t.closest("[data-day]"); if (dy && !dy.disabled) { S.day = dy.dataset.day; S.time = null; return render(); }
  const sl = t.closest("[data-time]"); if (sl) { S.time = +sl.dataset.time; render(); if (matchMedia("(max-width: 900px)").matches) $("[data-next]").focus({ preventScroll: true }); return; }
  if (t.closest("[data-ics]")) {
    const blob = new Blob([S.done.ics], { type: "text/calendar" }), a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "boat-house-spa-booking.ics"; document.body.appendChild(a); a.click(); a.remove();
    return;
  }
  if (t.closest("[data-again]")) { e.preventDefault(); Object.assign(S, { step: 0, id: null, opt: 0, staff: "any", day: null, time: null, done: null }); render(true); }
});
form.addEventListener("change", (e) => {
  const t = e.target;
  if (t.name === "t") { if (S.id !== t.value) { S.id = t.value; S.opt = 0; S.time = null; S.day = null; S.staff = "any"; } render(); }
  else if (t.name === "s") { S.staff = t.value; S.time = null; S.day = null; render(); }
  else if (t.name === "resident") { S.resident = t.checked; sum.innerHTML = summaryHTML(); render(); }
});
form.addEventListener("input", (e) => {
  const t = e.target; if (!["name", "phone", "email", "note"].includes(t.name)) return;
  S[t.name] = t.value; t.removeAttribute("aria-invalid"); t.closest(".field")?.classList.remove("bad");
  const n = $("[data-next]"); if (valid()) n.removeAttribute("aria-disabled"); else n.setAttribute("aria-disabled", "true");
});

render();
