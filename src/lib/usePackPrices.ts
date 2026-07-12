// Pack prices, sourced from the Lakeside platform catalog (the single source of
// truth) with the game's bundled prices as an instant, offline-safe fallback.
// Returns a { packId: priceCents } map that renders immediately from the
// fallback and updates in place once the platform catalog loads.

import { useEffect, useState } from "react";
import { api } from "./api";
import { PACKS } from "@content/packs";

const fallback: Record<string, number> = Object.fromEntries(PACKS.map((p) => [p.id, p.price]));

export function usePackPrices(): Record<string, number> {
  const [prices, setPrices] = useState<Record<string, number>>(fallback);
  useEffect(() => {
    let alive = true;
    api
      .catalog()
      .then((r) => {
        if (!alive) return;
        const next = { ...fallback };
        for (const p of r.products) next[p.id] = p.priceCents;
        setPrices(next);
      })
      .catch(() => {
        /* keep the bundled fallback */
      });
    return () => {
      alive = false;
    };
  }, []);
  return prices;
}
