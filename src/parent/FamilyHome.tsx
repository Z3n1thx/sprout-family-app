import { Link } from 'react-router-dom';
import { useQueue, useStore } from '../data/store';
import { useParent } from './ParentFrame';
import { Icon } from '../ui/Icons';
import { TopBar, Empty, Pill } from '../ui/bits';
import NoChildren from './NoChildren';
import { avatarGlyph } from '../data/catalog';
import { dayLabel, earnedThisWeek, foldBalances } from '../lib/ledger';
import { coinWord, plural, shortTime } from '../lib/format';
import type { QueueItem } from '../data/store';

const WEEK_MS = 7 * 86_400_000;

const KIND_LABEL: Record<QueueItem['kind'], string> = {
  job: 'Job to check',
  spend: 'Wants to spend',
  reward: 'Wants a reward',
  dispute: 'Asked you to look again',
};

/**
 * The parent's home.
 *
 * One queue, not three. A parent does not think in terms of "spend requests"
 * and "redemptions" — they think "what is waiting on me", and every item in that
 * list has a child waiting at the other end of it. So the queue is first, it is
 * the only coral thing on the screen, and the child cards below it lead with
 * effort rather than with a balance.
 */
export default function FamilyHome() {
  const { state, setSession } = useStore();
  const parent = useParent();
  const queue = useQueue();

  return (
    <>
      <TopBar
        title={state.family.name}
        right={
          <Link
            to="/parent/sign-in"
            className="grownup"
            onClick={() => setSession({ role: null, childId: null, parentId: null })}
          >
            <Icon name="lock" style={{ width: '1em', height: '1em' }} />
            Lock
          </Link>
        }
      />

      <div className="screen">
        <p className="meta">
          Signed in as {parent.label} ({parent.name}).
        </p>

        {/* --- Needs you --------------------------------------------------- */}
        <p className="eyebrow">
          {queue.length > 0 ? `Needs you — ${queue.length}` : 'Needs you'}
        </p>

        {queue.length === 0 ? (
          <Empty glyph="🌤️" title="Nothing waiting" body="Approvals will land here as they come in." />
        ) : (
          <div className="rows">
            {queue.map((q) => {
              const child = state.family.children.find((c) => c.id === q.childId);
              return (
                <Link
                  key={q.id}
                  to={`/parent/queue/${q.kind}/${q.id}`}
                  className={q.kind === 'dispute' ? 'row2 t-berry' : 'row2 t-sun'}
                >
                  <span className="art" aria-hidden="true">
                    {q.icon}
                  </span>
                  <span className="mid">
                    <p className="t">
                      {child?.name} — {q.title}
                    </p>
                    <p className="s">
                      {KIND_LABEL[q.kind]} · {q.detail} · {dayLabel(q.at)} {shortTime(q.at)}
                    </p>
                  </span>
                  <span className="end">
                    <Pill kind={q.kind === 'dispute' ? 'notyet' : 'wait'}>
                      {q.coins}
                      <Icon name="coin" />
                    </Pill>
                    <Icon name="arrowr" style={{ width: '1.1em', height: '1.1em', color: 'var(--ink-soft)' }} />
                  </span>
                </Link>
              );
            })}
          </div>
        )}

        {/* --- The children ------------------------------------------------ */}
        <p className="eyebrow">Children</p>
        {state.family.children.length === 0 ? (
          <NoChildren what="Add the first one and their app is ready to open — four jobs for their age, the reward shelf, and zero coins." />
        ) : null}
        <div className="rows">
          {state.family.children.map((c) => {
            const b = foldBalances(state.entries, c.id);
            const earned = earnedThisWeek(state.entries, c.id);
            const done = state.jobs.filter(
              (j) =>
                j.childId === c.id &&
                j.status === 'approved' &&
                j.decidedAt !== undefined &&
                Date.now() - new Date(j.decidedAt).getTime() < WEEK_MS,
            ).length;
            const waiting = queue.filter((q) => q.childId === c.id).length;
            const goal = state.goals.find((g) => g.childId === c.id);
            const escrow = goal ? (b.goals[goal.id] ?? 0) : 0;

            return (
              <div key={c.id} className="card">
                <div className="row2 soft" style={{ border: 0, padding: 0, minHeight: 0 }}>
                  <span className="art" aria-hidden="true">
                    {avatarGlyph(c.avatar)}
                  </span>
                  <span className="mid">
                    <p className="t">
                      {c.name}, {c.age}
                    </p>
                    {/* Effort first. A parent who opens this app and reads a
                        balance learns what their child has; a parent who reads
                        the week's work learns what their child did. */}
                    <p className="s">
                      Earned {coinWord(earned)} this week · {plural(done, 'job finished', 'jobs finished')}
                    </p>
                  </span>
                  <span className="end">
                    {waiting > 0 ? <Pill kind="count">{waiting}</Pill> : null}
                  </span>
                </div>

                <div className="split">
                  <div className="b-spend">
                    <span className="k">Spend</span>
                    <span className="v">{b.spend}</span>
                  </div>
                  <div className="b-save">
                    <span className="k">Save</span>
                    <span className="v">{b.save}</span>
                  </div>
                  <div className="b-share">
                    <span className="k">Share</span>
                    <span className="v">{b.share}</span>
                  </div>
                </div>

                {goal ? (
                  <p className="meta">
                    {goal.emoji} {goal.name}: {escrow} of {goal.target} put aside
                  </p>
                ) : (
                  <p className="meta">No goal set yet.</p>
                )}

                <div className="btnrow">
                  <Link className="btn sm sun auto" to={`/parent/add-coins/${c.id}`}>
                    <Icon name="plus" />
                    Add coins
                  </Link>
                  <Link className="btn sm ghost auto" to={`/parent/children/${c.id}`}>
                    Settings
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Both of these need a child to act on, so before there is one they
            would only lead to another empty screen. */}
        {state.family.children.length > 0 ? (
          <div className="btnrow">
            <Link className="btn ghost auto" to="/parent/jobs/new">
              <Icon name="plus" />
              New job
            </Link>
            <Link className="btn ghost auto" to="/parent/add-coins">
              <Icon name="coin" />
              Add coins
            </Link>
          </div>
        ) : null}

        <p className="meta">
          Coins are play money. They are worth what your family agrees they are worth — Sprout has no card, no bank
          link, and no way to move real money.
        </p>
      </div>
    </>
  );
}
