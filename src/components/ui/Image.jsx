import clsx from "clsx";

// Thin wrapper so future swaps (CDN, srcset, blur-up) happen in one place.
export default function Image({ src, alt, className, eager = false, ...rest }) {
  return (
    <img
      src={src}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      className={clsx(className)}
      {...rest}
    />
  );
}
