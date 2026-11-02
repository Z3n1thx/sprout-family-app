/**
 * Sound.
 *
 * Two cues exist and both are good news: coins landing, and a reward
 * unlocking. There is deliberately no sound for a decline, a spend, or an
 * error — a sad noise attached to "not yet" would turn a parent's reason into
 * a punishment, and a chime attached to spending would be a slot machine.
 *
 * Generated with WebAudio so the app ships no audio files and can be muted per
 * child from their profile.
 */

type Cue = 'earn' | 'unlock';

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  ctx ??= new Ctor();
  return ctx;
}

function note(ac: AudioContext, freq: number, start: number, length: number, gain: number) {
  const osc = ac.createOscillator();
  const amp = ac.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  amp.gain.setValueAtTime(0, ac.currentTime + start);
  amp.gain.linearRampToValueAtTime(gain, ac.currentTime + start + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + start + length);
  osc.connect(amp).connect(ac.destination);
  osc.start(ac.currentTime + start);
  osc.stop(ac.currentTime + start + length + 0.02);
}

/** Rising thirds. Short, quiet, and over before it can become a reason to
 *  repeat the action for its own sake. */
export function chime(cue: Cue, enabled: boolean): void {
  if (!enabled) return;
  const ac = audio();
  if (!ac) return;
  if (ac.state === 'suspended') void ac.resume();

  const steps = cue === 'earn' ? [659.25, 830.61, 987.77] : [523.25, 659.25, 783.99, 1046.5];
  steps.forEach((f, i) => note(ac, f, i * 0.075, 0.22, 0.075));
}
