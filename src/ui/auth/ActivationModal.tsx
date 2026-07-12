import { useState } from "react";
import { useAuthStore } from "@store/authStore";
import { SCENARIOS_BY_ID } from "@content/scenarioRegistry";
import { packForScenario, PACKS } from "@content/packs";
import { usePackPrices } from "@lib/usePackPrices";
import { isValidActivationCode, normalizeActivationCode } from "@lib/activationCode";
import { X, KeyRound } from "lucide-react";
import { Spinner } from "@ui/Skeleton";

export function ActivationModal() {
  const activate = useAuthStore((s) => s.activate);
  const user = useAuthStore((s) => s.user);
  const openModal = useAuthStore((s) => s.openModal);
  const closeModal = useAuthStore((s) => s.closeModal);
  const paywallScenarioId = useAuthStore((s) => s.paywallScenarioId);
  const packPrices = usePackPrices();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  const scenario = paywallScenarioId ? SCENARIOS_BY_ID[paywallScenarioId] : undefined;
  const pack = paywallScenarioId ? packForScenario(paywallScenarioId) : undefined;
  const normalized = normalizeActivationCode(code);
  const formatOk = normalized.length === 0 || isValidActivationCode(normalized);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!isValidActivationCode(normalized)) {
      setError("Invalid format: expected CAMP-XXXX-XXXX-XXXX");
      return;
    }
    setBusy(true);
    const out = await activate(normalized);
    setBusy(false);
    if (out.error) { setError(out.error); return; }
    setCode("");
    setSuccess(out.packName ? `${out.packName} unlocked. Every scenario in the pack is now yours.` : "Scenario unlocked.");
  };

  return (
    <div className="overlay" onClick={closeModal}>
      <div className="modal" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
        <div className="head">
          <div className="tag">Unlock</div>
          <h2><KeyRound size={18} style={{ verticalAlign: "-3px", marginRight: 6 }} />Redeem Activation Code</h2>
          <button className="sheet-close" onClick={closeModal} aria-label="Close"><X size={18} /></button>
        </div>
        <div className="body">
          {scenario && (
            <p className="prompt">
              <strong>{scenario.flag} {scenario.label}</strong> is part of{" "}
              <strong>{pack?.name ?? "a scenario pack"}</strong>
              {pack && <> (${((packPrices[pack.id] ?? pack.price) / 100).toFixed(2)})</>}. A pack code unlocks every scenario in it.
            </p>
          )}
          {!user ? (
            <p className="muted">
              You need an account to redeem codes:{" "}
              <button className="su-link" onClick={() => openModal("login", paywallScenarioId)}>log in</button> or{" "}
              <button className="su-link" onClick={() => openModal("register", paywallScenarioId)}>register</button> first.
            </p>
          ) : (
            <form onSubmit={submit}>
              <div className="field" style={{ textAlign: "left" }}>
                <label>Code: CAMP-XXXX-XXXX-XXXX</label>
                <input
                  type="text" value={code} required autoFocus placeholder="CAMP-…"
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  aria-invalid={!formatOk}
                  style={{ width: "100%", fontFamily: "monospace", letterSpacing: 1 }}
                />
              </div>
              {!formatOk && (
                <p className="muted small" style={{ color: "var(--rose)" }}>
                  Use the form CAMP-XXXX-XXXX-XXXX (letters A-Z except O/I/L, digits 2-9).
                </p>
              )}
              {error && <p className="muted small" style={{ color: "var(--rose)" }}>{error}</p>}
              {success && <p className="muted small" style={{ color: "var(--green)" }}>{success}</p>}
              <button className="primary" type="submit" disabled={busy || !formatOk || !normalized} style={{ width: "100%", marginTop: 8 }}>
                {busy ? <Spinner label="Redeeming…" /> : "Redeem"}
              </button>
            </form>
          )}
          <div style={{ marginTop: 16 }}>
            <div className="tag muted small" style={{ marginBottom: 6 }}>AVAILABLE PACKS</div>
            {PACKS.map((p) => (
              <div className="kv" key={p.id}>
                <span className="k">{p.name} · {p.scenarios.length} scenarios</span>
                <span>${((packPrices[p.id] ?? p.price) / 100).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
