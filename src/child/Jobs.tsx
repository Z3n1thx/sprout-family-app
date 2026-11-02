import { Link } from 'react-router-dom';
import { useChildCtx } from './ChildFrame';
import { useStore } from '../data/store';
import { Empty, Pill, TopBar, useAutoRead } from '../ui/bits';
import { Icon } from '../ui/Icons';
import { coinWord } from '../lib/format';
import { dayLabel } from '../lib/ledger';

/**
 * Jobs.
 *
 * Grouped by what the child can do about them: things to do, things being
 * checked, things finished. A "not yet" job sits back in *To do* rather than in
 * a rejected pile of its own, because that is what it is — work still available,
 * with its coins still waiting.
 */
export default function Jobs() {
  const { child } = useChildCtx();
  const { state } = useStore();

  const mine = state.jobs.filter((j) => j.childId === child.id);
  const todo = mine.filter((j) => j.status === 'open' || j.status === 'not_yet');
  const checking = mine.filter((j) => j.status === 'submitted' || j.status === 'disputed');
  const done = mine
    .filter((j) => j.status === 'approved')
    .sort((a, b) => (b.decidedAt ?? '').localeCompare(a.decidedAt ?? ''));

  const readText = `Your jobs. ${todo.length} to do. ${checking.length} waiting to be checked.`;
  useAutoRead(child.prefs.readAloud, readText);

  return (
    <>
      <TopBar title="My jobs" readText={readText} />
      <div className="screen">
        <p className="eyebrow">To do</p>
        {todo.length === 0 ? (
          <Empty glyph="🎉" title="Nothing to do right now" body="A grown-up will add more jobs soon." />
        ) : (
          <div className="rows">
            {todo.map((j) => (
              <Link
                key={j.id}
                to={`/child/${child.id}/jobs/${j.id}`}
                className={j.status === 'not_yet' ? 'row2 t-slate' : 'row2'}
              >
                <span className="art" aria-hidden="true">
                  {j.icon}
                </span>
                <span className="mid">
                  <p className="t">{j.title}</p>
                  <p className="s">
                    {j.status === 'not_yet' ? 'Not yet — your coins are still waiting' : coinWord(j.coins)}
                  </p>
                </span>
                <span className="end">
                  {j.status === 'not_yet' ? (
                    <Pill kind="notyet">Not yet</Pill>
                  ) : (
                    <span className="pill open">
                      <Icon name="coin" />
                      {j.coins}
                    </span>
                  )}
                </span>
              </Link>
            ))}
          </div>
        )}

        {checking.length > 0 ? (
          <>
            <p className="eyebrow">Being checked</p>
            <div className="rows">
              {checking.map((j) => (
                <Link key={j.id} to={`/child/${child.id}/jobs/${j.id}`} className="row2 t-sun">
                  <span className="art" aria-hidden="true">
                    {j.icon}
                  </span>
                  <span className="mid">
                    <p className="t">{j.title}</p>
                    <p className="s">
                      {j.status === 'disputed' ? 'You asked for another look' : `${coinWord(j.coins)} on the way`}
                    </p>
                  </span>
                  <span className="end">
                    <Pill kind="wait">
                      <Icon name="hourglass" />
                      Waiting
                    </Pill>
                  </span>
                </Link>
              ))}
            </div>
          </>
        ) : null}

        {done.length > 0 ? (
          <>
            <p className="eyebrow">Finished</p>
            <div className="rows">
              {done.slice(0, 6).map((j) => (
                <Link key={j.id} to={`/child/${child.id}/jobs/${j.id}`} className="row2 soft">
                  <span className="art" aria-hidden="true">
                    {j.icon}
                  </span>
                  <span className="mid">
                    <p className="t">{j.title}</p>
                    <p className="s">{j.decidedAt ? dayLabel(j.decidedAt) : ''}</p>
                  </span>
                  <span className="end">
                    <Pill kind="done">
                      <Icon name="check" />+{j.coins}
                    </Pill>
                  </span>
                </Link>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </>
  );
}
