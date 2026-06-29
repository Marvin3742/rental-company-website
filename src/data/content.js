// ─────────────────────────────────────────────────────────────────────────────
// SITE CONTENT — edit everything here.
// Changes made in this file update the whole website automatically.
// ─────────────────────────────────────────────────────────────────────────────


// ─── Feature flags ────────────────────────────────────────────────────────────

export const features = {
  showGallery: false,  
};


// ─── Business info ────────────────────────────────────────────────────────────

export const business = {
  name: "Solimar Event Rentals",
  tagline: "Family-owned event rentals in the Naples, FL area",
  phone: "239-778-3742",
  email: "SolimarEventRentals88@gmail.com",
  Facebook: "https://www.facebook.com/profile.php?id=61590500376097",
  serviceAreas: ["Naples", "Bonita Springs", "Marco Island"],
  hours: "Mon–Sat, 8am–7pm",
  city: "Naples, FL",
};


// ─── Navigation ───────────────────────────────────────────────────────────────

export const nav = {
  links: [
    { to: "/",        label: "Home",       end: true },
    { to: "/rentals", label: "Rent" },
    { to: "/about",   label: "About & FAQ" },
    { to: "/gallery", label: "Gallery" },
  ],
};


// ─── Hero (home page banner) ──────────────────────────────────────────────────

export const hero = {
  titleLine1:   "Solimar Event",
  titleAccent:  "Rentals",
  subtitle:     "Family-owned event rentals serving the Naples, FL area. Tents, tables, chairs, and inflatables — delivered and set up for you.",
  primaryCta:   "Call to Book",
  secondaryCta: "View Rentals",
};


// ─── Home — Featured Packages section ────────────────────────────────────────

export const featuredPackagesSection = {
  title:      "Event packages",
  subtitle:   "Includes delivery and setup.",
  altLinkText: "Individual rentals →",
};


// ─── Home — Gallery Preview section ──────────────────────────────────────────

export const galleryPreviewSection = {
  title:    "Recent setups",
  subtitle: "A look at real events we've helped families host across Naples, FL.",
  cta:      "Full gallery →",
};


// ─── Rentals page ─────────────────────────────────────────────────────────────

export const rentalsPage = {
  seo: {
    title:       "Event Rentals & Packages | Naples, Bonita Springs, Marco Island",
    description: "Browse our event rental packages and individual items. Tents, tables, chairs, and bounce houses with delivery and setup included.",
  },
  packagesSection: {
    title:    "Packages",
    subtitle: "Save 10% when you book one of our packages.",
  },
  itemsSection: {
    title:   "Tents, Chairs, Tables, and Inflatables",
  },
  reminder: {
    heading: "Packages include delivery and setup.",
  },
};


// ─── About & FAQ page ─────────────────────────────────────────────────────────

export const about = {
  seo: {
    description:
      "Learn about Solimar Event Rentals and find answers to common questions about booking, delivery, payment, weather, and safety.",
  },
  eyebrow: "About Us",
  headline: "Event rentals for local families and events.",
  paragraphs: [
    "Solimar Event Rentals is a family-owned business based in Naples, Florida. We provide tents, tables, chairs, inflatables, and other essentials for parties and events.",
    "We serve Naples, Bonita Springs, and Marco Island. We handle delivery, setup, and pickup so you don't have to worry about the equipment.",
    "Our focus is simple: reliable service, fair pricing, and making party planning a little easier.",
  ],
  closer: "",
};

export const faqSection = {
  eyebrow:          "Questions & policies",
  title:            "Frequently Asked Questions",
};


// ─── Gallery page ─────────────────────────────────────────────────────────────

export const galleryPage = {
  seo: {
    description: "A look at real parties and events we've set up across Naples, Bonita Springs, and Marco Island.",
  },
  eyebrow: "Past events",
  title:   "Gallery",
  cta:     "See something you'd love for your party?",
};


// ─── Footer ───────────────────────────────────────────────────────────────────

export const footer = {
  serviceAreaSuffix: ", FL",
  bottomCta:       "Call us to book",  // phone is appended after a dash
};


// ─── Packages ─────────────────────────────────────────────────────────────────
// Each package needs: id, name, price (number), badge, tagline, image, includes[]

export const packages = [
  {
    id:      "Package_1",
    name:    "Package #1",
    price:   910,
    image:   "/images/packages/essentials-plus.jpg",
    includes: [
      "20×30 Premium frame tent",
      "9 Tables",
      "72 chairs",
      "18ft Waterslide",
      "Delivery & setup included",
    ],
  },
  {
    id:      "Package_2",
    name:    "Package #2",
    price:   575,
    image:   "/images/packages/essentials.jpg",
    includes: [
      "20×30 Premium frame tent",
      "9 Tables",
      "72 Chairs",
      "Delivery & setup included",
    ],
  },
    {
    id:      "Package_3",
    name:    "Package #3",
    price:   775,
    image:   "/images/packages/essentials-plus.jpg",
    includes: [
      "20×20 Premium frame tent",
      "6 Tables",
      "45 Chairs",
      "18ft Waterslide",
      "Delivery & setup included",
    ],
  },
  {
    id:      "Package_4",
    name:    "Package #4",
    price:   450,
    image:   "/images/packages/essentials.jpg",
    includes: [
      "20×20 Premium frame tent",
      "6 Tables",
      "45 Chairs",
      "Delivery & setup included",
    ],
  },
];


// ─── FAQs ─────────────────────────────────────────────────────────────────────
// Categories control tab order. Each FAQ needs a matching category string.

export const faqCategories = [
  "Booking",
  "Delivery & Setup",
  "Payment",
  "Cancellation & Weather",
  "Inflatable & Tent Safety",
  "Damage",
];

export const faqs = [
  {
    category: "Booking",
    question:  "How do I book a rental?",
    answer:    "You can reach us at 239-778-3742. Text is preferred.",
  },
  {
    category: "Delivery & Setup",
    question:  "Is delivery included?",
    answer:    "We deliver throughout Naples, Bonita Springs, and Marco Island. Small orders or addresses outside this area require a small delivery fee",
  },
  {
    category: "Delivery & Setup",
    question:  "How long does setup take?",
    answer:    "Between 40-60 minutes",
  },
  {
    category: "Payment",
    question:  "What payment methods do you accept?",
    answer:    "Cash, Zelle, Apple Pay, and major credit cards.",
  },
  {
    category: "Payment",
    question:  "Is a deposit required?",
    answer:    "Yes",
  },
  {
    category: "Cancellation & Weather",
    question:  "What's your cancellation policy?",
    answer:    "Cancellations more than 7 days before your event are refunded in full. Closer than that, we'll happily apply your deposit towards a future booking.",
  },


];


// ─── Individual inventory items ───────────────────────────────────────────────
// unit: "each" → price per piece  |  unit: "day" → flat daily price

// images: array of photo paths shown in a click-through carousel on the rentals page
// description: short paragraph shown next to the photos
// details: bullet points of practical/important info (dimensions, capacity, setup notes, etc.)
export const inventory = [
  {
    id: "waterslide",
    name: "18FT Baja Splash Waterslide",
    price: 350,
    unit: "day",
    image: "/images/inventory/slide2.jpg",
    images: ["/images/inventory/slide2.jpg", "/images/inventory/slide3.png", "/images/inventory/slide1.png"],
    description: "32.5ft L x 19ft W x 18ft H",
    details: ["Requires water & power source to be within 70 ft", "Setup & breakdown included"],
  },
    {
    id: "tent20x30",
    name: "20×30 Premium Frame Tent",
    price: 350,
    unit: "day",
    image: "/images/inventory/tent1.png",
    images: ["/images/inventory/tent1.png", "/images/inventory/20x30seating.jpg"],
    description: "600 sqft tent, seating for up to 76 guests. Setup & breakdown included.",
    details: ["Tent lighting add-on available"],
  },
  {
    id: "tent20x20",
    name: "20×20 Premium Frame Tent",
    price: 300,
    unit: "day",
    image: "/images/inventory/tent2.png",
    images: ["/images/inventory/tent2.png", "/images/inventory/20x20seating1.jpg", "/images/inventory/20x20seating2.jpg", "/images/inventory/20x20seating3.jpg"],
    description: "400 sqft tent, seating for up to 54 guests. Setup & breakdown included.",
    details: ["Tent lighting add-on available"],
  },
  {
    id: "table8",
    name: "8FT White Folding Table",
    price: 12,
    unit: "each",
    image: "/images/inventory/table.jpg",
    images: ["/images/inventory/table.jpg"],
    description: "Rectangular 8ft folding table, seats up to 8 guests.",
    details: ["Seats 8", "96in x 30in", "Linens add-on available"],
  },
  {
    id: "table6",
    name: "6FT White Folding Table",
    price: 10,
    unit: "each",
    image: "/images/inventory/table.jpg",
    images: ["/images/inventory/table.jpg"],
    description: "Rectangular 6ft folding table, seats up to 6 guests.",
    details: ["Seats 6", "72in x 30in", "Linens add-on available"],
  },
  {
    id: "chair",
    name: "Plastic Folding Chair",
    price: 2.75,
    unit: "each",
    image: "/images/inventory/chair.jpg",
    images: ["/images/inventory/chair.jpg"],
    description: "White plastic folding chairs.",
    details: [],
  }
];


// ─── Gallery images ───────────────────────────────────────────────────────────
// Drop images in /public/images/gallery/ then add an entry below.
// Use descriptive alt text — it helps with SEO.

export const gallery = [
  { src: "/images/gallery/01.jpg", alt: "Backyard birthday party with white tent and tables in Naples",  category: "Birthday"    },
  { src: "/images/gallery/02.jpg", alt: "Bounce house setup at a kids' birthday party",                  category: "Birthday"    },
  { src: "/images/gallery/03.jpg", alt: "School event with rows of folding chairs under a tent",         category: "School"      },
  { src: "/images/gallery/04.jpg", alt: "Tables set up for a backyard graduation celebration",           category: "Graduation"  },
  { src: "/images/gallery/05.jpg", alt: "20x30 tent installation for a community gathering",             category: "Community"   },
  { src: "/images/gallery/06.jpg", alt: "Church event tables and chairs under a tent",                   category: "Church"      },
  { src: "/images/gallery/07.jpg", alt: "Family birthday party with bounce house and tent",              category: "Birthday"    },
  { src: "/images/gallery/08.jpg", alt: "Outdoor backyard celebration with white folding chairs",        category: "Backyard"    },
];
