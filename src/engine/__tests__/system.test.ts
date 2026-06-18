import { describe, it, expect } from "vitest";
import { getSystem, SYSTEMS } from "@content/systems";
import { partyById } from "@engine/system";

// Guards the P0 system abstraction: the U.S. descriptor must keep matching the
// concrete two-party / 270-of-538 path the engine actually runs, so the N-party
// generalization (P1) has a correct target to read from.
describe("political system abstraction", () => {
  it("registers the US system and falls back to it", () => {
    expect(getSystem("US").id).toBe("US");
    expect(getSystem(undefined).id).toBe("US");
    expect(getSystem("nonexistent").id).toBe("US");
  });

  it("US system matches the engine's two-party / electoral-college arithmetic", () => {
    const us = SYSTEMS.US;
    expect(us.parties.map((p) => p.id).sort()).toEqual(["dem", "rep"]);
    expect(us.allocation.id).toBe("winner_take_all_ev");
    expect(us.majority.total).toBe(538);
    expect(us.majority.threshold).toBe(270);
  });

  it("looks parties up by id", () => {
    const us = SYSTEMS.US;
    expect(partyById(us, "dem")?.shortName).toBe("Dem");
    expect(partyById(us, "rep")?.shortName).toBe("Rep");
    expect(partyById(us, "snp")).toBeUndefined();
  });
});
