import { Link } from "react-router-dom";
import Container from "../ui/Container";
import SectionHeading from "../ui/SectionHeading";
import PackageCard from "../packages/PackageCard";
import { packages, featuredPackagesSection } from "../../data/content";
import "./FeaturedPackages.css";

export default function FeaturedPackages() {
  return (
    <section className="featured-packages" id="packages">
      <Container>
        <SectionHeading
          eyebrow={featuredPackagesSection.eyebrow}
          title={featuredPackagesSection.title}
          subtitle={featuredPackagesSection.subtitle}
          align="center"
        />

        <div className="featured-packages__grid">
          {packages.map((p) => (
            <PackageCard key={p.id} pkg={p} />
          ))}
        </div>

        <p className="featured-packages__alt">
          <Link to="/rentals">{featuredPackagesSection.altLinkText}</Link>
        </p>
      </Container>
    </section>
  );
}
