import { useSettingsStore } from "@store/settingsStore";
import { armAudio, sfx } from "@lib/sfx";

const SHORTCUTS: { keys: string; does: string }[] = [
  { keys: "Enter / Space", does: "End the week" },
  { keys: "Esc", does: "Close the open window" },
  { keys: "1-9", does: "Pick an action type" },
  { keys: "?", does: "Show this list" },
];

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const soundOn = useSettingsStore((s) => s.soundOn);
  const volume = useSettingsStore((s) => s.volume);
  const reducedMotion = useSettingsStore((s) => s.reducedMotion);
  const hotkeysOn = useSettingsStore((s) => s.hotkeysOn);
  const setSoundOn = useSettingsStore((s) => s.setSoundOn);
  const setVolume = useSettingsStore((s) => s.setVolume);
  const setReducedMotion = useSettingsStore((s) => s.setReducedMotion);
  const setHotkeysOn = useSettingsStore((s) => s.setHotkeysOn);

  const toggleSound = (on: boolean) => {
    armAudio();
    setSoundOn(on);
    if (on) sfx.pollUp();
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal settings" onClick={(e) => e.stopPropagation()}>
        <div className="head">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div>
              <div className="tag">SETTINGS</div>
              <h2>Preferences</h2>
            </div>
            <button className="ghost" onClick={onClose}>Close</button>
          </div>
        </div>
        <div className="body">
          <div className="guide-section">
            <h3>Sound</h3>
            <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
              <span>Sound effects</span>
              <button className="ghost small" onClick={() => toggleSound(!soundOn)} aria-pressed={soundOn}>
                {soundOn ? "On" : "Muted"}
              </button>
            </div>
            <div className="row" style={{ justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
              <span>Volume</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={volume}
                disabled={!soundOn}
                onChange={(e) => setVolume(Number(e.target.value))}
                aria-label="Volume"
              />
            </div>
          </div>

          <div className="guide-section">
            <h3>Motion</h3>
            <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
              <span>Reduce motion</span>
              <button className="ghost small" onClick={() => setReducedMotion(!reducedMotion)} aria-pressed={reducedMotion}>
                {reducedMotion ? "Reduced" : "Normal"}
              </button>
            </div>
            <p className="guide-text">Cuts down on animation and transitions if motion bothers you.</p>
          </div>

          <div className="guide-section">
            <h3>Keyboard shortcuts</h3>
            <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
              <span>Shortcuts enabled</span>
              <button className="ghost small" onClick={() => setHotkeysOn(!hotkeysOn)} aria-pressed={hotkeysOn}>
                {hotkeysOn ? "On" : "Off"}
              </button>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, marginTop: 10 }}>
              <tbody>
                {SHORTCUTS.map((s) => (
                  <tr key={s.keys} style={{ borderTop: "1px solid var(--border)" }}>
                    <td style={{ padding: "6px 8px", fontWeight: 700, whiteSpace: "nowrap" }}>{s.keys}</td>
                    <td style={{ padding: "6px 8px", color: "var(--ink-300)" }}>{s.does}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
