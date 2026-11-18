// The drawing kit: the canvas fitted to the window, text, rounded boxes, wrapping and the heart.

/** Logical width and height; the canvas scales to the window. */
export const W = 1280, H = 720;
/** The type: system Korean fonts, nothing fetched. */
export const FONT = '"Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", sans-serif';

/** The game's canvas. */
export const canvas = document.getElementById('game') as HTMLCanvasElement;
/** Its 2D context, in logical pixels after fit(). */
export const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
/** The current scale of the logical screen to the window. */
export const view = { s: 1 };

/** Fills the window at any size and pixel ratio, centred, keeping 16:9. */
export function fit(): void {
  const k = Math.min(innerWidth / W, innerHeight / H);
  const r = k * (devicePixelRatio || 1);
  canvas.width = Math.round(W * r); canvas.height = Math.round(H * r);
  canvas.style.width = Math.round(W * k) + 'px'; canvas.style.height = Math.round(H * k) + 'px';
  canvas.style.marginTop = Math.max(0, Math.floor((innerHeight - H * k) / 2)) + 'px';
  ctx.setTransform(r, 0, 0, r, 0, 0); ctx.imageSmoothingEnabled = true; view.s = k;
}

/** Fills the whole screen with one colour. */
export function clear(c: string): void { ctx.fillStyle = c; ctx.fillRect(0, 0, W, H); }

/** Draws one line of text, centred on y. */
export function text(s: string, x: number, y: number, size: number, c: string, align: CanvasTextAlign = 'center', weight = ''): void {
  ctx.fillStyle = c; ctx.font = `${weight} ${size}px ${FONT}`; ctx.textAlign = align;
  ctx.textBaseline = 'middle'; ctx.fillText(s, x, y);
}

/** Traces a rounded rectangle for fill or stroke. */
export function rrect(x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

/** Splits text into lines that fit maxW: Korean wraps at any letter, at a space when one is near. */
export function wrap(s: string, maxW: number, size: number): string[] {
  ctx.font = `${size}px ${FONT}`;
  const lines: string[] = []; let line = '';
  for (const ch of s) {
    if (ctx.measureText(line + ch).width > maxW) {
      const sp = line.lastIndexOf(' ');
      if (sp > line.length - 8 && sp > 0) { lines.push(line.slice(0, sp)); line = line.slice(sp + 1) + ch; }
      else { lines.push(line); line = ch; }
    } else line += ch;
  }
  if (line) lines.push(line);
  return lines;
}

/** Traces a heart s pixels tall, its top centre at (x, y). */
export function heartPath(x: number, y: number, s: number): void {
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.35);
  ctx.bezierCurveTo(x, y, x - s * 0.5, y - s * 0.05, x - s * 0.5, y + s * 0.3);
  ctx.bezierCurveTo(x - s * 0.5, y + s * 0.6, x - s * 0.1, y + s * 0.75, x, y + s);
  ctx.bezierCurveTo(x + s * 0.1, y + s * 0.75, x + s * 0.5, y + s * 0.6, x + s * 0.5, y + s * 0.3);
  ctx.bezierCurveTo(x + s * 0.5, y - s * 0.05, x, y, x, y + s * 0.35);
  ctx.closePath();
}
