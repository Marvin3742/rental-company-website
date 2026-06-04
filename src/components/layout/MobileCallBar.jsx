import { business } from "../../data/business";
import { telHref, formatPhone } from "../../lib/format";
import "./MobileCallBar.css";

export default function MobileCallBar() {
  return (
    <a
      className="mobile-call-bar"
      href={telHref(business.phone)}
      aria-label={`Call us at ${formatPhone(business.phone)}`}
    >
      <span aria-hidden="true" className="mobile-call-bar__icon"></span>
      <span className="mobile-call-bar__label">Call to Book</span>
      <span className="mobile-call-bar__number">{formatPhone(business.phone)}</span>
    </a>
  );
}
