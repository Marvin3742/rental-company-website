import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import SeoHead from "../lib/seo";
import Container from "../components/ui/Container";
import Button from "../components/ui/Button";
import { useCart, selectSubtotalCents } from "../store/cart";
import { formatCents } from "../lib/format";
import { checkCartAvailability, toISODate, formatDateLong } from "../lib/availability";
import { startCheckout, fetchSettings, fetchDeliveryQuote } from "../lib/checkout";
import { business } from "../data/content";
import "./CheckoutPage.css";

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

// Fixed 30-minute time slots, independent of the current time.
const buildTimeOptions = (startMins, endMins) => {
  const opts = [];
  for (let mins = startMins; mins <= endMins; mins += 30) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    const value = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    const h12 = h % 12 === 0 ? 12 : h % 12;
    const label = `${h12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
    opts.push({ value, label });
  }
  return opts;
};

// Drop-off and pickup both run 6:30 AM – 3:00 PM.
const DROPOFF_OPTIONS = buildTimeOptions(6 * 60 + 30, 15 * 60);
const PICKUP_OPTIONS = buildTimeOptions(6 * 60 + 30, 15 * 60);

export default function CheckoutPage() {
  const items = useCart((s) => s.items);
  const subtotal = useCart(selectSubtotalCents);

  const [settings, setSettings] = useState({ depositPct: 30, deliveryFeeCents: 0 });
  const [selectedDate, setSelectedDate] = useState(null);
  const [availStatus, setAvailStatus] = useState("idle");
  const [avail, setAvail] = useState(null);
  const [availError, setAvailError] = useState(null);
  const [paymentMode, setPaymentMode] = useState("FULL");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [quote, setQuote] = useState(null);
  const [quoteStatus, setQuoteStatus] = useState("idle"); // idle | loading | loaded | error

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    street: "",
    unit: "",
    city: "",
    state: "FL",
    zip: "",
    notes: "",
    dropoffLatest: "12:00",
    pickupEarliest: "06:30",
    pickupSameDay: false,
  });
  const update = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));
  const updateZip = (e) =>
    setForm((f) => ({ ...f, zip: e.target.value.replace(/\D/g, "").slice(0, 5) }));
  const updateState = (e) =>
    setForm((f) => ({ ...f, state: e.target.value.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 2) }));

  // Load deposit % for display (one-time fetch).
  useEffect(() => {
    let cancelled = false;
    fetchSettings()
      .then((s) => {
        if (!cancelled) setSettings(s);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Quote the delivery fee once the address is complete (debounced).
  useEffect(() => {
    const parts = { street: form.street, city: form.city, state: form.state, zip: form.zip };
    let cancelled = false;
    const timer = setTimeout(async () => {
      if (!(parts.street && parts.city && parts.state && /^\d{5}$/.test(parts.zip))) {
        setQuote(null);
        setQuoteStatus("idle");
        return;
      }
      setQuoteStatus("loading");
      try {
        const q = await fetchDeliveryQuote(parts);
        if (!cancelled) {
          setQuote(q);
          setQuoteStatus("loaded");
        }
      } catch {
        if (!cancelled) {
          setQuote(null);
          setQuoteStatus("error");
        }
      }
    }, 700);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [form.street, form.city, form.state, form.zip]);

  const handleSelectDate = (date) => {
    setSelectedDate(date ?? null);
    setSubmitError(null);
    if (!date) {
      setAvailStatus("idle");
      setAvail(null);
      return;
    }
    const iso = toISODate(date);
    setAvailStatus("loading");
    setAvailError(null);
    checkCartAvailability(iso, items)
      .then((result) => {
        setAvail(result);
        setAvailStatus("loaded");
      })
      .catch((err) => {
        setAvailError(err.message);
        setAvailStatus("error");
      });
  };

  if (items.length === 0) {
    return (
      <section className="checkout-page">
        <Container narrow>
          <SeoHead title="Checkout" path="/checkout" />
          <h1 className="checkout-page__title">Checkout </h1>
          <p className="checkout-page__empty">
            Your cart is empty. <Link to="/rentals">Browse rentals</Link> to get started.
          </p>
        </Container>
      </section>
    );
  }

  const deliverable = quoteStatus === "loaded" && quote?.serviceable;
  const deliveryFeeCents = deliverable ? quote.feeCents : 0;
  const totalCents = subtotal + deliveryFeeCents;
  const depositCents = Math.round((totalCents * (settings.depositPct ?? 30)) / 100);
  const payNowCents = paymentMode === "DEPOSIT" ? depositCents : totalCents;
  const balanceCents = totalCents - payNowCents;

  const dateOk = availStatus === "loaded" && avail?.bookable;
  const zipOk = /^\d{5}$/.test(form.zip);
  const detailsOk =
    form.name &&
    form.email &&
    form.phone &&
    form.street &&
    form.city &&
    form.state &&
    zipOk &&
    form.dropoffLatest &&
    form.pickupEarliest;
  const canContinue = Boolean(selectedDate && dateOk && detailsOk && deliverable && !submitting);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canContinue) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const { url } = await startCheckout({
        eventDate: toISODate(selectedDate),
        lines: items.map((i) => ({ kind: i.kind, slug: i.slug, quantity: i.quantity })),
        customer: {
          name: form.name,
          email: form.email,
          phone: form.phone,
          street: form.street,
          unit: form.unit,
          city: form.city,
          state: form.state,
          zip: form.zip,
          notes: form.notes,
          dropoffLatest: form.dropoffLatest,
          pickupEarliest: form.pickupEarliest,
          pickupSameDay: form.pickupSameDay,
        },
        paymentMode,
      });
      window.location.href = url; // redirect to Stripe Checkout
    } catch (err) {
      if (err.status === 409) {
        setSubmitError(
          err.shortfalls?.length
            ? `No longer available for this date: ${err.shortfalls
                .map((s) => s.name)
                .join(", ")}. Please pick another date or reduce quantities.`
            : err.message
        );
        // Re-check so the calendar feedback updates.
        handleSelectDate(selectedDate);
      } else {
        setSubmitError(err.message || "Something went wrong. Please try again.");
      }
      setSubmitting(false);
    }
  };

  return (
    <section className="checkout-page">
      <Container>
        <SeoHead title="Checkout" description="Book your event rentals online." path="/checkout" />
        <h1 className="checkout-page__title">Checkout (DO NOT PLACE ORDER! ONLINE BOOKING STILL IN DEVELOPMENT)</h1>

        <form className="checkout-grid" onSubmit={handleSubmit}>
          <div className="checkout-main">
            {/* Step 1 — date */}
            <div className="checkout-section">
              <h2 className="checkout-section__title">Choose your event date</h2>
              <DayPicker
                mode="single"
                selected={selectedDate}
                onSelect={handleSelectDate}
                disabled={{ before: startOfToday() }}
                weekStartsOn={0}
              />
              <div className="checkout-avail" role="status" aria-live="polite">
                {availStatus === "loading" && <p>Checking availability…</p>}
                {availStatus === "error" && <p className="checkout-avail--bad">{availError}</p>}
                {availStatus === "loaded" &&
                  avail &&
                  (avail.bookable ? (
                    <p className="checkout-avail--good">
                      Everything in your cart is available on {formatDateLong(avail.date)}.
                    </p>
                  ) : (
                    <div className="checkout-avail--bad">
                      {!avail.dayBookable ? (
                        <p>
                          {formatDateLong(avail.date)} is unavailable for delivery. Please choose
                          another date.
                        </p>
                      ) : (
                        <>
                          <p>
                            Some items aren’t available on {formatDateLong(avail.date)} in the quantity
                            you selected. Try another date, reduce quantities, or call us.
                          </p>
                          <ul>
                            {avail.lines
                              .filter((l) => !l.ok)
                              .map((l) => (
                                <li key={l.slug}>{l.name}</li>
                              ))}
                          </ul>
                        </>
                      )}
                    </div>
                  ))}
              </div>
            </div>

            {/* Step 2 — delivery windows */}
            <div className="checkout-section">
              <h2 className="checkout-section__title">Delivery &amp; pickup</h2>
              <p className="checkout-hint">
                What is the latest you need us to be there by and what is the earliest we can come and pick up your equipment?
                These are preferences, <strong>we’ll call to confirm exact times</strong>.
              </p>
              <div className="checkout-fields">
                <label className="checkout-field">
                  <span>Latest drop-off time needed</span>
                  <select value={form.dropoffLatest} onChange={update("dropoffLatest")} required>
                    {DROPOFF_OPTIONS.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="checkout-field">
                  <span>Earliest pickup time</span>
                  <select value={form.pickupEarliest} onChange={update("pickupEarliest")} required>
                    {PICKUP_OPTIONS.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="checkout-checkbox">
                <input type="checkbox" checked={form.pickupSameDay} onChange={update("pickupSameDay")} />
                <span>Same-day pickup if possible (6-8 PM)</span>
              </label>
            </div>

            {/* Step 3 — details */}
            <div className="checkout-section">
              <h2 className="checkout-section__title">Your details</h2>
              <div className="checkout-fields">
                <label className="checkout-field checkout-field--wide">
                  <span>Full name</span>
                  <input type="text" autoComplete="name" value={form.name} onChange={update("name")} required />
                </label>
                <label className="checkout-field">
                  <span>Email</span>
                  <input type="email" autoComplete="email" value={form.email} onChange={update("email")} required />
                </label>
                <label className="checkout-field">
                  <span>Phone</span>
                  <input type="tel" autoComplete="tel" value={form.phone} onChange={update("phone")} required />
                </label>
                <label className="checkout-field checkout-field--wide">
                  <span>Street address</span>
                  <input type="text" autoComplete="address-line1" value={form.street} onChange={update("street")} required />
                </label>
                <label className="checkout-field">
                  <span>
                    Apt / Unit <span className="checkout-optional">(optional)</span>
                  </span>
                  <input type="text" autoComplete="address-line2" value={form.unit} onChange={update("unit")} />
                </label>
                <label className="checkout-field">
                  <span>City</span>
                  <input
                    type="text"
                    list="service-cities"
                    autoComplete="address-level2"
                    value={form.city}
                    onChange={update("city")}
                    required
                  />
                  <datalist id="service-cities">
                    {business.serviceAreas.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </label>
                <label className="checkout-field">
                  <span>State</span>
                  <input type="text" autoComplete="address-level1" maxLength={2} value={form.state} onChange={updateState} required />
                </label>
                <label className="checkout-field">
                  <span>ZIP code</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="postal-code"
                    maxLength={5}
                    value={form.zip}
                    onChange={updateZip}
                    aria-invalid={form.zip !== "" && !zipOk}
                    required
                  />
                  {form.zip !== "" && !zipOk && (
                    <span className="checkout-field__error">Enter a 5-digit ZIP.</span>
                  )}
                </label>
                <label className="checkout-field checkout-field--wide">
                  <span>
                    Delivery notes <span className="checkout-optional">(optional)</span>
                  </span>
                  <textarea
                    rows={2}
                    value={form.notes}
                    onChange={update("notes")}
                    placeholder=""
                  />
                </label>
              </div>
            </div>

            {/* Step 4 — payment option */}
            <div className="checkout-section">
              <h2 className="checkout-section__title">Payment</h2>
              <div className="checkout-payopts">
                <label className={`checkout-payopt ${paymentMode === "FULL" ? "is-selected" : ""}`}>
                  <input
                    type="radio"
                    name="paymentMode"
                    value="FULL"
                    checked={paymentMode === "FULL"}
                    onChange={() => setPaymentMode("FULL")}
                  />
                  <span className="checkout-payopt__title">Pay in full now</span>
                  <span className="checkout-payopt__amount">{formatCents(totalCents)}</span>
                </label>
                <label className={`checkout-payopt ${paymentMode === "DEPOSIT" ? "is-selected" : ""}`}>
                  <input
                    type="radio"
                    name="paymentMode"
                    value="DEPOSIT"
                    checked={paymentMode === "DEPOSIT"}
                    onChange={() => setPaymentMode("DEPOSIT")}
                  />
                  <span className="checkout-payopt__title">Pay {settings.depositPct}% deposit now</span>
                  <span className="checkout-payopt__amount">{formatCents(depositCents)}</span>
                  <span className="checkout-payopt__sub">
                    {formatCents(totalCents - depositCents)} balance collected on delivery (Cash, Zelle, Apple Pay only)
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Summary */}
          <aside className="checkout-summary">
            <h2 className="checkout-summary__title">Order summary</h2>
            <ul className="checkout-summary__list">
              {items.map((i) => (
                <li key={`${i.kind}:${i.slug}`}>
                  <span className="checkout-summary__item">
                    <span className="checkout-summary__item-name">{i.name}</span>
                    <span className="checkout-summary__item-calc">
                      {i.quantity} × {formatCents(i.unitPriceCents)}
                    </span>
                  </span>
                  <span>{formatCents(i.unitPriceCents * i.quantity)}</span>
                </li>
              ))}
            </ul>

            <div className="checkout-summary__lines">
              <div className="checkout-summary__line">
                <span>Subtotal</span>
                <span>{formatCents(subtotal)}</span>
              </div>
              <div className="checkout-summary__line">
                <span>Delivery</span>
                <span>
                  {quoteStatus === "idle" && <span className="checkout-summary__muted">enter address</span>}
                  {quoteStatus === "loading" && <span className="checkout-summary__muted">calculating…</span>}
                  {quoteStatus === "error" && <span className="checkout-avail--bad">check address</span>}
                  {quoteStatus === "loaded" &&
                    (quote?.serviceable ? (
                      deliveryFeeCents === 0 ? "FREE" : formatCents(deliveryFeeCents)
                    ) : (
                      <span className="checkout-avail--bad">call us</span>
                    ))}
                </span>
              </div>
              <div className="checkout-summary__line checkout-summary__line--muted">
                <span>Tax</span>
                <span>Calculated at payment</span>
              </div>
            </div>

            {quoteStatus === "loaded" && quote && !quote.serviceable && (
              <p className="checkout-summary__error">
                {quote.reason === "too_far"
                  ? `That address is outside our delivery area. Please call ${business.phone} to book.`
                  : "We couldn't verify that address. Please double-check it, or call us to book."}
              </p>
            )}
            {quoteStatus === "error" && (
              <p className="checkout-summary__error">
                Couldn't check delivery for that address. Please verify it or call us.
              </p>
            )}

            <div className="checkout-summary__row">
              <span>Due now</span>
              <span className="checkout-summary__amount">{formatCents(payNowCents)}</span>
            </div>
            {balanceCents > 0 && (
              <p className="checkout-summary__note">
                {formatCents(balanceCents)} balance collected on delivery.
              </p>
            )}

            {submitError && <p className="checkout-summary__error">{submitError}</p>}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="checkout-summary__cta"
              disabled={!canContinue}
            >
              {submitting ? "Redirecting…" : "Continue to payment"}
            </Button>
            {!canContinue && !submitting && (
              <p className="checkout-summary__hint">
                Pick an available date and fill in your details to continue.
              </p>
            )}
            <Link to="/cart" className="checkout-summary__back">
              <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true" focusable="false">
                <path d="M10 3L5 8l5 5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Back to cart
            </Link>
          </aside>
        </form>
      </Container>
    </section>
  );
}
