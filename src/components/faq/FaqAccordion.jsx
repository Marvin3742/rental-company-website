import { useState } from "react";
import clsx from "clsx";
import { faqs, faqCategories } from "../../data/faqs";
import "./FaqAccordion.css";

export default function FaqAccordion() {
  const [openIndexes, setOpenIndexes] = useState(() => new Set());

  function toggle(index) {
    setOpenIndexes((prev) => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  }

  return (
    <div className="faq">
      {faqCategories.map((category) => {
        const items = faqs
          .map((f, i) => ({ ...f, index: i }))
          .filter((f) => f.category === category);
        if (items.length === 0) return null;
        return (
          <section key={category} className="faq__group">
            <h3 className="faq__group-title">{category}</h3>
            <div className="faq__list">
              {items.map((f) => {
                const isOpen = openIndexes.has(f.index);
                const panelId = `faq-panel-${f.index}`;
                const buttonId = `faq-button-${f.index}`;
                return (
                  <div
                    key={f.index}
                    className={clsx("faq__item", isOpen && "is-open")}
                  >
                    <h4 className="faq__q">
                      <button
                        type="button"
                        id={buttonId}
                        aria-expanded={isOpen}
                        aria-controls={panelId}
                        onClick={() => toggle(f.index)}
                      >
                        <span>{f.question}</span>
                        <span className="faq__icon" aria-hidden="true">
                          {isOpen ? "−" : "+"}
                        </span>
                      </button>
                    </h4>
                    <div
                      id={panelId}
                      role="region"
                      aria-labelledby={buttonId}
                      className="faq__a"
                      hidden={!isOpen}
                    >
                      <p>{f.answer}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
