import type { CountryCode } from "@content/scenarioRegistry";

const COUNTRY_FLAGS: Record<CountryCode, string> = {
  US: "🇺🇸",
  UK: "🇬🇧",
  CA: "🇨🇦",
  DE: "🇩🇪",
  FR: "🇫🇷",
  AU: "🇦🇺",
};

const COUNTRY_NAMES: Record<CountryCode, string> = {
  US: "United States",
  UK: "United Kingdom",
  CA: "Canada",
  DE: "Germany",
  FR: "France",
  AU: "Australia",
};

function variantFor(scenarioId: string): number {
  let hash = 2166136261;
  for (const char of scenarioId) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash) % 6;
}

export function ScenarioArt({
  scenarioId,
  country,
  year,
}: {
  scenarioId: string;
  country: CountryCode;
  year: number;
}) {
  const variant = variantFor(scenarioId);
  return (
    <div
      className={`scenario-cover scenario-art art-${country.toLowerCase()} art-v${variant}`}
      data-scenario-art={scenarioId}
      aria-hidden="true"
    >
      <span className="scenario-art-top">
        <span>{COUNTRY_FLAGS[country]} {COUNTRY_NAMES[country]}</span>
        <span>Ballotline archive</span>
      </span>
      <span className="scenario-art-year">{year}</span>
      <span className="scenario-art-title">Campaign file / {scenarioId.toUpperCase()}</span>
      <span className="scenario-art-mark">B</span>
    </div>
  );
}
