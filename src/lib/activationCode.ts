// Shared activation-code format: CAMP-XXXX-XXXX-XXXX using the same alphabet
// as server/activation.ts (no O/0/I/1/L). Validated on the client before submit
// so typos don't round-trip to the server.

export const ACTIVATION_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const BLOCK = `[${ACTIVATION_ALPHABET}]{4}`;
export const ACTIVATION_CODE_PATTERN = new RegExp(`^CAMP-${BLOCK}-${BLOCK}-${BLOCK}$`);

export function normalizeActivationCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

export function isValidActivationCode(raw: string): boolean {
  return ACTIVATION_CODE_PATTERN.test(normalizeActivationCode(raw));
}
