import { useState } from "react";
import { useAuthStore } from "@store/authStore";
import { PACKS_BY_ID } from "@content/packs";
import { CircleUser, KeyRound, LogOut } from "lucide-react";

// Top-right auth affordance: Login/Register buttons when signed out, a
// username dropdown (activations, redeem, logout) when signed in.
export function UserMenu() {
  const user = useAuthStore((s) => s.user);
  const unlocked = useAuthStore((s) => s.unlocked);
  const openModal = useAuthStore((s) => s.openModal);
  const logout = useAuthStore((s) => s.logout);
  const [open, setOpen] = useState(false);

  if (!user) {
    return (
      <div className="row" style={{ gap: 6 }}>
        <button className="ghost small" onClick={() => openModal("login")}>Log In</button>
        <button className="primary small" onClick={() => openModal("register")}>Register</button>
      </div>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      <button className="ghost small" onClick={() => setOpen((o) => !o)}>
        <CircleUser size={15} style={{ verticalAlign: "-3px", marginRight: 5 }} />
        {user.username}
      </button>
      {open && (
        <div
          className="card"
          style={{ position: "absolute", right: 0, top: "calc(100% + 6px)", width: 260, zIndex: 60, padding: 14 }}
          onMouseLeave={() => setOpen(false)}
        >
          <div className="muted small" style={{ marginBottom: 8 }}>{user.email}</div>
          <div className="tag muted small">MY ACTIVATIONS</div>
          {unlocked.packIds.length === 0 && unlocked.scenarioIds.length === 0 ? (
            <p className="muted small" style={{ margin: "6px 0 10px" }}>Free scenarios only — redeem a code to unlock more.</p>
          ) : (
            <div style={{ margin: "6px 0 10px" }}>
              {unlocked.packIds.map((p) => (
                <div className="kv" key={p}><span className="k">📦 {PACKS_BY_ID[p]?.name ?? p}</span></div>
              ))}
              {unlocked.scenarioIds.filter((s) => !unlocked.packIds.some((p) => PACKS_BY_ID[p]?.scenarios.includes(s))).map((s) => (
                <div className="kv" key={s}><span className="k">🎫 {s}</span></div>
              ))}
            </div>
          )}
          <div className="row" style={{ gap: 6 }}>
            <button className="ghost small" style={{ flex: 1 }} onClick={() => { setOpen(false); openModal("activate"); }}>
              <KeyRound size={13} style={{ verticalAlign: "-2px", marginRight: 4 }} />Redeem
            </button>
            <button className="ghost small" style={{ flex: 1 }} onClick={() => { setOpen(false); logout(); }}>
              <LogOut size={13} style={{ verticalAlign: "-2px", marginRight: 4 }} />Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
