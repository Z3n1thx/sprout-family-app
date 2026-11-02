import { useState } from 'react';
import { useStore } from '../data/store';
import { TopBar, Empty } from '../ui/bits';
import NoChildren from './NoChildren';
import { avatarGlyph, badgeDef, categoryOf, shelfLabel } from '../data/catalog';
import { earnedThisWeek, foldBalances, spentThisWeek } from '../lib/ledger';
import { coinWord, pct, plural, shortDate } from '../lib/format';
import type { Child, Entry, State } from '../data/types';

const DAY = 86_400_000;

const SOURCE_LABEL: Record<string, string> = {
  job: 'Jobs',
  allowance: 'Pocket money',
  bonus: 'Bonuses',
  'savings-bonus': 'Saving bonus',
  correction: 'Fixes',
};

/**
 * Insights.
 *
 * Deliberately not a finance dashboard. Everything here is counted in coins,
 * over weeks, and the whole screen exists to produce the last card: one or two
 * things worth saying out loud to the child this week. A chart a parent looks at
 * and then does nothing about has taught nobody anything.
 */
export default function Insights() {
  const { state } = useStore();
  const [target, setTarget] = useState('');
  const [days, setDays] = useState(7);

  /* `target` is an override, not the source of truth. This screen can be reached
     before any child exists, and a child can be removed while it is open, so the
     first child is always the fallback rather than a blank screen. */
  const child = state.family.children.find((c) => c.id === target) ?? state.family.children[0];
  if (!child) {
    return (
      <>
        <TopBar title="Insights" />
        <div className="screen">
          <NoChildren what="Insights are about one child at a time — where their coins came from, where they went, and the one or two things worth saying out loud this week." />
        </div>
      </>
    );
  }

  const since = Date.now() - days * DAY;
  const inWindow = (iso: string | undefined) => iso !== undefined && new Date(iso).getTime() >= since;

  const mine = state.entries.filter((e) => e.childId === child.id && inWindow(e.at));
  const b = foldBalances(state.entries, child.id);

  /* --- Out ---------------------------------------------------------------- */
  const outs = mine.filter((e) => e.kind === 'spend');
  const outTotal = outs.reduce((n, e) => n + e.coins, 0);
  const byWhat = new Map<string, number>();
  for (const e of outs) byWhat.set(whatFor(e, state), (byWhat.get(whatFor(e, state)) ?? 0) + e.coins);
  const spendRows = [...byWhat.entries()].sort((x, y) => y[1] - x[1]);

  /* --- In ----------------------------------------------------------------- */
  const ins = mine.filter((e) => e.to !== undefined && e.from === undefined);
  const inTotal = ins.reduce((n, e) => n + e.coins, 0);
  const bySource = new Map<string, number>();
  for (const e of ins) {
    const k = SOURCE_LABEL[e.kind] ?? 'Other';
    bySource.set(k, (bySource.get(k) ?? 0) + e.coins);
  }
  const sourceRows = [...bySource.entries()].sort((x, y) => y[1] - x[1]);

  /* --- Effort ------------------------------------------------------------- */
  const jobs = state.jobs.filter((j) => j.childId === child.id);
  const finished = jobs.filter((j) => j.status === 'approved' && inWindow(j.decidedAt));
  const sentBack = jobs.filter((j) => (j.status === 'not_yet' || j.status === 'disputed') && inWindow(j.decidedAt));
  const disputes = jobs.filter((j) => j.dispute && inWindow(j.dispute.createdAt));
  const asks = state.spendRequests.filter((s) => s.childId === child.id && inWindow(s.createdAt));
  const unlocked = state.redemptions.filter(
    (r) => r.childId === child.id && r.status === 'granted' && inWindow(r.decidedAt),
  );
  const gotBadges = state.badges.filter((x) => x.childId === child.id && inWindow(x.earnedAt));
  const goal = state.goals.find((g) => g.childId === child.id);
  const escrow = goal ? (b.goals[goal.id] ?? 0) : 0;

  const talk = chatPrompts(child, {
    spendRows,
    outTotal,
    saved: b.save,
    earned: earnedThisWeek(state.entries, child.id),
    spentWeek: spentThisWeek(state.entries, child.id),
    repeats: jobs.filter((j) => j.declineCount >= 2),
    disputes: disputes.length,
    unlocked: unlocked.length,
    goal: goal ? { name: goal.name, emoji: goal.emoji, target: goal.target, escrow } : null,
  });

  return (
    <>
      <TopBar title="Insights" />
      <div className="screen">
        {state.family.children.length > 1 ? (
          <div className="seg">
            {state.family.children.map((c) => (
              <button key={c.id} aria-pressed={c.id === child.id} onClick={() => setTarget(c.id)}>
                {avatarGlyph(c.avatar)} {c.name}
              </button>
            ))}
          </div>
        ) : null}
        <div className="seg">
          {[7, 28].map((d) => (
            <button key={d} aria-pressed={days === d} onClick={() => setDays(d)}>
              {d === 7 ? 'This week' : 'Four weeks'}
            </button>
          ))}
        </div>
        <p className="meta">Since {shortDate(new Date(since).toISOString())}.</p>

        {/* --- The shape of it -------------------------------------------- */}
        <div className="split">
          <div className="b-spend">
            <span className="k">In</span>
            <span className="v">{inTotal}</span>
          </div>
          <div className="b-save">
            <span className="k">Out</span>
            <span className="v">{outTotal}</span>
          </div>
          <div className="b-share">
            <span className="k">Kept</span>
            <span className="v">{inTotal - outTotal}</span>
          </div>
        </div>

        {/* --- Where it went ---------------------------------------------- */}
        <p className="eyebrow">Where the coins went</p>
        {spendRows.length === 0 ? (
          <Empty glyph="🫙" title="Nothing spent" body={`${child.name} has not spent a coin in this window.`} />
        ) : (
          <div className="hbars">
            {spendRows.map(([label, n]) => (
              <div key={label} className="hbar">
                <span>{label}</span>
                <span className="track">
                  <i style={{ width: `${pct(n, outTotal)}%` }} />
                </span>
                <span className="v">{n}</span>
              </div>
            ))}
          </div>
        )}

        {/* --- Where it came from ----------------------------------------- */}
        <p className="eyebrow">Where the coins came from</p>
        {sourceRows.length === 0 ? (
          <Empty glyph="🌱" title="Nothing earned yet" body="No coins have arrived in this window." />
        ) : (
          <div className="hbars">
            {sourceRows.map(([label, n]) => (
              <div key={label} className="hbar">
                <span>{label}</span>
                <span className="track">
                  <i
                    style={{
                      width: `${pct(n, inTotal)}%`,
                      background: label === 'Jobs' ? 'var(--sprout)' : 'var(--sun)',
                    }}
                  />
                </span>
                <span className="v">{n}</span>
              </div>
            ))}
          </div>
        )}
        {/* The ratio that matters more than the totals. A child whose coins all
            arrive on a schedule is learning a different lesson from one whose
            coins arrive from work. */}
        {inTotal > 0 ? (
          <p className="meta">
            {pct(bySource.get('Jobs') ?? 0, inTotal)}% of what arrived was earned from jobs.
          </p>
        ) : null}

        {/* --- Effort ----------------------------------------------------- */}
        <p className="eyebrow">Jobs and asks</p>
        <table className="tbl">
          <tbody>
            <tr>
              <th scope="row">Jobs finished</th>
              <td>
                {plural(finished.length, 'job', 'jobs')}
                {finished.length > 0 ? ` · ${finished.reduce((n, j) => n + j.coins, 0)} coins` : ''}
              </td>
            </tr>
            <tr>
              <th scope="row">Sent back</th>
              <td>{plural(sentBack.length, 'job', 'jobs')}</td>
            </tr>
            <tr>
              <th scope="row">Asked you to look again</th>
              <td>{plural(disputes.length, 'time', 'times')}</td>
            </tr>
            <tr>
              <th scope="row">Asked to spend</th>
              <td>
                {plural(asks.length, 'time', 'times')} ·{' '}
                {asks.filter((s) => s.status === 'withdrawn').length} taken back before you saw them
              </td>
            </tr>
            <tr>
              <th scope="row">Rewards unlocked</th>
              <td>{unlocked.length === 0 ? 'none' : unlocked.length}</td>
            </tr>
          </tbody>
        </table>

        {unlocked.length > 0 ? (
          <div className="rows">
            {unlocked.map((r) => {
              const rw = state.rewards.find((x) => x.id === r.rewardId);
              return (
                <div key={r.id} className="row2 soft">
                  <span className="art" aria-hidden="true">
                    {rw?.emoji ?? '🎁'}
                  </span>
                  <span className="mid">
                    <p className="t">{rw?.name ?? 'A reward'}</p>
                    <p className="s">
                      {rw ? shelfLabel(rw.shelf) : ''} · {coinWord(r.coins)} ·{' '}
                      {r.decidedAt ? shortDate(r.decidedAt) : ''}
                    </p>
                  </span>
                </div>
              );
            })}
          </div>
        ) : null}

        {gotBadges.length > 0 ? (
          <>
            <p className="eyebrow">Badges earned</p>
            <p className="meta">
              {gotBadges
                .map((x) => {
                  const d = badgeDef(x.key);
                  return d ? `${d.glyph} ${d.name}` : x.key;
                })
                .join(' · ')}
            </p>
            <p className="meta">Badges cannot be bought with coins, at any price. Worth saying out loud.</p>
          </>
        ) : null}

        {/* --- The point of the screen ------------------------------------ */}
        <p className="eyebrow">Worth a chat this week</p>
        <div className="card t-sprout">
          {talk.length === 0 ? (
            <p className="body">
              A quiet week — nothing here needs fixing. Asking {child.name} what they are saving for is never wasted.
            </p>
          ) : (
            talk.map((t) => (
              <p key={t} className="body">
                {t}
              </p>
            ))
          )}
        </div>

        {/* --- The freemium line ------------------------------------------ */}
        <div className="card soft">
          <p className="eyebrow">Sprout Free</p>
          <p className="meta">
            You are on the free plan: every feature in the children&apos;s app, unlimited jobs and rewards, and eight
            weeks of history. Sprout Plus would add longer history, printable summaries and per-child reports — all of
            it on this screen, where children never come.
          </p>
          <p className="meta">
            Read-aloud, the beginner font, reduced motion and high contrast are not premium features and never will be.
            A child does not get a smaller app because of what a parent can pay.
          </p>
        </div>
      </div>
    </>
  );
}

/* ========================================================================== */

/** What a spend entry was actually for — a category, or a shelf if it was a reward. */
function whatFor(e: Entry, state: State): string {
  const req = state.spendRequests.find((s) => s.id === e.refId);
  if (req) return categoryOf(req.category).label;
  const red = state.redemptions.find((r) => r.id === e.refId);
  if (red) {
    const rw = state.rewards.find((x) => x.id === red.rewardId);
    return rw ? shelfLabel(rw.shelf) : 'Rewards';
  }
  return 'Other';
}

/**
 * The conversation prompts. Every one is derived from something that actually
 * happened, and none of them tells a parent what to think about it — a prompt
 * that comes with its own conclusion is just an app with opinions about your
 * family.
 */
function chatPrompts(
  child: Child,
  d: {
    spendRows: [string, number][];
    outTotal: number;
    saved: number;
    earned: number;
    spentWeek: number;
    repeats: { title: string; declineCount: number }[];
    disputes: number;
    unlocked: number;
    goal: { name: string; emoji: string; target: number; escrow: number } | null;
  },
): string[] {
  const out: string[] = [];
  const top = d.spendRows[0];

  if (top && d.outTotal >= 8 && pct(top[1], d.outTotal) >= 70) {
    out.push(
      `${pct(top[1], d.outTotal)}% of what ${child.name} spent went on ${top[0].toLowerCase()}. Worth asking what else was on the list.`,
    );
  }
  if (d.earned > 0 && d.saved === 0) {
    out.push(`Nothing has stayed in the Save jar. Ask ${child.name} what would be worth waiting for.`);
  }
  for (const r of d.repeats.slice(0, 1)) {
    out.push(
      `“${r.title}” has come back ${plural(r.declineCount, 'time', 'times')}. That is usually the job, not the child — try splitting it or changing what it is worth.`,
    );
  }
  if (d.disputes > 0) {
    out.push(
      `${child.name} asked you to look again ${plural(d.disputes, 'time', 'times')}. Whichever way you decided, making the case is the skill worth praising.`,
    );
  }
  if (d.goal && d.goal.escrow > 0 && d.goal.target - d.goal.escrow <= Math.ceil(d.goal.target * 0.15)) {
    out.push(
      `${d.goal.emoji} ${d.goal.name} is ${coinWord(d.goal.target - d.goal.escrow)} away. A good week to notice it out loud.`,
    );
  }
  if (d.goal && d.goal.escrow === 0) {
    out.push(`Nothing has gone towards ${d.goal.name} yet. Ask ${child.name} how many weeks they think it would take.`);
  }
  if (d.unlocked > 0) {
    out.push(`${child.name} unlocked ${plural(d.unlocked, 'reward', 'rewards')}. Did it feel worth the coins?`);
  }
  return out.slice(0, 3);
}
