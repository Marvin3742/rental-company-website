import { useState } from "react";
import clsx from "clsx";
import { faqs } from "../../data/faqs";
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
      <div className="faq__list">
        {faqs.map((f, index) => {
          const isOpen = openIndexes.has(index);
          const panelId = `faq-panel-${index}`;
          const buttonId = `faq-button-${index}`;
          return (
            <div
              key={index}
              className={clsx("faq__item", isOpen && "is-open")}
            >
              <h4 className="faq__q">
                <button
                  type="button"
                  id={buttonId}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => toggle(index)}
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
    </div>
  );
}
