// Country photography for the landing page. Scenario tiles use code-native
// campaign art so every election stays distinct and never depends on a missing
// or duplicated portrait asset.

import type { CountryCode } from "./scenarioRegistry";

const COUNTRY_COVERS: Record<CountryCode, string> = {
  US: "images/covers/country-us.jpg",
  UK: "images/covers/country-uk.jpg",
  CA: "images/covers/country-ca.jpg",
  DE: "images/covers/country-de.jpg",
  FR: "images/covers/country-fr.jpg",
  AU: "images/covers/country-au.jpg",
};

export function countryCover(code: CountryCode): string {
  return COUNTRY_COVERS[code];
}
