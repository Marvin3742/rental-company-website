import clsx from "clsx";
import "./SectionHeading.css";

export default function SectionHeading({ eyebrow, title, subtitle, align = "left", className }) {
  return (
    <header className={clsx("section-heading", `section-heading--${align}`, className)}>
      {eyebrow && <span className="section-heading__eyebrow">{eyebrow}</span>}
      <h2 className="section-heading__title">{title}</h2>
      {subtitle && <p className="section-heading__subtitle">{subtitle}</p>}
    </header>
  );
}
