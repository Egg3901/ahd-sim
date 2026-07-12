import { useSettingsStore } from "@store/settingsStore";

// Tiny WebAudio synth for UI cues. No binary audio assets: every sound here is
// a short oscillator blip built at play time. Browsers block audio until a
// user gesture, so the context is created lazily on first call (armAudio
// should be wired to the first pointerdown/keydown in the app root).

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** Call once on the first user gesture to satisfy the browser autoplay policy. */
export function armAudio(): void {
  getCtx();
}

interface Tone {
  freq: number;
  duration: number;
  type?: OscillatorType;
  delay?: number;
  gain?: number;
}

function playTones(tones: Tone[]): void {
  const { soundOn, volume } = useSettingsStore.getState();
  if (!soundOn || volume <= 0) return;
  const audio = getCtx();
  if (!audio) return;

  const now = audio.currentTime;
  for (const t of tones) {
    const osc = audio.createOscillator();
    const gainNode = audio.createGain();
    osc.type = t.type ?? "sine";
    osc.frequency.value = t.freq;

    const start = now + (t.delay ?? 0);
    const peak = (t.gain ?? 0.2) * volume;
    gainNode.gain.setValueAtTime(0, start);
    gainNode.gain.linearRampToValueAtTime(peak, start + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, start + t.duration);

    osc.connect(gainNode);
    gainNode.connect(audio.destination);
    osc.start(start);
    osc.stop(start + t.duration + 0.02);
  }
}

export const sfx = {
  /** Soft rising blip when a turn/week advances. */
  turnAdvance(): void {
    playTones([{ freq: 420, duration: 0.12, type: "triangle" }, { freq: 560, duration: 0.14, delay: 0.06, type: "triangle" }]);
  },
  /** Quick upward tick for a poll number moving in the player's favor. */
  pollUp(): void {
    playTones([{ freq: 660, duration: 0.09, type: "sine", gain: 0.15 }]);
  },
  /** Quick downward tick for a poll number moving against the player. */
  pollDown(): void {
    playTones([{ freq: 300, duration: 0.11, type: "sine", gain: 0.15 }]);
  },
  /** Alert tone when an event modal pops up needing a decision. */
  eventPopup(): void {
    playTones([{ freq: 520, duration: 0.1, type: "square", gain: 0.12 }, { freq: 520, duration: 0.1, delay: 0.14, type: "square", gain: 0.12 }]);
  },
  /** Triumphant sting for an election-night win. */
  win(): void {
    playTones([
      { freq: 523.25, duration: 0.16, delay: 0, type: "triangle", gain: 0.22 },
      { freq: 659.25, duration: 0.16, delay: 0.12, type: "triangle", gain: 0.22 },
      { freq: 783.99, duration: 0.28, delay: 0.24, type: "triangle", gain: 0.24 },
    ]);
  },
  /** Somber sting for an election-night loss. */
  lose(): void {
    playTones([
      { freq: 392, duration: 0.2, delay: 0, type: "sawtooth", gain: 0.16 },
      { freq: 329.63, duration: 0.3, delay: 0.16, type: "sawtooth", gain: 0.16 },
    ]);
  },
};
