import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Container from "../ui/Container";
import SectionHeading from "../ui/SectionHeading";
import PackageCard from "../packages/PackageCard";
import { fetchPackages } from "../../lib/catalog";
import { featuredPackagesSection } from "../../data/content";
import "./FeaturedPackages.css";

export default function FeaturedPackages() {
  const [packages, setPackages] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchPackages()
      .then((data) => !cancelled && setPackages(data))
      .catch(() => !cancelled && setPackages([]));
    return () => {
      cancelled = true;
    };
  }, []);

  if (packages !== null && packages.length === 0) return null;

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
          {(packages ?? []).map((p) => (
            <PackageCard key={p.slug} pkg={p} />
          ))}
        </div>

        <p className="featured-packages__alt">
          <Link to="/rentals">{featuredPackagesSection.altLinkText}</Link>
        </p>
      </Container>
    </section>
  );
}
