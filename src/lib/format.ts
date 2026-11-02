/**
 * Formatting helpers.
 *
 * The word "coins" is used everywhere; "balance" appears only in the parent
 * app; a currency symbol appears in exactly one place (`approxMoney`, tier 3
 * only) and always behind a "~". That is what it is *like*, not what it *is*.
 */

/** House rate. A parent-visible setting in a later build; fixed for now. */
export const COIN_CENTS = 10;

export function approxMoney(coins: number): string {
  const cents = coins * COIN_CENTS;
  return `~ $${(cents / 100).toFixed(2)}`;
}

export function coinWord(n: number): string {
  return `${n} ${n === 1 ? 'coin' : 'coins'}`;
}

export function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function weekday(n: number): string {
  return WEEKDAYS[n] ?? 'Monday';
}

export function shortTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export function stamp(iso: string): string {
  return `${shortDate(iso)}, ${shortTime(iso)}`;
}

/**
 * How long until a goal is reachable at the current earning rate. Tier 3 only:
 * reasoning about rate against time needs the multiplicative thinking that
 * arrives around 9-10. Below that it is noise.
 */
export function weeksAtRate(remaining: number, perWeek: number): string | null {
  if (perWeek <= 0 || remaining <= 0) return null;
  const weeks = Math.ceil(remaining / perWeek);
  return `${plural(weeks, 'week', 'weeks')} at ${perWeek}/wk`;
}

export function pct(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((part / whole) * 100)));
}

export function newId(prefix: string): string {
  const rand =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}_${rand}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

/** ISO string N days ago — used by the seed so the app opens with a history. */
export function daysAgo(days: number, hour = 17, minute = 20): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}
