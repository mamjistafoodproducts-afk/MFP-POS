// Web Audio API Sound Synthesizer for Fast POS Billing
// Works 100% client-side and offline with zero audio assets

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

interface SoundOptions {
  enabled?: boolean;
  volume?: number;
}

/**
 * Standard pleasant beep with frequency, duration, and curve
 */
function playTone(freq: number, durationSec: number, type: OscillatorType = 'sine', volume = 0.5) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    const targetGain = Math.max(0.01, Math.min(1, volume));
    gain.gain.setValueAtTime(targetGain, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationSec);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + durationSec);
  } catch (err) {
    console.debug('Audio tone playback ignored:', err);
  }
}

/**
 * High-pitched quick chirp when an item is added or scanned
 */
export function playScanSuccess(opts: SoundOptions = {}) {
  if (opts.enabled === false) return;
  const vol = opts.volume ?? 0.6;
  playTone(880, 0.08, 'sine', vol);
}

/**
 * Shorter soft chirp when changing quantity
 */
export function playQtyChange(isIncrement: boolean, opts: SoundOptions = {}) {
  if (opts.enabled === false) return;
  const vol = (opts.volume ?? 0.6) * 0.8;
  playTone(isIncrement ? 720 : 540, 0.06, 'sine', vol);
}

/**
 * Deeper downward tone when an item is removed from cart
 */
export function playItemRemoved(opts: SoundOptions = {}) {
  if (opts.enabled === false) return;
  const vol = (opts.volume ?? 0.6) * 0.7;
  playTone(330, 0.12, 'triangle', vol);
}

/**
 * Cash register / Sale completed victory chord arpeggio
 */
export function playSaleCompleteChime(opts: SoundOptions = {}) {
  if (opts.enabled === false) return;
  const vol = opts.volume ?? 0.7;
  const ctx = getAudioContext();
  if (!ctx) return;

  // Arpeggio: C5 (523Hz), E5 (659Hz), G5 (784Hz), C6 (1046Hz)
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((freq, idx) => {
    setTimeout(() => {
      playTone(freq, 0.18, 'triangle', vol * 0.9);
    }, idx * 60);
  });
}

/**
 * Hold / Park cart gentle double chime
 */
export function playHoldChime(opts: SoundOptions = {}) {
  if (opts.enabled === false) return;
  const vol = (opts.volume ?? 0.6) * 0.8;
  playTone(440, 0.08, 'sine', vol);
  setTimeout(() => playTone(587, 0.12, 'sine', vol), 80);
}

/**
 * Recall held cart chime
 */
export function playRecallChime(opts: SoundOptions = {}) {
  if (opts.enabled === false) return;
  const vol = (opts.volume ?? 0.6) * 0.8;
  playTone(587, 0.08, 'sine', vol);
  setTimeout(() => playTone(440, 0.12, 'sine', vol), 80);
}

/**
 * Error / Empty cart / Warning beep
 */
export function playAlertBeep(opts: SoundOptions = {}) {
  if (opts.enabled === false) return;
  const vol = opts.volume ?? 0.7;
  playTone(220, 0.18, 'sawtooth', vol * 0.5);
}
