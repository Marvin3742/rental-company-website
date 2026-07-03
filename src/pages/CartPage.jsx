import { Link, useNavigate } from "react-router-dom";
import SeoHead from "../lib/seo";
import Container from "../components/ui/Container";
import Button from "../components/ui/Button";
import { useCart, selectSubtotalCents } from "../store/cart";
import { formatCents } from "../lib/format";
import "./CartPage.css";

export default function CartPage() {
  const items = useCart((s) => s.items);
  const setQuantity = useCart((s) => s.setQuantity);
  const removeItem = useCart((s) => s.removeItem);
  const subtotal = useCart(selectSubtotalCents);
  const navigate = useNavigate();

  return (
    <section className="cart-page">
      <Container narrow>
        <SeoHead title="Cart" description="Review your event rental cart." path="/cart" />
        <h1 className="cart-page__title">Your cart (DO NOT PLACE ORDER! ONLINE BOOKING STILL IN DEVELOPMENT)</h1>

        {items.length === 0 ? (
          <div className="cart-page__empty">
            <p>Your cart is empty.</p>
            <Button to="/rentals" variant="primary">
              Browse rentals
            </Button>
          </div>
        ) : (
          <>
            <ul className="cart-list">
              {items.map((i) => (
                <li className="cart-row" key={`${i.kind}:${i.slug}`}>
                  <div className="cart-row__media">
                    {i.image && <img src={i.image} alt="" loading="lazy" />}
                  </div>
                  <div className="cart-row__info">
                    <span className="cart-row__name">{i.name}</span>
                    <span className="cart-row__unit">
                      {formatCents(i.unitPriceCents)} / {i.unit}
                    </span>
                  </div>
                  <div className="cart-row__qty">
                    <button
                      type="button"
                      onClick={() => setQuantity(i.kind, i.slug, i.quantity - 1)}
                      aria-label={`Decrease quantity of ${i.name}`}
                      disabled={i.quantity <= 1}
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={i.quantity}
                      onChange={(e) => setQuantity(i.kind, i.slug, Number(e.target.value))}
                      aria-label={`Quantity of ${i.name}`}
                    />
                    <button
                      type="button"
                      onClick={() => setQuantity(i.kind, i.slug, i.quantity + 1)}
                      aria-label={`Increase quantity of ${i.name}`}
                    >
                      +
                    </button>
                  </div>
                  <div className="cart-row__total">{formatCents(i.unitPriceCents * i.quantity)}</div>
                  <button
                    type="button"
                    className="cart-row__remove"
                    onClick={() => removeItem(i.kind, i.slug)}
                    aria-label={`Remove ${i.name} from cart`}
                  >
                    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
                      <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>

            <div className="cart-summary">
              <div className="cart-summary__row">
                <span>Subtotal</span>
                <span className="cart-summary__amount">{formatCents(subtotal)}</span>
              </div>
              <p className="cart-summary__note">
                Pick your event date and confirm availability at checkout. Taxes and any delivery
                fee are added there.
              </p>
              <Button
                variant="primary"
                size="lg"
                className="cart-summary__checkout"
                onClick={() => navigate("/checkout")}
              >
                Proceed to checkout
              </Button>
              <Link to="/rentals" className="cart-summary__continue">
                <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true" focusable="false">
                  <path d="M10 3L5 8l5 5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Continue browsing
              </Link>
            </div>
          </>
        )}
      </Container>
    </section>
  );
}
