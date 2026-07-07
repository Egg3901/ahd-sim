import type { CountryBundle } from "@engine/countryGame";
import { CANADA } from "./canada";
import { GERMANY } from "./germany";
import { FRANCE } from "./france";

export const COUNTRIES: Record<string, CountryBundle> = {
  CA: CANADA,
  DE: GERMANY,
  FR: FRANCE,
};

export function getCountry(id: string): CountryBundle | undefined {
  return COUNTRIES[id];
}
