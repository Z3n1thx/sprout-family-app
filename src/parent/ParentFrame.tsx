import { NavLink, Navigate, Outlet } from 'react-router-dom';
import { useQueue, useStore } from '../data/store';
import { Icon, type IconName } from '../ui/Icons';
import type { Parent } from '../data/types';

/**
 * The parent shell.
 *
 * `data-tier="p"` swaps the whole scale to adult density — 15px body, 44px taps,
 * tables and segmented controls. That visual gap is a safety feature: a child
 * who lands here by accident can see immediately that this is not their app,
 * without having to read a word of it.
 */
export default function ParentFrame() {
  const { state, session } = useStore();
  /* The session outlives the state it refers to — a stored session from an
     older schema, or a device that has just adopted a different family. If the
     signed-in parent is not in this family, they are not signed in. */
  const known = state.family.parents.some((p) => p.id === session.parentId);
  if (session.role !== 'parent' || !session.parentId || !known) {
    return <Navigate to="/parent/sign-in" replace />;
  }
  return (
    <div className="app" data-tier="p">
      <Outlet />
      <ParentTabs />
    </div>
  );
}

const TABS: { to: string; icon: IconName; label: string; end?: boolean }[] = [
  { to: '/parent', icon: 'home', label: 'Family', end: true },
  { to: '/parent/jobs', icon: 'jobs', label: 'Jobs' },
  { to: '/parent/rewards', icon: 'gift', label: 'Rewards' },
  { to: '/parent/insights', icon: 'chart', label: 'Insights' },
  { to: '/parent/children', icon: 'people', label: 'Children' },
];

function ParentTabs() {
  const queue = useQueue();
  return (
    <nav className="bnav" aria-label="Sections">
      {TABS.map((t) => (
        <NavLink key={t.to} to={t.to} end={t.end} className={({ isActive }) => (isActive ? 'on' : undefined)}>
          <Icon name={t.icon} />
          {t.label}
          {t.end && queue.length > 0 ? (
            <span className="dot" aria-label={`${queue.length} waiting for you`}>
              {queue.length}
            </span>
          ) : null}
        </NavLink>
      ))}
    </nav>
  );
}

/** The signed-in parent. Safe below ParentFrame, which redirects without one. */
export function useParent(): Parent {
  const { state, session } = useStore();
  const parent = state.family.parents.find((p) => p.id === session.parentId);
  if (!parent) throw new Error('useParent outside a signed-in parent');
  return parent;
}
