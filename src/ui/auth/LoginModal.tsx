import { useState } from "react";
import { useAuthStore } from "@store/authStore";
import { X } from "lucide-react";
import { LakesideButton, AuthDivider } from "./LakesideButton";
import { Spinner } from "@ui/Skeleton";

export function LoginModal() {
  const login = useAuthStore((s) => s.login);
  const openModal = useAuthStore((s) => s.openModal);
  const closeModal = useAuthStore((s) => s.closeModal);
  const paywallScenarioId = useAuthStore((s) => s.paywallScenarioId);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const err = await login(email, password);
    setBusy(false);
    if (err) { setError(err); return; }
    // Coming from a locked scenario? Move straight to code redemption.
    if (paywallScenarioId) openModal("activate", paywallScenarioId);
    else closeModal();
  };

  return (
    <div className="overlay" onClick={closeModal}>
      <div className="modal" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
        <div className="head">
          <div className="tag">Account</div>
          <h2>Log In</h2>
          <button className="sheet-close" onClick={closeModal} aria-label="Close"><X size={18} /></button>
        </div>
        <div className="body">
          <LakesideButton />
          <AuthDivider />
          <form onSubmit={submit}>
            <div className="field" style={{ textAlign: "left" }}>
              <label>Email</label>
              <input type="email" value={email} required autoFocus onChange={(e) => setEmail(e.target.value)} style={{ width: "100%" }} />
            </div>
            <div className="field" style={{ textAlign: "left" }}>
              <label>Password</label>
              <input type="password" value={password} required onChange={(e) => setPassword(e.target.value)} style={{ width: "100%" }} />
            </div>
            {error && <p className="muted small" style={{ color: "var(--rose)" }}>{error}</p>}
            <button className="primary" type="submit" disabled={busy} style={{ width: "100%", marginTop: 8 }}>
              {busy ? <Spinner label="Logging in…" /> : "Log In"}
            </button>
          </form>
          <p className="muted small" style={{ marginTop: 12, textAlign: "center" }}>
            No account?{" "}
            <button className="su-link" onClick={() => openModal("register", paywallScenarioId)}>Register</button>
            {" "}· Free scenarios never need one.
          </p>
        </div>
      </div>
    </div>
  );
}
