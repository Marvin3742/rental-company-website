import SeoHead from "../lib/seo";
import Container from "../components/ui/Container";
import SectionHeading from "../components/ui/SectionHeading";
import BookButton from "../components/ui/BookButton";
import Image from "../components/ui/Image";
import FaqAccordion from "../components/faq/FaqAccordion";
import { about, faqSection as faqSectionContent, business } from "../data/content";
import { telHref, formatPhone } from "../lib/format";
import "./AboutFaqPage.css";

export default function AboutFaqPage() {
  return (
    <>
      <SeoHead
        title="About & FAQ"
        description={about.seo.description}
        path="/about"
      />

      <section className="about">
        <Container>
          <div className="about__grid">
            <div className="about__copy">
              <span className="about__eyebrow">{about.eyebrow}</span>
              <h1 className="about__headline">{about.headline}</h1>
              {about.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
              <p className="about__mission">{about.mission}</p>
              <p className="about__closer">{about.closer}</p>
              <BookButton size="lg" />
            </div>

            <div className="about__media">
              <Image src="/images/about/naples-pier.jpg" alt="Solimar Party Rentals setup" eager />
            </div>

          </div>
        </Container>
      </section>

      <section className="faq-section">
        <Container narrow>
          <SectionHeading
            eyebrow={faqSectionContent.eyebrow}
            title={faqSectionContent.title}
            subtitle={faqSectionContent.subtitle}
          />
          <FaqAccordion />

          <div className="faq-section__close">
            <p>{faqSectionContent.followUpLine1}</p>
            <p>
              Call us at{" "}
              <a href={telHref(business.phone)}>{formatPhone(business.phone)}</a>{" "}
              {faqSectionContent.followUpLine2}
            </p>
          </div>
        </Container>
      </section>
    </>
  );
}
