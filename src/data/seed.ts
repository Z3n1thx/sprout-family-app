import type { Child, Job, Reward, State, Tier } from './types';
import { REWARD_CATALOG, templatesFor } from './catalog';
import { newId, nowIso } from '../lib/format';

/**
 * First run.
 *
 * There is no demo family. An app that opens onto someone else's children asks
 * a parent to imagine their way into it, and worse, it makes the first real
 * question "how do I get rid of this?" So the first screen is empty and the
 * first action is naming your own family.
 *
 * What *is* seeded is the reward shelf and, per child, a handful of starter
 * jobs — both drawn from the same catalogue the parent edits afterwards. That is
 * not decoration: a rewards screen with nothing on it teaches a five-year-old
 * that earning leads nowhere, and it would take a parent twenty minutes of
 * typing to disprove it. Every seeded row is a real, editable, deletable row.
 */

/** Age → interface level. The one place the mapping is decided. */
export function tierForAge(age: number): Tier {
  if (age <= 6) return 1;
  if (age <= 8) return 2;
  return 3;
}

/**
 * Opening settings for a new child, by level.
 *
 * These are starting points a parent can change on the child's own screen, and
 * they are deliberately cautious at the bottom end: a six-year-old's per-ask
 * limit is small because the limit is the thing that keeps a request answerable
 * with "yes" most of the time. Read-aloud and the beginner font default on at
 * level 1, where a child cannot yet read the interface they are using.
 */
export function defaultsForTier(tier: Tier): Pick<Child, 'limits' | 'prefs' | 'savingsBonus' | 'allowance'> {
  const all: Child['limits']['categories'] = ['toy', 'book', 'treat', 'present', 'other'];
  if (tier === 1) {
    return {
      limits: { perRequest: 6, weekly: 10, pauseBigAsks: false, categories: all },
      prefs: { readAloud: true, reducedMotion: false, beginnerFont: true, sound: true },
      savingsBonus: false,
      allowance: { coins: 6, weekday: 1, active: true },
    };
  }
  if (tier === 2) {
    return {
      limits: { perRequest: 15, weekly: 25, pauseBigAsks: false, categories: all },
      prefs: { readAloud: false, reducedMotion: false, beginnerFont: false, sound: true },
      savingsBonus: true,
      allowance: { coins: 10, weekday: 1, active: true },
    };
  }
  return {
    limits: { perRequest: 40, weekly: 60, pauseBigAsks: true, categories: all },
    prefs: { readAloud: false, reducedMotion: false, beginnerFont: false, sound: true },
    savingsBonus: true,
    allowance: { coins: 20, weekday: 1, active: true },
  };
}

export function makeChild(input: {
  name: string;
  age: number;
  avatar: string;
  pictureKey: string[];
}): Child {
  const tier = tierForAge(input.age);
  return {
    id: newId('c'),
    name: input.name.trim(),
    avatar: input.avatar,
    pictureKey: input.pictureKey,
    age: input.age,
    tier,
    ...defaultsForTier(tier),
  };
}

/** The shelf every family starts with. Same rows the parent then edits. */
export function catalogRewards(): Reward[] {
  return REWARD_CATALOG.map((r) => ({
    id: newId('r'),
    shelf: r.shelf,
    name: r.name,
    emoji: r.emoji,
    coins: r.coins,
    tiers: r.tiers,
    ...(r.realWorldHint ? { realWorldHint: r.realWorldHint } : {}),
    active: true,
  }));
}

/**
 * Four opening jobs for a new child.
 *
 * Filtered by level, so a five-year-old is never handed a nine-year-old's job on
 * day one — the single commonest way a chore app starts a fight. Two repeat on
 * weekdays and two are one-offs, which shows the parent both shapes exist
 * without their having to read about it.
 */
export function starterJobs(child: Child): Job[] {
  const picks = templatesFor(child.tier).slice(0, 4);
  const at = nowIso();
  return picks.map((t, i) => ({
    id: newId('j'),
    childId: child.id,
    title: t.title,
    icon: t.icon,
    coins: t.coins,
    ...(t.detail ? { detail: t.detail } : {}),
    status: 'open' as const,
    autoApprove: false,
    repeatDays: i < 2 ? [1, 2, 3, 4, 5] : [],
    createdAt: at,
    declineCount: 0,
    history: [],
    seenByChild: true,
  }));
}

/** No family yet. Everything past this point is created by a person. */
export function emptyState(): State {
  return {
    version: 2,
    premium: false,
    family: { name: '', code: '', createdAt: nowIso(), devices: [], parents: [], children: [] },
    entries: [],
    jobs: [],
    spendRequests: [],
    rewards: catalogRewards(),
    redemptions: [],
    goals: [],
    badges: [],
  };
}
