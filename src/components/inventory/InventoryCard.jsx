import { useState } from "react";
import clsx from "clsx";
import Image from "../ui/Image";
import { formatPrice } from "../../lib/format";
import "./InventoryCard.css";

export default function InventoryCard({ item }) {
  const photos = item.images?.length ? item.images : [item.image];
  const [active, setActive] = useState(0);
  const hasMultiple = photos.length > 1;

  const goTo = (i) => setActive((i + photos.length) % photos.length);

  return (
    <article className="inv-card">
      <div className="inv-card__media">
        <div className="inv-card__photo-row">
          {hasMultiple && (
            <button
              type="button"
              className="inv-card__arrow inv-card__arrow--prev"
              onClick={() => goTo(active - 1)}
              aria-label={`Show previous photo of ${item.name}`}
            >
              ‹
            </button>
          )}
          <div className="inv-card__main-photo">
            <Image src={photos[active]} alt={item.name} />
          </div>
          {hasMultiple && (
            <button
              type="button"
              className="inv-card__arrow inv-card__arrow--next"
              onClick={() => goTo(active + 1)}
              aria-label={`Show next photo of ${item.name}`}
            >
              ›
            </button>
          )}
        </div>
        {hasMultiple && (
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
        )}
      </div>

      <div className="inv-card__body">
        <h3 className="inv-card__name">{item.name}</h3>
        <p className="inv-card__price">
          <span className="inv-card__amount">{formatPrice(item.price)}</span>
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
      </div>
    </article>
  );
}
