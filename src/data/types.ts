/**
 * Sprout domain types.
 *
 * Two rules shape everything here:
 *
 *  1. Coins are play money. Nothing in this file references a bank, a card, a
 *     currency code or a payment provider, because no such thing exists in the
 *     product. `realWorldHint` on a Reward is a *string a parent typed*, not a price.
 *
 *  2. The ledger is the single source of truth for how many coins a child has.
 *     Balances are never stored — they are folded from entries (see lib/ledger.ts).
 *     That makes "My Story" and the arithmetic shown to 7-8s correct by
 *     construction rather than by careful bookkeeping.
 */

export type Tier = 1 | 2 | 3;

/** Where coins sit. `goal:<id>` is escrow — committed to a goal, still the child's. */
export type Bucket = 'spend' | 'save' | 'share' | `goal:${string}`;

export type EntryKind =
  | 'allowance'
  | 'bonus'
  | 'job'
  | 'spend'
  | 'correction'
  | 'transfer'
  | 'savings-bonus';

/**
 * One movement of coins. `to` without `from` mints (a parent added coins);
 * `from` without `to` burns (coins left for a reward); both = a transfer.
 * `coins` is always a positive magnitude — direction lives in from/to.
 */
export interface Entry {
  id: string;
  childId: string;
  at: string;
  kind: EntryKind;
  coins: number;
  from?: Bucket;
  to?: Bucket;
  /** Child-facing fragment: "a toy", "tidying your room", "pocket money". */
  label: string;
  /** Emoji shown in My Story. Kept alongside the label so history is scannable. */
  icon: string;
  /** Parent id, when a grown-up caused this. */
  by?: string;
  note?: string;
  /** Job / SpendRequest / Redemption id. */
  refId?: string;
}

export interface Parent {
  id: string;
  /** What children call them. Shown in the child app: "Dad will check your bed." */
  label: string;
  name: string;
  /** Four digits. There is no account and no server — see data/store.tsx. */
  pin: string;
}

export interface ChildLimits {
  /** Largest single request the child can make without it being flagged. */
  perRequest: number;
  /** Rolling 7-day ceiling. */
  weekly: number;
  /**
   * Pause on big asks. A request over half the per-ask limit gets a short,
   * visible wait-and-count step before the child can send it. It interrupts the
   * impulse without ever refusing the child, which is the only part of
   * "think about it" that works at this age.
   */
  pauseBigAsks: boolean;
  /** Categories the child may ask for. */
  categories: SpendCategoryId[];
}

export interface ChildPrefs {
  readAloud: boolean;
  reducedMotion: boolean;
  /** Andika — single-storey a and g, matching handwriting taught at 4-6. */
  beginnerFont: boolean;
  sound: boolean;
}

export interface Child {
  id: string;
  name: string;
  /** Animal key into ui/avatars.ts. Recognition beats recall at login. */
  avatar: string;
  /** Three picture-key cells, in order. Never displayed as a hint. */
  pictureKey: string[];
  age: number;
  tier: Tier;
  limits: ChildLimits;
  prefs: ChildPrefs;
  /** Sunday savings bonus: +1 coin per 10 kept in Save. */
  savingsBonus: boolean;
  /** Coins per allowance run, and the weekday it lands on (0 = Sunday). */
  allowance: { coins: number; weekday: number; active: boolean };
}

export type JobStatus = 'open' | 'submitted' | 'approved' | 'not_yet' | 'disputed';

export interface JobEvent {
  at: string;
  /** Short past-tense sentence for the parent's review history. */
  what: string;
  actor: 'child' | 'parent';
}

export interface Dispute {
  createdAt: string;
  /** Canned phrase chips a non-writer can tap. */
  phrases: string[];
  typed?: string;
  /** Object URL for a recorded clip. Prototype-local; never uploaded. */
  voiceNoteUrl?: string;
  voiceNoteSeconds?: number;
  photo?: string;
}

export interface Job {
  id: string;
  childId: string;
  title: string;
  icon: string;
  coins: number;
  /** Optional plain-language detail: "Sheets flat, pillow at the top." */
  detail?: string;
  status: JobStatus;
  autoApprove: boolean;
  /** Weekday numbers this job reappears on. Empty = one-off. */
  repeatDays: number[];
  createdAt: string;
  submittedAt?: string;
  decidedAt?: string;
  /** Which parent decided. The child is told who said it, by name. */
  decidedBy?: string;
  /** Photo the child attached when submitting. */
  photo?: string;
  /** Which decline reason the parent picked. Mandatory on a decline. */
  reasonId?: string;
  /** Free text the parent added to a decline or an approval. */
  parentNote?: string;
  dispute?: Dispute;
  /** How many times this job has been declined, for the "1 of 4 weeks" signal. */
  declineCount: number;
  history: JobEvent[];
  /** Cleared by the child once they have seen the outcome screen. */
  seenByChild: boolean;
}

export type SpendCategoryId = 'toy' | 'book' | 'treat' | 'present' | 'other';

export type SpendStatus = 'pending' | 'approved' | 'not_yet' | 'withdrawn';

export interface SpendRequest {
  id: string;
  childId: string;
  coins: number;
  category: SpendCategoryId;
  /** What the child said it was for, typed or spoken. */
  said?: string;
  voiceNoteUrl?: string;
  status: SpendStatus;
  createdAt: string;
  decidedAt?: string;
  decidedBy?: string;
  reasonId?: string;
  parentNote?: string;
  /** Parent's answer to "then what happens": "I'll get it with you Saturday." */
  nextStep?: string;
  seenByChild: boolean;
}

export type ShelfId = 'time' | 'screen' | 'treats' | 'outings' | 'things';

export interface Reward {
  id: string;
  shelf: ShelfId;
  name: string;
  emoji: string;
  coins: number;
  /** Which interface levels this reward is offered to. */
  tiers: Tier[];
  /** Parent-authored note: "We'll go after school." Not a price. */
  realWorldHint?: string;
  /** Times it can still be unlocked. undefined = unlimited. */
  stock?: number;
  active: boolean;
}

export type RedemptionStatus = 'requested' | 'granted' | 'not_yet' | 'done';

export interface Redemption {
  id: string;
  childId: string;
  rewardId: string;
  coins: number;
  status: RedemptionStatus;
  createdAt: string;
  decidedAt?: string;
  decidedBy?: string;
  reasonId?: string;
  parentNote?: string;
  seenByChild: boolean;
}

export interface Goal {
  id: string;
  childId: string;
  name: string;
  emoji: string;
  target: number;
  createdAt: string;
  reachedAt?: string;
}

export interface EarnedBadge {
  key: string;
  childId: string;
  earnedAt: string;
}

/**
 * One phone, tablet or laptop that has joined the family.
 *
 * A device is not an account. It is a note in the family's own records saying
 * "this is Dad's phone, and it is the one Ada uses" — enough for a parent to
 * recognise a device they no longer own and unlink it.
 */
export interface Device {
  id: string;
  /** Parent-editable: "Dad's phone", "the kitchen iPad". */
  name: string;
  /** What this device is used as. A child device opens straight into the kid app. */
  kind: 'parent' | 'child';
  /** Set when this device belongs to one particular child. */
  childId?: string;
  addedAt: string;
  /** Last time a grown-up signed in here. */
  lastSeen?: string;
}

export interface Family {
  name: string;
  /**
   * The joining code, XXXX-XXXX. Not a lookup key — there is nothing to look it
   * up in. It is the passphrase a join link is encrypted under, so regenerating
   * it makes every link already sent permanently unreadable. See lib/pair.ts.
   */
  code: string;
  createdAt: string;
  devices: Device[];
  parents: Parent[];
  children: Child[];
}

export interface State {
  /** Schema version, so a stored state from an older build can be discarded. */
  version: number;
  family: Family;
  entries: Entry[];
  jobs: Job[];
  spendRequests: SpendRequest[];
  rewards: Reward[];
  redemptions: Redemption[];
  goals: Goal[];
  badges: EarnedBadge[];
  /** Premium is a parent-side flag. Nothing in the child app reads it. */
  premium: boolean;
}

/** Folded from the ledger — never stored. */
export interface Balances {
  spend: number;
  save: number;
  share: number;
  /** goalId -> escrowed coins. */
  goals: Record<string, number>;
  /** spend + save + share. Escrow is deliberately excluded: it is committed. */
  available: number;
  /** Everything the child owns, escrow included. */
  total: number;
}
