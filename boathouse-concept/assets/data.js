/* Boat House Spa: treatments and prices from their own price menu and hair menu (Facebook, 25 Sep 2026).
   Prices in SCR. `opts` = the lengths you can book, each [minutes, price]. Lengths marked `est` aren't on their menu (our guess, to confirm). */

export const PHONE = "+2484247466", PHONE_TXT = "4 247 466";
export const WA = "2482734734", WA_TXT = "2 734 734";
export const EMAIL = "boathouse.sey@gmail.com";
export const FB = "https://www.facebook.com/boathousespaseychelles/";
export const IG = "https://www.instagram.com/boathouse_spa_seychelles/";
export const MAP = "https://www.google.com/maps/search/?api=1&query=Boat+House+Spa+Beau+Vallon+Seychelles";

// opening hours by weekday (0 = Sunday), minutes from midnight
export const HOURS = { 0: [570, 1050], 1: [615, 1155], 2: [615, 1155], 3: [615, 1155], 4: [615, 1155], 5: [615, 1155], 6: [615, 1155] };
export const HOURS_TXT = [["Monday to Saturday", "10.15 am to 7.15 pm"], ["Sunday", "9.30 am to 5.30 pm"]];

export const STAFF = [
  { id: "tina", name: "Tina", does: ["massage", "nails", "facials", "waxing", "couples"], note: "Massage, nails" },
  { id: "samantha", name: "Samantha", does: ["massage", "facials", "waxing", "nails", "couples"], note: "Massage, facials" },
  { id: "jacky", name: "Jacky", does: ["hair"], note: "Hair & barber" },
];

export const MENU = [
  { slug: "massage", name: "Massage", photo: "balinese", line: "Sixty or ninety minutes, oils warmed, the jungle outside the glass.", items: [
    { id: "boathouse", name: "Boat House Massage", d: "Our signature full body massage.", opts: [[60, 1000], [90, 1300]] },
    { id: "balinese", name: "Balinese Massage", d: "Gentle stretching, kneading and targeted pressure.", opts: [[60, 1075], [90, 1375]] },
    { id: "hotstone", name: "Hot Stone Massage", d: "Warm stones to ease deep tension.", opts: [[60, 1075], [90, 1375]] },
    { id: "aroma", name: "Aromatherapy Massage", d: "Soft pressure with essential oils.", opts: [[60, 1075], [90, 1375]] },
    { id: "deep", name: "Deep Tissue Massage", d: "Firm pressure for tight muscles.", opts: [[60, 1075], [90, 1375]] },
    { id: "mother", name: "Mother to be Massage", d: "Comfortable, supported pregnancy massage.", opts: [[60, 1000], [90, 1300]] },
    { id: "head", name: "Indian Head Massage", d: "Scalp, neck and shoulders.", opts: [[45, 825]] },
    { id: "bns", name: "Back, Neck & Shoulder Massage", d: "Where the desk week sits.", opts: [[30, 625], [45, 825], [60, 975]] },
    { id: "footleg", name: "Foot & Leg Massage", d: "For legs that have walked the beach all day.", opts: [[30, 625], [45, 825], [60, 975]] },
    { id: "reflex", name: "Reflexology", d: "Pressure points on the feet.", opts: [[30, 650], [45, 850]] },
    { id: "scrub", name: "Full Body Scrub", d: "Polishes away dead skin and brings back your glow.", opts: [[45, 700]], est: true },
  ] },
  { slug: "nails", name: "Manicure & pedicure", photo: "nails-green", line: "A cart of colours to choose from and a cold drink while they dry.", items: [
    { id: "cmani", name: "Classic Manicure", d: "Shape, cuticles, polish.", opts: [[45, 600]], est: true },
    { id: "cpedi", name: "Classic Pedicure", d: "Soak, scrub, shape, polish.", opts: [[60, 700]], est: true },
    { id: "xmp", name: "Express Mani or Pedi", d: "Shape and polish, quickly.", opts: [[30, 375]], est: true },
    { id: "gmani", name: "Full Gel Manicure", d: "Gel colour that lasts.", opts: [[60, 700]], est: true },
    { id: "gpedi", name: "Full Gel Pedicure", d: "Full pedicure with gel colour.", opts: [[75, 800]], est: true },
    { id: "xgel", name: "Express Gel Mani or Pedi", d: "Gel colour, no fuss.", opts: [[45, 500]], est: true },
    { id: "mmani", name: "Men's Manicure", d: "Tidy, buffed, no polish.", opts: [[40, 550]], est: true },
    { id: "mpedi", name: "Men's Pedicure", d: "Soak, scrub and tidy.", opts: [[40, 500]], est: true },
    { id: "soak", name: "Gel Soak Off", d: "Safe removal of old gel.", opts: [[20, 275]], est: true, addon: true },
  ] },
  { slug: "facials", name: "Facials", photo: "facial", line: "Cleanse, exfoliate, hydrate. Your skin comes back to itself.", items: [
    { id: "cfacial", name: "Classic Facial", d: "A full hour of cleansing, exfoliation and hydration.", opts: [[60, 850]] },
    { id: "xfacial", name: "Express Facial", d: "A thirty minute pick-me-up.", opts: [[30, 600]] },
  ] },
  { slug: "couples", name: "For two", photo: "couples-room", line: "Two tables side by side, one shared hour.", items: [
    { id: "cmassage", name: "Couples Full Body Massage", d: "A relaxing 60 minute massage, side by side. Price for two.", opts: [[60, 1850]] },
    { id: "bodysoul", name: "Body & Soul for two", d: "Full body scrub, then a full body massage. Price for two.", opts: [[60, 3100]] },
  ] },
  { slug: "waxing", name: "Waxing & brows", photo: "wax", line: "Quick, careful, done.", items: [
    { id: "brow", name: "Eyebrow Shape", opts: [[15, 150]], est: true },
    { id: "tint", name: "Brow Tint", opts: [[15, 150]], est: true },
    { id: "shapetint", name: "Brow Shape & Tint", opts: [[30, 250]], est: true },
    { id: "lip", name: "Lip or Chin", opts: [[15, 150]], est: true },
    { id: "under", name: "Underarm", opts: [[15, 275]], est: true },
    { id: "arm", name: "Half or Full Arm", opts: [[20, 300], [30, 400]], est: true, lab: ["Half", "Full"] },
    { id: "leg", name: "Half or Full Leg", opts: [[30, 300], [45, 500]], est: true, lab: ["Half", "Full"] },
    { id: "back", name: "Back or Chest", opts: [[30, 475]], est: true },
    { id: "holly", name: "Hollywood", opts: [[30, 600]], est: true },
    { id: "bikini", name: "Bikini", opts: [[20, 275]], est: true },
  ] },
  { slug: "hair", name: "Hair & barber", photo: "arrive", line: "Cuts, colour and blow-dries for the whole family.", items: [
    { id: "mcut", name: "Men's Cut", opts: [[30, 250]], est: true },
    { id: "kcut", name: "Kid's Cut", opts: [[30, 175]], est: true },
    { id: "beard", name: "Beard Shape", opts: [[15, 150]], est: true },
    { id: "dcut", name: "Dry Cut", opts: [[30, 250]], est: true },
    { id: "wcut", name: "Wash & Cut", opts: [[45, 350]], est: true },
    { id: "wbd", name: "Wash & Blow Dry", from: true, opts: [[45, 450]], est: true, d: "From SCR 450, up to 900 for long hair." },
    { id: "wcbd", name: "Wash, Cut & Blow Dry", from: true, opts: [[60, 550]], est: true, d: "From SCR 550, up to 1,000 for long hair." },
    { id: "root", name: "Root Touch Up", opts: [[90, 600]], est: true },
    { id: "colour", name: "Hair Colour", from: true, opts: [[120, 650]], est: true, d: "From SCR 650 (short) to 1,050 (long)." },
    { id: "hhalf", name: "Highlights, half head", from: true, opts: [[120, 750]], est: true, d: "From SCR 750 to 1,150." },
    { id: "hfull", name: "Highlights, full head", from: true, opts: [[150, 950]], est: true, d: "From SCR 950 to 1,350." },
    { id: "keratin", name: "Keratin Treatment", from: true, opts: [[180, 2500]], est: true, d: "From SCR 2,500 to 4,000." },
    { id: "updo", name: "Up Do", opts: [[60, 550]], est: true },
    { id: "htreat", name: "Hair Treatment", from: true, opts: [[45, 400]], est: true, d: "SCR 400, 500 or 600 by length." },
  ] },
];

export const RESIDENT_OFF = 0.2;
export const money = (n) => "SCR " + Math.round(n).toLocaleString("en-GB");
export const find = (id) => { for (const c of MENU) for (const it of c.items) if (it.id === id) return { cat: c, it }; return null; };
export const fromPrice = (c) => Math.min(...c.items.filter((i) => !i.addon).flatMap((i) => i.opts.map((o) => o[1])));
