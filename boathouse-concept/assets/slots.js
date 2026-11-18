/* Sample availability shared by the booking page and the home page's free-times list. Replace with the live booking system. */
import { STAFF, HOURS } from "./data.js";

/* ---------- Dates in Seychelles time (UTC+4) ---------- */
export const scNow = () => { const n = new Date(); return new Date(n.getTime() + (n.getTimezoneOffset() + 240) * 60000); };
export const DAYS = (() => { const n = scNow(), out = []; for (let i = 0; i < 21; i++) { const d = new Date(n.getFullYear(), n.getMonth(), n.getDate() + i); out.push(d); } return out; })();
export const key = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], MO = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const WDL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const dayLabel = (d, long) => (long ? `${WDL[d.getDay()]} ${d.getDate()} ${MO[d.getMonth()]}` : `${WD[d.getDay()]} ${d.getDate()} ${MO[d.getMonth()]}`);

/* ---------- Sample availability ----------
   Each therapist's diary is filled at random in 15 minute units, busier in the next few days (they say to book
   1-2 weeks ahead). Start times are offered every 30 minutes from opening, if the whole treatment fits. */
export function rng(seed) { let h = 2166136261; for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 10000) / 10000; }; }
export const diaries = {};
export function diary(staff, d) {
  const k = staff + key(d); if (diaries[k]) return diaries[k];
  const [o, c] = HOURS[d.getDay()], n = Math.ceil((c - o) / 15), busy = new Array(n).fill(false);
  const ahead = Math.round((d - DAYS[0]) / 864e5), fill = ahead <= 2 ? 0.86 : ahead <= 6 ? 0.68 : ahead <= 13 ? 0.42 : 0.2;
  const r = rng(k);
  for (let i = 0; i < n;) { const len = 4 + Math.floor(r() * 3) * 2; if (r() < fill) for (let j = i; j < Math.min(n, i + len); j++) busy[j] = true; i += len; }
  if (staff === "jacky" && d.getDay() === 0) busy.fill(true); // say: hair is closed on Sundays (to confirm)
  return (diaries[k] = { o, c, busy });
}
export const who = (catSlug) => STAFF.filter((s) => s.does.includes(catSlug));
export function freeAt(staff, d, start, mins) {
  const D = diary(staff, d), a = (start - D.o) / 15, b = a + Math.ceil(mins / 15);
  if (start + mins > D.c) return false;
  for (let i = a; i < b; i++) if (D.busy[i]) return false;
  return true;
}
// minutes from midnight of each bookable start on day d, and which therapist would take it
export function availability(d, catSlug, mins, staffPick) {
  const [o, c] = HOURS[d.getDay()], out = [], now = scNow();
  const today = key(d) === key(now), earliest = today ? now.getHours() * 60 + now.getMinutes() + 60 : 0;
  const pool = staffPick === "any" ? who(catSlug) : who(catSlug).filter((s) => s.id === staffPick);
  for (let t = o; t + mins <= c; t += 30) {
    if (t < earliest) continue;
    if (catSlug === "couples") { const f = pool.filter((s) => freeAt(s.id, d, t, mins)); if (f.length >= 2) out.push({ t, staff: f.slice(0, 2).map((s) => s.id) }); continue; }
    const f = pool.find((s) => freeAt(s.id, d, t, mins)); if (f) out.push({ t, staff: [f.id] });
  }
  return out;
}

