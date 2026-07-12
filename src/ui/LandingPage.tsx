import { useMemo, useState, type ReactNode } from "react";
import { PAYWALL_ENABLED, SCENARIO_REGISTRY, type CountryCode, type ScenarioMeta } from "@content/scenarioRegistry";
import { PACKS } from "@content/packs";
import { countryCover, scenarioCover } from "@content/covers";
import { useAuthStore } from "@store/authStore";
import { usePackPrices } from "@lib/usePackPrices";
import { UserMenu } from "@ui/auth/UserMenu";
import { DailyCard } from "@ui/DailyCard";
import { EvBar } from "@ui/EvBar";
import { Sparkline } from "@ui/Sparkline";
import {
  Vote, Lock, Play, Trophy, KeyRound, ChevronLeft, ChevronRight, Check, X, ShoppingBag,
  LineChart, Mic2, Globe2, MessageCircleQuestion,
} from "lucide-react";
import { BRAND } from "../brand";

const COUNTRY_NAMES: Record<CountryCode, string> = {
  US: "United States",
  UK: "United Kingdom",
  CA: "Canada",
  DE: "Germany",
  FR: "France",
  AU: "Australia",
};

const COUNTRY_BLURBS: Record<CountryCode, string> = {
  US: "Winner-take-all duels for 270 electoral votes.",
  UK: "Multiparty FPTP: coalitions, landslides, hung parliaments.",
  CA: "343 seats, five parties, coast to coast to coast.",
  DE: "Proportional Bundestag politics and the firewall.",
  FR: "The two-round runoff for the Élysée.",
  AU: "Preferential voting across 150 seats.",
};

export type LandingDestination =
  | { kind: "us"; scenarioId: string }   // native id, e.g. "2024"
  | { kind: "uk"; electionId?: string }
  | { kind: "country"; countryId: string; electionId?: string }
  | { kind: "leaderboard" }
  | { kind: "daily" }                    // App resolves via dailyAssignment()
  | { kind: "legal"; tab?: "privacy" | "terms" };

const DIFF_COLOR: Record<ScenarioMeta["difficulty"], string> = {
  easy: "var(--green)",
  medium: "var(--gold)",
  hard: "var(--rose)",
};

function CoverImg({ src, alt, tall }: { src?: string; alt: string; tall?: boolean }) {
  if (!src) return null;
  return (
    <img
      className={`scenario-cover${tall ? " tall" : ""}`}
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
    />
  );
}

function ScenarioCard({ s, unlocked, onPlay, onLocked, showCover = true }: {
  s: ScenarioMeta;
  unlocked: boolean;
  onPlay: () => void;
  onLocked: () => void;
  showCover?: boolean;
}) {
  const cover = showCover ? scenarioCover(s.scenarioId) : undefined;
  return (
    <button
      type="button"
      className={`scenario-card${cover ? " has-cover" : ""}`}
      style={{ position: "relative", textAlign: "left", alignItems: cover ? "stretch" : "flex-start", opacity: unlocked ? 1 : 0.75, minHeight: cover ? undefined : 96 }}
      onClick={unlocked ? onPlay : onLocked}
      title={s.description}
    >
      <CoverImg src={cover} alt="" />
      <span className="row" style={{ gap: 8, alignItems: "center", width: "100%" }}>
        <span style={{ fontSize: 18 }}>{s.flag}</span>
        <span className="scenario-year" style={{ fontSize: 15 }}>{s.label.split("·")[0].trim()}</span>
        <span style={{ marginLeft: "auto", display: "inline-flex", gap: 6, alignItems: "center" }}>
          <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: DIFF_COLOR[s.difficulty] }}>{s.difficulty}</span>
          {s.free && PAYWALL_ENABLED ? (
            <span style={{ fontSize: 10, fontWeight: 800, color: "var(--green)", border: "1px solid var(--green)", borderRadius: 4, padding: "1px 5px" }}>FREE</span>
          ) : !unlocked ? (
            <Lock size={13} style={{ color: "var(--gold)" }} />
          ) : (
            <Play size={13} style={{ color: "var(--green)" }} />
          )}
        </span>
      </span>
      <span className="scenario-match" style={{ fontWeight: 700 }}>{s.label.split("·")[1]?.trim() ?? s.label}</span>
      <span className="muted small" style={{ fontSize: 11, lineHeight: 1.4 }}>{s.description}</span>
      {(s.scenarioId === "us-1984" || s.scenarioId === "uk-1983" || s.scenarioId === "uk-1997" || s.scenarioId === "uk-2001" || s.scenarioId === "uk-2024" || s.scenarioId === "fr-2017") && (
        <span className="muted small" style={{ fontSize: 10, color: "var(--rose)" }}>Historical tide</span>
      )}
      {s.scenarioId === "uk-2017" && (
        <span className="muted small" style={{ fontSize: 10, color: "var(--gold)" }}>Coin-flip election</span>
      )}
      {!unlocked && (
        <span className="muted small" style={{ fontSize: 10, color: "var(--gold)" }}>
          <KeyRound size={10} style={{ verticalAlign: "-1px" }} /> Unlock with a code
        </span>
      )}
    </button>
  );
}

// Sample polling swing used only to illustrate the mechanic on the landing
// page. Not tied to any real scenario or player data.
const SAMPLE_POLL_TREND = [0.47, 0.49, 0.48, 0.51, 0.53, 0.52, 0.55];

// Mock projection shape (same type EvBar takes in-game) used purely as an
// illustration of the electoral tally bar. Numbers are made up.
const SAMPLE_PROJECTION = {
  ev: { dem: 236, rep: 235 },
  tossupEv: 67,
} as unknown as Parameters<typeof EvBar>[0]["projection"];

function FeatureBlock({
  icon, title, blurb, children,
}: { icon: ReactNode; title: string; blurb: string; children: ReactNode }) {
  return (
    <div className="feature-card">
      <div className="feature-illustration">{children}</div>
      <span className="feature-icon">{icon}</span>
      <h3>{title}</h3>
      <p className="muted small" style={{ lineHeight: 1.5 }}>{blurb}</p>
    </div>
  );
}

function FeaturesSection() {
  return (
    <div className="field" style={{ margin: "8px 0 0" }}>
      <div className="feature-grid">
        <FeatureBlock
          icon={<LineChart size={18} />}
          title="Polling that moves like the real thing"
          blurb="Every rally, ad buy, and news cycle nudges a state's polling average. Track the swing turn by turn instead of watching a single fixed number."
        >
          <Sparkline values={SAMPLE_POLL_TREND} color="var(--dem-bright)" />
        </FeatureBlock>
        <FeatureBlock
          icon={<Mic2 size={18} />}
          title="Debates and events change the race"
          blurb="Scripted debates, scandals, and endorsements land on the calendar and shift the electoral map. The tally bar updates live as tossup states break."
        >
          <EvBar projection={SAMPLE_PROJECTION} />
        </FeatureBlock>
        <FeatureBlock
          icon={<Globe2 size={18} />}
          title="Six countries, six voting systems"
          blurb="US electoral college duels, UK multiparty first-past-the-post with hung parliaments, French two-round runoffs, German proportional Bundestag seats, and more."
        >
          <div className="feature-flags">
            {["\u{1F1FA}\u{1F1F8}", "\u{1F1EC}\u{1F1E7}", "\u{1F1E9}\u{1F1EA}", "\u{1F1EB}\u{1F1F7}", "\u{1F1E8}\u{1F1E6}", "\u{1F1E6}\u{1F1FA}"].map((f) => (
              <span key={f}>{f}</span>
            ))}
          </div>
        </FeatureBlock>
      </div>
    </div>
  );
}

const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "What's actually free?",
    a: "Two full scenarios plus a new daily challenge every day, no account and no payment required. Nothing is time limited or ad supported.",
  },
  {
    q: "What do I get if I pay?",
    a: "Scenario packs unlock more elections (extra US years, the UK, Canada, Germany, France, Australia). It's a one time purchase per pack through the Lakeside store, not a subscription.",
  },
  {
    q: "Where do I buy packs?",
    a: `Through lakesidegames.net/store. After checkout the pack unlocks automatically on your account, or you can redeem a code from the "Unlock with a code" prompt on a locked scenario.`,
  },
  {
    q: "Can I play offline or without an account?",
    a: "Yes for the free scenarios and daily challenge: progress saves in your browser. An account is only needed to keep a purchased pack across devices and to appear on leaderboards.",
  },
  {
    q: "What's your refund policy?",
    a: "Refunds for scenario packs follow the Lakeside store's standard policy. Contact Lakeside support through the store or reach us directly if a purchase didn't unlock correctly.",
  },
  {
    q: "What platforms does this run on?",
    a: "It's a browser game: desktop and mobile, any modern browser, nothing to install.",
  },
];

function FaqSection() {
  return (
    <div className="field" style={{ textAlign: "left", margin: "36px 0 0" }}>
      <label><MessageCircleQuestion size={13} style={{ verticalAlign: "-2px", marginRight: 4 }} />Frequently asked</label>
      <div className="faq-list">
        {FAQ_ITEMS.map((item) => (
          <details className="faq-item" key={item.q}>
            <summary>{item.q}</summary>
            <p className="muted small" style={{ lineHeight: 1.55 }}>{item.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}

// Quiet one-line banner for post-redirect notices (Stripe result, Lakeside
// sign-in). Success gets the green edge; cancel stays neutral.
function NoticeBanner() {
  const notice = useAuthStore((s) => s.notice);
  const dismiss = useAuthStore((s) => s.dismissNotice);
  if (!notice) return null;
  const good = notice.kind === "purchase-success" || notice.kind === "lakeside-signed-in";
  const text =
    notice.kind === "purchase-success"
      ? `Payment complete. ${notice.packName ?? "Your pack"} is unlocked on this account.`
      : notice.kind === "purchase-cancelled"
        ? "Checkout cancelled. Nothing was charged."
        : notice.kind === "lakeside-signed-in"
          ? `Signed in as ${notice.username} with your Lakeside Games account.`
          : "That sign in link expired. Try again from the login screen.";
  return (
    <div className={`notice-banner${good ? " good" : ""}`} role="status">
      {good ? <Check size={14} /> : null}
      <span>{text}</span>
      <button className="notice-close" onClick={dismiss} aria-label="Dismiss"><X size={14} /></button>
    </div>
  );
}

export function LandingPage({ onGo }: { onGo: (dest: LandingDestination) => void }) {
  const canPlay = useAuthStore((s) => s.canPlay);
  const unlocked = useAuthStore((s) => s.unlocked);
  const openModal = useAuthStore((s) => s.openModal);
  const user = useAuthStore((s) => s.user);
  const buyPack = useAuthStore((s) => s.buyPack);
  const packPrices = usePackPrices();
  const [country, setCountry] = useState<CountryCode | null>(null);
  const [buyBusy, setBuyBusy] = useState<string | null>(null);
  const [buyError, setBuyError] = useState<string | null>(null);

  const buy = async (packId: string) => {
    if (!user) { openModal("register"); return; }
    setBuyBusy(packId);
    setBuyError(null);
    const err = await buyPack(packId);
    setBuyBusy(null);
    if (err) setBuyError(err);
  };

  // Country-first browsing: one card per country, then that country's
  // elections (newest first) once picked.
  const countries = useMemo(() => {
    const order: CountryCode[] = [];
    for (const s of SCENARIO_REGISTRY) if (!order.includes(s.country)) order.push(s.country);
    return order.map((code) => {
      const rows = SCENARIO_REGISTRY.filter((s) => s.country === code);
      const years = rows.map((r) => r.year);
      return {
        code,
        flag: rows[0].flag,
        name: COUNTRY_NAMES[code],
        blurb: COUNTRY_BLURBS[code],
        count: rows.length,
        from: Math.min(...years),
        to: Math.max(...years),
        cover: countryCover(code),
      };
    });
  }, []);

  const scenarios = useMemo(
    () => (country ? SCENARIO_REGISTRY.filter((s) => s.country === country).sort((a, b) => b.year - a.year) : []),
    [country],
  );

  const free = SCENARIO_REGISTRY.filter((s) => s.free);

  const play = (s: ScenarioMeta) => {
    if (s.engine === "us") onGo({ kind: "us", scenarioId: s.nativeId });
    else if (s.engine === "uk") onGo({ kind: "uk", electionId: s.nativeId });
    else onGo({ kind: "country", countryId: s.country, electionId: s.nativeId });
  };

  const locked = (s: ScenarioMeta) => {
    openModal(user ? "activate" : "login", s.scenarioId);
  };

  return (
    <div className="landing">
      {/* Sticky topbar: game brand left, auth right */}
      <div className="landing-topbar">
        <div className="landing-topbar-inner">
          <span className="landing-brand">
            <span className="mark"><Vote size={18} /></span>{BRAND.name}
          </span>
          <span className="row" style={{ gap: 6 }}>
            <button className="ghost small" onClick={() => { window.location.href = "https://lakesidegames.net/store/"; }}>
              <ShoppingBag size={13} style={{ verticalAlign: "-2px", marginRight: 4 }} />Store
            </button>
            <button className="ghost small" onClick={() => onGo({ kind: "leaderboard" })}>
              <Trophy size={13} style={{ verticalAlign: "-2px", marginRight: 4 }} />Leaderboard
            </button>
            <UserMenu />
          </span>
        </div>
      </div>

      <div className="landing-body">
        <NoticeBanner />
        <header className="landing-hero">
          <div className="kicker">Turn-based election campaign sim · {BRAND.eyebrow}</div>
          <h1>{BRAND.name}</h1>
          <p className="sub">
            Run a real campaign turn by turn: allocate a budget, pick rally states, run ads, survive debates,
            and watch the polling average move in response. {SCENARIO_REGISTRY.length} historical elections
            across {new Set(SCENARIO_REGISTRY.map((s) => s.country)).size} countries.
            {PAYWALL_ENABLED
              ? " Two scenarios and the daily challenge are free forever."
              : " All of them are free to play right now."}
          </p>
        </header>

        <FeaturesSection />

        {/* Daily Challenge: one seeded race, same for everyone, every day */}
        <div className="field" style={{ textAlign: "left", margin: "28px 0 0" }}>
          <DailyCard onPlay={() => onGo({ kind: "daily" })} />
        </div>

        {/* Featured starters, text-led (portraits live in the setup wizard) */}
        <div className="field" style={{ textAlign: "left", margin: "36px 0 0" }}>
          <label>{PAYWALL_ENABLED ? "Play free, no account needed" : "Start here, no account needed"}</label>
          <div className="scenario-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
            {free.map((s) => (
              <ScenarioCard key={s.scenarioId} s={s} unlocked showCover={false} onPlay={() => play(s)} onLocked={() => {}} />
            ))}
          </div>
        </div>

        {/* Full catalog: pick a country, then a date */}
        <div className="field" style={{ textAlign: "left", margin: "36px 0 0" }}>
          <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline" }}>
            <label>
              {country
                ? `${COUNTRY_NAMES[country]}: pick an election`
                : "Browse by country"}
            </label>
            {country && (
              <button className="ghost small" onClick={() => setCountry(null)}>
                <ChevronLeft size={13} style={{ verticalAlign: "-2px" }} /> All countries
              </button>
            )}
          </div>

          {!country ? (
            <div className="scenario-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
              {countries.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  className={`scenario-card${c.cover ? " has-cover" : ""}`}
                  style={{ textAlign: "left", alignItems: c.cover ? "stretch" : "flex-start", minHeight: c.cover ? undefined : 88 }}
                  onClick={() => setCountry(c.code)}
                >
                  <CoverImg src={c.cover} alt="" tall />
                  <span className="row" style={{ gap: 10, alignItems: "center", width: "100%" }}>
                    <span style={{ fontSize: 24 }}>{c.flag}</span>
                    <span className="scenario-year" style={{ fontSize: 16 }}>{c.name}</span>
                    <ChevronRight size={15} style={{ marginLeft: "auto", color: "var(--muted)" }} />
                  </span>
                  <span className="scenario-match" style={{ fontWeight: 700 }}>
                    {c.count === 1 ? `1 election · ${c.to}` : `${c.count} elections · ${c.from}-${c.to}`}
                  </span>
                  <span className="muted small" style={{ fontSize: 11, lineHeight: 1.4 }}>{c.blurb}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="scenario-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
              {scenarios.map((s) => (
                <ScenarioCard
                  key={s.scenarioId}
                  s={s}
                  unlocked={canPlay(s.scenarioId)}
                  onPlay={() => play(s)}
                  onLocked={() => locked(s)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Pricing: honest free vs paid, no fake tiers */}
        <div className="field" style={{ textAlign: "left", margin: "44px 0 0" }}>
          <label>Pricing</label>
          <div className="pricing-grid">
            <div className="pricing-card">
              <h3>Free</h3>
              <p className="pricing-price">$0</p>
              <ul className="pricing-list">
                <li><Check size={13} /> 2 full scenarios, no account needed</li>
                <li><Check size={13} /> A new daily challenge every day</li>
                <li><Check size={13} /> Leaderboards with a free account</li>
              </ul>
              <p className="muted small" style={{ marginTop: 8 }}>No ads, no time limit, no trial.</p>
            </div>
            <div className="pricing-card">
              <h3>Scenario packs</h3>
              <p className="pricing-price">Priced per pack</p>
              <ul className="pricing-list">
                <li><Check size={13} /> {SCENARIO_REGISTRY.length - free.length} additional elections across {PACKS.length} packs</li>
                <li><Check size={13} /> One time purchase, yours to keep, no subscription</li>
                <li><Check size={13} /> Bought and delivered through the Lakeside store</li>
              </ul>
              <button className="ghost small" style={{ marginTop: 8 }} onClick={() => { window.location.href = "https://lakesidegames.net/store/"; }}>
                <ShoppingBag size={13} style={{ verticalAlign: "-2px", marginRight: 4 }} />Browse packs on lakesidegames.net
              </button>
            </div>
          </div>
        </div>

        {/* Packs strip: text-led, no cover art */}
        <div className="field" style={{ textAlign: "left", margin: "36px 0 0" }}>
          <label>{PAYWALL_ENABLED ? "Scenario packs" : "Scenario packs: everything is playable free while we're in open beta"}</label>
          <div className="scenario-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))" }}>
            {PACKS.map((p) => {
              const owned = unlocked.packIds.includes(p.id);
              return (
                <div key={p.id} className={`scenario-card pack-card${owned ? " sel" : ""}`}
                  style={{ textAlign: "left", alignItems: "flex-start" }}>
                  <span className="scenario-year" style={{ fontSize: 14 }}>
                    {p.name} {owned && <Check size={13} style={{ verticalAlign: "-2px", color: "var(--green)" }} />}
                  </span>
                  <span className="scenario-match">{p.scenarios.length} scenarios</span>
                  <span className="muted small" style={{ fontSize: 11 }}>{p.description}</span>
                  <span className="pack-foot">
                    <span className="pack-price">${((packPrices[p.id] ?? p.price) / 100).toFixed(2)}</span>
                    {owned ? (
                      <span className="muted small">Owned</span>
                    ) : PAYWALL_ENABLED ? (
                      <button className="primary small" disabled={buyBusy === p.id} onClick={() => buy(p.id)}>
                        {buyBusy === p.id ? "Opening…" : "Buy"}
                      </button>
                    ) : (
                      <span className="pack-beta-note">Free during open beta</span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
          {buyError && <p className="muted small" style={{ color: "var(--rose)", marginTop: 8 }}>{buyError}</p>}
        </div>

        <FaqSection />

        {/* Footer: legal + studio credit + contact + attribution */}
        <div className="landing-foot">
          <button className="ghost small" onClick={() => onGo({ kind: "legal", tab: "privacy" })}>Privacy</button>
          <button className="ghost small" onClick={() => onGo({ kind: "legal", tab: "terms" })}>Terms</button>
          <a className="ghost small" href={`mailto:support@${BRAND.domain}`}>Contact</a>
          <a className="ghost small" href="https://lakesidegames.net/store/" target="_blank" rel="noopener">Store</a>
          <span className="muted small" title="Coming soon">Discord (coming soon)</span>
          <a className="lakeside-credit" href="https://lakesidegames.net" target="_blank" rel="noopener">
            <img src="lakeside-mark.svg" alt="Lakeside Games logo" width={20} height={20} />
            by Lakeside Games
          </a>
          <span>Cover photos: Wikimedia Commons / public domain</span>
        </div>
      </div>
    </div>
  );
}
