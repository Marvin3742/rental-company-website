import { useState } from "react";
import clsx from "clsx";
import { faqs } from "../../data/faqs";
import { useSettings } from "../../lib/settings";
import { settingsCopy } from "../../lib/settingsCopy";
import "./FaqAccordion.css";

export default function FaqAccordion() {
  const [openIndexes, setOpenIndexes] = useState(() => new Set());
  const settings = useSettings();

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
          // Hidden while the fee is off (or settings haven't loaded); skipping it
          // here keeps every other FAQ's index, and so its open state, stable.
          if (f.onlyWithSmallOrderFee && !(settings?.smallOrderFeeCents > 0)) return null;
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
                <p>{settingsCopy(f.answer, settings)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
