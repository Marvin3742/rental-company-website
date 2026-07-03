// ─────────────────────────────────────────────────────────────────────────────
// SEED DATA — the initial catalog, used ONLY by prisma/seed.mjs on `npm run db:seed`.
//
// The live site does NOT read this file. Products and packages are served from the
// database and managed in /admin, so editing values here does NOT change the site.
//
// Re-running the seed upserts by slug/id and will OVERWRITE admin edits for matching
// items back to these values — treat this as "factory defaults", not live content.
//
// Physical stock counts and each package's bill-of-materials live in
// prisma/seed-stock.json (also owner-input before go-live).
// ─────────────────────────────────────────────────────────────────────────────

// ─── Packages ─────────────────────────────────────────────────────────────────
// Each package needs: id, name, price (number), image, includes[]
export const packages = [
  {
    id: "Package_1",
    name: "Package #1",
    price: 910,
    image: "/images/packages/essentials-plus.webp",
    includes: [
      "20×30 Premium frame tent",
      "9 Tables",
      "72 chairs",
      "18ft Waterslide",
      "Delivery & setup included",
    ],
  },
  {
    id: "Package_2",
    name: "Package #2",
    price: 575,
    image: "/images/packages/essentials.webp",
    includes: [
      "20×30 Premium frame tent",
      "9 Tables",
      "72 Chairs",
      "Delivery & setup included",
    ],
  },
  {
    id: "Package_3",
    name: "Package #3",
    price: 775,
    image: "/images/packages/essentials-plus.webp",
    includes: [
      "20×20 Premium frame tent",
      "6 Tables",
      "45 Chairs",
      "18ft Waterslide",
      "Delivery & setup included",
    ],
  },
  {
    id: "Package_4",
    name: "Package #4",
    price: 450,
    image: "/images/packages/essentials.webp",
    includes: [
      "20×20 Premium frame tent",
      "6 Tables",
      "45 Chairs",
      "Delivery & setup included",
    ],
  },
];

// ─── Individual inventory items ───────────────────────────────────────────────
// unit: "each" → price per piece  |  unit: "day" → flat daily price
// images: array of photo paths shown in a click-through carousel on the rentals page
// description: short paragraph shown next to the photos
// details: bullet points (dimensions, capacity, setup notes, etc.)
export const inventory = [
  {
    id: "baja-splash-18ft",
    name: "18FT Baja Splash Dual Lane Waterslide",
    price: 350,
    unit: "day",
    image: "/images/inventory/slide2.webp",
    images: ["/images/inventory/slide2.webp", "/images/inventory/slide3.webp", "/images/inventory/slide1.webp"],
    description: "32.5ft L x 19ft W x 18ft H",
    details: ["Requires water & power source to be within 70 ft", "Setup & breakdown included"],
  },
  {
    id: "tent20x30",
    name: "20×30 Premium Frame Tent",
    price: 350,
    unit: "day",
    image: "/images/inventory/tent1.webp",
    images: ["/images/inventory/tent1.webp", "/images/inventory/20x30seating.jpg"],
    description: "600 sqft tent, seating for up to 76 guests. Setup & breakdown included.",
    details: ["Tent lighting add-on available"],
  },
  {
    id: "tent20x20",
    name: "20×20 Premium Frame Tent",
    price: 300,
    unit: "day",
    image: "/images/inventory/tent2.webp",
    images: ["/images/inventory/tent2.webp", "/images/inventory/20x20seating1.webp", "/images/inventory/20x20seating2.webp", "/images/inventory/20x20seating3.webp"],
    description: "400 sqft tent, seating for up to 54 guests. Setup & breakdown included.",
    details: ["Tent lighting add-on available"],
  },
  {
    id: "table8",
    name: "8FT White Folding Table",
    price: 12,
    unit: "each",
    image: "/images/inventory/table.webp",
    images: ["/images/inventory/table.webp"],
    description: "Rectangular 8ft folding table, seats 8-10 guests.",
    details: ["Seats 8", "96in x 30in", "Linens add-on available"],
  },
  {
    id: "table6",
    name: "6FT White Folding Table",
    price: 10,
    unit: "each",
    image: "/images/inventory/table.webp",
    images: ["/images/inventory/table.webp"],
    description: "Rectangular 6ft folding table, seats 6-8 guests.",
    details: ["Seats 6", "72in x 30in", "Linens add-on available"],
  },
  {
    id: "chair",
    name: "Plastic Folding Chairs",
    price: 2.75,
    unit: "each",
    image: "/images/inventory/chair.webp",
    images: ["/images/inventory/chair.webp"],
    description: "White plastic folding chairs.",
    details: [],
  },
];
