import type { ShelfId, SpendCategoryId, Tier } from './types';

/* ==========================================================================
   Catalogues. Everything a parent picks from, and every canned phrase a child
   can tap instead of typing.
   ========================================================================== */

/** Login avatars. Face-first, name-second: a pre-reader identifies their own
 *  animal in under a second but cannot reliably pick their name from three
 *  words. Recognition beats recall. */
export const AVATARS: { key: string; glyph: string; name: string }[] = [
  { key: 'frog', glyph: '🐸', name: 'Frog' },
  { key: 'fox', glyph: '🦊', name: 'Fox' },
  { key: 'panda', glyph: '🐼', name: 'Panda' },
  { key: 'owl', glyph: '🦉', name: 'Owl' },
  { key: 'octopus', glyph: '🐙', name: 'Octopus' },
  { key: 'bee', glyph: '🐝', name: 'Bee' },
  { key: 'turtle', glyph: '🐢', name: 'Turtle' },
  { key: 'lion', glyph: '🦁', name: 'Lion' },
];

export function avatarGlyph(key: string): string {
  return AVATARS.find((a) => a.key === key)?.glyph ?? '🐣';
}

/** The nine picture-key cells. Order is reshuffled on every attempt so a
 *  watching sibling cannot learn positions. */
export const KEY_CELLS = ['🐸', '🍕', '⭐', '🚀', '🍎', '🐙', '🎈', '🌈', '🚲'];

/* --- Decline reasons ------------------------------------------------------
   A reason is mandatory, but it costs one tap. The chips cover almost every
   real case, so a bare decline is never the path of least resistance — and
   the child always gets words rather than a silent no.
   ---------------------------------------------------------------------- */

export interface Reason {
  id: string;
  /** What the parent taps. */
  label: string;
  /** What the child reads, in the parent's voice. */
  childText: string;
}

export const JOB_REASONS: Reason[] = [
  { id: 'unfinished', label: 'Not finished yet', childText: 'It needs a little bit more.' },
  { id: 'unseen', label: "I can't see it done", childText: "I had a look and I couldn't see it done." },
  { id: 'again', label: 'Needs doing again', childText: 'Have another go — it needs doing again.' },
  { id: 'yesterday', label: "That was yesterday's", childText: 'That one was yesterday. This one is still to do.' },
  { id: 'talk', label: "Let's talk about it", childText: "Let's talk about this one together." },
];

export const SPEND_REASONS: Reason[] = [
  { id: 'toomuch', label: 'Too many coins for now', childText: 'That is a lot of coins for right now.' },
  { id: 'have', label: 'You already have one', childText: 'You have one of those already.' },
  { id: 'goal', label: 'Keep saving for your goal', childText: 'I think you would rather keep saving.' },
  { id: 'later', label: 'Not this week — ask again', childText: 'Not this week. Ask me again next week.' },
  { id: 'talk', label: "Let's talk about it", childText: "Let's talk about this one together." },
];

export function reasonText(list: Reason[], id: string | undefined): string {
  if (!id) return '';
  return list.find((r) => r.id === id)?.childText ?? '';
}

export function reasonLabel(list: Reason[], id: string | undefined): string {
  if (!id) return '';
  return list.find((r) => r.id === id)?.label ?? '';
}

/* --- Dispute phrases -----------------------------------------------------
   A child who cannot spell can still make a case. Chips first, then a mic,
   then a camera — typing is last because at 7 it is the slowest of the four.
   ---------------------------------------------------------------------- */

export const DISPUTE_PHRASES = [
  'I did it before dinner',
  'I did it — come and look',
  'I did most of it',
  'Someone messed it up after',
  'I did it in my room',
  'I did it yesterday as well',
];

/* --- Job templates -------------------------------------------------------
   Filtered by the child's interface level. The most common failure in chore
   apps is an adult assigning an adult-shaped task to a five-year-old and then
   declining it, so a parent adding a job for a 5-year-old is only shown jobs
   a 5-year-old can finish alone.
   ---------------------------------------------------------------------- */

export interface JobTemplate {
  title: string;
  icon: string;
  coins: number;
  tiers: Tier[];
  detail?: string;
}

export const JOB_TEMPLATES: JobTemplate[] = [
  // Reachable alone at 4-6.
  { title: 'Put your toys away', icon: '🧸', coins: 2, tiers: [1, 2] },
  { title: 'Put clothes in the basket', icon: '🧺', coins: 2, tiers: [1, 2] },
  { title: 'Feed the pet', icon: '🐟', coins: 2, tiers: [1, 2, 3] },
  { title: 'Water the plant', icon: '🪴', coins: 1, tiers: [1, 2] },
  { title: 'Put the spoons out', icon: '🥄', coins: 2, tiers: [1] },
  { title: 'Shoes on the rack', icon: '👟', coins: 1, tiers: [1] },
  { title: 'Brush your teeth', icon: '🪥', coins: 1, tiers: [1] },
  { title: 'Tidy your books', icon: '📚', coins: 2, tiers: [1, 2] },
  { title: 'Plate in the sink', icon: '🍽️', coins: 1, tiers: [1] },
  { title: 'Make your bed', icon: '🛏️', coins: 3, tiers: [1, 2, 3], detail: 'Sheet flat, pillow at the top.' },
  { title: 'Pick up the socks', icon: '🧦', coins: 1, tiers: [1] },
  { title: 'Sing to the plant', icon: '🎵', coins: 1, tiers: [1] },

  // 7-8.
  { title: 'Read for 15 minutes', icon: '📖', coins: 3, tiers: [2, 3] },
  { title: 'Homework done', icon: '✏️', coins: 4, tiers: [2, 3] },
  { title: 'Clear the table', icon: '🍽️', coins: 3, tiers: [2, 3] },
  { title: 'Sort the laundry', icon: '🧦', coins: 3, tiers: [2, 3] },
  { title: 'Take out the recycling', icon: '♻️', coins: 3, tiers: [2, 3] },
  { title: 'Tidy your room', icon: '🧹', coins: 4, tiers: [2, 3], detail: 'Floor clear, bed made, drawers shut.' },
  { title: 'Practise music 10 min', icon: '🎹', coins: 3, tiers: [2, 3] },
  { title: 'Wipe the table', icon: '🧽', coins: 2, tiers: [2, 3] },
  { title: 'Water all the plants', icon: '🪴', coins: 3, tiers: [2, 3] },
  { title: 'Help with the shopping list', icon: '📝', coins: 3, tiers: [2, 3] },
  { title: 'Put the shopping away', icon: '🛍️', coins: 3, tiers: [2, 3] },
  { title: 'Fold your own washing', icon: '👕', coins: 4, tiers: [2, 3] },

  // 9-10.
  { title: 'Load the dishwasher', icon: '🍴', coins: 5, tiers: [3] },
  { title: 'Empty the dishwasher', icon: '🥣', coins: 4, tiers: [3] },
  { title: 'Vacuum a room', icon: '🧹', coins: 6, tiers: [3] },
  { title: 'Walk the dog', icon: '🐕', coins: 6, tiers: [3] },
  { title: 'Help cook dinner', icon: '🍳', coins: 8, tiers: [3] },
  { title: 'Homework, no reminders', icon: '✏️', coins: 6, tiers: [3] },
  { title: 'Read for 30 minutes', icon: '📖', coins: 5, tiers: [3] },
  { title: 'Take the bins out', icon: '🗑️', coins: 4, tiers: [3] },
  { title: 'Change your sheets', icon: '🛏️', coins: 6, tiers: [3] },
  { title: 'Read to your sister', icon: '🧒', coins: 5, tiers: [3] },
  { title: 'Wash the car', icon: '🚗', coins: 12, tiers: [3] },
  { title: 'Plan a family meal', icon: '📋', coins: 10, tiers: [3], detail: 'Pick it, list what we need, help cook.' },
  { title: 'Pack your own lunch', icon: '🥪', coins: 4, tiers: [3] },
  { title: 'Sweep the porch', icon: '🧹', coins: 5, tiers: [3] },
  { title: 'Sort the recycling properly', icon: '♻️', coins: 5, tiers: [3] },
  { title: 'Tidy the shoe cupboard', icon: '👟', coins: 5, tiers: [3] },
];

export function templatesFor(tier: Tier): JobTemplate[] {
  return JOB_TEMPLATES.filter((t) => t.tiers.includes(tier));
}

/* --- Reward shelves ------------------------------------------------------
   The ordering is the argument. "Time with you" comes first, always, because
   the cheapest and most valuable category is the one that costs a parent
   nothing but attention.
   ---------------------------------------------------------------------- */

export const SHELVES: { id: ShelfId; label: string; blurb: string; emoji: string }[] = [
  { id: 'time', label: 'Time with you', blurb: 'Costs nothing but your attention.', emoji: '💛' },
  { id: 'screen', label: 'Screen time', blurb: 'Minutes and choices, not devices.', emoji: '📺' },
  { id: 'treats', label: 'Treats', blurb: 'Small, soon, and shared where you can.', emoji: '🍦' },
  { id: 'outings', label: 'Outings', blurb: 'Bigger goals worth a few weeks.', emoji: '🎡' },
  { id: 'things', label: 'Things', blurb: 'Last on the shelf on purpose.', emoji: '🎁' },
];

export function shelfLabel(id: ShelfId): string {
  return SHELVES.find((s) => s.id === id)?.label ?? id;
}

export interface RewardSeed {
  shelf: ShelfId;
  name: string;
  emoji: string;
  coins: number;
  tiers: Tier[];
  realWorldHint?: string;
}

export const REWARD_CATALOG: RewardSeed[] = [
  // Time with you.
  { shelf: 'time', name: 'You pick the bedtime story', emoji: '📖', coins: 2, tiers: [1, 2, 3] },
  { shelf: 'time', name: 'Board game with a grown-up', emoji: '🎲', coins: 5, tiers: [1, 2, 3], realWorldHint: 'After dinner, any evening.' },
  { shelf: 'time', name: 'Bake something together', emoji: '🧁', coins: 8, tiers: [1, 2, 3], realWorldHint: 'Weekend mornings work best.' },
  { shelf: 'time', name: 'Stay up 15 minutes later', emoji: '🌙', coins: 4, tiers: [1, 2, 3] },
  { shelf: 'time', name: 'Just you and me at the park', emoji: '🌳', coins: 10, tiers: [1, 2, 3] },
  { shelf: 'time', name: 'You choose what we do Saturday', emoji: '🗓️', coins: 14, tiers: [2, 3] },

  // Screen time.
  { shelf: 'screen', name: '15 minutes extra screen time', emoji: '⏱️', coins: 4, tiers: [1, 2, 3] },
  { shelf: 'screen', name: 'You pick family film night', emoji: '🍿', coins: 6, tiers: [1, 2, 3] },
  { shelf: 'screen', name: '30 minutes of your game', emoji: '🎮', coins: 7, tiers: [2, 3] },

  // Treats.
  { shelf: 'treats', name: 'Ice cream after dinner', emoji: '🍦', coins: 5, tiers: [1, 2, 3] },
  { shelf: 'treats', name: 'You pick the pudding', emoji: '🍮', coins: 3, tiers: [1, 2, 3] },
  { shelf: 'treats', name: 'Hot chocolate with cream', emoji: '☕', coins: 4, tiers: [1, 2, 3] },
  { shelf: 'treats', name: 'Pancakes on a school day', emoji: '🥞', coins: 6, tiers: [1, 2, 3] },

  // Outings.
  { shelf: 'outings', name: 'Trip to the playground', emoji: '🛝', coins: 10, tiers: [1, 2, 3] },
  { shelf: 'outings', name: 'Swimming pool', emoji: '🏊', coins: 18, tiers: [2, 3] },
  { shelf: 'outings', name: 'Cinema trip', emoji: '🎬', coins: 30, tiers: [2, 3] },
  { shelf: 'outings', name: 'Day out, you plan it', emoji: '🗺️', coins: 60, tiers: [3] },

  // Things. Last on purpose.
  { shelf: 'things', name: 'Sticker pack', emoji: '✨', coins: 6, tiers: [1, 2, 3] },
  { shelf: 'things', name: 'Colouring book', emoji: '🖍️', coins: 12, tiers: [1, 2, 3] },
  { shelf: 'things', name: 'A book you choose', emoji: '📕', coins: 45, tiers: [2, 3] },
  { shelf: 'things', name: 'Paint set', emoji: '🎨', coins: 60, tiers: [2, 3] },
  { shelf: 'things', name: 'Small building set', emoji: '🧱', coins: 90, tiers: [3] },
  { shelf: 'things', name: 'The camping tent', emoji: '⛺', coins: 180, tiers: [3], realWorldHint: 'The big one. Worth the wait.' },
];

/* --- Spend categories ----------------------------------------------------
   Four pictures plus a mic. Four fits the <=5-choice ceiling at 4-6, and the
   mic catches everything else, so a reason is always required but never costs
   more than one tap.
   ---------------------------------------------------------------------- */

export const SPEND_CATEGORIES: { id: SpendCategoryId; label: string; emoji: string; tint: string }[] = [
  { id: 'toy', label: 'A toy', emoji: '🧸', tint: 'var(--berry-tint)' },
  { id: 'book', label: 'A book', emoji: '📚', tint: 'var(--sky-tint)' },
  { id: 'treat', label: 'A treat', emoji: '🍦', tint: 'var(--sun-tint)' },
  { id: 'present', label: 'A present', emoji: '🎁', tint: 'var(--grape-tint)' },
  { id: 'other', label: 'Something else', emoji: '🎤', tint: 'var(--cloud-soft)' },
];

export function categoryOf(id: SpendCategoryId) {
  return SPEND_CATEGORIES.find((c) => c.id === id) ?? SPEND_CATEGORIES[0]!;
}

/* --- Badges --------------------------------------------------------------
   The intrinsic channel. Coins are extrinsic and spendable; badges are not
   purchasable at any price, and the badge case says so in those words. The
   moment achievement becomes purchasable it stops being achievement.
   ---------------------------------------------------------------------- */

export interface BadgeDef {
  key: string;
  glyph: string;
  name: string;
  how: string;
  tiers: Tier[];
}

export const BADGES: BadgeDef[] = [
  { key: 'first-save', glyph: '🌱', name: 'First save', how: 'Put a coin in Save.', tiers: [1, 2, 3] },
  { key: 'week', glyph: '🗓️', name: 'A whole week', how: 'Finish a job every day for seven days.', tiers: [1, 2, 3] },
  { key: 'goal', glyph: '🎯', name: 'Goal reached', how: 'Reach a goal you set yourself.', tiers: [1, 2, 3] },
  { key: 'patient', glyph: '🦉', name: 'Waited it out', how: 'Keep your coins when you nearly spent them.', tiers: [1, 2, 3] },
  { key: 'share', glyph: '🤝', name: 'Shared some', how: 'Give coins from your Share jar.', tiers: [2, 3] },
  { key: 'reader', glyph: '📖', name: 'Read every day', how: 'Finish a reading job five days running.', tiers: [1, 2, 3] },
  { key: 'fixer', glyph: '🔁', name: 'Fixed it and finished', how: 'Get a "not yet", put it right, and finish.', tiers: [1, 2, 3] },
  { key: 'counter', glyph: '🧮', name: 'Counted it right', how: 'Guess your own total correctly.', tiers: [2, 3] },
  { key: 'camper', glyph: '⛺', name: 'The big one', how: 'Save more than 150 coins for one goal.', tiers: [3] },
];

export function badgeDef(key: string): BadgeDef | undefined {
  return BADGES.find((b) => b.key === key);
}
