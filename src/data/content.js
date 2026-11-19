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
  phone: "305-735-1242",
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
  subtitle:     "Family-owned event rentals serving the Naples, FL area. Tents, tables, chairs, and inflatables. Free delivery & setup in Naples.",
  primaryCta:   "Call us",
  secondaryCta: "View Rentals",
};


// ─── Home — Featured Packages section ────────────────────────────────────────

export const featuredPackagesSection = {
  title:      "Event packages",
  subtitle:   "Free delivery & setup in Naples.",
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
    description: "Browse our event rental packages and individual items. Tents, tables, chairs, and bounce houses. Free delivery & setup in Naples.",
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
    heading: "Free delivery & setup in Naples.",
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
// Write {depositPct} wherever an answer mentions the deposit percentage — it's
// filled in from Admin → Settings, so the copy always matches what checkout charges.
// An answer that depends on whether deposits are on is written as
// { deposit: "...", noDeposit: "..." }; noDeposit shows while the deposit % is 0.
// Likewise {smallOrderFee} and {smallOrderThreshold} come from Admin → Settings,
// and an FAQ marked onlyWithSmallOrderFee is hidden while that fee is set to 0.

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
    answer: {
      deposit:   "Yes. We require {depositPct}% of your order to be paid upfront to secure your date.",
      noDeposit: "No. You can reserve your date online with nothing paid upfront and pay on delivery, or pay in full when you book.",
    },
  },
  {
    category: "Cancellation & Weather",
    question:  "What's your cancellation policy?",
    answer: {
      deposit:   "Bookings must be cancelled at least 3 days in advance to receive a full refund. Last-minute cancellations incur a {depositPct}% cancellation fee (the deposit).",
      noDeposit: "Bookings must be cancelled at least 3 days in advance to receive a full refund. Last-minute cancellations of prepaid orders incur a 15% cancellation fee. If you reserved without paying, please let us know as soon as possible if your plans change.",
    },
  },
  {
    category: "Delivery & Setup",
    question:  "Is delivery included?",
    answer:    "Delivery and setup are free within Naples. Elsewhere in Collier and Lee County, the delivery fee depends on distance and is shown at checkout before you book.",
  },
  {
    category: "Payment",
    question:  "Is there a small-order fee?",
    answer:    "Orders under {smallOrderThreshold} in rentals include a {smallOrderFee} small-order fee, in addition to any delivery fee.",
    onlyWithSmallOrderFee: true,
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
    answer:    "You can call or text us at 305-735-1242 to book — text is preferred. You can also book online.",
  },


];


// ─── Checkout: "Read this before booking" reminder ────────────────────────────
// Shown as a highlighted callout at the top of the checkout page. Edit the
// title/intro and the bullet points below — they render in order. As in the
// FAQs, {depositPct} is filled in with the live deposit % from Admin → Settings,
// and a point written as { deposit, noDeposit } switches with deposits on/off.

export const checkoutNotice = {
  title: "Read this before booking",
  intro: "A few important things to check so your delivery day goes smoothly:",
  points: [
    "Make sure you have enough clear, level space for everything you're renting. If you're unsure about sizes, measure your space or call us before booking.",
    "Water slides & inflatables: we provide a 150 ft hose and extension cord. A water source and a power outlet must be within 150 ft of where the unit will be set up.",
    "Please add anything important to the Delivery notes field below — especially the surface the rental will sit on (grass, concrete, turf, pavers, or dirt) and anything that affects access, like gates, stairs, slopes, or narrow walkways.",
    {
      deposit:   "Deposit & cancellation: a {depositPct}% deposit secures your date. Cancel 3 or more days before your event for a full refund; last-minute cancellations keep the {depositPct}% deposit.",
      noDeposit: "Payment & cancellation: no deposit needed. Reserve now and pay on delivery, or pay in full today. Prepaid orders cancelled 3 or more days before your event get a full refund; last-minute cancellations of prepaid orders incur a 15% fee.",
    },
  ],
};


// ─── Privacy policy (/privacy) ────────────────────────────────────────────────
// Plain-language template, not legal advice. Update lastUpdated ("YYYY-MM-DD")
// whenever the policy changes. The contact line at the bottom of the page comes
// from the business info above.

export const privacyPolicy = {
  lastUpdated: "2026-11-18",
  intro:
    "Solimar Event Rentals (\"we\", \"us\") is a family-owned party rental business in Naples, Florida. This policy explains what information we collect when you use solimareventrentals.com and how we use it.",
  sections: [
    {
      heading: "Information you give us",
      body: "When you book, we collect your name, email address, phone number, delivery address, event date, delivery and pickup preferences, and any notes you add. We use this to deliver, set up and pick up your rentals, to contact you about your booking, and to keep business records.",
    },
    {
      heading: "Payments",
      body: "Card payments are processed by Stripe. We do not see or store your full card number. If you reserve without paying online, you pay us directly on delivery.",
    },
    {
      heading: "Service providers",
      body: "A few service providers help us run the site and your booking: Vercel hosts the website, Neon stores booking records, Resend sends booking emails, and Stripe processes card payments. To work out the delivery fee, we look up your delivery address with the U.S. Census Bureau's address service.",
    },
    {
      heading: "Analytics and advertising",
      body: "We use Google Analytics to understand how visitors use our site, and Google Ads to measure whether our ads lead to bookings and calls. These services use cookies and similar technologies. When you complete a booking, we may share your email address and phone number with Google in hashed (encrypted, unreadable) form to measure ad performance. If you arrived from one of our Google ads, we save the ad click identifier with your booking.",
    },
    {
      heading: "What we don't do",
      body: "We do not sell your personal information. We share it only with the service providers above, as needed to run our business, or when required by law.",
    },
    {
      heading: "Your choices",
      body: "You can manage how Google uses ad data at adssettings.google.com and opt out of Google Analytics with Google's browser add-on (tools.google.com/dlpage/gaoptout). You can also block or delete cookies in your browser. To ask us to see, correct or delete your information, contact us using the details below.",
    },
    {
      heading: "Data retention",
      body: "We keep booking records as long as we need them for business, tax and legal purposes.",
    },
    {
      heading: "Children",
      body: "Our site is not directed at children under 13, and we do not knowingly collect their information.",
    },
    {
      heading: "Changes",
      body: "If we update this policy, we will post the new version on this page with a new date.",
    },
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
