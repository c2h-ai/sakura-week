// Every tuning value, from data/config.json: each with value, min, max and step. The game reads
// them live through tune.<name>; the tweak panel is on the dev server only, so no build has it.
import data from '../data/config.json';

/** A tunable key of data/config.json (every key but the seed). */
export type ConfigKey = Exclude<keyof typeof data, 'seed'>;

declare global {
  interface Window {
    CONFIG: typeof data;
  }
}

/** The config file as loaded; the tweak panel writes its values in place. */
export const CONFIG = data;
window.CONFIG = data;

/** Live reads: tune.text_speed is CONFIG.text_speed.value, read each time it is needed. */
export const tune = new Proxy({} as Record<ConfigKey, number>, {
  get: (_, k) => (CONFIG as unknown as Record<string, { value: number }>)[k as string].value,
});

if (import.meta.env.DEV) await import('./dev/tune');
