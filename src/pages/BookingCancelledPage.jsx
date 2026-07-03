import { Link } from "react-router-dom";
import SeoHead from "../lib/seo";
import Container from "../components/ui/Container";
import Button from "../components/ui/Button";
import "./BookingResult.css";

export default function BookingCancelledPage() {
  return (
    <section className="booking-result">
      <Container narrow>
        <SeoHead title="Checkout cancelled" path="/booking/cancelled" />
        <h1 className="booking-result__title">Checkout cancelled</h1>
        <p>
          No payment was taken. Your items are still in your cart, so you can pick up right where you
          left off.
        </p>
        <div className="booking-result__actions">
          <Button to="/checkout" variant="primary">Return to checkout</Button>
          <Link to="/cart" className="booking-result__link">View cart</Link>
        </div>
      </Container>
    </section>
  );
}
