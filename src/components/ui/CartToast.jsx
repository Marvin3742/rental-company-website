import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import Image from "./Image";
import { useToasts } from "../../store/toast";
import "./CartToast.css";

const AUTO_DISMISS_MS = 3600;

const CheckIcon = () => (
  <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    <path d="M4.5 10.5l3.5 3.5L15.5 6.5" />
  </svg>
);

const CloseIcon = () => (
  <svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" aria-hidden="true" focusable="false">
    <path d="M5 5l10 10M15 5L5 15" />
  </svg>
);

const ArrowIcon = () => (
  <svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    <path d="M3 8h9M8.5 4l4 4-4 4" />
  </svg>
);

/**
 * A single toast card. Owns its own auto-dismiss timer (paused while hovered
 * or focused so a reaching cursor never loses the "View cart" link) and its
 * own slide-out animation before it asks the store to remove it.
 */
function ToastCard({ toast, onDismiss }) {
  const { name, image, quantity, nonce } = toast;
  const [leaving, setLeaving] = useState(false);
  const timer = useRef(null);
  const pausedRef = useRef(false);

  const beginLeave = () => setLeaving(true);

  const startTimer = () => {
    clearTimeout(timer.current);
    if (pausedRef.current) return;
    timer.current = setTimeout(beginLeave, AUTO_DISMISS_MS);
  };

  // (Re)start the countdown on mount and whenever the item is re-added (nonce
  // bump) or its quantity changes, so a fresh add keeps the card on screen.
  useEffect(() => {
    startTimer();
    return () => clearTimeout(timer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nonce, quantity]);

  const pause = () => {
    pausedRef.current = true;
    clearTimeout(timer.current);
  };
  const resume = () => {
    pausedRef.current = false;
    startTimer();
  };

  return (
    <div
      className={`cart-toast${leaving ? " is-leaving" : ""}`}
      onAnimationEnd={(e) => {
        if (e.animationName === "cart-toast-out") onDismiss();
      }}
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocus={pause}
      onBlur={resume}
    >
      {image && (
        <div className="cart-toast__thumb">
          <Image src={image} alt="" eager />
        </div>
      )}
      <div className="cart-toast__body">
        <p className="cart-toast__heading">
          <span className="cart-toast__check" aria-hidden="true">
            <CheckIcon />
          </span>
          Added to cart
        </p>
        <p className="cart-toast__name">
          {name}
          {quantity > 1 && <span className="cart-toast__qty">&times;{quantity}</span>}
        </p>
        <Link to="/cart" className="cart-toast__link" onClick={beginLeave}>
          View cart
          <ArrowIcon />
        </Link>
      </div>
      <button type="button" className="cart-toast__close" onClick={beginLeave} aria-label="Dismiss notification">
        <CloseIcon />
      </button>
    </div>
  );
}

/**
 * Fixed-position host for cart toasts. Mounted once (in Layout) and rendered
 * through a portal to <body> so it's never clipped by a transformed ancestor
 * and always sits above the page regardless of scroll position.
 */
export default function CartToast() {
  const toasts = useToasts((s) => s.toasts);
  const dismissToast = useToasts((s) => s.dismissToast);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="cart-toast-host" aria-live="polite" aria-atomic="false">
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onDismiss={() => dismissToast(toast.id)} />
      ))}
    </div>,
    document.body
  );
}
