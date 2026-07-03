import { useState, useRef, useEffect } from "react";
import Button from "../ui/Button";
import { useCart } from "../../store/cart";

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
      {added ? "Added to cart" : label}
    </Button>
  );
}
