import Container from "../ui/Container";
import Button from "../ui/Button";
import BookButton from "../ui/BookButton";
import { business, hero } from "../../data/content";
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
            {hero.titleLine1}
            <br />
            <span className="hero__accent">{hero.titleAccent}</span>
          </h1>
          <p className="hero__subtitle">{hero.subtitle}</p>
          <div className="hero__actions">
            <BookButton size="lg" label={hero.primaryCta} showNumber={false} />
            <Button to="/rentals" variant="ghost" size="lg">
              {hero.secondaryCta}
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
