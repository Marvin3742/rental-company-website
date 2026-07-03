import { useEffect, useState } from "react";
import { adminMe, adminLogout } from "../../lib/admin";
import AdminLogin from "./AdminLogin";
import BookingsPanel from "./BookingsPanel";
import InventoryPanel from "./InventoryPanel";
import PackagesPanel from "./PackagesPanel";
import BlackoutsPanel from "./BlackoutsPanel";
import SettingsPanel from "./SettingsPanel";
import "./Admin.css";

const TABS = [
  { id: "bookings", label: "Bookings", Panel: BookingsPanel },
  { id: "inventory", label: "Inventory", Panel: InventoryPanel },
  { id: "packages", label: "Packages", Panel: PackagesPanel },
  { id: "blackouts", label: "Blackout dates", Panel: BlackoutsPanel },
  { id: "settings", label: "Settings", Panel: SettingsPanel },
];

export default function AdminApp() {
  const [auth, setAuth] = useState("checking"); // checking | authed | anon
  const [email, setEmail] = useState("");
  const [tab, setTab] = useState("bookings");

  useEffect(() => {
    adminMe()
      .then((me) => {
        setEmail(me.email);
        setAuth("authed");
      })
      .catch(() => setAuth("anon"));
  }, []);

  if (auth === "checking") {
    return <div className="admin-loading">Loading…</div>;
  }

  if (auth === "anon") {
    return (
      <AdminLogin
        onLoggedIn={(loggedInEmail) => {
          setEmail(loggedInEmail);
          setAuth("authed");
        }}
      />
    );
  }

  const ActivePanel = TABS.find((t) => t.id === tab).Panel;

  return (
    <div className="admin">
      <aside className="admin__sidebar">
        <div className="admin__brand">
          <img src="/images/Solimar.webp" alt="Solimar" className="admin__logo" />
        </div>

        <nav className="admin__nav">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`admin__nav-item ${tab === t.id ? "is-active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className="admin__account">
          <span className="admin__email">{email}</span>
          <button
            type="button"
            className="admin__logout"
            onClick={() =>
              adminLogout()
                .catch(() => {})
                .finally(() => setAuth("anon"))
            }
          >
            Log out
          </button>
        </div>
      </aside>

      <main className="admin__main">
        <ActivePanel />
      </main>
    </div>
  );
}
