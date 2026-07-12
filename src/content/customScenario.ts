// ─────────────────────────────────────────────────────────────────────────
// CUSTOM SCENARIO — a player-authored election the US engine can run exactly
// like a registry scenario. This module owns the versioned on-disk shape, a
// hand-rolled validator used at every save/load/import boundary, and the
// adapter that turns a CustomScenario into the engine's Scenario record.
// Custom scenarios are always FREE to play (no entitlement gate).
// ─────────────────────────────────────────────────────────────────────────
import type {
  BlocId,
  CandidateTraits,
  EventMode,
  IssueId,
  Party,
  RunningMate,
} from "@engine/types";
import { ISSUE_IDS } from "@content/issues";
import { BLOC_IDS } from "@content/blocs";
import { SCENARIOS, type Scenario, type ScenarioTicket } from "@content/scenarios";

// Bump when the shape changes in a breaking way. validateCustomScenario rejects
// anything it does not know how to read, so old files fail loudly, not silently.
export const CUSTOM_SCENARIO_VERSION = 1;

export const TRAIT_KEYS: (keyof CandidateTraits)[] = [
  "charisma",
  "energy",
  "debatePrep",
  "intelligence",
  "policyKnowledge",
  "debatingSkill",
  "fundraisingProwess",
];

const PARTIES: Party[] = ["Democratic", "Republican"];
const EVENT_MODES: EventMode[] = ["historical", "plausible"];

export interface CustomTicketInput {
  name: string;
  shortName: string;
  party: Party;
  color: string; // hex, e.g. "#2563eb"
  traits: CandidateTraits; // each 0..100
  issuePositions: Record<IssueId, number>; // each -1..1
  baseFavorability: Partial<Record<BlocId, number>>; // each -1..1
}

export interface CustomScenario {
  version: number;
  id: string; // "custom-..."
  label: string; // "1968 · My Race v. Their Race"
  tagline: string; // one-line setup framing
  year: number;
  createdAt: number;
  updatedAt: number;
  dem: CustomTicketInput; // fills the engine's "dem" slot
  rep: CustomTicketInput; // fills the engine's "rep" slot
  // Optional event-deck selection; defaults to "historical" at play time.
  eventMode?: EventMode;
}

export type ValidationResult =
  | { ok: true; value: CustomScenario }
  | { ok: false; errors: string[] };

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

// Fresh, valid defaults so the editor form always starts from a playable state.
export function makeDefaultTicket(side: "dem" | "rep"): CustomTicketInput {
  const dem = side === "dem";
  return {
    name: dem ? "Your Candidate" : "The Opponent",
    shortName: dem ? "Yours" : "Them",
    party: dem ? "Democratic" : "Republican",
    color: dem ? "#2563eb" : "#dc2626",
    traits: {
      charisma: 60,
      energy: 60,
      debatePrep: 60,
      intelligence: 60,
      policyKnowledge: 60,
      debatingSkill: 60,
      fundraisingProwess: 60,
    },
    issuePositions: Object.fromEntries(
      ISSUE_IDS.map((id) => [id, dem ? -0.3 : 0.3]),
    ) as Record<IssueId, number>,
    baseFavorability: {},
  };
}

export function makeDefaultCustomScenario(): CustomScenario {
  const now = Date.now();
  return {
    version: CUSTOM_SCENARIO_VERSION,
    id: newCustomId(),
    label: "My Custom Race",
    tagline: "A campaign of your own making. Ninety days to find 270.",
    year: 2024,
    createdAt: now,
    updatedAt: now,
    dem: makeDefaultTicket("dem"),
    rep: makeDefaultTicket("rep"),
    eventMode: "historical",
  };
}

export function newCustomId(): string {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `custom-${rand}`;
}

export function isCustomScenarioId(id: string | undefined): boolean {
  return !!id && id.startsWith("custom-");
}

function validateTicket(raw: unknown, side: "dem" | "rep", errors: string[]): CustomTicketInput | null {
  const where = side === "dem" ? "your candidate" : "the opponent";
  if (!isObject(raw)) {
    errors.push(`${where}: missing candidate data.`);
    return null;
  }
  const name = raw.name;
  const shortName = raw.shortName;
  if (typeof name !== "string" || name.trim() === "") errors.push(`${where}: name is required.`);
  if (typeof name === "string" && name.length > 40) errors.push(`${where}: name is too long (40 characters max).`);
  if (typeof shortName !== "string" || shortName.trim() === "") errors.push(`${where}: short name is required.`);
  if (typeof shortName === "string" && shortName.length > 16) errors.push(`${where}: short name is too long (16 characters max).`);
  if (!PARTIES.includes(raw.party as Party)) errors.push(`${where}: party must be Democratic or Republican.`);
  if (typeof raw.color !== "string" || !HEX_COLOR.test(raw.color)) errors.push(`${where}: color must be a hex value like #2563eb.`);

  const traits = {} as CandidateTraits;
  if (!isObject(raw.traits)) {
    errors.push(`${where}: traits are missing.`);
  } else {
    for (const key of TRAIT_KEYS) {
      const v = (raw.traits as Record<string, unknown>)[key];
      if (!isFiniteNumber(v)) {
        errors.push(`${where}: trait "${key}" must be a number.`);
      } else if (v < 0 || v > 100) {
        errors.push(`${where}: trait "${key}" must be between 0 and 100.`);
      } else {
        traits[key] = v;
      }
    }
  }

  const issuePositions = {} as Record<IssueId, number>;
  if (!isObject(raw.issuePositions)) {
    errors.push(`${where}: issue positions are missing.`);
  } else {
    for (const id of ISSUE_IDS) {
      const v = (raw.issuePositions as Record<string, unknown>)[id];
      if (!isFiniteNumber(v)) {
        errors.push(`${where}: position on "${id}" must be a number.`);
      } else if (v < -1 || v > 1) {
        errors.push(`${where}: position on "${id}" must be between -1 and 1.`);
      } else {
        issuePositions[id] = v;
      }
    }
  }

  const baseFavorability: Partial<Record<BlocId, number>> = {};
  if (raw.baseFavorability !== undefined) {
    if (!isObject(raw.baseFavorability)) {
      errors.push(`${where}: favorability data is malformed.`);
    } else {
      for (const [k, v] of Object.entries(raw.baseFavorability)) {
        if (!BLOC_IDS.includes(k as BlocId)) {
          errors.push(`${where}: unknown voter bloc "${k}".`);
        } else if (!isFiniteNumber(v)) {
          errors.push(`${where}: favorability for "${k}" must be a number.`);
        } else if (v < -1 || v > 1) {
          errors.push(`${where}: favorability for "${k}" must be between -1 and 1.`);
        } else if (v !== 0) {
          baseFavorability[k as BlocId] = v;
        }
      }
    }
  }

  if (errors.length > 0) return null;
  return {
    name: (name as string).trim(),
    shortName: (shortName as string).trim(),
    party: raw.party as Party,
    color: raw.color as string,
    traits,
    issuePositions,
    baseFavorability,
  };
}

// The single gate every save, load, and import passes through. Returns readable
// errors instead of throwing, so the UI can show the player exactly what to fix.
export function validateCustomScenario(raw: unknown): ValidationResult {
  const errors: string[] = [];
  if (!isObject(raw)) {
    return { ok: false, errors: ["File is not a valid custom scenario."] };
  }
  if (raw.version !== CUSTOM_SCENARIO_VERSION) {
    return {
      ok: false,
      errors: [
        `Unsupported scenario version (${String(raw.version)}). This app reads version ${CUSTOM_SCENARIO_VERSION}.`,
      ],
    };
  }
  if (typeof raw.id !== "string" || !isCustomScenarioId(raw.id)) {
    errors.push('Scenario id must start with "custom-".');
  }
  if (typeof raw.label !== "string" || raw.label.trim() === "") errors.push("Scenario needs a title.");
  if (typeof raw.label === "string" && raw.label.length > 60) errors.push("Scenario title is too long (60 characters max).");
  if (typeof raw.tagline !== "string") errors.push("Scenario tagline must be text.");
  if (typeof raw.tagline === "string" && raw.tagline.length > 200) errors.push("Scenario tagline is too long (200 characters max).");
  if (!isFiniteNumber(raw.year) || raw.year < 1788 || raw.year > 2100) errors.push("Year must be between 1788 and 2100.");
  if (raw.eventMode !== undefined && !EVENT_MODES.includes(raw.eventMode as EventMode)) {
    errors.push("Event mode must be historical or plausible.");
  }

  const dem = validateTicket(raw.dem, "dem", errors);
  const rep = validateTicket(raw.rep, "rep", errors);

  if (errors.length > 0 || !dem || !rep) {
    return { ok: false, errors: errors.length > 0 ? errors : ["Scenario data is incomplete."] };
  }

  const now = Date.now();
  return {
    ok: true,
    value: {
      version: CUSTOM_SCENARIO_VERSION,
      id: raw.id as string,
      label: (raw.label as string).trim(),
      tagline: (raw.tagline as string).trim(),
      year: raw.year as number,
      createdAt: isFiniteNumber(raw.createdAt) ? (raw.createdAt as number) : now,
      updatedAt: isFiniteNumber(raw.updatedAt) ? (raw.updatedAt as number) : now,
      dem,
      rep,
      eventMode: (raw.eventMode as EventMode) ?? "historical",
    },
  };
}

// A single generated running mate per side, so the custom ticket carries a valid
// default the setup/engine paths can resolve. Custom scenarios do not ship a VP
// shortlist; the player runs with a generic partner.
function defaultMate(side: "dem" | "rep", ticket: CustomTicketInput): RunningMate {
  return {
    id: `${side}-runningmate`,
    name: "Running Mate",
    ticket: side,
    historical: true,
    blurb: `Runs alongside ${ticket.shortName}.`,
  };
}

function toTicket(side: "dem" | "rep", t: CustomTicketInput): ScenarioTicket {
  return {
    name: t.name,
    shortName: t.shortName,
    party: t.party,
    color: t.color,
    traits: { ...t.traits },
    issuePositions: { ...t.issuePositions },
    baseFavorability: { ...t.baseFavorability },
    runningMates: [defaultMate(side, t)],
  };
}

// Adapt a validated custom scenario to the engine's Scenario record. State
// priors and EV apportionment are left to the engine defaults (2020 map), so a
// custom race plays on the standard board without touching election math.
export function toScenario(cs: CustomScenario): Scenario {
  return {
    id: cs.id,
    year: cs.year,
    label: cs.label,
    tagline: cs.tagline,
    dem: toTicket("dem", cs.dem),
    rep: toTicket("rep", cs.rep),
  };
}

// Inject a custom scenario into the runtime registry so getScenario(id) finds it
// and createGame can build the game exactly like a built-in year. Idempotent.
export function registerCustomScenario(cs: CustomScenario): void {
  SCENARIOS[cs.id] = toScenario(cs);
}

// Serialize for the export-to-file flow (pretty-printed for hand editing).
export function serializeCustomScenario(cs: CustomScenario): string {
  return JSON.stringify(cs, null, 2);
}

// Parse + validate an imported file. Throws with a readable message on bad data.
export function parseCustomScenario(json: string): CustomScenario {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error("That file is not valid JSON.");
  }
  const result = validateCustomScenario(parsed);
  if (!result.ok) throw new Error(result.errors.join("\n"));
  return result.value;
}
