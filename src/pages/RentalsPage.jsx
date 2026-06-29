import SeoHead from "../lib/seo";
import Container from "../components/ui/Container";
import SectionHeading from "../components/ui/SectionHeading";
import PackageCard from "../components/packages/PackageCard";
import InventoryCard from "../components/inventory/InventoryCard";
import { packages, inventory, rentalsPage as rentalsPageContent } from "../data/content";
import "./RentalsPage.css";

export default function RentalsPage() {
  return (
    <>
      <SeoHead
        title="Rentals"
        description={rentalsPageContent.seo.description}
        path="/rentals"
      />

      {/* Individual rentals */}
      <section className="rentals-items" id="individual-rentals">
        <Container>
          <SectionHeading
            eyebrow={rentalsPageContent.itemsSection.eyebrow}
            title={rentalsPageContent.itemsSection.title}
            align="center"
          />
          <div className="rentals-items__list">
            {inventory.map((item) => (
              <InventoryCard key={item.id} item={item} />
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
            {packages.map((p) => (
              <PackageCard key={p.id} pkg={p} featured />
            ))}
          </div>
        </Container>
      </section>

    </>
  );
}
