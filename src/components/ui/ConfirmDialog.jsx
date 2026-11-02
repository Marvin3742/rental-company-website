import { useEffect, useId, useRef } from "react";
import Button from "./Button";
import "./ConfirmDialog.css";

/**
 * Modal "are you sure?" dialog on the native <dialog> element, which brings the
 * focus trap, Escape-to-close and the backdrop. The cancel button comes first so
 * it gets the initial focus — a stray Enter or double-click can't confirm.
 */
export default function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  cancelLabel = "Go back",
  busy = false,
  onConfirm,
  onCancel,
}) {
  const ref = useRef(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    const shown = dialog.hasAttribute("open");
    if (open && !shown) {
      if (dialog.showModal) dialog.showModal();
      else dialog.setAttribute("open", ""); // no <dialog> support: show it in place
    } else if (!open && shown) {
      if (dialog.close) dialog.close();
      else dialog.removeAttribute("open");
    }
  }, [open]);

  const cancel = () => {
    if (!busy) onCancel();
  };

  return (
    <dialog
      ref={ref}
      className="confirm-dialog"
      aria-labelledby={titleId}
      onCancel={(e) => {
        // Escape: close through onCancel so `open` stays the source of truth.
        e.preventDefault();
        cancel();
      }}
      // A click on the <dialog> itself (not the panel inside it) is on the backdrop.
      onClick={(e) => e.target === e.currentTarget && cancel()}
    >
      <div className="confirm-dialog__panel">
        <h2 id={titleId} className="confirm-dialog__title">
          {title}
        </h2>
        <div className="confirm-dialog__body">{children}</div>
        <div className="confirm-dialog__actions">
          <Button variant="secondary" onClick={cancel} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button variant="primary" onClick={onConfirm} disabled={busy}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
