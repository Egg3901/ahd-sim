// Shared "Next Campaign" retention card used by US / UK / country results.

export function NextCampaignCard({
  title,
  subtitle,
  blurb,
  unlocked,
  ctaLabel,
  lockLabel,
  onPlay,
  onUnlock,
}: {
  title: string;
  subtitle?: string;
  blurb: string;
  unlocked: boolean;
  ctaLabel: string;
  lockLabel: string;
  onPlay: () => void;
  onUnlock: () => void;
}) {
  return (
    <div className="card">
      <h3>Next Campaign</h3>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <div>
          <div style={{ fontWeight: 700 }}>{title}</div>
          {subtitle && <div className="muted small">{subtitle}</div>}
          <div className="muted small">{blurb}{!unlocked ? " · locked" : ""}</div>
        </div>
        {unlocked ? (
          <button className="secondary" onClick={onPlay}>{ctaLabel}</button>
        ) : (
          <button className="secondary" onClick={onUnlock}>{lockLabel}</button>
        )}
      </div>
    </div>
  );
}
