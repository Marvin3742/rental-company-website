import SeoHead from "../lib/seo";
import Container from "../components/ui/Container";
import { business, privacyPolicy } from "../data/content";
import { telHref, formatPhone, mailtoHref } from "../lib/format";
import "./AboutFaqPage.css";
import "./PrivacyPage.css";

// "YYYY-MM-DD" → "November 18, 2026"
const formatUpdated = (iso) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });

export default function PrivacyPage() {
  return (
    <>
      <SeoHead
        title="Privacy Policy"
        description={`How ${business.name} collects and uses your information.`}
        path="/privacy"
      />

      <section className="about privacy">
        <Container narrow>
          <div className="about__copy">
            <h1 className="about__headline">Privacy Policy</h1>
            <p className="privacy__updated">Last updated: {formatUpdated(privacyPolicy.lastUpdated)}</p>
            <p>{privacyPolicy.intro}</p>
            {privacyPolicy.sections.map((s) => (
              <div key={s.heading} className="privacy__section">
                <h2 className="privacy__heading">{s.heading}</h2>
                <p>{s.body}</p>
              </div>
            ))}
            <div className="privacy__section">
              <h2 className="privacy__heading">Contact us</h2>
              <p>
                <a href={mailtoHref(business.email)}>{business.email}</a> ·{" "}
                <a href={telHref(business.phone)} data-track-location="other">
                  {formatPhone(business.phone)}
                </a>{" "}
                · {business.city}
              </p>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
