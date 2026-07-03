import { useState } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import clsx from "clsx";
import Container from "../ui/Container";
import { business, nav, features } from "../../data/content";
import { telHref, formatPhone } from "../../lib/format";
import { useCart, selectCount } from "../../store/cart";
import "./Header.css";

const NAV = nav.links.filter((l) => l.to !== "/gallery" || features.showGallery);

export default function Header() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const cartCount = useCart(selectCount);

  // Close the mobile menu on navigation. Adjusting state during render in
  // response to a changed value is React's recommended pattern (no effect needed).
  const [prevPath, setPrevPath] = useState(location.pathname);
  if (location.pathname !== prevPath) {
    setPrevPath(location.pathname);
    setOpen(false);
  }

  const isHome = location.pathname === "/";

  return (
    <header className={clsx("site-header", isHome && "site-header--over-hero")}>
      <Container className="site-header__inner">
        <Link to="/" className="site-header__brand" aria-label={`${business.name} home`}>
          <img src="/images/Solimar.webp" alt="" className="site-header__logo" />
        </Link>

        <nav
          className={clsx("site-header__nav", open && "is-open")}
          aria-label="Primary"
        >
          <ul>
            {NAV.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    clsx("site-header__nav-link", isActive && "is-active")
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <a className="site-header__phone" href={telHref(business.phone)}>
          <span>{formatPhone(business.phone)}</span>
        </a>

        <Link
          to="/cart"
          className="site-header__cart"
          aria-label={`Cart${cartCount ? `, ${cartCount} item${cartCount === 1 ? "" : "s"}` : ", empty"}`}
        >
          <span className="site-header__cart-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="20" r="1.3" />
              <circle cx="18" cy="20" r="1.3" />
              <path d="M2.5 3.5h2l2.15 10.4a1.6 1.6 0 0 0 1.57 1.28h7.9a1.6 1.6 0 0 0 1.57-1.26L20.5 7H6" />
            </svg>
          </span>
          {cartCount > 0 && <span className="site-header__cart-count">{cartCount}</span>}
        </Link>

        <button
          type="button"
          className="site-header__toggle"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span className={clsx("burger", open && "is-open")} aria-hidden="true">
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>
      </Container>
    </header>
  );
}
