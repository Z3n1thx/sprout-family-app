import { useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useChildCtx } from './ChildFrame';
import { useStore } from '../data/store';
import { Balance, CoinRow, Bar, Pill, TopBar, useAutoRead } from '../ui/bits';
import { Icon } from '../ui/Icons';
import { GoalPlant, Sprig } from '../ui/Sprig';
import { approxMoney, coinWord, pct, weeksAtRate } from '../lib/format';
import { earnedThisWeek, spentThisWeek } from '../lib/ledger';
import { chime } from '../lib/sound';

/**
 * The dashboard.
 *
 * The three variants differ in *composition*, not just in size — a five-year-old
 * gets one jar and one big thing to do, a ten-year-old gets three jars, a rate,
 * and a percentage. The components underneath are the same components; what
 * changes is which of them are on the screen at all.
 */
export default function Home() {
  const { child, balances, goal, news } = useChildCtx();
  const { state, dispatch, setSession } = useStore();
  const nav = useNavigate();
  const tier = child.tier;

  const freshJobs = news.jobs.filter((j) => j.status === 'approved');
  const fresh = freshJobs.reduce((n, j) => n + j.coins, 0);

  useEffect(() => {
    if (fresh > 0) chime('earn', child.prefs.sound);
  }, [fresh, child.prefs.sound]);

  const openJobs = state.jobs.filter((j) => j.childId === child.id && (j.status === 'open' || j.status === 'not_yet'));
  const waiting = state.jobs.filter((j) => j.childId === child.id && (j.status === 'submitted' || j.status === 'disputed'));
  const pendingSpend = state.spendRequests.filter((s) => s.childId === child.id && s.status === 'pending');

  const escrow = goal ? (balances.goals[goal.id] ?? 0) : 0;
  const earned = earnedThisWeek(state.entries, child.id);
  const spent = spentThisWeek(state.entries, child.id);
  const perWeek = child.allowance.coins + openJobs.reduce((n, j) => n + j.coins, 0);

  const readText = useMemo(() => {
    const bits = [`Hello ${child.name}.`, `You have ${coinWord(balances.available)}.`];
    if (fresh > 0) bits.push(`${coinWord(fresh)} just arrived for your jobs.`);
    if (openJobs.length) bits.push(`You have ${openJobs.length} ${openJobs.length === 1 ? 'job' : 'jobs'} to do.`);
    if (waiting.length) bits.push(`${waiting.length} ${waiting.length === 1 ? 'job is' : 'jobs are'} waiting to be checked.`);
    return bits.join(' ');
  }, [child.name, balances.available, fresh, openJobs.length, waiting.length]);

  useAutoRead(child.prefs.readAloud, readText);

  function leave() {
    setSession({ role: null, childId: null, parentId: null });
    nav('/');
  }

  return (
    <>
      <TopBar
        title={`Hi, ${child.name}`}
        readText={readText}
        right={
          <>
            <button className="grownup" onClick={() => nav('/parent/sign-in')}>
              <Icon name="lock" style={{ width: 14, height: 14 }} />
              Grown-ups
            </button>
            <button className="grownup" onClick={leave} aria-label="Finish">
              <Icon name="arrowr" style={{ width: 14, height: 14 }} />
            </button>
          </>
        }
      />

      <div className="screen">
        {/* --- The jar ------------------------------------------------------ */}
        <div className="jar">
          <p className="jarlabel">My coins</p>
          <Balance coins={balances.available} fresh={fresh} />
          {tier === 1 ? <CoinRow n={balances.available} fresh={fresh} /> : null}
          {tier === 3 ? <p className="approx">{approxMoney(balances.available)} of pretend money</p> : null}
        </div>

        {/* Three jars from 7-8, where a child can hold more than one purpose
            for the same coin at the same time. */}
        {tier >= 2 ? (
          <div className="split">
            <div className="b-spend">
              <span className="k">Spend</span>
              <span className="v">{balances.spend}</span>
            </div>
            <div className="b-save">
              <span className="k">Save</span>
              <span className="v">{balances.save}</span>
            </div>
            <div className="b-share">
              <span className="k">Share</span>
              <span className="v">{balances.share}</span>
            </div>
          </div>
        ) : null}

        {/* --- Good news --------------------------------------------------- */}
        {freshJobs.map((j) => (
          <Link
            key={j.id}
            to={`/child/${child.id}/jobs/${j.id}`}
            className="row2 t-sprout"
            onClick={() => dispatch({ t: 'job/seen', jobId: j.id })}
          >
            <span className="art" aria-hidden="true">
              {j.icon}
            </span>
            <span className="mid">
              <p className="t">You got {coinWord(j.coins)}!</p>
              <p className="s">{j.title}</p>
            </span>
            <span className="end">
              <Icon name="arrowr" style={{ width: 20, height: 20 }} />
            </span>
          </Link>
        ))}

        {news.jobs
          .filter((j) => j.status === 'not_yet')
          .map((j) => (
            <Link
              key={j.id}
              to={`/child/${child.id}/jobs/${j.id}`}
              className="row2 t-slate"
              onClick={() => dispatch({ t: 'job/seen', jobId: j.id })}
            >
              <span className="art" aria-hidden="true">
                {j.icon}
              </span>
              <span className="mid">
                <p className="t">{j.title}</p>
                <p className="s">Not yet — have a look</p>
              </span>
              <span className="end">
                <Icon name="arrowr" style={{ width: 20, height: 20 }} />
              </span>
            </Link>
          ))}

        {news.spends.map((s) => (
          <Link
            key={s.id}
            to={`/child/${child.id}/spend`}
            className={`row2 ${s.status === 'approved' ? 't-sprout' : 't-slate'}`}
            onClick={() => dispatch({ t: 'spend/seen', id: s.id })}
          >
            <span className="art" aria-hidden="true">
              {s.status === 'approved' ? '✅' : '💬'}
            </span>
            <span className="mid">
              <p className="t">{s.status === 'approved' ? 'Yes!' : 'Not this time'}</p>
              <p className="s">Your {coinWord(s.coins)} — tap to see</p>
            </span>
          </Link>
        ))}

        {/* --- Waiting ----------------------------------------------------- */}
        {waiting.length > 0 ? (
          <div className="card t-sun">
            <div className="goal">
              <Sprig mood="wait" className="sprig sm" />
              <div className="goalbody">
                <p className="body">
                  {waiting.length === 1 ? 'One job is' : `${waiting.length} jobs are`} waiting to be
                  checked.
                </p>
                <p className="meta">
                  {coinWord(waiting.reduce((n, j) => n + j.coins, 0))} on the way.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {pendingSpend.length > 0 ? (
          <div className="card t-sun">
            <p className="body">
              You asked for {coinWord(pendingSpend[0]!.coins)}. Waiting for a grown-up.
            </p>
          </div>
        ) : null}

        {/* --- Goal -------------------------------------------------------- */}
        {tier >= 2 && goal ? (
          <Link to={`/child/${child.id}/goals`} className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="goal">
              <GoalPlant progress={goal.target > 0 ? escrow / goal.target : 0} />
              <div className="goalbody">
                <p className="h2">
                  {goal.emoji} {goal.name}
                </p>
                <Bar value={escrow} max={goal.target} escrow />
                <p className="meta">
                  {escrow} of {goal.target} put aside
                  {tier === 3 ? ` · ${pct(escrow, goal.target)}%` : ''}
                </p>
                {tier === 3 ? (
                  <p className="meta">
                    {weeksAtRate(goal.target - escrow, perWeek) ?? 'You can get it now'}
                  </p>
                ) : null}
              </div>
            </div>
          </Link>
        ) : null}

        {/* --- This week (9-10 only) --------------------------------------- */}
        {tier === 3 ? (
          <div className="card soft">
            <p className="eyebrow">This week</p>
            <div className="hbars">
              <div className="hbar">
                <span>Earned</span>
                <span className="track">
                  <i style={{ width: `${pct(earned, Math.max(earned, spent, 1))}%`, background: 'var(--sprout)' }} />
                </span>
                <span className="v">+{earned}</span>
              </div>
              <div className="hbar">
                <span>Spent</span>
                <span className="track">
                  <i style={{ width: `${pct(spent, Math.max(earned, spent, 1))}%` }} />
                </span>
                <span className="v">−{spent}</span>
              </div>
            </div>
          </div>
        ) : null}

        {/* --- Actions ----------------------------------------------------- */}
        <button className="btn berry huge" onClick={() => nav(`/child/${child.id}/spend`)}>
          <Icon name="talk" />
          {tier === 1 ? 'I want to buy something' : 'Ask to spend coins'}
        </button>

        <Link to={`/child/${child.id}/jobs`} className="row2">
          <span className="art" aria-hidden="true">
            ⭐
          </span>
          <span className="mid">
            <p className="t">My jobs</p>
            <p className="s">
              {openJobs.length > 0
                ? `${openJobs.length} to do · ${coinWord(openJobs.reduce((n, j) => n + j.coins, 0))} to earn`
                : 'All done for now'}
            </p>
          </span>
          <span className="end">
            {openJobs.length > 0 ? <Pill kind="open">{openJobs.length}</Pill> : null}
            <Icon name="arrowr" style={{ width: 20, height: 20 }} />
          </span>
        </Link>

        {tier < 3 ? (
          <Link to={`/child/${child.id}/story`} className="row2 soft">
            <span className="art" aria-hidden="true">
              📖
            </span>
            <span className="mid">
              <p className="t">My story</p>
              <p className="s">Everything you have earned and spent</p>
            </span>
            <span className="end">
              <Icon name="arrowr" style={{ width: 20, height: 20 }} />
            </span>
          </Link>
        ) : null}

        <Link to={`/child/${child.id}/badges`} className="row2 soft">
          <span className="art" aria-hidden="true">
            🏅
          </span>
          <span className="mid">
            <p className="t">My badges</p>
            <p className="s">
              {state.badges.filter((b) => b.childId === child.id).length} earned
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
