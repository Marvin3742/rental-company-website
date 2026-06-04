import { useState, useEffect } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import clsx from "clsx";
import Container from "../ui/Container";
import { business, nav, features } from "../../data/content";
import { telHref, formatPhone } from "../../lib/format";
import "./Header.css";

const NAV = nav.links.filter((l) => l.to !== "/gallery" || features.showGallery);

export default function Header() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const isHome = location.pathname === "/";

  return (
    <header className={clsx("site-header", isHome && "site-header--over-hero")}>
      <Container className="site-header__inner">
        <Link to="/" className="site-header__brand" aria-label={`${business.name} home`}>
          <span className="site-header__brand-mark" aria-hidden="true">☀</span>
          <span className="site-header__brand-name">{business.name}</span>
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
          <span aria-hidden="true"></span>
          <span>{formatPhone(business.phone)}</span>
        </a>

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
