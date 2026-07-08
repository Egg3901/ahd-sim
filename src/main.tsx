import React from "react";
import ReactDOM from "react-dom/client";
import * as Sentry from "@sentry/browser";
import { App } from "./App";
import "./ui/styles.css";

// Error tracking (GlitchTip). Errors only — no performance spans, no replays;
// release is the build SHA so stacks map to a commit. No DSN ⇒ fully inert
// (local dev, tests).
const dsn = import.meta.env.VITE_GLITCHTIP_DSN as string | undefined;
if (dsn) {
  Sentry.init({
    dsn,
    release: (import.meta.env.VITE_RELEASE as string | undefined) ?? "dev",
    tracesSampleRate: 0,
    sendDefaultPii: false,
  });
}

// Privacy-friendly analytics (self-hosted umami). Inert until a website id is
// configured in .env.production — register the site in the umami UI and set
// VITE_UMAMI_WEBSITE_ID (+ optional VITE_UMAMI_SRC).
const umamiId = import.meta.env.VITE_UMAMI_WEBSITE_ID as string | undefined;
if (umamiId) {
  const s = document.createElement("script");
  s.defer = true;
  s.src = (import.meta.env.VITE_UMAMI_SRC as string | undefined) ?? "https://analytics.ahousedividedgame.com/script.js";
  s.dataset.websiteId = umamiId;
  document.head.appendChild(s);
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
