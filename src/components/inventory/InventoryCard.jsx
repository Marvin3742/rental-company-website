import Image from "../ui/Image";
import { formatPrice } from "../../lib/format";
import "./InventoryCard.css";

export default function InventoryCard({ item }) {
  return (
    <article className="inv-card">
      <div className="inv-card__media">
        <Image src={item.image} alt={item.name} />
      </div>
      <div className="inv-card__body">
        <h3 className="inv-card__name">{item.name}</h3>
        <p className="inv-card__blurb">{item.blurb}</p>
        <p className="inv-card__price">
          <span className="inv-card__amount">{formatPrice(item.price)}</span>
          <span className="inv-card__unit">/ {item.unit}</span>
        </p>
      </div>
    </article>
  );
}
