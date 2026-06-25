import { Link } from "react-router-dom";
import Container from "../ui/Container";
import SectionHeading from "../ui/SectionHeading";
import BundleCard from "../bundles/BundleCard";
import { bundles, featuredBundlesSection } from "../../data/content";
import "./FeaturedBundles.css";

export default function FeaturedBundles() {
  return (
    <section className="featured-bundles" id="bundles">
      <Container>
        <SectionHeading
          eyebrow={featuredBundlesSection.eyebrow}
          title={featuredBundlesSection.title}
          subtitle={featuredBundlesSection.subtitle}
          align="center"
        />

        <div className="featured-bundles__grid">
          {bundles.map((b) => (
            <BundleCard key={b.id} bundle={b} />
          ))}
        </div>

        <p className="featured-bundles__alt">
          <Link to="/rentals">{featuredBundlesSection.altLinkText}</Link>
        </p>
      </Container>
    </section>
  );
}
