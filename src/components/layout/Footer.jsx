import Container from "../ui/Container";
import { business } from "../../data/business";
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
              <span className="site-footer__mark" aria-hidden="true">☀</span>
              {business.name}
            </p>
            <p className="site-footer__tag">{business.tagline}</p>
          </div>

          <div>
            <h3 className="site-footer__heading">Get in touch</h3>
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
                <a href={business.instagram} target="_blank" rel="noreferrer">
                  <span aria-hidden="true"></span> Instagram
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="site-footer__heading">Serving</h3>
            <ul className="site-footer__list">
              {business.serviceAreas.map((area) => (
                <li key={area}>{area}, FL</li>
              ))}
            </ul>
            <p className="site-footer__hours">{business.hours}</p>
          </div>
        </div>

        <div className="site-footer__bottom">
          <p>© {year} {business.name}. Family-owned in {business.city}.</p>
          <p>
            Call us to book a bundle —{" "}
            <a href={telHref(business.phone)}>{formatPhone(business.phone)}</a>
          </p>
        </div>
      </Container>
    </footer>
  );
}
