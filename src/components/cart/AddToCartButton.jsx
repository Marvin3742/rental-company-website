import { useState, useRef, useEffect } from "react";
import Button from "../ui/Button";
import { useCart } from "../../store/cart";

const CartIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    <circle cx="9" cy="20" r="1.3" />
    <circle cx="18" cy="20" r="1.3" />
    <path d="M2.5 3.5h2l2.15 10.4a1.6 1.6 0 0 0 1.57 1.28h7.9a1.6 1.6 0 0 0 1.57-1.26L20.5 7H6" />
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    <path d="M4.5 10.5l3.5 3.5L15.5 6.5" />
  </svg>
);

/**
 * Adds a cart entry on click and shows a brief "Added to cart" confirmation.
 * @param entry cart entry (see productEntry/packageEntry in store/cart)
 */
export default function AddToCartButton({
  entry,
  quantity = 1,
  variant = "primary",
  size = "md",
  label = "Add to cart",
  ariaLabel,
  className,
}) {
  const addItem = useCart((s) => s.addItem);
  const [added, setAdded] = useState(false);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const onClick = () => {
    addItem(entry, quantity);
    setAdded(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setAdded(false), 1400);
  };

  return (
    <Button
      variant={added ? "secondary" : variant}
      size={size}
      className={className}
      onClick={onClick}
      aria-label={ariaLabel}
      aria-live="polite"
    >
      {added ? <CheckIcon /> : <CartIcon />}
      {added ? "Added to cart" : label}
    </Button>
  );
}
