import Container from "../ui/Container";
import Button from "../ui/Button";
import BookButton from "../ui/BookButton";
import { business } from "../../data/business";
import "./Hero.css";

export default function Hero() {
  return (
    <section className="hero">
      <div className="hero__bg" aria-hidden="true">
        <img
          src="/images/hero/hero.jpg"
          alt=""
          loading="eager"
          decoding="async"
        />
      </div>

      <Container className="hero__inner">
        <div className="hero__content">
          <span className="hero__eyebrow">
            {business.serviceAreas.join(" · ")}
          </span>
          <h1 className="hero__title">
            Rangel Party
            <br />
            <span className="hero__accent">Rentals</span>
          </h1>
          <p className="hero__subtitle">
            Family-owned party rentals serving Southwest Florida. Tents,
            tables, chairs, and inflatables — delivered and set up for you.
          </p>
          <div className="hero__actions">
            <BookButton size="lg" label="Book Your Party" showNumber={false} />
            <Button to="/rentals" variant="ghost" size="lg">
              View Bundles
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
