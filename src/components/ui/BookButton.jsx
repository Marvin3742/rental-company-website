import { business } from "../../data/business";
import { telHref, formatPhone } from "../../lib/format";
import Button from "./Button";

// Single seam for all "book" CTAs. When real booking software arrives,
// swap this implementation — every CTA on the site updates at once.
export default function BookButton({
  label = "Call to Book",
  variant = "primary",
  size = "md",
  showNumber = true,
  className,
}) {
  const text = showNumber ? `${label} · ${formatPhone(business.phone)}` : label;
  return (
    <Button
      href={telHref(business.phone)}
      variant={variant}
      size={size}
      className={className}
      aria-label={`Call ${formatPhone(business.phone)} to book your party`}
    >
      <span aria-hidden="true"></span>
      {text}
    </Button>
  );
}
