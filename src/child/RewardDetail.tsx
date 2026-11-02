import { useNavigate, useParams } from 'react-router-dom';
import { useChildCtx } from './ChildFrame';
import { useStore } from '../data/store';
import { CoinRow, Pill, TopBar, useAutoRead } from '../ui/bits';
import { Icon } from '../ui/Icons';
import { Sprig } from '../ui/Sprig';
import { shelfLabel } from '../data/catalog';
import { coinWord, weeksAtRate } from '../lib/format';

/**
 * One reward.
 *
 * The arithmetic is shown before the ask, not after it: "you have 39, this
 * costs 5, you would have 34". A child old enough to do that subtraction gets to
 * do it; a child who is not sees the same thing as coins.
 *
 * Nothing is deducted here. The coins move when a grown-up says yes, which is
 * why the screen can promise they are still yours while you wait.
 */
export default function RewardDetail() {
  const { rewardId } = useParams();
  const { child, balances } = useChildCtx();
  const { state, dispatch } = useStore();
  const nav = useNavigate();

  const reward = state.rewards.find((r) => r.id === rewardId);
  const existing = state.redemptions.find(
    (r) => r.childId === child.id && r.rewardId === rewardId && r.status === 'requested',
  );

  if (!reward) {
    return (
      <>
        <TopBar title="Reward" back={`/child/${child.id}/rewards`} />
        <div className="screen center">
          <p className="body">That one is not on the shelf any more.</p>
        </div>
      </>
    );
  }

  const after = balances.available - reward.coins;
  const ready = after >= 0;
  const openJobs = state.jobs.filter((j) => j.childId === child.id && (j.status === 'open' || j.status === 'not_yet'));
  const perWeek = child.allowance.coins + openJobs.reduce((n, j) => n + j.coins, 0);

  const readText = ready
    ? `${reward.name}. It costs ${coinWord(reward.coins)}. You have ${coinWord(balances.available)}. After, you would have ${coinWord(after)}.`
    : `${reward.name}. It costs ${coinWord(reward.coins)}. You need ${coinWord(-after)} more.`;
  useAutoRead(child.prefs.readAloud, readText);

  return (
    <>
      <TopBar title={shelfLabel(reward.shelf)} back={`/child/${child.id}/rewards`} readText={readText} />
      <div className="screen center">
        <span style={{ fontSize: 72 }} aria-hidden="true">
          {reward.emoji}
        </span>
        <h2 className="h1">{reward.name}</h2>
        {reward.realWorldHint ? <p className="meta">{reward.realWorldHint}</p> : null}

        <div className="jar" style={{ width: '100%' }}>
          <p className="jarlabel">It costs</p>
          <p className="bal">
            <Icon name="coin" />
            {reward.coins}
          </p>
          <CoinRow n={reward.coins} />
        </div>

        {/* The trade-off, spelled out. At 4-6 as two rows of coins; from 7-8 as
            the sum as well, because by then it is arithmetic they can follow. */}
        <div className={ready ? 'card t-sprout' : 'card t-slate'} style={{ width: '100%' }}>
          {ready ? (
            <>
              <p className="body">
                You have <b>{balances.available}</b>. After this you would have <b>{after}</b>.
              </p>
              {child.tier >= 2 ? (
                <p className="sum">
                  {balances.available} − {reward.coins} = {after}
                </p>
              ) : (
                <CoinRow n={after} />
              )}
            </>
          ) : (
            <>
              <p className="body">
                You need <b>{coinWord(-after)}</b> more.
              </p>
              {child.tier === 3 ? (
                <p className="sum">{weeksAtRate(-after, perWeek) ?? ''}</p>
              ) : null}
            </>
          )}
        </div>

        <div className="spacer" />

        {existing ? (
          <>
            <Sprig mood="wait" className="sprig" />
            <Pill kind="wait">
              <Icon name="hourglass" />
              Waiting for a grown-up
            </Pill>
            <p className="meta">Your coins stay with you until they say yes.</p>
          </>
        ) : ready ? (
          <>
            <button
              className="btn green huge"
              onClick={() => {
                dispatch({ t: 'reward/request', childId: child.id, rewardId: reward.id });
                nav(`/child/${child.id}/rewards`);
              }}
            >
              <Icon name="gift" />
              Ask to unlock this
            </button>
            <p className="meta">Your coins stay with you until a grown-up says yes.</p>
          </>
        ) : (
          <>
            <button className="btn sun huge" onClick={() => nav(`/child/${child.id}/jobs`)}>
              <Icon name="jobs" />
              Find a job to do
            </button>
            <p className="meta">
              {openJobs.length > 0
                ? `${coinWord(openJobs.reduce((n, j) => n + j.coins, 0))} waiting in your jobs.`
                : 'A grown-up will add more jobs soon.'}
            </p>
          </>
        )}
      </div>
    </>
  );
}
