import Container from "../ui/Container";
import { business, footer as footerContent } from "../../data/content";
import { telHref, formatPhone, mailtoHref } from "../../lib/format";
import "./Footer.css";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <Container>
        <div className="site-footer__grid">
          <div>
            <p className="site-footer__brand">
              <img src="/images/Solimar.webp" alt={business.name} className="site-footer__logo" />
            </p>
          </div>

          <div>
            <h3 className="site-footer__heading">{footerContent.contactHeading}</h3>
            <ul className="site-footer__list">
              <li>
                <a href={telHref(business.phone)}>
                  <span aria-hidden="true"></span> {formatPhone(business.phone)}
                </a>
              </li>
              <li>
                <a href={mailtoHref(business.email)}>
                  <span aria-hidden="true"></span> {business.email}
                </a>
              </li>
              <li>
                <a href={business.Facebook} target="_blank" rel="noreferrer">
                  <span aria-hidden="true"></span> Follow us on Facebook
                </a>
              </li>
              <li>
                <a href={"https://www.linkedin.com/in/marvin3742/"} target="_blank" rel="noreferrer">
                  <span aria-hidden="true"></span> Built by Marvin Guerrero-Rangel
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="site-footer__heading">{footerContent.servingHeading}</h3>
            <ul className="site-footer__list">
              {business.serviceAreas.map((area) => (
                <li key={area}>{area}{footerContent.serviceAreaSuffix}</li>
              ))}
            </ul>
            <p className="site-footer__hours">{business.hours}</p>
          </div>
        </div>

        <div className="site-footer__bottom">
          <p>© {year} {business.name}. Family-owned in {business.city}.</p>
          <p>
            {footerContent.bottomCta} —{" "}
            <a href={telHref(business.phone)}>{formatPhone(business.phone)}</a>
          </p>
        </div>
      </Container>
    </footer>
  );
}
