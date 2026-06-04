import { Link } from "react-router-dom";
import Container from "../ui/Container";
import SectionHeading from "../ui/SectionHeading";
import BundleCard from "../bundles/BundleCard";
import { bundles } from "../../data/bundles";
import "./FeaturedBundles.css";

export default function FeaturedBundles() {
  return (
    <section className="featured-bundles" id="bundles">
      <Container>
        <SectionHeading
          eyebrow="Start with a bundle"
          title="Party packages"
          subtitle="Bundles include delivery and setup."
          align="center"
        />

        <div className="featured-bundles__grid">
          {bundles.map((b) => (
            <BundleCard key={b.id} bundle={b} />
          ))}
        </div>

        <p className="featured-bundles__alt">
          Need just a few items? <Link to="/rentals">Browse individual rentals →</Link>
        </p>
      </Container>
    </section>
  );
}
