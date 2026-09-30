/** A function that returns a float in [0, 1), like Math.random. */
export type RandomSource = () => number;

/** Small, fast seeded PRNG. Used so seed data is stable for a given day. */
export function mulberry32(seed: number): RandomSource {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** FNV-1a string hash, handy for turning a date into a PRNG seed. */
export function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function secureRandom(): number {
  if (typeof globalThis.crypto?.getRandomValues === "function") {
    const buffer = new Uint32Array(1);
    globalThis.crypto.getRandomValues(buffer);
    return buffer[0] / 4294967296;
  }
  return Math.random();
}

/** Inclusive on both ends. */
export function randomInt(random: RandomSource, min: number, max: number): number {
  return min + Math.floor(random() * (max - min + 1));
}

export function pickOne<T>(random: RandomSource, items: readonly T[]): T {
  return items[Math.floor(random() * items.length)];
}

export function pickWeighted<T>(random: RandomSource, entries: ReadonlyArray<readonly [T, number]>): T {
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = random() * total;
  for (const [value, weight] of entries) {
    roll -= weight;
    if (roll < 0) return value;
  }
  return entries[entries.length - 1][0];
}

const ID_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

export function createId(random: RandomSource, prefix = "bk"): string {
  let id = "";
  for (let index = 0; index < 12; index += 1) id += pickOne(random, ID_ALPHABET.split(""));
  return `${prefix}_${id}`;
}
