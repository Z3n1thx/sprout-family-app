import type { Balances, Bucket, Entry } from '../data/types';

/**
 * Balances are folded from the ledger, never stored.
 *
 * This is not a purity exercise: the running sums shown to 7-8s ("47 - 8 = 39")
 * and the whole of My Story are the same fold. If the balance were a separate
 * field, the number a child reads and the arithmetic they practise could drift
 * apart, and the app would be teaching a lie.
 */

export const EMPTY_BALANCES: Balances = {
  spend: 0,
  save: 0,
  share: 0,
  goals: {},
  available: 0,
  total: 0,
};

function apply(b: Balances, bucket: Bucket, delta: number) {
  if (bucket === 'spend' || bucket === 'save' || bucket === 'share') {
    b[bucket] += delta;
  } else {
    const id = bucket.slice(5);
    b.goals[id] = (b.goals[id] ?? 0) + delta;
  }
}

export function foldBalances(entries: Entry[], childId: string): Balances {
  const b: Balances = { spend: 0, save: 0, share: 0, goals: {}, available: 0, total: 0 };
  for (const e of entries) {
    if (e.childId !== childId) continue;
    if (e.to) apply(b, e.to, e.coins);
    if (e.from) apply(b, e.from, -e.coins);
  }
  b.available = b.spend + b.save + b.share;
  b.total = b.available + Object.values(b.goals).reduce((n, v) => n + v, 0);
  return b;
}

/** Coins committed to one goal. Still the child's — escrow is a commitment
 *  device, not a lock, and the withdraw button is always on the goal screen. */
export function escrowedFor(balances: Balances, goalId: string): number {
  return balances.goals[goalId] ?? 0;
}

export type LineKind = 'in' | 'out' | 'move';

export interface StoryLine {
  entry: Entry;
  kind: LineKind;
  /** Coins the child had in hand before and after this line. */
  before: number;
  after: number;
}

function isAvailable(bucket: Bucket | undefined): boolean {
  return bucket === 'spend' || bucket === 'save' || bucket === 'share';
}

/**
 * Chronological fold, returned newest-first for display.
 *
 * The running total tracks *available* coins, not everything owned, because
 * available is the number on the jar. Putting coins aside for a goal therefore
 * shows as a subtraction — which is the honest reading, and the whole point of
 * escrow being visible rather than a hidden sub-account.
 */
export function storyLines(entries: Entry[], childId: string): StoryLine[] {
  const mine = entries
    .filter((e) => e.childId === childId)
    .slice()
    .sort((a, b) => a.at.localeCompare(b.at));

  let running = 0;
  const out: StoryLine[] = [];
  for (const e of mine) {
    const before = running;
    const delta = (isAvailable(e.to) ? e.coins : 0) - (isAvailable(e.from) ? e.coins : 0);
    running += delta;
    const kind: LineKind = delta > 0 ? 'in' : delta < 0 ? 'out' : 'move';
    out.push({ entry: e, kind, before, after: running });
  }
  return out.reverse();
}

const DAY = 86_400_000;

/** "Today" / "Yesterday" beat a date for a child who cannot yet read one. */
export function dayLabel(iso: string, now = new Date()): string {
  const d = new Date(iso);
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((startOf(now) - startOf(d)) / DAY);
  if (diff <= 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return d.toLocaleDateString(undefined, { weekday: 'long' });
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'long' });
}

export function groupByDay(lines: StoryLine[], now = new Date()): { day: string; lines: StoryLine[] }[] {
  const groups: { day: string; lines: StoryLine[] }[] = [];
  for (const l of lines) {
    const day = dayLabel(l.entry.at, now);
    const last = groups[groups.length - 1];
    if (last && last.day === day) last.lines.push(l);
    else groups.push({ day, lines: [l] });
  }
  return groups;
}

/** Coins that have left the child in the last 7 days. Drives the weekly cap. */
export function spentThisWeek(entries: Entry[], childId: string, now = new Date()): number {
  const cutoff = now.getTime() - 7 * DAY;
  return entries
    .filter(
      (e) =>
        e.childId === childId &&
        e.kind === 'spend' &&
        e.from &&
        !e.to &&
        new Date(e.at).getTime() >= cutoff,
    )
    .reduce((n, e) => n + e.coins, 0);
}

export function earnedThisWeek(entries: Entry[], childId: string, now = new Date()): number {
  const cutoff = now.getTime() - 7 * DAY;
  return entries
    .filter(
      (e) =>
        e.childId === childId &&
        (e.kind === 'job' || e.kind === 'bonus') &&
        e.to &&
        !e.from &&
        new Date(e.at).getTime() >= cutoff,
    )
    .reduce((n, e) => n + e.coins, 0);
}
