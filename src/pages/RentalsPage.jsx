import SeoHead from "../lib/seo";
import Container from "../components/ui/Container";
import SectionHeading from "../components/ui/SectionHeading";
import BookButton from "../components/ui/BookButton";
import BundleCard from "../components/bundles/BundleCard";
import InventoryCard from "../components/inventory/InventoryCard";
import { bundles } from "../data/bundles";
import { inventory } from "../data/inventory";
import "./RentalsPage.css";

export default function RentalsPage() {
  return (
    <>
      <SeoHead
        title="Party Rentals & Bundles | Naples, Bonita Springs, Marco Island"
        description="Browse our party rental bundles and individual items. Tents, tables, chairs, and bounce houses with delivery and setup included."
        path="/rentals"
      />

      {/* Bundles first — the headline offer */}
      <section className="rentals-bundles">
        <Container>
          <SectionHeading
            eyebrow="Party Bundles"
            title="Bundles save money and keep things simple."
          />
          <div className="rentals-bundles__grid">
            {bundles.map((b) => (
              <BundleCard key={b.id} bundle={b} featured />
            ))}
          </div>
        </Container>
      </section>

      {/* Individual rentals — secondary by design */}
      <section className="rentals-items">
        <Container>
          <SectionHeading
            eyebrow="Individual Rentals"
            title="Looking for just a few items?"

          />
          <div className="rentals-items__grid">
            {inventory.map((item) => (
              <InventoryCard key={item.id} item={item} />
            ))}
          </div>
        </Container>
      </section>

      {/* Bundle nudge at the bottom */}
      <section className="rentals-reminder">
        <Container narrow>
          <div className="rentals-reminder__inner">
            <h2>Bundles include delivery and setup.</h2>
            <p></p>
            <BookButton size="lg" />
          </div>
        </Container>
      </section>
    </>
  );
}
