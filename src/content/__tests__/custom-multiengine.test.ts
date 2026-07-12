import { describe, it, expect } from "vitest";
import {
  makeDefaultCustomScenario,
  makeDefaultMultiparty,
  validateCustomScenario,
  serializeCustomScenario,
  parseCustomScenario,
  buildUkCustomGame,
  buildCountryCustomGame,
  CUSTOM_SCENARIO_VERSION,
  type CustomScenario,
} from "@content/customScenario";
import { ukAdvanceTurn } from "@engine/ukGame";
import { countryAdvanceTurn } from "@engine/countryGame";

describe("schema v1 -> v2 migration", () => {
  it("loads a version-1 doc as the us engine", () => {
    // A pre-migration doc: no `engine` field, version 1.
    const v1: Record<string, unknown> = {
      ...(makeDefaultCustomScenario() as unknown as Record<string, unknown>),
      version: 1,
    };
    delete v1.engine;
    const result = validateCustomScenario(v1);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.version).toBe(CUSTOM_SCENARIO_VERSION);
      expect(result.value.engine).toBe("us");
      expect(result.value.dem).toBeTruthy();
    }
  });

  it("still rejects a genuinely unsupported version", () => {
    const bad = { ...makeDefaultCustomScenario(), version: 999 } as unknown;
    expect(validateCustomScenario(bad).ok).toBe(false);
  });
});

describe("UK custom scenario", () => {
  it("accepts a default UK scenario and round-trips", () => {
    const cs = makeDefaultMultiparty("uk");
    expect(cs.engine).toBe("uk");
    expect(cs.mp?.parties.length).toBeGreaterThanOrEqual(2);
    const restored = parseCustomScenario(serializeCustomScenario(cs));
    expect(restored.engine).toBe("uk");
    expect(restored.mp?.baseElection).toBe(cs.mp?.baseElection);
  });

  it("builds, starts, and advances one turn", () => {
    const cs = makeDefaultMultiparty("uk");
    cs.mp!.parties[0].leaderName = "Custom Leader";
    cs.mp!.parties[0].baseSupport = 0.3;
    const validated = validateCustomScenario(cs);
    expect(validated.ok).toBe(true);

    const game = buildUkCustomGame(validated.ok ? validated.value : cs);
    expect(game.custom).toBe(true);
    expect(game.turn).toBe(0);
    expect(game.leaders[game.playerParty].name).toBeTruthy();

    const next = ukAdvanceTurn(game, { autoResolvePlayerEvents: true });
    expect(next.turn).toBe(1);
  });
});

describe("country custom scenario", () => {
  it("accepts a default country scenario and round-trips", () => {
    const cs = makeDefaultMultiparty("country");
    expect(cs.engine).toBe("country");
    expect(cs.mp?.countryId).toBeTruthy();
    const restored = parseCustomScenario(serializeCustomScenario(cs));
    expect(restored.mp?.countryId).toBe(cs.mp?.countryId);
  });

  it("builds a cloned bundle with the custom labels, starts, and advances", () => {
    const cs = makeDefaultMultiparty("country");
    const pid = cs.mp!.parties[0].partyId;
    cs.mp!.parties[0].name = "Renamed Party";
    cs.mp!.parties[0].shortName = "RENAME";
    cs.mp!.parties[0].leaderName = "Custom Chief";
    const validated = validateCustomScenario(cs);
    expect(validated.ok).toBe(true);

    const { country, game } = buildCountryCustomGame(validated.ok ? validated.value : cs);
    expect(game.custom).toBe(true);
    expect(game.turn).toBe(0);
    // The cloned bundle carries the player's party label + leader override.
    expect(country.system.parties.find((p) => p.id === pid)?.shortName).toBe("RENAME");
    expect(game.leaders[pid].name).toBe("Custom Chief");

    const next = countryAdvanceTurn(game, country, { autoResolvePlayerEvents: true });
    expect(next.turn).toBe(1);
  });
});

describe("multiparty validation rejects bad party lists", () => {
  const withMp = (patch: (cs: CustomScenario) => void): CustomScenario => {
    const cs = makeDefaultMultiparty("uk");
    patch(cs);
    return cs;
  };

  it("rejects fewer than two parties", () => {
    const cs = withMp((c) => { c.mp!.parties = c.mp!.parties.slice(0, 1); });
    expect(validateCustomScenario(cs).ok).toBe(false);
  });

  it("rejects an unknown party id", () => {
    const cs = withMp((c) => { c.mp!.parties[0].partyId = "not_a_real_party"; });
    const r = validateCustomScenario(cs);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.join(" ")).toMatch(/does not contest/);
  });

  it("rejects a duplicate party", () => {
    const cs = withMp((c) => { c.mp!.parties[1].partyId = c.mp!.parties[0].partyId; });
    const r = validateCustomScenario(cs);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.join(" ")).toMatch(/listed twice/);
  });

  it("rejects out-of-range traits and base support", () => {
    const cs = withMp((c) => { c.mp!.parties[0].charisma = 500; c.mp!.parties[0].baseSupport = 5; });
    const r = validateCustomScenario(cs);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.join(" ")).toMatch(/between 0 and 100/);
      expect(r.errors.join(" ")).toMatch(/base support must be between -1 and 1/);
    }
  });

  it("rejects a bad base election", () => {
    const cs = withMp((c) => { c.mp!.baseElection = "9999"; });
    expect(validateCustomScenario(cs).ok).toBe(false);
  });
});
