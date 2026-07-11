import { useState } from "react";
import { BRAND } from "../brand";
import { ChevronLeft } from "lucide-react";

// Privacy policy + terms for the game. Plain-language and honest — it only
// claims what the stack actually does (see server/ and main.tsx). Reviewed
// copy is the publisher's responsibility before any paid launch.

const UPDATED = "July 8, 2026";

function Privacy() {
  return (
    <>
      <h3>Privacy Policy</h3>
      <p className="muted small">Last updated {UPDATED}</p>

      <h4>The short version</h4>
      <p>
        You can play {BRAND.name} without an account, and nothing about you leaves your browser except
        anonymous usage counts and error reports. If you create an account, we store the minimum needed
        to run leaderboards: a username, an email address, and a hashed password. We don't run ads,
        we don't use third-party trackers, and we never sell or share your data.
      </p>

      <h4>What we collect</h4>
      <ul>
        <li><strong>No account:</strong> your campaigns and settings are saved in your own browser
          (localStorage / IndexedDB). They never reach our servers.</li>
        <li><strong>With an account:</strong> username, email address, a bcrypt-hashed password (we cannot
          read it), and the scores, achievements, and daily-challenge results you choose to post.
          Your username appears publicly next to your leaderboard entries.</li>
        <li><strong>Analytics:</strong> we self-host a privacy-focused counter (umami). It records page
          views without cookies and without building a profile of you. No data goes to any third-party
          analytics company.</li>
        <li><strong>Error reports:</strong> if the game crashes, a technical report (stack trace, browser
          version, game build) is sent to our own error tracker so we can fix it. Reports are not tied
          to your account.</li>
      </ul>

      <h4>Where it lives</h4>
      <p>
        Account and leaderboard data is stored on our own server in the European Union (Hetzner,
        Germany), with routine encrypted backups. We keep it for as long as your account exists.
      </p>

      <h4>Your rights</h4>
      <p>
        Email us and we will show you, correct, or permanently delete everything tied to your account,
        usually within a few days, always within 30. Deleting your account removes your leaderboard
        entries too.
      </p>

      <h4>Children</h4>
      <p>The game is not directed at children under 13, and we do not knowingly collect their data.</p>

      <h4>Contact</h4>
      <p className="muted">Questions or data requests: <strong>support@{BRAND.domain || "electioneer.example"}</strong></p>
    </>
  );
}

function Terms() {
  return (
    <>
      <h3>Terms of Service</h3>
      <p className="muted small">Last updated {UPDATED}</p>

      <h4>The deal</h4>
      <p>
        {BRAND.name} is a game of historical fiction. Play it, enjoy it, share your results. Scenario
        packs, when sold, are a personal, non-transferable license to play that content on your accounts,
        not ownership of the content itself.
      </p>

      <h4>Fair play</h4>
      <p>
        Leaderboards are shared space. Submitting forged scores, exploiting bugs for ranks, automating
        play, or abusing other players gets your entries removed and can get your account closed.
        Found a bug or exploit? Tell us. We're grateful, not litigious.
      </p>

      <h4>Your account</h4>
      <p>
        You're responsible for keeping your password safe. We can suspend accounts that break these
        terms. You can delete your account at any time (see the privacy policy).
      </p>

      <h4>The content</h4>
      <p>
        Scenarios depict real elections, public figures, and historical events for the purposes of
        simulation, commentary, and education. Candidate ratings and event outcomes are editorial game
        design, not statements of fact. All trademarks belong to their owners.
      </p>

      <h4>No warranty</h4>
      <p>
        The game is provided as-is. We work hard to keep it up and your data safe, but we can't promise
        uninterrupted service, and our total liability is limited to what you paid us in the last
        12 months.
      </p>

      <h4>Changes</h4>
      <p>
        We may update these terms as the game grows; material changes will be noted on this page with a
        new date above.
      </p>
    </>
  );
}

export function LegalPage({ initialTab, onBack }: { initialTab?: "privacy" | "terms"; onBack: () => void }) {
  const [tab, setTab] = useState<"privacy" | "terms">(initialTab ?? "privacy");
  return (
    <div className="center" style={{ alignItems: "flex-start", paddingTop: 18 }}>
      <div className="setup" style={{ maxWidth: 760, textAlign: "left" }}>
        <div className="row" style={{ justifyContent: "space-between", width: "100%", marginBottom: 10 }}>
          <button className="ghost small" onClick={onBack}>
            <ChevronLeft size={13} style={{ verticalAlign: "-2px" }} /> Back to {BRAND.name}
          </button>
          <div className="row" style={{ gap: 4 }}>
            <button className={`ghost small${tab === "privacy" ? " active" : ""}`} onClick={() => setTab("privacy")}>Privacy</button>
            <button className={`ghost small${tab === "terms" ? " active" : ""}`} onClick={() => setTab("terms")}>Terms</button>
          </div>
        </div>
        <div className="card" style={{ lineHeight: 1.55 }}>
          {tab === "privacy" ? <Privacy /> : <Terms />}
        </div>
      </div>
    </div>
  );
}
