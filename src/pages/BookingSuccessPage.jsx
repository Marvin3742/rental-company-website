import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import SeoHead from "../lib/seo";
import Container from "../components/ui/Container";
import Button from "../components/ui/Button";
import { fetchBooking } from "../lib/checkout";
import { useCart } from "../store/cart";
import { formatCents } from "../lib/format";
import { formatDateLong } from "../lib/availability";
import "./BookingResult.css";

export default function BookingSuccessPage() {
  const [params] = useSearchParams();
  const bookingId = params.get("b");
  const [booking, setBooking] = useState(null);
  const [state, setState] = useState(bookingId ? "polling" : "missing");

  // Trust the webhook, not just the redirect: poll until the booking is CONFIRMED.
  useEffect(() => {
    if (!bookingId) return;
    let active = true;
    let timer;
    let attempts = 0;

    const tick = async () => {
      try {
        const b = await fetchBooking(bookingId);
        if (!active) return;
        setBooking(b);
        if (b.status === "CONFIRMED") {
          setState("confirmed");
          useCart.getState().clear();
          return;
        }
        if (b.status === "CANCELLED" || b.status === "EXPIRED") {
          setState("error");
          return;
        }
      } catch {
        // transient — keep polling
      }
      attempts += 1;
      if (attempts > 15) {
        if (active) setState("timeout");
        return;
      }
      if (active) timer = setTimeout(tick, 1500);
    };

    timer = setTimeout(tick, 600);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [bookingId]);

  return (
    <section className="booking-result">
      <Container narrow>
        <SeoHead title="Booking confirmed" path="/booking/success" />

        <div className="booking-result__card">
          {state === "missing" && (
            <>
              <h1 className="booking-result__title">No booking reference found</h1>
              <p className="booking-result__lead">
                We couldn’t find your booking. If you were charged, please call us and we’ll sort it
                out.
              </p>
              <Button to="/rentals" variant="primary" size="lg">Back to rentals</Button>
            </>
          )}

          {state === "polling" && (
            <>
              <div className="booking-result__spinner" aria-hidden="true" />
              <h1 className="booking-result__title">Finalizing your booking</h1>
              <p className="booking-result__lead">Hang tight while we confirm your payment.</p>
            </>
          )}

          {state === "confirmed" && booking && (
            <>
              <h1 className="booking-result__title">Booking confirmed</h1>
              <p className="booking-result__lead">
                Thank you, {booking.customerName}. Your rentals are reserved for{" "}
                <strong>{formatDateLong(booking.eventDate)}</strong>. We’ll call to confirm your exact
                delivery and pickup times, and a confirmation email is on its way.
              </p>
              <dl className="booking-result__summary">
                <div>
                  <dt>Booking reference</dt>
                  <dd className="booking-result__ref">{booking.id}</dd>
                </div>
                <div>
                  <dt>Paid today</dt>
                  <dd>{formatCents(booking.amountPaidCents)}</dd>
                </div>
                {booking.balanceDueCents > 0 && (
                  <div>
                    <dt>Balance on delivery</dt>
                    <dd>{formatCents(booking.balanceDueCents)}</dd>
                  </div>
                )}
              </dl>
              <Button to="/" variant="primary" size="lg">Done</Button>
            </>
          )}

          {state === "timeout" && (
            <>
              <h1 className="booking-result__title">Payment received</h1>
              <p className="booking-result__lead">
                Your booking is being finalized — you’ll get an email confirmation shortly. If
                anything looks off, give us a call.
              </p>
              <Button to="/" variant="primary" size="lg">Back home</Button>
            </>
          )}

          {state === "error" && (
            <>
              <h1 className="booking-result__title">This booking didn’t complete</h1>
              <p className="booking-result__lead">
                The hold expired or was cancelled. Your items may still be in your cart — please try
                again.
              </p>
              <Button to="/cart" variant="primary" size="lg">Back to cart</Button>
            </>
          )}
        </div>
      </Container>
    </section>
  );
}
