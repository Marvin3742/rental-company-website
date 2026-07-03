import clsx from "clsx";
import Image from "../ui/Image";
import AddToCartButton from "../cart/AddToCartButton";
import { formatPrice } from "../../lib/format";
import { packageEntry } from "../../store/cart";
import "./PackageCard.css";

export default function PackageCard({ pkg, featured = false }) {
  return (
    <article className={clsx("package-card", featured && "package-card--featured")}>
      <div className="package-card__media">
        {pkg.image && <Image src={pkg.image} alt={`${pkg.name} setup`} />}
        {pkg.badge && (
          <span className="package-card__badge">{pkg.badge}</span>
        )}
      </div>

      <div className="package-card__body">
        <header className="package-card__head">
          <h3 className="package-card__name">{pkg.name}</h3>
          <p className="package-card__price">
            <span className="package-card__amount">{formatPrice(pkg.priceCents / 100)}</span>
            <span className="package-card__price-suffix">/ day</span>
          </p>
        </header>

        {pkg.tagline && <p className="package-card__tagline">{pkg.tagline}</p>}

        <ul className="package-card__includes">
          {pkg.includes.map((item) => (
            <li key={item}>
              <svg className="package-card__check" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
                <path
                  d="M4.5 10.5l3.5 3.5L15.5 6.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {item}
            </li>
          ))}
        </ul>

        <AddToCartButton
          entry={packageEntry(pkg)}
          variant="primary"
          size="lg"
          className="package-card__cta"
          ariaLabel={`Add ${pkg.name} to cart`}
        />
      </div>
    </article>
  );
}
