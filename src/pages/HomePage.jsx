import SeoHead from "../lib/seo";
import Hero from "../components/home/Hero";
import GalleryPreview from "../components/home/GalleryPreview";
import { features } from "../data/content";

export default function HomePage() {
  return (
    <>
      <SeoHead
        description="Family-owned party rentals in Naples, Bonita Springs & Marco Island, FL. Tents, tables, chairs and water slides. Free delivery & setup in Naples."
        path="/"
      />
      <Hero />
      {features.showGallery && <GalleryPreview />}
    </>
  );
}
