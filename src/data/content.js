// ─────────────────────────────────────────────────────────────────────────────
// SITE CONTENT — marketing copy & configuration.
// Edit text here (business info, nav, hero, About, FAQs, gallery, footer) and the
// site updates automatically. The rental CATALOG (products & packages) is NOT
// here — it's database-driven and managed in /admin (seed defaults live in
// prisma/seed-data.js).
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
  hours: "Mon–Sun, 8am–7pm",
  city: "Naples, FL",
};


// ─── Navigation ───────────────────────────────────────────────────────────────

export const nav = {
  links: [
    { to: "/",        label: "HOME",       end: true },
    { to: "/rentals", label: "RENT" },
    { to: "/about",   label: "ABOUT & FAQ" },
    { to: "/gallery", label: "GALLERY" },
  ],
};


// ─── Hero (home page banner) ──────────────────────────────────────────────────

export const hero = {
  titleLine1:   "Solimar Event",
  titleAccent:  "Rentals",
  subtitle:     "Family-owned event rentals serving the Naples, FL area. Tents, tables, chairs, and inflatables — delivered and set up for you.",
  primaryCta:   "Call us",
  secondaryCta: "View Rentals",
};


// ─── Home — Featured Packages section ────────────────────────────────────────

export const featuredPackagesSection = {
  title:      "Event packages",
  subtitle:   "Includes delivery and setup.",
  altLinkText: "Individual rentals",
};


// ─── Home — Gallery Preview section ──────────────────────────────────────────

export const galleryPreviewSection = {
  title:    "Recent setups",
  subtitle: "A look at real events we've helped families host across Naples, FL.",
  cta:      "Full gallery",
};


// ─── Rentals page ─────────────────────────────────────────────────────────────

export const rentalsPage = {
  seo: {
    title:       "Event Rentals & Packages | Naples, Bonita Springs, Marco Island",
    description: "Browse our event rental packages and individual items. Tents, tables, chairs, and bounce houses with delivery and setup included.",
  },
  packagesSection: {
    title:    "PACKAGES",
    subtitle: "Save 10% when you book one of our packages.",
  },
  tentsSection: {
    title:   "TENTS, TABLES, AND CHAIRS",
  },
  inflatablesSection: {
    title:   "INFLATABLES",
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
  eyebrow: "",
  headline: "Party Rentals For Local Families and Events.",
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
  eyebrow: "",
  title:   "Gallery",
  cta:     "",
};


// ─── Footer ───────────────────────────────────────────────────────────────────

export const footer = {
  serviceAreaSuffix: ", FL",
  bottomCta:       "Call us to book",  // phone is appended after a dash
};


// ─── Catalog (products & packages) is database-driven ────────────────────────
// The rental catalog is NOT here. It's served from the database (/api/products,
// /api/packages) and managed in /admin. Initial seed defaults live in
// prisma/seed-data.js.


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
    category: "Payment",
    question:  "Is a deposit required?",
    answer:    "Yes. We require 15% of your order to be paid upfront to secure your date.",
  },
  {
    category: "Cancellation & Weather",
    question:  "What's your cancellation policy?",
    answer:    "Bookings must be cancelled at least 3 days in advance to receive a full refund. Last-minute cancellations incur a 15% cancellation fee (the deposit).",
  },
  {
    category: "Delivery & Setup",
    question:  "Is delivery included?",
    answer:    "We deliver throughout Collier and Lee County. The delivery fee is calculated based on your distance from us and can be as low as $0.00. ",
  },
  {
    question: "What time do you guys drop-off/deliver?",
    answer: "We will ask for your time preferences at checkout and then CALL you to confirm your actual delivery times."
  },
  {
    question: "What is included with the waterslides?",
    answer: "We provide a 150 ft extension cord and hose. Please make sure a power and water source is available within this distance before booking."
  },
  {
    question: "Do tents come with any lighting options?",
    answer: "Please call us about that."
  },
  {
    category: "Delivery & Setup",
    question:  "How long does setup take?",
    answer:    "About 40 minutes for smaller orders and about 90 minutes for our biggest packages. We work to bring these times down after every delivery.",
  },
  {
    category: "Payment",
    question:  "What do you accept for in-person payments?",
    answer:    "We prefer cash but also take credit cards, Zelle, and Apple Pay.",
  },
  {
    category: "Booking",
    question:  "How do I book a rental?",
    answer:    "You can call or text us at 239-778-3742 to book — text is preferred. You can also book online.",
  },


];


// ─── Checkout: "Read this before booking" reminder ────────────────────────────
// Shown as a highlighted callout at the top of the checkout page. Edit the
// title/intro and the bullet points below — they render in order.

export const checkoutNotice = {
  title: "Read this before booking",
  intro: "A few important things to check so your delivery day goes smoothly:",
  points: [
    "Make sure you have enough clear, level space for everything you're renting. If you're unsure about sizes, measure your space or call us before booking.",
    "Water slides & inflatables: we provide a 150 ft hose and extension cord. A water source and a power outlet must be within 150 ft of where the unit will be set up.",
    "Please add anything important to the Delivery notes field below — especially the surface the rental will sit on (grass, concrete, turf, pavers, or dirt) and anything that affects access, like gates, stairs, slopes, or narrow walkways.",
    "Deposit & cancellation: a 15% deposit secures your date. Cancel 3 or more days before your event for a full refund; last-minute cancellations keep the 15% deposit.",
  ],
};


// ─── Gallery images ───────────────────────────────────────────────────────────
// Drop images in /public/images/gallery/ then add an entry below.
// Use descriptive alt text — it helps with SEO.

export const gallery = [
  { src: "/images/gallery/01.webp", alt: "Backyard birthday party with white tent and tables in Naples",  category: "Birthday"    },
  { src: "/images/gallery/02.webp", alt: "Bounce house setup at a kids' birthday party",                  category: "Birthday"    },
  { src: "/images/gallery/03.webp", alt: "School event with rows of folding chairs under a tent",         category: "School"      },
  { src: "/images/gallery/04.webp", alt: "Tables set up for a backyard graduation celebration",           category: "Graduation"  },
  { src: "/images/gallery/05.webp", alt: "20x30 tent installation for a community gathering",             category: "Community"   },
  { src: "/images/gallery/06.webp", alt: "Church event tables and chairs under a tent",                   category: "Church"      },
  { src: "/images/gallery/07.webp", alt: "Family birthday party with bounce house and tent",              category: "Birthday"    },
  { src: "/images/gallery/08.webp", alt: "Outdoor backyard celebration with white folding chairs",        category: "Backyard"    },
];
