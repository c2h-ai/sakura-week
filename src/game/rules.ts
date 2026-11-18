// The story's rules with no browser in them, so Vitest runs them in Node.
import type { CastId, Hearts, Item, Story } from './types';

/** One step of mulberry32: the next seed and a number in [0, 1). */
export function rngNext(seed: number): { seed: number; value: number } {
  const s = (seed + 0x6D2B79F5) | 0;
  let t = Math.imul(s ^ (s >>> 15), s | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return { seed: s, value: ((t ^ (t >>> 14)) >>> 0) / 4294967296 };
}

/** Hearts after a change, kept between 0 and the full row. */
export function addHeart(v: number, d: number, max: number): number {
  return Math.max(0, Math.min(max, v + d));
}

/** Where a festival invite goes: that person's ending when their hearts reach the bar, else their kind no. */
export function inviteRoute(hearts: Hearts, who: CastId, threshold: number): string {
  return hearts[who] >= threshold ? `end_${who}` : `decline_${who}`;
}

/** Whether an `if` holds: a flag the story remembers, or `!flag` for one it does not. */
export function flagHolds(flags: string[], cond: string): boolean {
  return cond.startsWith('!') ? !flags.includes(cond.slice(1)) : flags.includes(cond);
}

/** The list of entries at a path into the story. */
export function resolvePath(story: Story, path: (string | number)[]): Item[] {
  return path.reduce<unknown>((o, k) => (o as Record<string | number, unknown>)[k], story) as Item[];
}

/** How full heart number i (0 to 5) of a row is, 0 to 1, with per points to a heart. */
export function heartFill(v: number, i: number, per: number): number {
  return Math.max(0, Math.min(1, (v - i * per) / per));
}
