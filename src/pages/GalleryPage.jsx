import SeoHead from "../lib/seo";
import Container from "../components/ui/Container";
import SectionHeading from "../components/ui/SectionHeading";
import BookButton from "../components/ui/BookButton";
import GalleryGrid from "../components/gallery/GalleryGrid";
import { gallery, galleryPage as galleryPageContent } from "../data/content";
import "./GalleryPage.css";

export default function GalleryPage() {
  return (
    <>
      <SeoHead
        title="Gallery"
        description={galleryPageContent.seo.description}
        path="/gallery"
      />

      <section className="gallery-page">
        <Container>
          <SectionHeading
            eyebrow={galleryPageContent.eyebrow}
            title={galleryPageContent.title}
          />

          <GalleryGrid items={gallery} />

          <div className="gallery-page__cta">
            <p>{galleryPageContent.cta}</p>
            <BookButton size="lg" />
          </div>
        </Container>
      </section>
    </>
  );
}
