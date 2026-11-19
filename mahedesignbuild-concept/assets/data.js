/* Projects, testimonials and contact details. Text, years, architects and engineers are from mahedesignbuild.com (read 2026-11-18).
   Photos are their own archive photos from that site (2007–2010). Ask permission before going live. */
export const CONTACT = {
  phone: "+248 4 322 762", tel: "+2484322762",
  email: "info@mahedesignbuild.com",
  address: "East Coast Road, Victoria, Mahé, Seychelles",
  hours: "Monday to Saturday, 8am to 5pm",
  map: "https://www.google.com/maps/search/?api=1&query=8FXG%2BR23+Victoria+Seychelles",
};

export const SECTORS = [
  { id: "resort", name: "Resort" },
  { id: "villa", name: "Private villa" },
  { id: "commercial", name: "Commercial" },
  { id: "industrial", name: "Industrial" },
  { id: "community", name: "Community" },
];

const ph = (stem, n) => n.map((i) => `${stem}-${i}`);

export const PROJECTS = [
  { slug: "seypec-admin-building", name: "Seypec Admin Building", sector: "commercial", year: "2010",
    client: "Seychelles Petroleum Company", scope: "Design and build of the company's administration building.",
    team: [["Architect", "Frichot Associates"], ["Structural engineer", "JPA"], ["Project manager", "Elvis Didon"], ["Quantity surveyor", "Lester Quatre"]],
    cover: "seypec-admin-building-1", photos: ph("seypec-admin-building", [1, 2, 4, 5, 3, 6]) },
  { slug: "ice-pro-warehouse", name: "Ice Pro Warehouse (Mamma Mia)", sector: "industrial", year: "2010",
    client: "Ice Pro", scope: "Factory building at Providence.",
    team: [["Architect", "V. Ah-Time"], ["Structural engineer", "Philippe Adrienne"]],
    cover: "ice-pro-warehouse-2", photos: ph("ice-pro-warehouse", [2, 1, 4, 3]) },
  { slug: "puc-hangar", name: "PUC Hangar", sector: "industrial", year: "2010",
    client: "Public Utilities Corporation", scope: "Steel-framed open hangar.",
    team: [],
    cover: "puc-hangar-4", photos: ph("puc-hangar", [4, 1, 3, 2]) },
  { slug: "lemuria-resort", name: "Lemuria Rooms Renovations", sector: "resort", year: "2009–2010",
    client: "Lemuria Resort, Praslin", scope: "Various types and scale of projects, from back-of-house facilities and building services to pool and villa decks and new facilities.",
    team: [["Architect", "Jean-Marc Eynaud"], ["Structural engineer", "JPA"]],
    cover: "lemuria-resort-4", photos: ph("lemuria-resort", [4, 1, 2, 3]) },
  { slug: "lemuria-restaurant-and-pool-deck", name: "Lemuria Restaurant and Pool Deck", sector: "resort", year: "2009",
    client: "Lemuria Resort, Praslin", scope: "Restaurant and pool deck.",
    team: [["Architect", "Jean-Marc Eynaud"], ["Structural engineer", "JPA"]],
    cover: "lemuria-restaurant-and-pool-deck-5", photos: ph("lemuria-restaurant-and-pool-deck", [5, 1, 4, 6, 2, 3, 7]) },
  { slug: "lemuria-kids-club", name: "Lemuria Kids Club", sector: "resort", year: "2007",
    client: "Lemuria Resort, Praslin", scope: "A new kids club building.",
    team: [["Architect", "Jean-Marc Eynaud"], ["Structural engineer", "JPA"]],
    cover: "lemuria-kids-club-3", photos: ph("lemuria-kids-club", [3, 1, 4, 2]) },
  { slug: "val-mer-resort", name: "Val Mer Resort, Phase 2", sector: "resort", year: "2007",
    client: "Val Mer Resort", scope: "Addition of guest villas, restaurant, swimming pool and infrastructure.",
    team: [["Architect", "Tirant Associates"], ["Structural engineer", "F&D"]],
    cover: "val-mer-resort-2", photos: ph("val-mer-resort", [2, 6, 5, 3, 1, 4]) },
  { slug: "anse-soleil-resort", name: "Anse Soleil Resort", sector: "resort", year: "2007",
    client: "Anse Soleil Resort", scope: "Resort building.",
    team: [["Architect", "Klaus Kuehn"], ["Structural engineer", "F&D"]],
    cover: "anse-soleil-bc-1", photos: ph("anse-soleil-bc", [1, 2, 3]) },
  { slug: "mountain-villa", name: "Mountain Villa", sector: "villa", year: "2009",
    client: "Private client", scope: "Luxury mountainside villa in the south of Mahé.",
    team: [["Architect", "Frichot Associates"], ["Structural engineer", "JPA"]],
    cover: "mountain-villa-3", photos: ph("mountain-villa", [3, 2, 5, 4]) },
  { slug: "seaside-villa", name: "Seaside Villa", sector: "villa", year: "2008",
    client: "Private client", scope: "Luxury seaside villa in the north of Mahé.",
    team: [["Architect", "Klaus Kuehn"], ["Structural engineer", "Charles Pool"]],
    cover: "seaside-villa-2", photos: ph("seaside-villa", [2, 1, 3, 4, 5]) },
  { slug: "anse-francois-housing", name: "Anse François Housing", sector: "community", year: "2008",
    client: "Social housing programme", scope: "New two and three bedroom social housing, with infrastructure.",
    team: [],
    cover: "anse-francois-housing-5", photos: ph("anse-francois-housing", [5, 1, 2, 3, 4, 6]) },
  { slug: "st-joseph-church", name: "St Joseph Church Renovations", sector: "community", year: "2008",
    client: "St Joseph Church", scope: "Renovation of the church.",
    team: [],
    cover: "st-joseph-church-1", photos: ph("st-joseph-church", [1, 3, 2]) },
];

/* Recent work: no photos yet, shown as a drawing card. Reported publicly (JOBO.sc). Confirm wording with them. */
export const NOW = { name: "Seychelles Pension Fund building", role: "Building contractor", note: "Tender awarded in 2026. Under way." };

export const QUOTES = [
  { q: "A remarkable aspect of our project was the good workmanship standard. We have no problem recommending Mahé Design & Build for similar construction, as we are confident they will deliver accordingly.",
    who: "Ray Hoareau", role: "Assistant General Manager, Seychelles Petroleum Company" },
  { q: "They always finish the projects at Lemuria Resort on time and with good results. I highly recommend Mahé Design & Build for any project one may have.",
    who: "Rajan Chetty", role: "Preventive Maintenance Manager, Lemuria Resort" },
  { q: "A highly cooperative and reliable team of workers who displayed a good attitude during the entire project.",
    who: "Michelle Bedier", role: "Director, Pirogue Restaurant" },
  { q: "The quality of material used and workmanship was of a good standard. I can confidently recommend them as a solid and reliable company for future works.",
    who: "K. Arnephy", role: "Project Manager, Ministry of Land Use and Habitat, Project Implementation Unit" },
];

export const ARCHITECTS = ["Jean-Marc Eynaud", "Frichot Associates", "Tirant Associates", "Klaus Kuehn"];
