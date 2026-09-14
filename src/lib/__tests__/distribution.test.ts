import { describe, expect, it } from "vitest";
import { distributionPolicy } from "../distribution";

describe("distributionPolicy", () => {
  it("allows Lakeside commerce on web and direct desktop builds", () => {
    expect(distributionPolicy("web").externalStore).toBe(true);
    expect(distributionPolicy("desktop-direct").externalStore).toBe(true);
  });

  it.each([
    ["steam", "Steam"],
    ["ios", "App Store"],
    ["android", "Google Play"],
  ])("keeps external checkout out of %s builds", (channel, store) => {
    expect(distributionPolicy(channel)).toMatchObject({
      externalStore: false,
      nativeStoreName: store,
    });
  });

  it("fails safely to web for missing or unknown build values", () => {
    expect(distributionPolicy()).toEqual(distributionPolicy("web"));
    expect(distributionPolicy("unknown")).toEqual(distributionPolicy("web"));
  });
});
