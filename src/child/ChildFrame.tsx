import { NavLink, Navigate, Outlet, useParams } from 'react-router-dom';
import type { Balances, Child, Goal, Tier } from '../data/types';
import { useBalances, useChildNews, useGoals, useStore } from '../data/store';
import { Icon, type IconName } from '../ui/Icons';

/**
 * The child shell.
 *
 * One attribute — `data-tier` — carries the whole age scale: type sizes, tap
 * targets, spacing, how many actions a screen is allowed, and how long a
 * celebration runs. No screen below this point branches on a child's age, which
 * is why moving a child from 4-6 to 7-8 is a single setting and not a rebuild.
 */
export default function ChildFrame() {
  const { id } = useParams();
  const { state, session } = useStore();
  const child = state.family.children.find((c) => c.id === id);

  if (!child) return <Navigate to="/child" replace />;
  // A deep link cannot skip the picture key.
  if (session.role !== 'child' || session.childId !== child.id) {
    return <Navigate to={`/child/${child.id}/key`} replace />;
  }

  return (
    <div
      className="app"
      data-tier={String(child.tier)}
      {...(child.prefs.beginnerFont ? { 'data-font': 'beginner' } : {})}
      {...(child.prefs.reducedMotion ? { 'data-motion': 'reduced' } : {})}
    >
      <Outlet />
    </div>
  );
}

/* --- Tabs ----------------------------------------------------------------- */

interface Tab {
  to: string;
  icon: IconName;
  label: string;
  end?: boolean;
}

/**
 * Three tabs at 4-6, four at 7-8, five at 9-10. The cap is not decoration: a
 * five-year-old choosing between three labelled destinations is navigating; the
 * same child choosing between five is guessing.
 */
function tabsFor(tier: Tier): Tab[] {
  const home: Tab = { to: '', icon: 'home', label: 'Home', end: true };
  const jobs: Tab = { to: 'jobs', icon: 'jobs', label: 'Jobs' };
  const goals: Tab = { to: 'goals', icon: 'seed', label: 'Goal' };
  const rewards: Tab = { to: 'rewards', icon: 'gift', label: 'Rewards' };
  const story: Tab = { to: 'story', icon: 'book', label: 'Story' };
  if (tier === 1) return [home, jobs, rewards];
  if (tier === 2) return [home, jobs, goals, rewards];
  return [home, jobs, goals, rewards, story];
}

export function ChildTabs() {
  const { child, news } = useChildCtx();
  const tabs = tabsFor(child.tier);

  return (
    <>
      <Outlet />
      <nav className="bnav" aria-label="Sections">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to ? `/child/${child.id}/${t.to}` : `/child/${child.id}`}
            end={t.end}
            className={({ isActive }) => (isActive ? 'on' : undefined)}
          >
            <Icon name={t.icon} />
            {t.label}
            {t.to === 'jobs' && news.count > 0 ? (
              <span className="dot" aria-label={`${news.count} new`}>
                {news.count}
              </span>
            ) : null}
          </NavLink>
        ))}
      </nav>
    </>
  );
}

/* --- Context hook --------------------------------------------------------- */

export interface ChildCtx {
  child: Child;
  balances: Balances;
  goals: Goal[];
  goal: Goal | undefined;
  news: ReturnType<typeof useChildNews>;
}

/** Safe below ChildFrame, which will not render an Outlet without a child. */
export function useChildCtx(): ChildCtx {
  const { id } = useParams();
  const { state } = useStore();
  const balances = useBalances(id);
  const goals = useGoals(id);
  const news = useChildNews(id);
  const child = state.family.children.find((c) => c.id === id);
  if (!child) throw new Error('useChildCtx outside a signed-in child');
  return { child, balances, goals, goal: goals[0], news };
}
