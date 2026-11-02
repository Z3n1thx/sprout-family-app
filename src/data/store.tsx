import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type Dispatch,
  type ReactNode,
} from 'react';
import type {
  Bucket,
  Child,
  ChildLimits,
  ChildPrefs,
  Device,
  Dispute,
  Entry,
  Goal,
  Job,
  Parent,
  Reward,
  ShelfId,
  SpendCategoryId,
  State,
  Tier,
} from './types';
import { emptyState } from './seed';
import { foldBalances } from '../lib/ledger';
import { newId, nowIso } from '../lib/format';
import { categoryOf, shelfLabel } from './catalog';

/* ==========================================================================
   Store.

   Actions are domain events, not setters. That is deliberate: every coin
   movement has to name a reason and an actor, because the reason is what the
   child sees. There is no `setBalance`.

   Persistence is localStorage, and that is the whole of it. There is no server,
   no account, no bank connection and no analytics — so a second device does not
   sign in, it is handed a copy of the family (see lib/pair.ts). The parent PIN
   is four digits held on the device that created it; it stops a child opening
   the parent app, and it is described in exactly those terms wherever it is
   asked for. Nothing here is a security claim, and a real deployment would put
   an auth provider and a synced backend in this file's place.
   ========================================================================== */

const VERSION = 2;
const KEY = 'sprout.state.v2';
const SESSION_KEY = 'sprout.session.v1';

export type Action =
  /* --- Child ---------------------------------------------------------- */
  | { t: 'job/submit'; jobId: string; photo?: string }
  | { t: 'job/dispute'; jobId: string; dispute: Dispute }
  | { t: 'job/seen'; jobId: string }
  | { t: 'spend/request'; childId: string; coins: number; category: SpendCategoryId; said?: string }
  | { t: 'spend/withdraw'; id: string }
  | { t: 'spend/seen'; id: string }
  | { t: 'reward/request'; childId: string; rewardId: string }
  | { t: 'reward/seen'; id: string }
  | { t: 'coins/move'; childId: string; from: Bucket; to: Bucket; coins: number; label: string; icon: string }
  | { t: 'coins/kept'; childId: string; coins: number }
  | { t: 'goal/create'; childId: string; name: string; emoji: string; target: number }
  | { t: 'goal/delete'; goalId: string }
  /* --- Parent --------------------------------------------------------- */
  | { t: 'job/approve'; jobId: string; by: string; note?: string }
  | { t: 'job/decline'; jobId: string; by: string; reasonId: string; note?: string }
  | { t: 'job/create'; job: Omit<Job, 'id' | 'status' | 'createdAt' | 'declineCount' | 'history' | 'seenByChild'> }
  | { t: 'job/delete'; jobId: string }
  | { t: 'job/reopen'; jobId: string }
  | {
      t: 'coins/add';
      childId: string;
      by: string;
      coins: number;
      bucket: Bucket;
      kind: 'allowance' | 'bonus' | 'correction';
      label: string;
      icon: string;
      direction: 'in' | 'out';
      note?: string;
    }
  | { t: 'spend/decide'; id: string; by: string; approve: boolean; reasonId?: string; note?: string; nextStep?: string }
  | { t: 'reward/decide'; id: string; by: string; approve: boolean; reasonId?: string; note?: string }
  | { t: 'reward/upsert'; reward: Reward }
  | { t: 'reward/toggle'; rewardId: string }
  | { t: 'child/update'; childId: string; patch: Partial<Pick<Child, 'tier' | 'name' | 'avatar' | 'savingsBonus' | 'age'>> }
  | { t: 'child/limits'; childId: string; patch: Partial<ChildLimits> }
  | { t: 'child/prefs'; childId: string; patch: Partial<ChildPrefs> }
  | { t: 'child/allowance'; childId: string; patch: Partial<Child['allowance']> }
  | { t: 'premium/set'; on: boolean }
  /* --- The family itself ---------------------------------------------- */
  | { t: 'family/create'; name: string; code: string; parent: Parent; device: Device }
  | { t: 'family/rename'; name: string }
  | { t: 'family/code'; code: string }
  | { t: 'parent/add'; parent: Parent }
  | { t: 'parent/remove'; parentId: string }
  | { t: 'child/add'; child: Child; jobs: Job[] }
  | { t: 'child/remove'; childId: string }
  | { t: 'device/register'; device: Device }
  | { t: 'device/rename'; deviceId: string; name: string }
  | { t: 'device/remove'; deviceId: string }
  /** Replaces everything, once, when this device joins an existing family. */
  | { t: 'state/adopt'; state: State };

/* --- Helpers -------------------------------------------------------------- */

function entry(e: Omit<Entry, 'id'>): Entry {
  return { id: newId('e'), ...e };
}

/**
 * Take coins out of a child's hands, drawing Spend first, then Save, then
 * Share. When Spend is short this emits a visible transfer *and then* the
 * spend, so My Story shows both lines. Two true sentences beat one tidy one:
 * the child can see that the coins came out of savings.
 */
function withdraw(
  state: State,
  childId: string,
  coins: number,
  opts: { kind: Entry['kind']; label: string; icon: string; refId?: string; by?: string; at?: string },
): Entry[] {
  const b = foldBalances(state.entries, childId);
  const at = opts.at ?? nowIso();
  const out: Entry[] = [];

  const fromSpend = Math.min(b.spend, coins);
  let shortfall = coins - fromSpend;

  for (const src of ['save', 'share'] as const) {
    if (shortfall <= 0) break;
    const take = Math.min(b[src], shortfall);
    if (take > 0) {
      out.push(
        entry({
          childId,
          at,
          kind: 'transfer',
          coins: take,
          from: src,
          to: 'spend',
          label: `moved from ${src === 'save' ? 'Save' : 'Share'}`,
          icon: src === 'save' ? '🏦' : '🤝',
        }),
      );
      shortfall -= take;
    }
  }

  out.push(
    entry({
      childId,
      at,
      kind: opts.kind,
      coins,
      from: 'spend',
      label: opts.label,
      icon: opts.icon,
      ...(opts.refId ? { refId: opts.refId } : {}),
      ...(opts.by ? { by: opts.by } : {}),
    }),
  );
  return out;
}

function award(state: State, childId: string, key: string): State {
  if (state.badges.some((b) => b.childId === childId && b.key === key)) return state;
  return { ...state, badges: [...state.badges, { key, childId, earnedAt: nowIso() }] };
}

/**
 * Badge rules that fire from real events. `week`, `reader` and `counter` need
 * streak history the prototype does not track yet, so they stay seeded — a
 * badge that can be earned by accident is worse than one that is not wired up.
 */
function checkBadges(state: State, childId: string): State {
  let s = state;
  const b = foldBalances(s.entries, childId);
  if (b.save > 0) s = award(s, childId, 'first-save');
  if (s.entries.some((e) => e.childId === childId && e.from === 'share' && !e.to)) {
    s = award(s, childId, 'share');
  }
  for (const g of s.goals.filter((g) => g.childId === childId)) {
    const held = b.goals[g.id] ?? 0;
    if (held >= g.target) {
      s = award(s, childId, 'goal');
      if (held >= 150) s = award(s, childId, 'camper');
      if (!g.reachedAt) {
        s = { ...s, goals: s.goals.map((x) => (x.id === g.id ? { ...x, reachedAt: nowIso() } : x)) };
      }
    }
  }
  return s;
}

function patchJob(state: State, jobId: string, fn: (j: Job) => Job): State {
  return { ...state, jobs: state.jobs.map((j) => (j.id === jobId ? fn(j) : j)) };
}

/* --- Reducer -------------------------------------------------------------- */

export function reduce(state: State, a: Action): State {
  switch (a.t) {
    /* ----- Child ------------------------------------------------------- */

    case 'job/submit': {
      const job = state.jobs.find((j) => j.id === a.jobId);
      if (!job || (job.status !== 'open' && job.status !== 'not_yet')) return state;
      const at = nowIso();
      const child = state.family.children.find((c) => c.id === job.childId);
      const name = child?.name ?? 'They';

      // Auto-approve pays immediately. The parent opted into that per job; the
      // child is told which jobs pay straight away so the difference is never
      // a surprise.
      if (job.autoApprove) {
        const next: State = {
          ...state,
          entries: [
            ...state.entries,
            entry({
              childId: job.childId,
              at,
              kind: 'job',
              coins: job.coins,
              to: 'spend',
              label: job.title.toLowerCase(),
              icon: job.icon,
              refId: job.id,
            }),
          ],
        };
        return checkBadges(
          patchJob(next, job.id, (j) => ({
            ...j,
            status: 'approved',
            submittedAt: at,
            decidedAt: at,
            seenByChild: false,
            ...(a.photo ? { photo: a.photo } : {}),
            history: [
              ...j.history,
              { at, what: `${name} said it was done`, actor: 'child' as const },
              { at, what: 'Approved automatically', actor: 'parent' as const },
            ],
          })),
          job.childId,
        );
      }

      return patchJob(state, job.id, (j) => ({
        ...j,
        status: 'submitted',
        submittedAt: at,
        seenByChild: true,
        ...(a.photo ? { photo: a.photo } : {}),
        history: [...j.history, { at, what: `${name} said it was done`, actor: 'child' as const }],
      }));
    }

    case 'job/dispute': {
      const job = state.jobs.find((j) => j.id === a.jobId);
      if (!job || job.status !== 'not_yet') return state;
      const child = state.family.children.find((c) => c.id === job.childId);
      return patchJob(state, job.id, (j) => ({
        ...j,
        status: 'disputed',
        dispute: a.dispute,
        seenByChild: true,
        history: [
          ...j.history,
          {
            at: a.dispute.createdAt,
            what: `${child?.name ?? 'They'} asked for another look`,
            actor: 'child' as const,
          },
        ],
      }));
    }

    case 'job/seen':
      return patchJob(state, a.jobId, (j) => ({ ...j, seenByChild: true }));

    case 'spend/request': {
      const child = state.family.children.find((c) => c.id === a.childId);
      if (!child) return state;
      const b = foldBalances(state.entries, a.childId);
      if (a.coins <= 0 || a.coins > b.available) return state;
      return {
        ...state,
        spendRequests: [
          ...state.spendRequests,
          {
            id: newId('s'),
            childId: a.childId,
            coins: a.coins,
            category: a.category,
            ...(a.said ? { said: a.said } : {}),
            status: 'pending',
            createdAt: nowIso(),
            seenByChild: true,
          },
        ],
      };
    }

    case 'spend/withdraw':
      return {
        ...state,
        spendRequests: state.spendRequests.map((s) =>
          s.id === a.id && s.status === 'pending' ? { ...s, status: 'withdrawn', seenByChild: true } : s,
        ),
      };

    case 'spend/seen':
      return {
        ...state,
        spendRequests: state.spendRequests.map((s) => (s.id === a.id ? { ...s, seenByChild: true } : s)),
      };

    case 'reward/request': {
      const reward = state.rewards.find((r) => r.id === a.rewardId);
      if (!reward) return state;
      const b = foldBalances(state.entries, a.childId);
      if (b.available < reward.coins) return state;
      return {
        ...state,
        redemptions: [
          ...state.redemptions,
          {
            id: newId('d'),
            childId: a.childId,
            rewardId: reward.id,
            coins: reward.coins,
            status: 'requested',
            createdAt: nowIso(),
            seenByChild: true,
          },
        ],
      };
    }

    case 'reward/seen':
      return {
        ...state,
        redemptions: state.redemptions.map((r) => (r.id === a.id ? { ...r, seenByChild: true } : r)),
      };

    case 'coins/move': {
      if (a.coins <= 0) return state;
      const b = foldBalances(state.entries, a.childId);
      const have =
        a.from === 'spend' || a.from === 'save' || a.from === 'share'
          ? b[a.from]
          : (b.goals[a.from.slice(5)] ?? 0);
      if (have < a.coins) return state;
      const next: State = {
        ...state,
        entries: [
          ...state.entries,
          entry({
            childId: a.childId,
            at: nowIso(),
            kind: 'transfer',
            coins: a.coins,
            from: a.from,
            to: a.to,
            label: a.label,
            icon: a.icon,
          }),
        ],
      };
      return checkBadges(next, a.childId);
    }

    /**
     * "Keep my coins" on the Before-you-ask screen. It pays a badge, never
     * coins: rewarding restraint with currency would make restraint another
     * way to shop.
     */
    case 'coins/kept':
      return award(state, a.childId, 'patient');

    case 'goal/create': {
      if (!a.name.trim() || a.target <= 0) return state;
      const goal: Goal = {
        id: newId('g'),
        childId: a.childId,
        name: a.name.trim(),
        emoji: a.emoji,
        target: a.target,
        createdAt: nowIso(),
      };
      return { ...state, goals: [...state.goals, goal] };
    }

    case 'goal/delete': {
      const goal = state.goals.find((g) => g.id === a.goalId);
      if (!goal) return state;
      const b = foldBalances(state.entries, goal.childId);
      const held = b.goals[goal.id] ?? 0;
      // Escrow is a commitment device, not a lock. Deleting a goal hands the
      // coins straight back to Save; nothing is ever forfeited.
      const entries = held
        ? [
            ...state.entries,
            entry({
              childId: goal.childId,
              at: nowIso(),
              kind: 'transfer',
              coins: held,
              from: `goal:${goal.id}`,
              to: 'save',
              label: `took back your ${goal.name.toLowerCase()} coins`,
              icon: '🏦',
            }),
          ]
        : state.entries;
      return { ...state, entries, goals: state.goals.filter((g) => g.id !== a.goalId) };
    }

    /* ----- Parent ------------------------------------------------------ */

    case 'job/approve': {
      const job = state.jobs.find((j) => j.id === a.jobId);
      if (!job || (job.status !== 'submitted' && job.status !== 'disputed' && job.status !== 'not_yet')) {
        return state;
      }
      const at = nowIso();
      const parent = state.family.parents.find((p) => p.id === a.by);
      const next: State = {
        ...state,
        entries: [
          ...state.entries,
          entry({
            childId: job.childId,
            at,
            kind: 'job',
            coins: job.coins,
            to: 'spend',
            label: job.title.toLowerCase(),
            icon: job.icon,
            by: a.by,
            refId: job.id,
            ...(a.note ? { note: a.note } : {}),
          }),
        ],
      };
      let s = patchJob(next, job.id, (j) => ({
        ...j,
        status: 'approved',
        decidedAt: at,
        decidedBy: a.by,
        seenByChild: false,
        ...(a.note ? { parentNote: a.note } : {}),
        history: [
          ...j.history,
          { at, what: `${parent?.label ?? 'A grown-up'} approved it`, actor: 'parent' as const },
        ],
      }));
      // Declined, put right, then finished. The one badge that rewards a
      // recovery rather than a run of successes.
      if (job.declineCount > 0) s = award(s, job.childId, 'fixer');
      return checkBadges(s, job.childId);
    }

    case 'job/decline': {
      const job = state.jobs.find((j) => j.id === a.jobId);
      if (!job || (job.status !== 'submitted' && job.status !== 'disputed')) return state;
      const at = nowIso();
      const parent = state.family.parents.find((p) => p.id === a.by);
      return patchJob(state, job.id, (j) => ({
        ...j,
        status: 'not_yet',
        decidedAt: at,
        decidedBy: a.by,
        reasonId: a.reasonId,
        ...(a.note ? { parentNote: a.note } : { parentNote: undefined }),
        declineCount: j.declineCount + 1,
        seenByChild: false,
        // The dispute is cleared so the child can make a fresh case, but the
        // history keeps every round of it.
        dispute: undefined,
        history: [
          ...j.history,
          { at, what: `${parent?.label ?? 'A grown-up'} said not yet`, actor: 'parent' as const },
        ],
      }));
    }

    case 'job/create': {
      const job: Job = {
        id: newId('j'),
        status: 'open',
        createdAt: nowIso(),
        declineCount: 0,
        history: [],
        seenByChild: false,
        ...a.job,
      };
      return { ...state, jobs: [...state.jobs, job] };
    }

    case 'job/delete':
      return { ...state, jobs: state.jobs.filter((j) => j.id !== a.jobId) };

    case 'job/reopen':
      return patchJob(state, a.jobId, (j) => ({
        ...j,
        status: 'open',
        submittedAt: undefined,
        decidedAt: undefined,
        reasonId: undefined,
        dispute: undefined,
        photo: undefined,
        seenByChild: true,
      }));

    case 'coins/add': {
      if (a.coins <= 0) return state;
      if (a.direction === 'out') {
        const b = foldBalances(state.entries, a.childId);
        if (b.available < a.coins) return state;
        return {
          ...state,
          entries: [
            ...state.entries,
            ...withdraw(state, a.childId, a.coins, {
              kind: 'correction',
              label: a.label,
              icon: a.icon,
              by: a.by,
            }),
          ],
        };
      }
      const next: State = {
        ...state,
        entries: [
          ...state.entries,
          entry({
            childId: a.childId,
            at: nowIso(),
            kind: a.kind,
            coins: a.coins,
            to: a.bucket,
            label: a.label,
            icon: a.icon,
            by: a.by,
            ...(a.note ? { note: a.note } : {}),
          }),
        ],
      };
      return checkBadges(next, a.childId);
    }

    case 'spend/decide': {
      const req = state.spendRequests.find((s) => s.id === a.id);
      if (!req || req.status !== 'pending') return state;
      const at = nowIso();
      const cat = categoryOf(req.category);
      const decided = state.spendRequests.map((s) =>
        s.id === a.id
          ? {
              ...s,
              status: (a.approve ? 'approved' : 'not_yet') as 'approved' | 'not_yet',
              decidedAt: at,
              decidedBy: a.by,
              seenByChild: false,
              ...(a.reasonId ? { reasonId: a.reasonId } : {}),
              ...(a.note ? { parentNote: a.note } : {}),
              ...(a.nextStep ? { nextStep: a.nextStep } : {}),
            }
          : s,
      );
      if (!a.approve) return { ...state, spendRequests: decided };
      return checkBadges(
        {
          ...state,
          spendRequests: decided,
          entries: [
            ...state.entries,
            ...withdraw(state, req.childId, req.coins, {
              kind: 'spend',
              label: req.said?.trim() ? req.said.trim() : cat.label.toLowerCase(),
              icon: cat.emoji,
              refId: req.id,
              by: a.by,
              at,
            }),
          ],
        },
        req.childId,
      );
    }

    case 'reward/decide': {
      const red = state.redemptions.find((r) => r.id === a.id);
      if (!red || red.status !== 'requested') return state;
      const reward = state.rewards.find((r) => r.id === red.rewardId);
      const at = nowIso();
      const decided = state.redemptions.map((r) =>
        r.id === a.id
          ? {
              ...r,
              status: (a.approve ? 'granted' : 'not_yet') as 'granted' | 'not_yet',
              decidedAt: at,
              decidedBy: a.by,
              seenByChild: false,
              ...(a.reasonId ? { reasonId: a.reasonId } : {}),
              ...(a.note ? { parentNote: a.note } : {}),
            }
          : r,
      );
      if (!a.approve) return { ...state, redemptions: decided };

      const rewards = reward?.stock
        ? state.rewards.map((r) => (r.id === reward.id ? { ...r, stock: Math.max(0, (r.stock ?? 1) - 1) } : r))
        : state.rewards;

      return checkBadges(
        {
          ...state,
          redemptions: decided,
          rewards,
          entries: [
            ...state.entries,
            ...withdraw(state, red.childId, red.coins, {
              kind: 'spend',
              label: (reward?.name ?? 'a reward').toLowerCase(),
              icon: reward?.emoji ?? '🎁',
              refId: red.id,
              by: a.by,
              at,
            }),
          ],
        },
        red.childId,
      );
    }

    case 'reward/upsert': {
      const exists = state.rewards.some((r) => r.id === a.reward.id);
      return {
        ...state,
        rewards: exists
          ? state.rewards.map((r) => (r.id === a.reward.id ? a.reward : r))
          : [...state.rewards, a.reward],
      };
    }

    case 'reward/toggle':
      return {
        ...state,
        rewards: state.rewards.map((r) => (r.id === a.rewardId ? { ...r, active: !r.active } : r)),
      };

    case 'child/update':
      return {
        ...state,
        family: {
          ...state.family,
          children: state.family.children.map((c) => (c.id === a.childId ? { ...c, ...a.patch } : c)),
        },
      };

    case 'child/limits':
      return {
        ...state,
        family: {
          ...state.family,
          children: state.family.children.map((c) =>
            c.id === a.childId ? { ...c, limits: { ...c.limits, ...a.patch } } : c,
          ),
        },
      };

    case 'child/prefs':
      return {
        ...state,
        family: {
          ...state.family,
          children: state.family.children.map((c) =>
            c.id === a.childId ? { ...c, prefs: { ...c.prefs, ...a.patch } } : c,
          ),
        },
      };

    case 'child/allowance':
      return {
        ...state,
        family: {
          ...state.family,
          children: state.family.children.map((c) =>
            c.id === a.childId ? { ...c, allowance: { ...c.allowance, ...a.patch } } : c,
          ),
        },
      };

    case 'premium/set':
      return { ...state, premium: a.on };

    /* --- The family itself ------------------------------------------------ */

    case 'family/create':
      return {
        ...state,
        family: {
          name: a.name.trim(),
          code: a.code,
          createdAt: nowIso(),
          devices: [a.device],
          parents: [a.parent],
          children: [],
        },
      };

    case 'family/rename':
      return { ...state, family: { ...state.family, name: a.name.trim() } };

    /* Regenerating is the only revocation this app has. Every link already sent
       was encrypted under the old code, so it stops opening — which is exactly
       what a parent wants after sending one to the wrong thread. */
    case 'family/code':
      return { ...state, family: { ...state.family, code: a.code } };

    case 'parent/add':
      return {
        ...state,
        family: { ...state.family, parents: [...state.family.parents, a.parent] },
      };

    /* The last grown-up cannot be removed: a family with no parent has no way
       back into the parent app, and no way to unlink a device. */
    case 'parent/remove':
      if (state.family.parents.length <= 1) return state;
      return {
        ...state,
        family: { ...state.family, parents: state.family.parents.filter((p) => p.id !== a.parentId) },
      };

    case 'child/add':
      return {
        ...state,
        family: { ...state.family, children: [...state.family.children, a.child] },
        jobs: [...state.jobs, ...a.jobs],
      };

    /* Removing a child takes their jobs and asks with them, and leaves the
       ledger alone. Entries are the record of what happened; deleting them
       would rewrite history, and the balances everywhere else are folded from
       them. Nothing reads a removed child's entries, so they sit harmlessly. */
    case 'child/remove':
      return {
        ...state,
        family: {
          ...state.family,
          children: state.family.children.filter((c) => c.id !== a.childId),
          devices: state.family.devices.filter((d) => d.childId !== a.childId),
        },
        jobs: state.jobs.filter((j) => j.childId !== a.childId),
        spendRequests: state.spendRequests.filter((s) => s.childId !== a.childId),
        redemptions: state.redemptions.filter((r) => r.childId !== a.childId),
        goals: state.goals.filter((g) => g.childId !== a.childId),
      };

    /* Upsert, but a known device keeps what it already is. A parent signing in
       on a child's tablet is stamping a visit, not reclassifying the tablet —
       and the name is the parent's to set, so it survives too. */
    case 'device/register': {
      const known = state.family.devices.some((d) => d.id === a.device.id);
      return {
        ...state,
        family: {
          ...state.family,
          devices: known
            ? state.family.devices.map((d) =>
                d.id === a.device.id ? { ...d, lastSeen: a.device.lastSeen ?? d.lastSeen } : d,
              )
            : [...state.family.devices, a.device],
        },
      };
    }

    case 'device/rename':
      return {
        ...state,
        family: {
          ...state.family,
          devices: state.family.devices.map((d) => (d.id === a.deviceId ? { ...d, name: a.name.trim() } : d)),
        },
      };

    case 'device/remove':
      return {
        ...state,
        family: { ...state.family, devices: state.family.devices.filter((d) => d.id !== a.deviceId) },
      };

    case 'state/adopt':
      return { ...a.state, version: VERSION };

    default:
      return state;
  }
}

/* --- Persistence ---------------------------------------------------------- */

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as State;
    if (parsed?.version !== VERSION) return emptyState();
    return parsed;
  } catch {
    return emptyState();
  }
}

/** Has anyone set this device up yet? Guards every screen past Welcome. */
export function hasFamily(state: State): boolean {
  return state.family.parents.length > 0;
}

/* --- Session -------------------------------------------------------------- */

export interface Session {
  role: 'child' | 'parent' | null;
  childId: string | null;
  parentId: string | null;
}

const NO_SESSION: Session = { role: null, childId: null, parentId: null };

function loadSession(): Session {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? ({ ...NO_SESSION, ...(JSON.parse(raw) as Session) }) : NO_SESSION;
  } catch {
    return NO_SESSION;
  }
}

/* --- Context -------------------------------------------------------------- */

interface Ctx {
  state: State;
  dispatch: Dispatch<Action>;
  session: Session;
  setSession: (s: Session) => void;
}

const StoreCtx = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reduce, undefined, load);
  const [session, setSessionState] = useState<Session>(loadSession);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* A full quota is not worth interrupting a child over. */
    }
  }, [state]);

  const setSession = useCallback((s: Session) => {
    setSessionState(s);
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(() => ({ state, dispatch, session, setSession }), [state, session, setSession]);
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore(): Ctx {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error('useStore outside StoreProvider');
  return ctx;
}

/* --- Selectors ------------------------------------------------------------ */

export function useChild(childId: string | null | undefined): Child | undefined {
  const { state } = useStore();
  return state.family.children.find((c) => c.id === childId);
}

export function useBalances(childId: string | null | undefined) {
  const { state } = useStore();
  return useMemo(
    () => foldBalances(state.entries, childId ?? ''),
    [state.entries, childId],
  );
}

export function useGoals(childId: string | null | undefined): Goal[] {
  const { state } = useStore();
  return state.goals.filter((g) => g.childId === childId);
}

/** Everything waiting on a grown-up, newest first. One queue, three children. */
export interface QueueItem {
  id: string;
  kind: 'job' | 'spend' | 'reward' | 'dispute';
  childId: string;
  at: string;
  title: string;
  detail: string;
  coins: number;
  icon: string;
}

export function useQueue(): QueueItem[] {
  const { state } = useStore();
  return useMemo(() => {
    const items: QueueItem[] = [];

    for (const j of state.jobs) {
      if (j.status === 'submitted') {
        items.push({
          id: j.id,
          kind: 'job',
          childId: j.childId,
          at: j.submittedAt ?? j.createdAt,
          title: j.title,
          detail: j.photo ? 'Photo attached' : (j.detail ?? 'No note'),
          coins: j.coins,
          icon: j.icon,
        });
      } else if (j.status === 'disputed') {
        items.push({
          id: j.id,
          kind: 'dispute',
          childId: j.childId,
          at: j.dispute?.createdAt ?? j.decidedAt ?? j.createdAt,
          title: j.title,
          /* The child's own words, not a restatement of the status. A parent
             deciding which of four things to open first should be choosing on
             what was said, not on a label they can already see. */
          detail: j.dispute?.phrases[0] ?? j.dispute?.typed ?? 'Wants another look',
          coins: j.coins,
          icon: j.icon,
        });
      }
    }

    for (const s of state.spendRequests) {
      if (s.status !== 'pending') continue;
      const cat = categoryOf(s.category);
      items.push({
        id: s.id,
        kind: 'spend',
        childId: s.childId,
        at: s.createdAt,
        title: `Wants ${s.coins} coins`,
        detail: s.said?.trim() ? s.said.trim() : cat.label,
        coins: s.coins,
        icon: cat.emoji,
      });
    }

    for (const r of state.redemptions) {
      if (r.status !== 'requested') continue;
      const reward = state.rewards.find((x) => x.id === r.rewardId);
      items.push({
        id: r.id,
        kind: 'reward',
        childId: r.childId,
        at: r.createdAt,
        title: reward?.name ?? 'A reward',
        detail: reward ? shelfLabel(reward.shelf) : 'A reward',
        coins: r.coins,
        icon: reward?.emoji ?? '🎁',
      });
    }

    return items.sort((a, b) => b.at.localeCompare(a.at));
  }, [state]);
}

/** Anything the child has not been shown the outcome of yet. */
export function useChildNews(childId: string | null | undefined) {
  const { state } = useStore();
  return useMemo(() => {
    const jobs = state.jobs.filter(
      (j) => j.childId === childId && !j.seenByChild && (j.status === 'approved' || j.status === 'not_yet'),
    );
    const spends = state.spendRequests.filter((s) => s.childId === childId && !s.seenByChild);
    const rewards = state.redemptions.filter((r) => r.childId === childId && !r.seenByChild);
    return { jobs, spends, rewards, count: jobs.length + spends.length + rewards.length };
  }, [state, childId]);
}

export function rewardsForTier(rewards: Reward[], tier: Tier, shelf?: ShelfId): Reward[] {
  return rewards.filter((r) => r.active && r.tiers.includes(tier) && (!shelf || r.shelf === shelf));
}
