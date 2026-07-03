import { useState } from "react";
import clsx from "clsx";
import Image from "../ui/Image";
import AddToCartButton from "../cart/AddToCartButton";
import { formatPrice } from "../../lib/format";
import { productEntry } from "../../store/cart";
import "./InventoryCard.css";

// `item` is a DB product: { slug, name, priceCents, unit, images[], description, details[] }
export default function InventoryCard({ item }) {
  const photos = item.images?.length ? item.images : [];
  const [active, setActive] = useState(0);
  const hasMultiple = photos.length > 1;

  const goTo = (i) => setActive((i + photos.length) % photos.length);

  return (
    <article className="inv-card">
      <div className="inv-card__media">
        {photos.length > 0 ? (
          <>
            <div className="inv-card__main-photo">
              <Image src={photos[active]} alt={item.name} />
            </div>
            {hasMultiple && (
              <div className="inv-card__controls">
                <button
                  type="button"
                  className="inv-card__arrow"
                  onClick={() => goTo(active - 1)}
                  aria-label={`Show previous photo of ${item.name}`}
                >
                  <svg viewBox="0 0 16 16" width="18" height="18" aria-hidden="true" focusable="false">
                    <path d="M10 3L5 8l5 5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <div className="inv-card__dots">
                  {photos.map((src, i) => (
                    <button
                      key={src + i}
                      type="button"
                      className={clsx("inv-card__dot", i === active && "inv-card__dot--active")}
                      onClick={() => setActive(i)}
                      aria-label={`Show photo ${i + 1} of ${item.name}`}
                      aria-current={i === active}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  className="inv-card__arrow"
                  onClick={() => goTo(active + 1)}
                  aria-label={`Show next photo of ${item.name}`}
                >
                  <svg viewBox="0 0 16 16" width="18" height="18" aria-hidden="true" focusable="false">
                    <path d="M6 3l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="inv-card__main-photo inv-card__placeholder" aria-hidden="true">
            No photo yet
          </div>
        )}
      </div>

      <div className="inv-card__body">
        <h3 className="inv-card__name">{item.name}</h3>
        <p className="inv-card__price">
          <span className="inv-card__amount">{formatPrice(item.priceCents / 100)}</span>
          <span className="inv-card__unit">/ {item.unit}</span>
        </p>
        {item.description && <p className="inv-card__description">{item.description}</p>}
        {item.details?.length > 0 && (
          <ul className="inv-card__details">
            {item.details.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        )}
        <AddToCartButton
          entry={productEntry(item)}
          className="inv-card__cta"
          ariaLabel={`Add ${item.name} to cart`}
        />
      </div>
    </article>
  );
}
