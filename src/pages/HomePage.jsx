import SeoHead from "../lib/seo";
import Hero from "../components/home/Hero";
import GalleryPreview from "../components/home/GalleryPreview";
import { features } from "../data/content";

export default function HomePage() {
  return (
    <>
      <SeoHead
        description="Family-owned party rentals serving Naples, Bonita Springs, and Marco Island. Tents, tables, chairs, and bounce houses with delivery and setup included."
        path="/"
      />
      <Hero />
      {features.showGallery && <GalleryPreview />}
    </>
  );
}
