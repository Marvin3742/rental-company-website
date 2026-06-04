import SeoHead from "../lib/seo";
import Hero from "../components/home/Hero";
import FeaturedBundles from "../components/home/FeaturedBundles";
import GalleryPreview from "../components/home/GalleryPreview";
import { business } from "../data/business";
import { features } from "../data/content";

export default function HomePage() {
  return (
    <>
      <SeoHead
        title={`Party Rentals in Naples, FL — ${business.name}`}
        description="Family-owned party rentals serving Naples, Bonita Springs, and Marco Island. Tents, tables, chairs, and bounce houses with delivery and setup included."
        path="/"
      />
      <Hero />
      <FeaturedBundles />
      {features.showGallery && <GalleryPreview />}
    </>
  );
}
