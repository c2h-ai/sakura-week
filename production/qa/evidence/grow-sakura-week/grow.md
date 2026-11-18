# Grow: sakura-week (2026-11-18)

From `one-shot/sakura-week` (e59fa4e) into the web project at the project root. `prototypes/sakura-week/` was not touched.

| Step | Result | Seen in |
|---|---|---|
| 1 Reference | `exact yes`: two same-seed runs of the one-shot match (Enter, then Space ×60 into day 3 lunch) | `reference.png` |
| 2 Copy (still JavaScript) | `match yes`; story.js and images.js carried into `src/` as modules | `copy.png` |
| 3 TypeScript | `match yes`; split into `src/game/` (types, story, rules), `config.ts`, `screen.ts`, `audio.ts`, `images.ts`, `main.ts`; `tsc --noEmit` clean under `strict` | `typescript.png` |
| 4 Rules under test | Vitest 3 passed (invite bar, heart clamp, seeded chance); invite rule broken once (`>`), test failed, restored. Playwright 2 passed (`@boot`; first choice gives Hana +2 and `hana_remember`, same seed repeats exactly) | — |
| 5 Record | `npm run build` ok; `test-run.sh web` → `rule web:pass` (5 tests); `npm run smoke` 1 passed; engine Web (Vite 8.3.4) written | `typescript.png` beside `reference.png`: identical |

NOT ASSESSED: nothing in the replay; sound is not checked by any run (blips and chimes play through Web Audio, not heard).

Still `Loose`: nothing. No `any` alias was needed.

Note: the pictures ship inside the JS bundle as data URIs (`src/images.ts`, about 1.9 MB), so Vite warns the chunk is over 500 kB. It loads in one request; splitting it is a later story.
