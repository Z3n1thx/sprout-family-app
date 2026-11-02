/**
 * Read-aloud.
 *
 * A five-year-old cannot read "Dad will check your bed", so every child screen
 * carries an ear button and, at tier 1, reads itself once on arrival. It is a
 * comprehension aid, not a feature: it uses the browser's own voice, needs no
 * network, and sends nothing anywhere.
 */

export function speechAvailable(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function stopSpeaking(): void {
  if (speechAvailable()) window.speechSynthesis.cancel();
}

export function speak(text: string): void {
  if (!speechAvailable() || !text.trim()) return;
  stopSpeaking();
  const u = new SpeechSynthesisUtterance(text.replace(/\s+/g, ' ').trim());
  // Slightly slow and slightly high. Faster than this and a beginning reader
  // cannot follow the words on screen while hearing them.
  u.rate = 0.92;
  u.pitch = 1.1;
  window.speechSynthesis.speak(u);
}
