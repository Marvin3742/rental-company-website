import { Link } from "react-router-dom";
import Container from "../ui/Container";
import SectionHeading from "../ui/SectionHeading";
import Image from "../ui/Image";
import { gallery, galleryPreviewSection } from "../../data/content";
import "./GalleryPreview.css";

export default function GalleryPreview() {
  const preview = gallery.slice(0, 6);
  return (
    <section className="gallery-preview">
      <Container>
        <SectionHeading
          eyebrow={galleryPreviewSection.eyebrow}
          title={galleryPreviewSection.title}
          subtitle={galleryPreviewSection.subtitle}
        />

        <div className="gallery-preview__grid">
          {preview.map((img) => (
            <Link
              key={img.src}
              to="/gallery"
              className="gallery-preview__tile"
              aria-label={`See more — ${img.alt}`}
            >
              <Image src={img.src} alt={img.alt} />
            </Link>
          ))}
        </div>

        <p className="gallery-preview__cta">
          <Link to="/gallery">{galleryPreviewSection.cta}</Link>
        </p>
      </Container>
    </section>
  );
}
