import { Link } from "react-router-dom";
import Container from "../ui/Container";
import SectionHeading from "../ui/SectionHeading";
import Image from "../ui/Image";
import { gallery } from "../../data/gallery";
import "./GalleryPreview.css";

export default function GalleryPreview() {
  const preview = gallery.slice(0, 6);
  return (
    <section className="gallery-preview">
      <Container>
        <SectionHeading
          eyebrow="Real events"
          title="Recent setups."
          subtitle="A look at real parties we've helped families host across SWFL."
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
          <Link to="/gallery">See the full gallery →</Link>
        </p>
      </Container>
    </section>
  );
}
