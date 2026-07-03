import { useEffect, useState } from "react";
import SeoHead from "../lib/seo";
import Container from "../components/ui/Container";
import SectionHeading from "../components/ui/SectionHeading";
import PackageCard from "../components/packages/PackageCard";
import InventoryCard from "../components/inventory/InventoryCard";
import { fetchProducts, fetchPackages } from "../lib/catalog";
import { rentalsPage as rentalsPageContent } from "../data/content";
import "./RentalsPage.css";

export default function RentalsPage() {
  const [items, setItems] = useState(null); // null = loading
  const [packages, setPackages] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchProducts()
      .then((data) => !cancelled && setItems(data))
      .catch((e) => !cancelled && setError(e.message));
    fetchPackages()
      .then((data) => !cancelled && setPackages(data))
      .catch(() => !cancelled && setPackages([]));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <SeoHead
        title="Rentals"
        description={rentalsPageContent.seo.description}
        path="/rentals"
      />

      {/* Individual rentals */}
      <section className="rentals-items" id="individual-rentals">
        <h1 className="rentals-banner">{rentalsPageContent.itemsSection.title}</h1>
        <Container>
          {error && <p className="rentals-items__status">Couldn’t load rentals. Please refresh.</p>}
          {!error && items === null && <p className="rentals-items__status">Loading rentals…</p>}
          <div className="rentals-items__list">
            {items?.map((item) => (
              <InventoryCard key={item.slug} item={item} />
            ))}
          </div>
        </Container>
      </section>

      {/* Packages */}
      <section className="rentals-packages">
        <Container>
          <SectionHeading
            eyebrow={rentalsPageContent.packagesSection.eyebrow}
            title={rentalsPageContent.packagesSection.title}
            subtitle={rentalsPageContent.packagesSection.subtitle}
            align="center"
          />
          <div className="rentals-packages__grid">
            {(packages ?? []).map((p) => (
              <PackageCard key={p.slug} pkg={p} featured />
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
