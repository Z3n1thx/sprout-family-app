import { Link } from 'react-router-dom';
import { useStore } from '../data/store';
import { TopBar, Pill, Empty } from '../ui/bits';
import { Icon } from '../ui/Icons';
import { avatarGlyph } from '../data/catalog';
import { foldBalances } from '../lib/ledger';
import { coinWord, plural, weekday } from '../lib/format';
import type { Tier } from '../data/types';

const LEVEL: Record<Tier, string> = {
  1: 'Ages 4–6 — simplest',
  2: 'Ages 7–8',
  3: 'Ages 9–10',
};

/**
 * The children list.
 *
 * A directory, not a dashboard — the numbers live on the family screen. What
 * this page answers is "what does each child's app look like right now", because
 * that is the thing a parent forgets they control.
 */
export default function Family() {
  const { state } = useStore();
  const devices = state.family.devices.length;

  return (
    <>
      <TopBar title="Children" />
      <div className="screen">
        {state.family.children.length === 0 ? (
          <Empty
            glyph="🌱"
            title="No children yet"
            body="Add the first one and their app is ready — four jobs for their age, the reward shelf, and zero coins."
          />
        ) : null}

        <div className="rows">
          {state.family.children.map((c) => {
            const b = foldBalances(state.entries, c.id);
            const cats = c.limits.categories.length;
            return (
              <Link key={c.id} to={`/parent/children/${c.id}`} className="row2">
                <span className="art" aria-hidden="true">
                  {avatarGlyph(c.avatar)}
                </span>
                <span className="mid">
                  <p className="t">
                    {c.name}, {c.age}
                  </p>
                  <p className="s">
                    {LEVEL[c.tier]} · {coinWord(c.limits.perRequest)} per ask · {c.limits.weekly}/week ·{' '}
                    {plural(cats, 'category', 'categories')}
                  </p>
                  <p className="s">
                    {c.allowance.active
                      ? `${coinWord(c.allowance.coins)} every ${weekday(c.allowance.weekday)}`
                      : 'No pocket money set'}
                    {c.savingsBonus ? ' · saving bonus on' : ''}
                    {c.prefs.readAloud ? ' · read-aloud' : ''}
                    {c.prefs.beginnerFont ? ' · beginner letters' : ''}
                    {c.prefs.reducedMotion ? ' · less motion' : ''}
                    {c.prefs.sound ? '' : ' · sound off'}
                  </p>
                </span>
                <span className="end">
                  <Pill kind="count">
                    {b.available}
                    <Icon name="coin" />
                  </Pill>
                  <Icon name="arrowr" style={{ width: '1.1em', height: '1.1em', color: 'var(--ink-soft)' }} />
                </span>
              </Link>
            );
          })}
        </div>

        <Link to="/parent/children/new" className="btn ghost">
          <Icon name="plus" />
          Add a child
        </Link>

        <Link to="/parent/devices" className="row2">
          <span className="art" aria-hidden="true">
            📱
          </span>
          <span className="mid">
            <p className="t">Devices and family code</p>
            <p className="s">
              {plural(devices, 'device', 'devices')} · code {state.family.code}
            </p>
          </span>
          <span className="end">
            <Icon name="arrowr" style={{ width: '1.1em', height: '1.1em', color: 'var(--ink-soft)' }} />
          </span>
        </Link>

        <div className="card soft">
          <p className="meta">
            Each child signs in with a picture key — three pictures in order, chosen when you add them. It is never shown
            as a hint, and it is not a password: it stops a sibling opening the wrong app, which is the only threat a
            seven-year-old&apos;s account actually faces.
          </p>
          <p className="meta">
            Their pictures are on their own page, along with everything else about how their app behaves.
          </p>
        </div>
      </div>
    </>
  );
}
