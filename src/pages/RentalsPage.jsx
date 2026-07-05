import { useEffect, useState } from "react";
import SeoHead from "../lib/seo";
import Container from "../components/ui/Container";
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

      {/* Inflatables */}
      {(items === null || items.some((item) => item.category === "INFLATABLES")) && (
        <section className="rentals-items" id="inflatables">
          <h1 className="rentals-banner">{rentalsPageContent.inflatablesSection.title}</h1>
          <Container>
            {error && <p className="rentals-items__status">Couldn’t load rentals. Please refresh.</p>}
            {!error && items === null && <p className="rentals-items__status">Loading rentals…</p>}
            <div className="rentals-items__list">
              {items?.filter((item) => item.category === "INFLATABLES").map((item) => (
                <InventoryCard key={item.slug} item={item} />
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* Tents, tables & chairs */}
      <section className="rentals-items" id="tents-tables-chairs">
        <h1 className="rentals-banner">{rentalsPageContent.tentsSection.title}</h1>
        <Container>
          <div className="rentals-items__list">
            {items?.filter((item) => item.category === "TENTS_TABLES_CHAIRS").map((item) => (
              <InventoryCard key={item.slug} item={item} />
            ))}
          </div>
        </Container>
      </section>

      {/* Packages */}
      <section className="rentals-packages">
        <h2 className="rentals-banner">{rentalsPageContent.packagesSection.title}</h2>
        <Container>
          {rentalsPageContent.packagesSection.subtitle && (
            <p className="rentals-packages__subtitle">
              {rentalsPageContent.packagesSection.subtitle}
            </p>
          )}
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
