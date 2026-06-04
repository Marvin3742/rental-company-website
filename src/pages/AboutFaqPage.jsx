import SeoHead from "../lib/seo";
import Container from "../components/ui/Container";
import SectionHeading from "../components/ui/SectionHeading";
import BookButton from "../components/ui/BookButton";
import Image from "../components/ui/Image";
import FaqAccordion from "../components/faq/FaqAccordion";
import { about } from "../data/about";
import { business } from "../data/business";
import { telHref, formatPhone } from "../lib/format";
import "./AboutFaqPage.css";

export default function AboutFaqPage() {
  return (
    <>
      <SeoHead
        title={`About & FAQ | ${business.name}`}
        description="Meet the family behind Sunshine Party Rentals. Find answers to common questions about booking, delivery, payment, weather, and safety."
        path="/about"
      />

      <section className="about">
        <Container>
          <div className="about__grid">
            <div className="about__copy">
              <span className="about__eyebrow">About us</span>
              <h1 className="about__headline">{about.headline}</h1>
              {about.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
              <p className="about__mission">{about.mission}</p>
              <p className="about__closer">{about.closer}</p>
              <BookButton size="lg" />
            </div>

          </div>
        </Container>
      </section>

      <section className="faq-section">
        <Container narrow>
          <SectionHeading
            eyebrow="Questions & policies"
            title="Plain answers, no fine print."
            subtitle="If you don't see your question below, just call us — we'd rather chat than have you read fine print."
          />
          <FaqAccordion />

          <div className="faq-section__close">
            <p>Still have a question?</p>
            <p>
              Call us at{" "}
              <a href={telHref(business.phone)}>{formatPhone(business.phone)}</a>{" "}
              — we're happy to help.
            </p>
          </div>
        </Container>
      </section>
    </>
  );
}
