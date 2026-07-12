// Chronological "play next" chains for every engine. Keeps the retention loop
// in one place so Results screens don't each hard-code their own map.

export interface NextScenarioHint {
  id: string;
  blurb: string;
}

/** US presidential timeline (scenario ids match SCENARIOS). */
export const US_NEXT_SCENARIO: Record<string, NextScenarioHint> = {
  "2000": { id: "2004", blurb: "Continue the timeline: the wartime election" },
  "2004": { id: "2008", blurb: "Continue the timeline: the crash of 2008" },
  "2008": { id: "2012", blurb: "Continue the timeline: defend the coalition" },
  "2012": { id: "2016", blurb: "Continue the timeline: hold the blue wall" },
  "2016": { id: "2020", blurb: "Continue the timeline: the pandemic election" },
  "2020": { id: "2024", blurb: "Continue the timeline: the 2024 rematch" },
  "2024": { id: "2000", blurb: "Try a different era: the Florida recount awaits" },
};

/** UK general elections in chronological order (wraps at the end). */
const UK_CHAIN: { id: string; blurb: string }[] = [
  { id: "1951", blurb: "Continue the timeline: Churchill's last roar" },
  { id: "1964", blurb: "Continue the timeline: thirteen wasted years" },
  { id: "1966", blurb: "Continue the timeline: the white heat mandate" },
  { id: "1970", blurb: "Continue the timeline: the poll that lied" },
  { id: "1974feb", blurb: "Continue the timeline: who governs Britain?" },
  { id: "1974oct", blurb: "Continue the timeline: back for a majority" },
  { id: "1979", blurb: "Continue the timeline: the Winter of Discontent" },
  { id: "1983", blurb: "Continue the timeline: the Falklands landslide" },
  { id: "1987", blurb: "Continue the timeline: boom South, bust North" },
  { id: "1992", blurb: "Continue the timeline: the election Labour was sure to win" },
  { id: "1997", blurb: "Continue the timeline: things can only get better" },
  { id: "2001", blurb: "Continue the timeline: the quiet landslide" },
  { id: "2005", blurb: "Continue the timeline: Iraq's shadow" },
  { id: "2010", blurb: "Continue the timeline: I agree with Nick" },
  { id: "2015", blurb: "Continue the timeline: the polls were wrong" },
  { id: "2017", blurb: "Continue the timeline: the snap that backfired" },
  { id: "2019", blurb: "Continue the timeline: Get Brexit Done" },
  { id: "2024", blurb: "Continue the timeline: fourteen years later" },
];

export const UK_NEXT_SCENARIO: Record<string, NextScenarioHint> = Object.fromEntries(
  UK_CHAIN.map((entry, i) => {
    const next = UK_CHAIN[(i + 1) % UK_CHAIN.length]!;
    return [entry.id, { id: next.id, blurb: next.blurb }];
  }),
);

/** Country packs: chronological within each country, wrap to earliest. */
const COUNTRY_CHAINS: Record<string, { id: string; blurb: string }[]> = {
  CA: [
    { id: "2021", blurb: "Continue the timeline: the pandemic snap" },
    { id: "2025", blurb: "Continue the timeline: the tariff-war rematch" },
  ],
  DE: [
    { id: "2021", blurb: "Continue the timeline: the traffic-light era" },
    { id: "2025", blurb: "Continue the timeline: the centre holds?" },
  ],
  FR: [
    { id: "2017", blurb: "Continue the timeline: En Marche!" },
    { id: "2022", blurb: "Continue the timeline: the rematch with Le Pen" },
    { id: "2027", blurb: "Continue the timeline: the Republic's runoff" },
  ],
  AU: [
    { id: "2022", blurb: "Continue the timeline: the teal wave" },
    { id: "2025", blurb: "Continue the timeline: hold the middle" },
  ],
};

export function countryNextScenario(
  countryId: string,
  electionId: string,
): NextScenarioHint | null {
  const chain = COUNTRY_CHAINS[countryId];
  if (!chain || chain.length === 0) return null;
  const idx = chain.findIndex((e) => e.id === electionId);
  if (idx < 0) return chain[0] ?? null;
  const next = chain[(idx + 1) % chain.length]!;
  return { id: next.id, blurb: next.blurb };
}
