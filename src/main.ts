// 벚꽃 축제까지 사흘: the scenes, the story runner and the loop.
// Design: design/game-brief.md. Rules with no browser in them are in src/game/.
import { CONFIG, tune } from './config';
import { W, H, FONT, canvas, ctx, fit, text, rrect, wrap, heartPath } from './screen';
import { startAudio, isMuted, setMuted, tone, sfx } from './audio';
import { params, manual, clock, seedFrom, install } from './hook';
import { IMAGES } from './images';
import { NAMES, COLORS, HUD_INK, VOICES, DAYS, ENDINGS, STORY, STORY_PICKS, STORY_INVITE } from './game/story';
import { rngNext, addHeart, inviteRoute, flagHolds, resolvePath, heartFill } from './game/rules';
import type { CastId, Command, Face, Frame, Hearts, Item, Line, Option, Pos, Shown, SpeakerId, State } from './game/types';

// ---- Built to be checked ----------------------------------------------------------------
const STEP = 1 / 60;
const TITLE = '벚꽃 축제까지 사흘';
const CONTROLS = ['클릭 / Space / Enter: 다음 대사', '1~4 또는 ↑↓ + Enter: 선택지', 'L: 대사 로그   Esc: 일시정지 · 저장 · 글자 속도', 'M: 소리 끄기'];
let seed = 0;
/** The game's one source of chance: seeded, so the same seed plays the same. */
function rng(): number { const r = rngNext(seed); seed = r.seed; return r.value; }
const events: Record<string, unknown>[] = [];

// ---- Palette (brief: sakura pink for hearts and accents, cream for the box, navy for night) --
const C = { pink: '#f07a9a', pinkSoft: '#ffd3df', cream: '#fff7ec', ink: '#4a3b4f', inkSoft: '#8a7590', navy: '#232347' };

addEventListener('resize', fit); fit();

// ---- Images (made with Codex CLI, see assets/provenance.yaml) ------------------------------
const IMG: Record<string, HTMLImageElement> = {};
function load(key: string): void { const im = new Image(); im.src = IMAGES[key] || `assets/${key}.webp`; IMG[key] = im; }
for (const b of ['road', 'classroom', 'rooftop', 'festival']) load('bg_' + b);
for (const c of ['hana', 'serin', 'yuri']) for (const f of ['neutral', 'happy', 'shy', 'sad']) load(`${c}_${f}`);
const ready = (im: HTMLImageElement | undefined): im is HTMLImageElement => !!im && im.complete && im.naturalWidth > 0;

// ---- Input -------------------------------------------------------------------------------
const down = new Set<string>(), hit = new Set<string>();
const pressed = (code: string): boolean => hit.has(code);
let clickAt: { x: number; y: number } | null = null, mouse = { x: -1, y: -1 };
addEventListener('keydown', e => {
  startAudio();
  if (!e.repeat) { down.add(e.code); hit.add(e.code); }
  if (e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault();
});
addEventListener('keyup', e => down.delete(e.code));
function toLogical(e: PointerEvent): { x: number; y: number } { const b = canvas.getBoundingClientRect(); return { x: (e.clientX - b.left) / b.width * W, y: (e.clientY - b.top) / b.height * H }; }
canvas.addEventListener('pointerdown', e => { startAudio(); clickAt = toLogical(e); });
canvas.addEventListener('pointermove', e => { mouse = toLogical(e); });
addEventListener('blur', () => down.clear());
const advanceKey = (): boolean => pressed('Space') || pressed('Enter') || pressed('NumpadEnter');

// ---- Saves and found endings (browser storage; the game runs without it) -----------------
const SAVE_KEY = 'sakura-week.save', END_KEY = 'sakura-week.endings';
const store = {
  get<T>(k: string): T | null { try { return JSON.parse(localStorage.getItem(k) as string) as T; } catch { return null; } },
  set(k: string, v: unknown): boolean { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } },
  del(k: string): void { try { localStorage.removeItem(k); } catch { /* storage blocked: nothing to remove */ } },
};
let foundEndings: string[] = store.get<string[]>(END_KEY) || [];
const SPEEDS = [{ name: '느림', k: 0.55 }, { name: '보통', k: 1 }, { name: '빠름', k: 2 }, { name: '즉시', k: 99 }];
let speedIdx = store.get<number>('sakura-week.speed') ?? 1;

/** What a save holds: plain data, so it survives a reload. */
interface Save {
  frames: Frame[]; hearts: Hearts; flags: string[]; met: CastId[]; bg: string;
  shown: { id: CastId; face: Face; pos: Pos }[]; day: number;
  line: State['line']; choice: State['choice']; log: State['log'];
}

// ---- The story runner ---------------------------------------------------------------------
// The story (src/game/story.ts) is named lists of lines and commands. A frame is a path into it,
// so a save is plain data: the path, the index, the hearts and what the story remembers.
type SceneName = 'figures' | 'title' | 'play' | 'pause' | 'log' | 'results';
let scene: SceneName, state: State, toast: { text: string; t: number } | null = null;
function newState(): State {
  return {
    t: 0, frames: [{ path: ['start'], i: 0 }], hearts: { hana: 0, serin: 0, yuri: 0 }, flags: [], met: [],
    bg: 'road', shown: [], day: 0, card: null, line: null, reveal: 0, choice: null, sel: 0,
    log: [], fx: [], ending: null, score: 0, gained: '',
  };
}
function reset(): void {
  seed = seedFrom(CONFIG.seed);
  state = newState(); makePetals();
}
const resolve = (path: (string | number)[]): Item[] => resolvePath(STORY, path);
const has = (f: string): boolean => state.flags.includes(f);
function show(id: CastId, face: Face = 'neutral', pos?: Pos): void {
  let s = state.shown.find(c => c.id === id);
  if (!s) { s = { id, face, pos: pos || 'c', a: 0, bounce: 0 }; state.shown.push(s); }
  else { if (pos) s.pos = pos; if (face !== s.face) { s.face = face; s.bounce = 1; } }
  if (!state.met.includes(id)) state.met.push(id);
}
function setFace(id: CastId, face: Face): void { const s = state.shown.find(c => c.id === id); if (s && s.face !== face) { s.face = face; s.bounce = 1; } }
function addHearts(h: Partial<Hearts> | undefined): void {
  let up = false, dn = false;
  for (const [id, d] of Object.entries(h || {}) as [CastId, number][]) {
    if (!d) continue;
    state.hearts[id] = addHeart(state.hearts[id], d, tune.heart_max);
    if (!state.met.includes(id)) state.met.push(id);
    state.fx.push({ id, d, t: 0 }); if (d > 0) up = true; else dn = true;
    events.push({ type: 'heart', id, d });
  }
  if (up) sfx.up(); else if (dn) sfx.down();
}
function save(manualSave: boolean): void {
  const ok = store.set(SAVE_KEY, {
    frames: state.frames, hearts: state.hearts, flags: state.flags, met: state.met, bg: state.bg,
    shown: state.shown.map(s => ({ id: s.id, face: s.face, pos: s.pos })), day: state.day,
    line: state.line, choice: state.choice, log: state.log.slice(-40),
  } satisfies Save);
  if (manualSave) toast = { text: ok ? '저장했습니다' : '이 브라우저에서는 저장할 수 없습니다', t: 1.6 };
}
function loadSave(): boolean {
  const s = store.get<Save>(SAVE_KEY); if (!s) return false;
  reset(); Object.assign(state, s);
  state.shown = s.shown.map(c => ({ ...c, a: 1, bounce: 0 }));
  state.reveal = 9999; state.sel = 0; return true;
}
function say(cmd: Line): void {
  const [who, line, face] = cmd;
  if (who && face && who in HUD_INK) { if (state.shown.find(c => c.id === who)) setFace(who as CastId, face); }
  state.line = { who, text: line }; state.reveal = 0; state.blipAt = 0;
  state.log.push({ who, text: line }); if (state.log.length > 80) state.log.shift();
}
function choiceOptions(c: Command): Option[] { // a pick or an invite builds its options from the story's data
  if (c.pick) return STORY_PICKS[c.pick];
  if (c.invite) return STORY_INVITE;
  return c.choice || [];
}
/** Runs commands until a line to read, a choice, a day card or an ending. */
function run(): void {
  for (let guard = 0; guard < 500; guard++) {
    const f = state.frames[state.frames.length - 1];
    if (!f) { finish('alone'); return; }
    const list = resolve(f.path);
    if (f.i >= list.length) { state.frames.pop(); continue; }
    const at = f.i, item = list[f.i++];
    if (Array.isArray(item)) { say(item); return; }
    const cmd = item;
    if (cmd.bg) state.bg = cmd.bg;
    if (cmd.show) show(cmd.show, cmd.face, cmd.pos);
    if (cmd.hide) state.shown = state.shown.filter(c => c.id !== cmd.hide);
    if (cmd.hideAll) state.shown = [];
    if (cmd.goto) { state.frames = [{ path: [cmd.goto], i: 0 }]; continue; }
    if (cmd.if) {
      const br = flagHolds(state.flags, cmd.if) ? 'then' : 'else';
      if (cmd[br]) state.frames.push({ path: f.path.concat(at, br), i: 0 });
      continue;
    }
    if (cmd.day) { state.day = cmd.day; state.card = { day: cmd.day, t: 0 }; state.line = null; return; }
    if (cmd.choice || cmd.pick || cmd.invite) {
      state.choice = { path: f.path.concat(at) }; state.sel = 0; save(false);
      events.push({ type: 'choice' }); return;
    }
    if (cmd.ending) { finish(cmd.ending); return; }
  }
}
function currentChoice(): Command { return resolve((state.choice as { path: (string | number)[] }).path) as unknown as Command; }
function choose(idx: number): void {
  const cmd = currentChoice(), opts = choiceOptions(cmd), o = opts[idx];
  if (!o) return;
  const path = (state.choice as { path: (string | number)[] }).path; state.choice = null; sfx.pick();
  state.log.push({ who: 'me', text: '선택: ' + o.t });
  for (const fl of o.set || []) if (!has(fl)) state.flags.push(fl);
  for (const [id, face] of Object.entries(o.face || {}) as [CastId, Face][]) setFace(id, face);
  addHearts(o.h);
  let go = o.go;
  if (o.invite) go = inviteRoute(state.hearts, o.invite, tune.confess_threshold);
  if (go) state.frames = [{ path: [go], i: 0 }];
  if (o.reply) {
    const base = cmd.choice ? path.concat('choice', idx, 'reply') : null;
    if (base) state.frames.push({ path: base, i: 0 });
  }
  events.push({ type: 'chose', idx });
  run();
}
function finish(id: string): void {
  state.ending = id; state.line = null;
  if (!foundEndings.includes(id)) { foundEndings.push(id); store.set(END_KEY, foundEndings); }
  store.del(SAVE_KEY);
  state.gained = ENDINGS[id].title; sfx.ending(); scene = 'results';
  events.push({ type: 'ending', id });
}
function advance(): void {
  if (state.card) { state.card = null; run(); return; }
  if (state.choice) return;
  const full = state.line && state.reveal >= [...state.line.text].length;
  if (state.line && !full) { state.reveal = 9999; return; }
  sfx.page(); run();
}

// ---- Petals: the brief's signature detail ---------------------------------------------------
interface Petal { x: number; y: number; s: number; r: number; vr: number; sw: number; vx: number; k: number }
let petals: Petal[] = [];
function makePetals(): void {
  petals = [];
  for (let i = 0; i < tune.petal_count; i++) petals.push(newPetal(true));
}
function newPetal(any: boolean): Petal {
  return { x: rng() * (W + 200) - 100, y: any ? rng() * H : -20 - rng() * 60, s: 7 + rng() * 7, r: rng() * 6.28,
    vr: (rng() - 0.5) * 2.4, sw: rng() * 6.28, vx: 14 + rng() * 22, k: 0.7 + rng() * 0.6 };
}
function updatePetals(dt: number): void {
  while (petals.length < tune.petal_count) petals.push(newPetal(false));
  if (petals.length > tune.petal_count) petals.length = tune.petal_count;
  for (const p of petals) {
    p.sw += dt * 1.6; p.r += p.vr * dt;
    p.y += tune.petal_fall * p.k * dt; p.x += (p.vx * 0.5 + Math.sin(p.sw) * 22) * dt;
    if (p.y > H + 20 || p.x > W + 40) Object.assign(p, newPetal(false));
  }
}
function drawPetals(night: boolean): void {
  for (const p of petals) {
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.scale(1, 0.55 + 0.45 * Math.abs(Math.sin(p.sw)));
    ctx.beginPath(); // a petal: rounded with a notch at the tip
    ctx.moveTo(0, -p.s);
    ctx.quadraticCurveTo(p.s * 0.9, -p.s * 0.2, 0, p.s);
    ctx.quadraticCurveTo(-p.s * 0.9, -p.s * 0.2, 0, -p.s);
    ctx.fillStyle = night ? 'rgba(255,200,220,0.75)' : 'rgba(255,190,210,0.85)'; ctx.fill();
    ctx.strokeStyle = 'rgba(230,120,150,0.5)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.restore();
  }
}

// ---- Drawing the stage -----------------------------------------------------------------------
const POS: Record<Pos, number> = { l: W * 0.2, c: W * 0.5, r: W * 0.8 };
function drawBg(key: string): void {
  const im = IMG['bg_' + key];
  if (ready(im)) ctx.drawImage(im, 0, 0, W, H);
  else { const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#ffd9e4'); g.addColorStop(1, '#fff1e6'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
}
function drawChar(c: Shown, dim: boolean): void {
  const im = IMG[`${c.id}_${c.face}`]; if (!ready(im)) return;
  const h = tune.sprite_height, w = im.naturalWidth * h / im.naturalHeight;
  const bob = Math.sin(c.bounce * Math.PI) * 14;
  ctx.save(); ctx.globalAlpha = c.a;
  if (dim) ctx.filter = 'brightness(0.72) saturate(0.85)';
  ctx.drawImage(im, POS[c.pos] - w / 2, H - h + 30 - bob, w, h);
  ctx.restore();
}
function drawHearts(): void { // the hook made visible: one row of hearts for each person met
  const ids = (['hana', 'serin', 'yuri'] as CastId[]).filter(id => state.met.includes(id));
  if (!ids.length) return;
  const per = tune.heart_max / 6;
  ctx.save(); rrect(16, 14, 316, 18 + ids.length * 38 + (state.day === 4 ? 26 : 0), 14); ctx.fillStyle = 'rgba(255,247,236,0.94)'; ctx.fill(); ctx.restore();
  ids.forEach((id, row) => {
    const y = 34 + row * 38, fx = state.fx.filter(f => f.id === id);
    const shake = fx.length ? Math.sin(fx[0].t * 50) * 4 * Math.max(0, 1 - fx[0].t / tune.heart_shake_time) : 0;
    text(NAMES[id].short as string, 30, y + 2, 18, HUD_INK[id], 'left', 'bold');
    const v = state.hearts[id];
    for (let i = 0; i < 6; i++) {
      const x = 104 + i * 27 + shake, fill = heartFill(v, i, per);
      heartPath(x, y - 10, 22); ctx.fillStyle = '#ead7dc'; ctx.fill();
      if (fill > 0) { ctx.save(); heartPath(x, y - 10, 22); ctx.clip(); ctx.fillStyle = C.pink; ctx.fillRect(x - 12, y - 10, 24 * fill, 24); ctx.restore(); }
      heartPath(x, y - 10, 22); ctx.strokeStyle = '#c95b7a'; ctx.lineWidth = 1.5; ctx.stroke();
    }
    for (const f of fx) { // the change floats up beside the row
      const a = Math.max(0, 1 - f.t / 1.2);
      ctx.globalAlpha = a; text((f.d > 0 ? '+' : '') + f.d, 274, y - f.t * 8, 22, f.d > 0 ? '#c2335c' : '#4a4a6a', 'left', 'bold'); ctx.globalAlpha = 1;
    }
  });
  if (state.day === 4) text(`고백 기준: 하트 ${tune.confess_threshold}점`, 30, 34 + ids.length * 38, 16, C.ink, 'left');
}
function drawDay(): void {
  if (!state.day) return;
  const d = DAYS[state.day];
  ctx.save(); rrect(W - 262, 14, 246, 40, 14); ctx.fillStyle = 'rgba(255,247,236,0.82)'; ctx.fill(); ctx.restore();
  text(`${state.day}일차 · ${d.left}`, W - 139, 34, 19, C.ink, 'center', 'bold');
}
function drawBox(): void {
  const L = state.line; if (!L) return;
  const x = 90, y = H - 200, w = W - 180, h = 176;
  ctx.save(); rrect(x, y, w, h, 22); ctx.fillStyle = 'rgba(255,247,236,0.94)'; ctx.fill();
  ctx.strokeStyle = C.pinkSoft; ctx.lineWidth = 4; ctx.stroke(); ctx.restore();
  if (L.who) { // the name tag, in the speaker's colour
    const n = NAMES[L.who].full; ctx.font = `bold 24px ${FONT}`; const nw = ctx.measureText(n).width + 44;
    ctx.save(); rrect(x + 26, y - 22, nw, 44, 18); ctx.fillStyle = COLORS[L.who]; ctx.fill(); ctx.restore();
    text(n, x + 26 + nw / 2, y, 24, '#fff', 'center', 'bold');
  }
  const chars = [...L.text], shown = chars.slice(0, Math.floor(state.reveal)).join('');
  const out = wrap(shown, w - 80, 29);
  out.forEach((ln, i) => text(ln, x + 40, y + 56 + i * 42, 29, L.who ? C.ink : '#5d4a66', 'left'));
  if (state.reveal >= chars.length && !state.choice) { // a small blinking petal says "click on"
    const t = (Math.sin(state.t * 5) + 1) / 2; ctx.save(); ctx.translate(x + w - 40, y + h - 30 + t * 4);
    ctx.beginPath(); ctx.moveTo(0, -9); ctx.quadraticCurveTo(8, -1, 0, 9); ctx.quadraticCurveTo(-8, -1, 0, -9);
    ctx.fillStyle = C.pink; ctx.fill(); ctx.restore();
  }
}
interface Box { x: number; y: number; w: number; h: number; i: number }
let choiceBoxes: Box[] = [];
function drawChoice(): void {
  choiceBoxes = [];
  if (!state.choice) return;
  const cmd = currentChoice(), opts = choiceOptions(cmd);
  const bw = 760, bh = 62, gap = 16, top = H / 2 - 40 - (opts.length * (bh + gap)) / 2;
  ctx.fillStyle = 'rgba(40,25,50,0.25)'; ctx.fillRect(0, 0, W, H);
  if (cmd.prompt) { ctx.font = `bold 22px ${FONT}`; const pw = ctx.measureText(cmd.prompt).width + 48; ctx.save(); rrect(W / 2 - pw / 2, top - 52, pw, 44, 20); ctx.fillStyle = 'rgba(60,40,70,0.85)'; ctx.fill(); ctx.restore(); text(cmd.prompt, W / 2, top - 30, 22, '#fff', 'center', 'bold'); }
  opts.forEach((o, i) => {
    const x = W / 2 - bw / 2, y = top + i * (bh + gap);
    const hov = mouse.x > x && mouse.x < x + bw && mouse.y > y && mouse.y < y + bh;
    if (hov) state.sel = i;
    const on = state.sel === i;
    ctx.save(); rrect(x, y, bw, bh, 20); ctx.fillStyle = on ? '#ffe3ec' : 'rgba(255,247,236,0.95)'; ctx.fill();
    ctx.strokeStyle = on ? C.pink : '#e7cdd5'; ctx.lineWidth = on ? 4 : 2; ctx.stroke(); ctx.restore();
    text(`${i + 1}`, x + 34, y + bh / 2, 22, '#c2335c', 'center', 'bold');
    text(o.t, x + 64, y + bh / 2, 25, C.ink, 'left');
    if (o.sub) text(o.sub, x + bw - 24, y + bh / 2, 17, C.inkSoft, 'right');
    choiceBoxes.push({ x, y, w: bw, h: bh, i });
  });
}
function drawCard(): void {
  const c = state.card; if (!c) return;
  const d = DAYS[c.day], a = Math.min(1, c.t / 0.3);
  ctx.globalAlpha = a; ctx.fillStyle = c.day === 4 ? 'rgba(25,25,60,0.9)' : 'rgba(255,240,245,0.92)'; ctx.fillRect(0, 0, W, H);
  const ink = c.day === 4 ? '#ffe6ef' : C.ink;
  text(`${c.day}일차`, W / 2, H / 2 - 50, 64, ink, 'center', 'bold');
  text(d.card, W / 2, H / 2 + 30, 30, c.day === 4 ? '#ffb7cb' : C.pink);
  ctx.globalAlpha = 1;
}
function drawToast(): void {
  if (!toast) return;
  ctx.globalAlpha = Math.min(1, toast.t * 2);
  ctx.save(); rrect(W / 2 - 230, 70, 460, 50, 18); ctx.fillStyle = 'rgba(60,40,70,0.88)'; ctx.fill(); ctx.restore();
  text(toast.text, W / 2, 95, 22, '#fff'); ctx.globalAlpha = 1;
}
function drawStage(): void {
  drawBg(state.bg);
  const speaking = state.line && state.line.who;
  for (const c of state.shown) drawChar(c, state.shown.length > 1 && !!speaking && speaking !== c.id && speaking !== 'me' && !!NAMES[speaking]?.cast);
  drawPetals(state.bg === 'festival');
  drawHearts(); drawDay(); drawBox(); drawChoice(); drawCard();
}

// ---- Scenes --------------------------------------------------------------------------------
let titleSel = 0, pauseSel = 0, logScroll = 0;
const titleItems = (): string[] => store.get(SAVE_KEY) ? ['새로 시작', '이어하기'] : ['새로 시작'];
const PAUSE_ITEMS = ['계속하기', '저장하기', '글자 속도', '타이틀로'];
function menu(items: string[], sel: number, x: number, y: number, gap = 70): Box[] {
  const boxes: Box[] = [];
  items.forEach((s, i) => {
    const yy = y + i * gap, on = sel === i;
    ctx.save(); rrect(x - 190, yy - 26, 380, 52, 20); ctx.fillStyle = on ? '#ffe3ec' : 'rgba(255,247,236,0.9)'; ctx.fill();
    ctx.strokeStyle = on ? C.pink : '#e7cdd5'; ctx.lineWidth = on ? 4 : 2; ctx.stroke(); ctx.restore();
    text(s, x, yy, 26, C.ink, 'center', on ? 'bold' : '');
    boxes.push({ x: x - 190, y: yy - 26, w: 380, h: 52, i });
  });
  return boxes;
}
function clickedBox(boxes: Box[]): number {
  if (!clickAt) return -1;
  const p = clickAt;
  const b = boxes.find(b => p.x > b.x && p.x < b.x + b.w && p.y > b.y && p.y < b.y + b.h);
  return b ? b.i : -1;
}
function menuNav(n: number, sel: number): number {
  if (pressed('ArrowDown')) return (sel + 1) % n;
  if (pressed('ArrowUp')) return (sel + n - 1) % n;
  return sel;
}
let titleBoxes: Box[] = [], pauseBoxes: Box[] = [];
const scenes: Record<SceneName, { update(dt: number): void; draw(): void }> = {
  figures: { // every character side by side with their name, for the outline check
    update(dt) { state.t += dt; updatePetals(dt); },
    draw() {
      drawBg('road');
      (['hana', 'serin', 'yuri'] as CastId[]).forEach((id, i) => {
        const pos = (['l', 'c', 'r'] as Pos[])[i];
        drawChar({ id, face: 'neutral', pos, a: 1, bounce: 0 }, false);
        ctx.save(); rrect(POS[pos] - 110, H - 70, 220, 50, 18); ctx.fillStyle = COLORS[id]; ctx.fill(); ctx.restore();
        text(NAMES[id].full, POS[pos], H - 45, 26, '#fff', 'center', 'bold');
      });
      drawPetals(false);
    },
  },
  title: {
    update(dt) {
      state.t += dt; updatePetals(dt);
      const items = titleItems();
      titleSel = Math.min(menuNav(items.length, titleSel), items.length - 1);
      const c = clickedBox(titleBoxes); if (c >= 0) titleSel = c;
      if (pressed('KeyC') && items.length > 1) titleSel = 1;
      if (advanceKey() || c >= 0 || pressed('KeyC')) {
        if (titleSel === 1 && loadSave()) { scene = 'play'; if (!state.choice && !state.line) run(); }
        else { store.del(SAVE_KEY); reset(); scene = 'play'; run(); }
      }
    },
    draw() {
      drawBg('road');
      ctx.fillStyle = 'rgba(255,245,248,0.35)'; ctx.fillRect(0, 0, W, H);
      drawPetals(false);
      ctx.save(); rrect(W / 2 - 360, 70, 720, 150, 30); ctx.fillStyle = 'rgba(255,247,236,0.88)'; ctx.fill(); ctx.restore();
      text(TITLE, W / 2, 128, 60, '#d9577c', 'center', 'bold');
      text('전학 온 첫 주, 축제까지 남은 사흘', W / 2, 186, 24, C.inkSoft);
      titleBoxes = menu(titleItems(), titleSel, W / 2, 300);
      ctx.save(); rrect(W / 2 - 330, 470, 660, 190, 22); ctx.fillStyle = 'rgba(255,247,236,0.85)'; ctx.fill(); ctx.restore();
      CONTROLS.forEach((c, i) => text(c, W / 2, 506 + i * 38, 20, C.ink));
      if (foundEndings.length) text(`발견한 엔딩 ${foundEndings.length} / ${Object.keys(ENDINGS).length}`, W - 30, H - 24, 18, '#fff', 'right', 'bold');
    },
  },
  play: {
    update(dt) {
      state.t += dt; updatePetals(dt);
      if (toast && (toast.t -= dt) <= 0) toast = null;
      for (const c of state.shown) { c.a = Math.min(1, c.a + dt / tune.fade_time); c.bounce = Math.max(0, c.bounce - dt * 3); }
      for (const f of state.fx) f.t += dt; state.fx = state.fx.filter(f => f.t < 1.2);
      if (pressed('Escape') || pressed('KeyP')) { pauseSel = 0; scene = 'pause'; return; }
      if (pressed('KeyL')) { logScroll = 0; scene = 'log'; return; }
      if (state.card) {
        state.card.t += dt;
        if (state.card.t > tune.daycard_time || advanceKey() || clickAt) { state.card = null; run(); }
        return;
      }
      if (state.line && state.reveal < 9999) { // letters at the reader's speed, with the speaker's blip
        const n = [...state.line.text].length, before = Math.floor(state.reveal);
        state.reveal = Math.min(n, state.reveal + tune.text_speed * SPEEDS[speedIdx].k * dt);
        const now = Math.floor(state.reveal);
        if (now > before && state.line.who && now - (state.blipAt || 0) >= tune.blip_every && now < n) {
          state.blipAt = now; const v = VOICES[state.line.who as SpeakerId]; if (v) tone(v.f * (0.95 + rng() * 0.1), 0.05, v.type, v.vol);
        }
        if (state.reveal >= n) state.reveal = n;
      }
      if (state.choice) {
        const opts = choiceOptions(currentChoice());
        state.sel = menuNav(opts.length, state.sel);
        for (let i = 0; i < opts.length; i++) if (pressed('Digit' + (i + 1)) || pressed('Numpad' + (i + 1))) { choose(i); return; }
        const c = clickedBox(choiceBoxes);
        if (c >= 0) { choose(c); return; }
        if (pressed('Enter') || pressed('Space') || pressed('NumpadEnter')) choose(state.sel);
        return;
      }
      if (advanceKey() || clickAt) advance();
    },
    draw() { drawStage(); drawToast(); },
  },
  pause: {
    update() {
      pauseSel = menuNav(PAUSE_ITEMS.length, pauseSel);
      const c = clickedBox(pauseBoxes); if (c >= 0) pauseSel = c;
      if (pressed('Escape') || pressed('KeyP')) { scene = 'play'; return; }
      if (pauseSel === 2 && (pressed('ArrowLeft') || pressed('ArrowRight'))) {
        speedIdx = (speedIdx + (pressed('ArrowRight') ? 1 : SPEEDS.length - 1)) % SPEEDS.length; store.set('sakura-week.speed', speedIdx);
      }
      if (pressed('Enter') || pressed('Space') || c >= 0) {
        if (pauseSel === 0) scene = 'play';
        if (pauseSel === 1) { save(true); scene = 'play'; }
        if (pauseSel === 2) { speedIdx = (speedIdx + 1) % SPEEDS.length; store.set('sakura-week.speed', speedIdx); }
        if (pauseSel === 3) { save(false); titleSel = 0; scene = 'title'; }
      }
    },
    draw() {
      scenes.play.draw();
      ctx.fillStyle = 'rgba(40,25,50,0.55)'; ctx.fillRect(0, 0, W, H);
      text('일시정지', W / 2, 150, 48, '#fff', 'center', 'bold');
      const items = PAUSE_ITEMS.slice(); items[2] = `글자 속도: ${SPEEDS[speedIdx].name}`;
      pauseBoxes = menu(items, pauseSel, W / 2, 260, 80);
      text('↑↓ 고르기 · Enter 결정 · 글자 속도는 ←→ · Esc 돌아가기', W / 2, 620, 20, '#fff');
      text('선택지마다 자동으로 저장됩니다', W / 2, 656, 18, '#ffd3df');
    },
  },
  log: {
    update() {
      if (pressed('KeyL') || pressed('Escape') || clickAt) { scene = 'play'; return; }
      if (pressed('ArrowUp')) logScroll = Math.min(Math.max(0, state.log.length - 11), logScroll + 1);
      if (pressed('ArrowDown')) logScroll = Math.max(0, logScroll - 1);
    },
    draw() {
      scenes.play.draw();
      ctx.fillStyle = 'rgba(30,22,45,0.88)'; ctx.fillRect(0, 0, W, H);
      text('대사 로그', W / 2, 44, 30, '#fff', 'center', 'bold');
      const end = state.log.length - logScroll, rows = state.log.slice(Math.max(0, end - 11), end);
      rows.forEach((r, i) => {
        const y = 100 + i * 50;
        if (r.who) text(NAMES[r.who].full, 150, y, 21, COLORS[r.who] === '#7a8a99' ? '#b7c3cf' : COLORS[r.who], 'right', 'bold');
        const t = wrap(r.text, 920, 22)[0] + (wrap(r.text, 920, 22).length > 1 ? '…' : '');
        text(t, 170, y, 22, r.who ? '#fff' : '#d8c8e0', 'left');
      });
      text('↑↓ 넘기기 · L / Esc / 클릭 닫기', W / 2, H - 26, 19, '#ffd3df');
    },
  },
  results: {
    update(dt) {
      state.t += dt; updatePetals(dt);
      if (advanceKey() || clickAt) { reset(); scene = 'play'; run(); }
      if (pressed('Escape')) { titleSel = 0; scene = 'title'; }
    },
    draw() {
      const e = ENDINGS[state.ending as string];
      drawBg(e.bg);
      for (const c of state.shown) drawChar({ ...c, a: 1 }, false);
      drawPetals(e.bg === 'festival');
      ctx.fillStyle = 'rgba(25,20,50,0.62)'; ctx.fillRect(0, 0, W, H);
      text('ENDING', W / 2, 120, 26, '#ffb7cb', 'center', 'bold');
      text(e.title, W / 2, 180, 56, '#fff', 'center', 'bold');
      text(e.line, W / 2, 246, 24, '#ffe6ef');
      const all = Object.keys(ENDINGS);
      text(`엔딩 ${foundEndings.length} / ${all.length} 발견`, W / 2, 320, 30, '#fff', 'center', 'bold');
      all.forEach((id, i) => {
        const xx = W / 2 + (i - 1.5) * 260;
        const got = foundEndings.includes(id);
        ctx.save(); rrect(xx - 118, 370, 236, 90, 18); ctx.fillStyle = got ? 'rgba(255,227,236,0.95)' : 'rgba(30,20,50,0.6)'; ctx.fill(); ctx.restore();
        text(got ? ENDINGS[id].title : '???', xx, 402, 21, got ? C.ink : '#fff', 'center', 'bold');
        text(got ? ENDINGS[id].who : '아직 못 본 엔딩', xx, 434, 17, got ? C.inkSoft : '#ddd');
      });
      const left = all.filter(id => !foundEndings.includes(id));
      text(left.length ? '다른 사람을 만나면, 다른 말을 고르면, 다른 밤이 됩니다.' : '모든 엔딩을 찾았습니다. 고마워요!', W / 2, 530, 24, '#fff');
      text('Enter / 클릭: 처음부터 다시   ·   Esc: 타이틀', W / 2, 600, 24, '#ffd3df', 'center', 'bold');
    },
  },
};

// ---- Loop: fixed step, frame time clamped ---------------------------------------------
function step(): void {
  if (pressed('KeyM')) { setMuted(!isMuted()); hit.delete('KeyM'); toast = { text: isMuted() ? '소리 끔' : '소리 켬', t: 1 }; }
  scenes[scene].update(STEP); hit.clear(); clickAt = null;
}
let last = 0, acc = 0;
function tick(): void {
  const now = clock.now();
  acc += Math.min(now - last, 0.25); last = now;
  while (acc >= STEP) { step(); acc -= STEP; }
  drawFrame();
}
function drawFrame(): void { scenes[scene].draw(); if (scene !== 'play') drawToast(); }
function frame(): void { tick(); requestAnimationFrame(frame); }
function timer(): void { if (document.visibilityState === 'visible' && clock.now() - last > 0.1) tick(); }

install({
  get scene() { return scene; },
  get state() { return state; },
  press(code) { hit.add(code); },
  hold(code, on) { if (on) down.add(code); else down.delete(code); },
  get events() { return events; },
  step(n = 1, draw = true) {
    for (let i = 0; i < n; i++) step();
    if (draw) drawFrame();
  },
});

reset();
scene = (params.get('scene') as SceneName) || 'title';
if (scene === 'play') run();
last = clock.now();
if (manual) drawFrame();
else { requestAnimationFrame(frame); setInterval(timer, 50); }
