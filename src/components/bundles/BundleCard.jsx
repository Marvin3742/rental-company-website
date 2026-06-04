import clsx from "clsx";
import Image from "../ui/Image";
import BookButton from "../ui/BookButton";
import { formatPrice } from "../../lib/format";
import "./BundleCard.css";

export default function BundleCard({ bundle, featured = false }) {
  return (
    <article className={clsx("bundle-card", featured && "bundle-card--featured")}>
      <div className="bundle-card__media">
        <Image src={bundle.image} alt={`${bundle.name} setup`} />
        {bundle.badge && (
          <span className="bundle-card__badge">{bundle.badge}</span>
        )}
      </div>

      <div className="bundle-card__body">
        <header className="bundle-card__head">
          <h3 className="bundle-card__name">{bundle.name}</h3>
          <p className="bundle-card__price">
            <span className="bundle-card__amount">{formatPrice(bundle.price)}</span>
            <span className="bundle-card__price-suffix">/ event</span>
          </p>
        </header>

        <p className="bundle-card__tagline">{bundle.tagline}</p>

        <ul className="bundle-card__includes">
          {bundle.includes.map((item) => (
            <li key={item}>
              <span aria-hidden="true" className="bundle-card__check">✓</span>
              {item}
            </li>
          ))}
        </ul>

        <BookButton
          variant="primary"
          size="lg"
          className="bundle-card__cta"
          label={`Book ${bundle.name}`}
          showNumber={false}
        />
      </div>
    </article>
  );
}
