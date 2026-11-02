import { Link } from 'react-router-dom';
import { useChildCtx } from './ChildFrame';
import { rewardsForTier, useStore } from '../data/store';
import { Pill, TopBar, useAutoRead } from '../ui/bits';
import { Icon } from '../ui/Icons';
import { SHELVES } from '../data/catalog';
import { coinWord, plural } from '../lib/format';

/** How far ahead a child can usefully see. Two weeks at 4-6, three months at
 *  9-10 — a reward a five-year-old cannot reach inside a fortnight is not a
 *  goal, it is a taunt, so it is not put on their shelf at all. */
const HORIZON_WEEKS = { 1: 2, 2: 6, 3: 12 } as const;

/**
 * The reward shelves.
 *
 * "Time with you" is first, every time, and "Things" is last. That ordering is
 * the argument the whole rewards system is making: the cheapest thing on the
 * shelf costs a parent nothing but attention, and it is the one a child is
 * shown before anything that costs money.
 */
export default function Rewards() {
  const { child, balances } = useChildCtx();
  const { state } = useStore();

  const openJobs = state.jobs.filter((j) => j.childId === child.id && (j.status === 'open' || j.status === 'not_yet'));
  const perWeek = child.allowance.coins + openJobs.reduce((n, j) => n + j.coins, 0);
  const ceiling = balances.available + perWeek * HORIZON_WEEKS[child.tier];

  const pending = state.redemptions.filter((r) => r.childId === child.id && r.status === 'requested');
  const badgeCount = state.badges.filter((b) => b.childId === child.id).length;

  const readText = `Rewards. You have ${coinWord(balances.available)} to spend.`;
  useAutoRead(child.prefs.readAloud, readText);

  return (
    <>
      <TopBar title="Rewards" readText={readText} />
      <div className="screen">
        <div className="card t-sun" style={{ alignItems: 'center' }}>
          <p className="jarlabel">You have</p>
          <p className="bal" style={{ fontSize: 'var(--fs-h)' }}>
            <Icon name="coin" />
            {balances.available}
          </p>
          <p className="meta">Coins are only for these. They are not real money.</p>
        </div>

        {pending.map((r) => {
          const reward = state.rewards.find((x) => x.id === r.rewardId);
          return (
            <div key={r.id} className="row2 t-sun">
              <span className="art" aria-hidden="true">
                {reward?.emoji ?? '🎁'}
              </span>
              <span className="mid">
                <p className="t">{reward?.name ?? 'A reward'}</p>
                <p className="s">Waiting for a grown-up to say yes</p>
              </span>
              <span className="end">
                <Pill kind="wait">
                  <Icon name="hourglass" />
                  Asked
                </Pill>
              </span>
            </div>
          );
        })}

        {SHELVES.map((shelf) => {
          const items = rewardsForTier(state.rewards, child.tier, shelf.id)
            .filter((r) => r.coins <= ceiling && (r.stock === undefined || r.stock > 0))
            .sort((a, b) => a.coins - b.coins);
          if (items.length === 0) return null;
          return (
            <section key={shelf.id} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap)' }}>
              <div>
                <p className="eyebrow">{shelf.label}</p>
                {child.tier >= 2 ? <p className="meta">{shelf.blurb}</p> : null}
              </div>
              <div className="grid2">
                {items.map((r) => {
                  const ready = r.coins <= balances.available;
                  const short = r.coins - balances.available;
                  return (
                    <Link
                      key={r.id}
                      to={`/child/${child.id}/rewards/${r.id}`}
                      className={ready ? 'tile ready' : 'tile away'}
                    >
                      <span className="art" aria-hidden="true">
                        {r.emoji}
                      </span>
                      <p className="name">{r.name}</p>
                      <p className="price">
                        <Icon name="coin" />
                        {r.coins}
                      </p>
                      {ready ? (
                        <p className="away-note" style={{ color: 'var(--sprout-deep)', fontWeight: 700 }}>
                          You can get this
                        </p>
                      ) : (
                        <p className="away-note">{plural(short, 'coin', 'coins')} to go</p>
                      )}
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}

        {/* The intrinsic channel, kept structurally separate from the shelves. */}
        <Link to={`/child/${child.id}/badges`} className="row2 t-grape">
          <span className="art" aria-hidden="true">
            🏅
          </span>
          <span className="mid">
            <p className="t">My badges</p>
            <p className="s">
              {badgeCount} earned · badges can&apos;t be bought with coins
            </p>
          </span>
          <span className="end">
            <Icon name="arrowr" style={{ width: 20, height: 20 }} />
          </span>
        </Link>
      </div>
    </>
  );
}
