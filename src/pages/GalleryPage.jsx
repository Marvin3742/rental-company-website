import SeoHead from "../lib/seo";
import Container from "../components/ui/Container";
import SectionHeading from "../components/ui/SectionHeading";
import BookButton from "../components/ui/BookButton";
import GalleryGrid from "../components/gallery/GalleryGrid";
import { gallery } from "../data/gallery";
import { business } from "../data/business";
import "./GalleryPage.css";

export default function GalleryPage() {
  return (
    <>
      <SeoHead
        title={`Gallery | ${business.name}`}
        description="A look at real parties and events we've set up across Naples, Bonita Springs, and Marco Island."
        path="/gallery"
      />

      <section className="gallery-page">
        <Container>
          <SectionHeading
            eyebrow="Past events"
            title="Gallery"
          />

          <GalleryGrid items={gallery} />

          <div className="gallery-page__cta">
            <p>See something you'd love for your party?</p>
            <BookButton size="lg" />
          </div>
        </Container>
      </section>
    </>
  );
}
