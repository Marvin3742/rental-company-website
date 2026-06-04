import SeoHead from "../lib/seo";
import Container from "../components/ui/Container";
import SectionHeading from "../components/ui/SectionHeading";
import BookButton from "../components/ui/BookButton";
import BundleCard from "../components/bundles/BundleCard";
import InventoryCard from "../components/inventory/InventoryCard";
import { bundles, inventory, rentalsPage as rentalsPageContent } from "../data/content";
import "./RentalsPage.css";

export default function RentalsPage() {
  return (
    <>
      <SeoHead
        title={rentalsPageContent.seo.title}
        description={rentalsPageContent.seo.description}
        path="/rentals"
      />

      {/* Individual rentals */}
      <section className="rentals-items" id="individual-rentals">
        <Container>
          <SectionHeading
            eyebrow={rentalsPageContent.itemsSection.eyebrow}
            title={rentalsPageContent.itemsSection.title}
          />
          <div className="rentals-items__grid">
            {inventory.map((item) => (
              <InventoryCard key={item.id} item={item} />
            ))}
          </div>
        </Container>
      </section>

      {/* Bundles */}
      <section className="rentals-bundles">
        <Container>
          <SectionHeading
            eyebrow={rentalsPageContent.bundlesSection.eyebrow}
            title={rentalsPageContent.bundlesSection.title}
          />
          <div className="rentals-bundles__grid">
            {bundles.map((b) => (
              <BundleCard key={b.id} bundle={b} featured />
            ))}
          </div>
        </Container>
      </section>

      {/* Bundle nudge at the bottom */}
      <section className="rentals-reminder">
        <Container narrow>
          <div className="rentals-reminder__inner">
            <h2>{rentalsPageContent.reminder.heading}</h2>
            <p></p>
            <BookButton size="lg" />
          </div>
        </Container>
      </section>
    </>
  );
}
