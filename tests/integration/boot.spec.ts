// Playwright: the single-file build opened from disk, driven through the
// game-state hook (src/hook.ts). npm run smoke runs only the @boot test.
import { expect, test, type Page } from '@playwright/test';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const build = (query: string): string => `${pathToFileURL(resolve('dist-single/index.html')).href}?${query}`;

/** Opens the build and collects every page error and console error. */
async function open(page: Page, query: string): Promise<string[]> {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(build(query));
  await expect.poll(() => page.evaluate(() => typeof window.game?.step)).toBe('function');
  return errors;
}

test('boots to the title screen with no errors @boot', async ({ page }) => {
  const errors = await open(page, 'manual=1');
  expect(await page.evaluate(() => window.game!.scene)).toBe('title');
  const size = await page.locator('#game').boundingBox();
  expect(size && size.width > 0 && size.height > 0).toBe(true);
  expect(errors).toEqual([]);
});

test('the first choice moves Hana\'s hearts and is remembered, and the same seed repeats it exactly', async ({ page }) => {
  // ?manual=1 stops the loop, so only step() moves the game. The reference replay's opening:
  // Enter leaves the title, then Space reads on until the first choice.
  async function run(): Promise<{ scene: string; state: unknown }> {
    const errors = await open(page, 'manual=1&seed=7');
    const out = await page.evaluate(() => {
      const g = window.game!;
      const st = (): { choice: unknown; hearts: Record<string, number>; flags: string[] } => g.state as never;
      g.press('Enter'); g.step();
      for (let i = 0; i < 80 && !st().choice; i++) { g.press('Space'); g.step(10); }
      g.press('Digit1'); g.step();
      return { scene: g.scene, state: JSON.parse(JSON.stringify(g.state)) };
    });
    expect(errors).toEqual([]);
    return out;
  }
  const first = await run();
  const s = first.state as { hearts: Record<string, number>; flags: string[]; line: { who: string } };
  expect(first.scene).toBe('play');
  expect(s.hearts.hana).toBe(2);
  expect(s.flags).toContain('hana_remember');
  expect(s.line.who).toBe('hana');
  expect(await run()).toEqual(first);
});
