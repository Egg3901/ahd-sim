// UK issue set. Salience (0..1) is overridden per election by the scenario (e.g.
// Europe spikes in 2015/2019, cost-of-living leads 2024, the economy/strikes
// dominate the late-70s/80s). Stances live on the party leaders.

export type UkIssueId =
  | "economy"
  | "nhs"
  | "immigration"
  | "europe"
  | "cost_of_living"
  | "crime"
  | "housing"
  | "climate"
  | "scottish_independence"
  | "taxation"
  | "defence";

export interface UkIssue {
  id: UkIssueId;
  name: string;
  baseSalience: number;
  blurb: string;
}

export const UK_ISSUES: UkIssue[] = [
  { id: "economy", name: "The Economy", baseSalience: 0.85, blurb: "Growth, jobs, the cost of borrowing." },
  { id: "nhs", name: "The NHS", baseSalience: 0.8, blurb: "Waiting lists, funding, social care." },
  { id: "immigration", name: "Immigration", baseSalience: 0.65, blurb: "Small boats, net migration, asylum." },
  { id: "europe", name: "Europe / Brexit", baseSalience: 0.4, blurb: "Membership, the deal, rejoin vs diverge." },
  { id: "cost_of_living", name: "Cost of Living", baseSalience: 0.75, blurb: "Inflation, energy bills, wages." },
  { id: "crime", name: "Crime & Policing", baseSalience: 0.5, blurb: "Antisocial behaviour, knife crime, courts." },
  { id: "housing", name: "Housing", baseSalience: 0.55, blurb: "Building, planning, rents, the ladder." },
  { id: "climate", name: "Climate & Energy", baseSalience: 0.45, blurb: "Net zero, bills, green jobs." },
  { id: "scottish_independence", name: "Scottish Independence", baseSalience: 0.3, blurb: "Indyref2, devolution, the Union." },
  { id: "taxation", name: "Tax", baseSalience: 0.6, blurb: "The burden, who pays, public services." },
  { id: "defence", name: "Defence & Foreign Affairs", baseSalience: 0.4, blurb: "Ukraine, NATO, the nuclear deterrent." },
];

export const UK_ISSUES_BY_ID: Record<UkIssueId, UkIssue> = Object.fromEntries(
  UK_ISSUES.map((i) => [i.id, i]),
) as Record<UkIssueId, UkIssue>;

export const UK_ISSUE_IDS = UK_ISSUES.map((i) => i.id);
