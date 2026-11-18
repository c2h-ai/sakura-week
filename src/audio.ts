// Sound through Web Audio: voice blips and choice chimes, started on the first input, M mutes.
import { tune } from './config';
import { audioContext } from './hook';

let audio: { ac: AudioContext; out: GainNode } | null = null, muted = false;

/** Starts or resumes the audio; browsers allow it only after an input. */
export function startAudio(): void {
  if (!audio) {
    const ac = audioContext();
    const out = ac.createGain(); out.gain.value = muted ? 0 : tune.volume;
    out.connect(ac.destination); audio = { ac, out };
  }
  if (audio.ac.state === 'suspended') audio.ac.resume();
}

/** Whether the sound is off. */
export function isMuted(): boolean { return muted; }

/** Turns the sound off or on. */
export function setMuted(m: boolean): void { muted = m; if (audio) audio.out.gain.value = m ? 0 : tune.volume; }
addEventListener('tune', () => setMuted(muted)); // the tweak panel moved a value: the volume follows

/** Plays one fading tone. */
export function tone(freq: number, dur: number, type: OscillatorType = 'sine', vol = 0.2, delay = 0): void {
  if (!audio || muted) return;
  const t = audio.ac.currentTime + delay, o = audio.ac.createOscillator(), g = audio.ac.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(audio.out); o.start(t); o.stop(t + dur);
}

/** The game's sound effects. */
export const sfx = {
  up(): void { tone(784, 0.18, 'sine', 0.22); tone(1175, 0.3, 'sine', 0.2, 0.09); },
  down(): void { tone(392, 0.2, 'triangle', 0.2); tone(294, 0.35, 'triangle', 0.18, 0.12); },
  pick(): void { tone(660, 0.08, 'sine', 0.15); },
  page(): void { tone(990, 0.06, 'sine', 0.06); },
  ending(): void { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.6, 'sine', 0.15, i * 0.14)); },
};
