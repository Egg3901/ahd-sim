import { describe, it, expect } from "vitest";
import { isValidActivationCode, normalizeActivationCode } from "../activationCode";

describe("activation code format", () => {
  it("accepts CAMP-XXXX-XXXX-XXXX with the server alphabet", () => {
    expect(isValidActivationCode("CAMP-ABCD-EFGH-JKMN")).toBe(true);
    expect(isValidActivationCode("camp-abcd-efgh-jkmn")).toBe(true);
    expect(normalizeActivationCode("  camp-abcd-efgh-jkmn  ")).toBe("CAMP-ABCD-EFGH-JKMN");
  });

  it("rejects ambiguous letters and bad shapes", () => {
    expect(isValidActivationCode("CAMP-ABOI-EFGH-JKMN")).toBe(false); // O, I banned
    expect(isValidActivationCode("CAMP-AB0I-EFGH-JKMN")).toBe(false); // 0, I banned
    expect(isValidActivationCode("CAMP-ABCD-EFGH")).toBe(false);
    expect(isValidActivationCode("XXXX-ABCD-EFGH-JKMN")).toBe(false);
    expect(isValidActivationCode("")).toBe(false);
  });
});
