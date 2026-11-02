import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useChildCtx } from './ChildFrame';
import { rewardsForTier, useStore } from '../data/store';
import { Bar, Empty, Stepper, TopBar, useAutoRead } from '../ui/bits';
import { GoalPlant } from '../ui/Sprig';
import { Icon } from '../ui/Icons';
import { coinWord, pct, weeksAtRate } from '../lib/format';

/**
 * The goal.
 *
 * The plant is the whole idea: coins put aside are visibly growing into
 * something, and a child can see how much of the plant is left. It starts at
 * 7-8 because metaphor comprehension — "the plant *is* my saving" — arrives
 * around eight; below that a plant is just a picture of a plant.
 *
 * Coins in a goal are held, not gone. The take-back button is on this screen,
 * permanently, because escrow is a commitment device and not a trap.
 */
export default function Goals() {
  const { child, balances, goal } = useChildCtx();
  const { state, dispatch } = useStore();
  const [put, setPut] = useState(1);

  if (child.tier === 1) return <Navigate to={`/child/${child.id}`} replace />;

  const escrow = goal ? (balances.goals[goal.id] ?? 0) : 0;
  const left = goal ? Math.max(0, goal.target - escrow) : 0;
  const openJobs = state.jobs.filter((j) => j.childId === child.id && (j.status === 'open' || j.status === 'not_yet'));
  const perWeek = child.allowance.coins + openJobs.reduce((n, j) => n + j.coins, 0);
  const canPut = Math.min(balances.save > 0 ? balances.save : balances.spend, left);
  const source = balances.save > 0 ? 'save' : 'spend';

  const readText = goal
    ? `Your goal is a ${goal.name.toLowerCase()}. It costs ${coinWord(goal.target)}. You have put aside ${coinWord(escrow)}. ${coinWord(left)} to go.`
    : 'You have not picked a goal yet.';
  useAutoRead(child.prefs.readAloud, readText);

  /* --- No goal yet ------------------------------------------------------- */
  if (!goal) {
    const options = rewardsForTier(state.rewards, child.tier)
      .filter((r) => r.coins > balances.available)
      .sort((a, b) => a.coins - b.coins)
      .slice(0, 6);
    return (
      <>
        <TopBar title="My goal" readText={readText} />
        <div className="screen">
          <Empty glyph="🌱" title="Pick something to save for" body="Something big enough to be worth waiting for." />
          <div className="rows">
            {options.map((r) => (
              <button
                key={r.id}
                className="row2"
                onClick={() =>
                  dispatch({ t: 'goal/create', childId: child.id, name: r.name, emoji: r.emoji, target: r.coins })
                }
              >
                <span className="art" aria-hidden="true">
                  {r.emoji}
                </span>
                <span className="mid">
                  <p className="t">{r.name}</p>
                  <p className="s">
                    {coinWord(r.coins)}
                    {child.tier === 3 ? ` · ${weeksAtRate(r.coins - balances.available, perWeek) ?? ''}` : ''}
                  </p>
                </span>
                <span className="end">
                  <Icon name="arrowr" style={{ width: 20, height: 20 }} />
                </span>
              </button>
            ))}
          </div>
        </div>
      </>
    );
  }

  const reached = escrow >= goal.target;

  return (
    <>
      <TopBar title="My goal" readText={readText} />
      <div className="screen">
        <div className="card" style={{ alignItems: 'center' }}>
          <GoalPlant progress={escrow / goal.target} className="plant" />
          <h2 className="h1" style={{ textAlign: 'center' }}>
            {goal.emoji} {goal.name}
          </h2>
          <Bar value={escrow} max={goal.target} escrow />
          <p className="body">
            <b>{escrow}</b> of {goal.target} put aside
            {child.tier === 3 ? ` — ${pct(escrow, goal.target)}%` : ''}
          </p>
          {reached ? (
            <p className="body" style={{ color: 'var(--sprout-deep)' }}>
              You made it! Ask a grown-up.
            </p>
          ) : (
            <>
              <p className="meta">{coinWord(left)} to go</p>
              {child.tier === 3 ? (
                <p className="approx">{weeksAtRate(left, perWeek) ?? 'You can get it now'}</p>
              ) : null}
            </>
          )}
        </div>

        {/* --- Put coins aside --------------------------------------------- */}
        {!reached ? (
          <div className="card t-sky">
            <h3 className="h2">Put some coins aside</h3>
            <p className="meta">
              From your {source === 'save' ? 'Save' : 'Spend'} jar — you have {balances[source]}.
            </p>
            <Stepper value={Math.min(put, Math.max(1, canPut))} onChange={setPut} min={1} max={Math.max(1, canPut)} />
            <button
              className="btn green"
              disabled={canPut < 1}
              onClick={() => {
                dispatch({
                  t: 'coins/move',
                  childId: child.id,
                  from: source,
                  to: `goal:${goal.id}`,
                  coins: Math.min(put, canPut),
                  label: `put aside for the ${goal.name.toLowerCase()}`,
                  icon: goal.emoji,
                });
                setPut(1);
              }}
            >
              <Icon name="seed" />
              Put aside
            </button>
          </div>
        ) : null}

        {escrow > 0 ? (
          <div className="card soft">
            <p className="meta">
              These coins are still yours. You can take them back any time and the plant just gets
              smaller again.
            </p>
            <button
              className="btn ghost sm"
              onClick={() =>
                dispatch({
                  t: 'coins/move',
                  childId: child.id,
                  from: `goal:${goal.id}`,
                  to: source === 'save' ? 'save' : 'spend',
                  coins: escrow,
                  label: `took back your ${goal.name.toLowerCase()} coins`,
                  icon: '↩️',
                })
              }
            >
              <Icon name="arrowl" />
              Take my {coinWord(escrow)} back
            </button>
          </div>
        ) : null}

        <button
          className="btn quiet"
          onClick={() => dispatch({ t: 'goal/delete', goalId: goal.id })}
        >
          Choose a different goal
        </button>
      </div>
    </>
  );
}
