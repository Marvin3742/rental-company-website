import { useState } from "react";
import { adminLogin } from "../../lib/admin";
import "./Admin.css";

export default function AdminLogin({ onLoggedIn }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { email: loggedIn } = await adminLogin(email, password);
      onLoggedIn(loggedIn);
    } catch (err) {
      setError(err.status === 401 ? "Invalid email or password." : err.message);
      setBusy(false);
    }
  };

  return (
    <div className="admin-login">
      <div className="admin-login__inner">
        <img src="/images/Solimar.webp" alt="Solimar" className="admin-login__logo" />
        <form className="admin-login__card" onSubmit={submit}>
          <div className="admin-login__head">
            <h1 className="admin-login__title">Admin sign in</h1>
            <p className="admin-login__subtitle">
              Manage bookings, inventory &amp; packages
            </p>
          </div>
          <label className="admin-login__field">
            <span>Email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          </label>
          <label className="admin-login__field">
            <span>Password</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          {error && <p className="admin-login__error">{error}</p>}
          <button
            type="submit"
            className="admin-btn admin-btn--primary admin-login__submit"
            disabled={busy}
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
