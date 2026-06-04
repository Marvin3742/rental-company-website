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
  phone: "239-000-0000",
  email: "SolimarEventRentals88@gmail.com",
  instagram: "https://instagram.com/solimareventrentals",
  serviceAreas: ["Naples", "Bonita Springs", "Marco Island"],
  hours: "Mon–Sat, 8am–7pm",
  city: "Naples, FL",
};


// ─── Navigation ───────────────────────────────────────────────────────────────

export const nav = {
  links: [
    { to: "/",        label: "Home",       end: true },
    { to: "/rentals", label: "Rentals" },
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
  secondaryCta: "Bundles",
};


// ─── Home — Featured Bundles section ─────────────────────────────────────────

export const featuredBundlesSection = {
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
    title:       "Event Rentals & Bundles | Naples, Bonita Springs, Marco Island",
    description: "Browse our event rental bundles and individual items. Tents, tables, chairs, and bounce houses with delivery and setup included.",
  },
  bundlesSection: {
    title:   "Event Bundles",
  },
  itemsSection: {
    title:   "Individual Rentals",
  },
  reminder: {
    heading: "Bundles include delivery and setup.",
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
    "Solimar Event Rentals is a family-owned business based in Naples, Florida. We provide tents, tables, chairs, bounce houses, and other essentials for parties and events.",
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
  contactHeading:  "Get in touch",
  servingHeading:  "Serving",
  serviceAreaSuffix: ", FL",
  bottomCta:       "Call us to book a bundle",  // phone is appended after a dash
};


// ─── Bundles ──────────────────────────────────────────────────────────────────
// Each bundle needs: id, name, price (number), badge, tagline, image, includes[]

export const bundles = [
  {
    id:      "Bundle_1",
    name:    "Bundle #1",
    price:   700,
    image:   "/images/bundles/essentials-plus.jpg",
    includes: [
      "20×30 Premium frame tent",
      "9 tables",
      "60 chairs",
      "Inflatable bounce house",
      "Delivery & setup included",
    ],
  },
  {
    id:      "Bundle_2",
    name:    "Bundle #2",
    price:   600,
    image:   "/images/bundles/essentials.jpg",
    includes: [
      "20×30 Premium frame tent",
      "9 tables",
      "60 chairs",
      "Delivery & setup included",
    ],
  },
    {
    id:      "Bundle_3",
    name:    "Bundle #3",
    price:   500,
    image:   "/images/bundles/essentials-plus.jpg",
    includes: [
      "20×20 Premium frame tent",
      "6 tables",
      "45 chairs",
      "Inflatable bounce house",
      "Delivery & setup included",
    ],
  },
  {
    id:      "Bundle_4",
    name:    "Bundle #4",
    price:   400,
    image:   "/images/bundles/essentials.jpg",
    includes: [
      "20×20 Premium frame tent",
      "6 tables",
      "45 chairs",
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
    answer:    "Just send us a call, if we don't answer, leave a text.",
  },
  {
    category: "Delivery & Setup",
    question:  "Is delivery included?",
    answer:    "Yes, we deliver throughout Naples, Bonita Springs, and Marco Island. A small fee may be applied for small orders.",
  },
  {
    category: "Delivery & Setup",
    question:  "How long does setup take?",
    answer:    "Most setups take 30 to 60 minutes.",
  },
  {
    category: "Payment",
    question:  "What payment methods do you accept?",
    answer:    "Cash, Zelle, Apple Pay, and major credit cards.",
  },
  {
    category: "Payment",
    question:  "Is a deposit required?",
    answer:    "Yes, a small non-refundable deposit is required to protect against last minute cancellations.",
  },
  {
    category: "Cancellation & Weather",
    question:  "What happens if it rains?",
    answer:    "In case of severe weather, we would be happy to reschedule your event to a later date.",
  },
  {
    category: "Cancellation & Weather",
    question:  "What's your cancellation policy?",
    answer:    "Cancellations more than 7 days before your event are refunded in full. Closer than that, we'll happily apply your payment toward a future booking.",
  },


];


// ─── Individual inventory items ───────────────────────────────────────────────
// unit: "each" → price per piece  |  unit: "day" → flat daily price

export const inventory = [
  { id: "chair",  name: "Plastic Folding Chair", price: 3,   unit: "each", image: "/images/inventory/chair.jpg" },
  { id: "table6",  name: "6ft Table",             price: 10,  unit: "each", image: "/images/inventory/table.jpg" },
  { id: "table8",  name: "8ft Table",             price: 12,  unit: "each", image: "/images/inventory/table.jpg" },
  { id: "tent20x20",   name: "20×20 Tent",            price: 250, unit: "day",  image: "/images/inventory/tent.jpg"  },
  { id: "tent20x30",   name: "20×30 Tent",            price: 350, unit: "day",  image: "/images/inventory/tent.jpg"  },
  { id: "bounce", name: "Bounce House",           price: 175, unit: "day",  image: "/images/inventory/bounce.jpg" },
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
