// Vitest: the story's rules in src/game/, run in Node with no browser.
// Design: design/game-brief.md (Challenge: only someone whose hearts reach the bar says yes).
import { describe, expect, it } from 'vitest';
import config from '../../data/config.json';
import { addHeart, inviteRoute, rngNext } from '../../src/game/rules';

const bar = config.confess_threshold.value;
const max = config.heart_max.value;

describe('inviteRoute', () => {
  it('a festival invite is a yes exactly at the bar, and a kind no one heart under it', () => {
    expect(inviteRoute({ hana: bar, serin: 0, yuri: 0 }, 'hana', bar)).toBe('end_hana');
    expect(inviteRoute({ hana: 0, serin: bar - 1, yuri: 0 }, 'serin', bar)).toBe('decline_serin');
  });
});

describe('addHeart', () => {
  it('keeps hearts between zero and a full row', () => {
    expect(addHeart(max - 1, 3, max)).toBe(max);
    expect(addHeart(0, -1, max)).toBe(0);
    expect(addHeart(2, 2, max)).toBe(4);
  });
});

describe('rngNext', () => {
  it('repeats the same numbers for the same seed', () => {
    const run = (s: number): number[] => [0, 1, 2].map(() => { const r = rngNext(s); s = r.seed; return r.value; });
    const first = run(config.seed);
    expect(run(config.seed)).toEqual(first);
    expect(first.every(n => n >= 0 && n < 1)).toBe(true);
  });
});
