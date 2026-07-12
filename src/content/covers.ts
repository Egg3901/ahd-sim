// Cover images for the landing page and scenario pickers.
// Files live in public/images/covers/ — Wikimedia Commons / government
// public-domain and CC-licensed campaign & landmark photos. See
// public/images/covers/ATTRIBUTION.json for per-file license + source.

import type { CountryCode } from "./scenarioRegistry";

/** Landmark / seat-of-government covers for the country browser. */
export const COUNTRY_COVERS: Record<CountryCode, string> = {
  US: "images/covers/country-us.jpg",
  UK: "images/covers/country-uk.jpg",
  CA: "images/covers/country-ca.jpg",
  DE: "images/covers/country-de.jpg",
  FR: "images/covers/country-fr.jpg",
  AU: "images/covers/country-au.jpg",
};

/**
 * Campaign-era / official portraits keyed by global scenarioId
 * (e.g. "us-2024", "uk-1997"). Prefer public-domain government photos
 * and CC-licensed Commons images from that campaign cycle.
 */
export const SCENARIO_COVERS: Record<string, string> = {
  "us-2024": "images/covers/us-2024.jpg",
  "us-2020": "images/covers/us-2020.jpg",
  "us-2016": "images/covers/us-2016.jpg",
  "us-2012": "images/covers/us-2012.jpg",
  "us-2008": "images/covers/us-2008.jpg",
  "us-2004": "images/covers/us-2004.jpg",
  "us-2000": "images/covers/us-2000.jpg",
  "us-1996": "images/covers/us-1996.jpg",
  "us-1992": "images/covers/us-1992.jpg",
  "us-1988": "images/covers/us-1988.jpg",
  "us-1984": "images/covers/us-1984.jpg",
  "us-1980": "images/covers/us-1980.jpg",

  "uk-2024": "images/covers/uk-2024.jpg",
  "uk-2019": "images/covers/uk-2019.jpg",
  "uk-2017": "images/covers/uk-2017.jpg",
  "uk-2015": "images/covers/uk-2015.jpg",
  "uk-2010": "images/covers/uk-2010.jpg",
  "uk-2005": "images/covers/uk-2005.jpg",
  "uk-2001": "images/covers/uk-2001.jpg",
  "uk-1997": "images/covers/uk-1997.jpg",
  "uk-1992": "images/covers/uk-1992.jpg",
  "uk-1987": "images/covers/uk-1987.jpg",
  "uk-1983": "images/covers/uk-1983.jpg",
  "uk-1979": "images/covers/uk-1979.jpg",
  "uk-1974oct": "images/covers/uk-1974oct.jpg",
  "uk-1974feb": "images/covers/uk-1974feb.jpg",
  "uk-1970": "images/covers/uk-1970.jpg",
  "uk-1966": "images/covers/uk-1966.jpg",
  "uk-1964": "images/covers/uk-1964.jpg",
  "uk-1951": "images/covers/uk-1951.jpg",

  "ca-2025": "images/covers/ca-2025.jpg",
  "ca-2021": "images/covers/ca-2021.jpg",
  "de-2025": "images/covers/de-2025.jpg",
  "de-2021": "images/covers/de-2021.jpg",
  "fr-2027": "images/covers/fr-2027.jpg",
  "fr-2022": "images/covers/fr-2022.jpg",
  "fr-2017": "images/covers/fr-2017.jpg",
  "au-2025": "images/covers/au-2025.jpg",
  "au-2022": "images/covers/au-2022.jpg",
};

/** Pack strip thumbnails — one representative image per pack. */
export const PACK_COVERS: Record<string, string> = {
  "us-historical": "images/covers/us-1984.jpg",
  "uk-elections": "images/covers/country-uk.jpg",
  global: "images/covers/country-fr.jpg",
  complete: "images/covers/country-us.jpg",
};

export function countryCover(code: CountryCode): string | undefined {
  return COUNTRY_COVERS[code];
}

export function scenarioCover(scenarioId: string): string | undefined {
  return SCENARIO_COVERS[scenarioId];
}

export function packCover(packId: string): string | undefined {
  return PACK_COVERS[packId];
}

/** US setup uses native year ids ("2024"); map to global scenario covers. */
export function usNativeCover(nativeId: string): string | undefined {
  return SCENARIO_COVERS[`us-${nativeId}`];
}

export function ukNativeCover(nativeId: string): string | undefined {
  return SCENARIO_COVERS[`uk-${nativeId}`];
}

export function countryNativeCover(countryCode: string, nativeId: string): string | undefined {
  return SCENARIO_COVERS[`${countryCode.toLowerCase()}-${nativeId}`];
}
