import type { Issue, IssueId } from "@engine/types";

// ~10 issues. baseSalience 0..1 reflects roughly how dominant each issue was in
// the autumn 2020 discourse. Salience shifts during play via events.
export const ISSUES: Record<IssueId, Issue> = {
  economy: {
    id: "economy",
    name: "The Economy & Jobs",
    baseSalience: 0.85,
    blurb: "Recovery from the pandemic recession, jobs, and the stock market.",
  },
  covid_response: {
    id: "covid_response",
    name: "COVID-19 Response",
    baseSalience: 0.9,
    blurb: "Masks, lockdowns, vaccines, and the federal pandemic response.",
  },
  healthcare: {
    id: "healthcare",
    name: "Healthcare",
    baseSalience: 0.62,
    blurb: "The ACA, pre-existing conditions, and the cost of care.",
  },
  immigration: {
    id: "immigration",
    name: "Immigration",
    baseSalience: 0.48,
    blurb: "The border, DACA, and the family-separation legacy.",
  },
  race_policing: {
    id: "race_policing",
    name: "Race & Policing",
    baseSalience: 0.7,
    blurb: "Policing reform and racial justice after the summer of protest.",
  },
  climate: {
    id: "climate",
    name: "Climate & Energy",
    baseSalience: 0.4,
    blurb: "Wildfires, the Green New Deal, and fracking.",
  },
  taxes: {
    id: "taxes",
    name: "Taxes & Spending",
    baseSalience: 0.45,
    blurb: "Who pays, the 2017 cuts, and stimulus checks.",
  },
  law_and_order: {
    id: "law_and_order",
    name: "Law & Order",
    baseSalience: 0.55,
    blurb: "Crime, unrest in the cities, and 'defund the police'.",
  },
  abortion: {
    id: "abortion",
    name: "Abortion & the Courts",
    baseSalience: 0.5,
    blurb: "The Supreme Court vacancy and the future of Roe.",
  },
  trade: {
    id: "trade",
    name: "Trade & Manufacturing",
    baseSalience: 0.3,
    blurb: "China, tariffs, and the industrial Midwest.",
  },
};

export const ISSUE_IDS = Object.keys(ISSUES) as IssueId[];
