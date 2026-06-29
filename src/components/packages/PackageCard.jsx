import clsx from "clsx";
import Image from "../ui/Image";
import BookButton from "../ui/BookButton";
import { formatPrice } from "../../lib/format";
import "./PackageCard.css";

export default function PackageCard({ pkg, featured = false }) {
  return (
    <article className={clsx("package-card", featured && "package-card--featured")}>
      <div className="package-card__media">
        <Image src={pkg.image} alt={`${pkg.name} setup`} />
        {pkg.badge && (
          <span className="package-card__badge">{pkg.badge}</span>
        )}
      </div>

      <div className="package-card__body">
        <header className="package-card__head">
          <h3 className="package-card__name">{pkg.name}</h3>
          <p className="package-card__price">
            <span className="package-card__amount">{formatPrice(pkg.price)}</span>
            <span className="package-card__price-suffix">/ day</span>
          </p>
        </header>

        <p className="package-card__tagline">{pkg.tagline}</p>

        <ul className="package-card__includes">
          {pkg.includes.map((item) => (
            <li key={item}>
              <span aria-hidden="true" className="package-card__check">✓</span>
              {item}
            </li>
          ))}
        </ul>

        <BookButton
          variant="primary"
          size="lg"
          className="package-card__cta"
          label={`Book ${pkg.name}`}
          showNumber={false}
        />
      </div>
    </article>
  );
}
