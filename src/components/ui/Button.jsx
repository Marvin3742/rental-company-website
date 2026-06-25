import clsx from "clsx";
import { Link } from "react-router-dom";
import "./Button.css";

export default function Button({
  children,
  variant = "primary",
  size = "md",
  href,
  to,
  className,
  ...rest
}) {
  const classes = clsx("btn", `btn--${variant}`, `btn--${size}`, className);

  if (to) {
    return (
      <Link to={to} className={classes} {...rest}>
        {children}
      </Link>
    );
  }
  if (href) {
    return (
      <a href={href} className={classes} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" className={classes} {...rest}>
      {children}
    </button>
  );
}
