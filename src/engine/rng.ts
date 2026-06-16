// Seedable, deterministic RNG. Pure — no global state, no Math.random.
// Same seed always yields the same stream, which is what makes advanceTurn
// reproducible (undo, replays, calibration tests all rely on this).

export interface Rng {
  // Returns a float in [0, 1).
  next(): number;
  // Returns an integer in [min, max] inclusive.
  int(min: number, max: number): number;
  // Standard-normal sample (Box–Muller).
  normal(mean?: number, stdev?: number): number;
  // Picks one element with optional weights.
  pick<T>(items: readonly T[]): T;
  weightedPick<T>(items: readonly T[], weights: readonly number[]): T;
  // Returns true with probability p.
  chance(p: number): boolean;
  // Forks a new independent stream (deterministic from current state).
  fork(salt: number): Rng;
  // Current internal state — used to persist RNG across turns.
  state(): number;
}

// mulberry32: tiny, fast, good-enough statistical quality for a game sim.
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Hash a string to a 32-bit seed so seeds can be human-readable.
export function hashSeed(input: string | number): number {
  const str = String(input);
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function createRng(seed: number | string): Rng {
  const numericSeed = typeof seed === "string" ? hashSeed(seed) : seed >>> 0;
  let core = mulberry32(numericSeed);
  let lastState = numericSeed;

  const rng: Rng = {
    next() {
      const v = core();
      lastState = Math.floor(v * 4294967296);
      return v;
    },
    int(min, max) {
      return min + Math.floor(rng.next() * (max - min + 1));
    },
    normal(mean = 0, stdev = 1) {
      // Box–Muller; never returns exactly 0 for u1 to avoid log(0).
      let u1 = rng.next();
      const u2 = rng.next();
      if (u1 < 1e-12) u1 = 1e-12;
      const mag = Math.sqrt(-2.0 * Math.log(u1));
      return mean + stdev * mag * Math.cos(2.0 * Math.PI * u2);
    },
    pick(items) {
      return items[rng.int(0, items.length - 1)];
    },
    weightedPick(items, weights) {
      const total = weights.reduce((s, w) => s + Math.max(0, w), 0);
      let r = rng.next() * total;
      for (let i = 0; i < items.length; i++) {
        r -= Math.max(0, weights[i]);
        if (r <= 0) return items[i];
      }
      return items[items.length - 1];
    },
    chance(p) {
      return rng.next() < p;
    },
    fork(salt) {
      return createRng(hashSeed(`${numericSeed}:${salt}:${lastState}`));
    },
    state() {
      return lastState;
    },
  };
  return rng;
}
