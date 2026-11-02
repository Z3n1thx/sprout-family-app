import { Link } from 'react-router-dom';
import { useStore } from '../data/store';
import { TopBar, Pill, Empty } from '../ui/bits';
import NoChildren from './NoChildren';
import { Icon } from '../ui/Icons';
import { avatarGlyph } from '../data/catalog';
import { coinWord, plural, stamp, weekday } from '../lib/format';
import type { Job, JobStatus } from '../data/types';

const STATUS: Record<JobStatus, { pill: 'wait' | 'done' | 'notyet' | 'open'; word: string }> = {
  open: { pill: 'open', word: 'Waiting to be done' },
  submitted: { pill: 'wait', word: 'Says it is done' },
  approved: { pill: 'done', word: 'Paid' },
  not_yet: { pill: 'notyet', word: 'Not yet' },
  disputed: { pill: 'notyet', word: 'Asked you to look again' },
};

/**
 * The job list, per child.
 *
 * Sorted by what needs the parent first, then by what the child can still do.
 * Paid jobs sink to the bottom: they are a record, not a task. Repeating jobs
 * say which days they come back, because a job list a parent has lost track of
 * is the usual reason these apps get abandoned in week three.
 */
export default function JobsAdmin() {
  const { state, dispatch } = useStore();

  const rank = (j: Job): number =>
    j.status === 'disputed' ? 0 : j.status === 'submitted' ? 1 : j.status === 'open' ? 2 : j.status === 'not_yet' ? 3 : 4;

  return (
    <>
      <TopBar
        title="Jobs"
        right={
          <Link to="/parent/jobs/new" className="grownup">
            <Icon name="plus" style={{ width: '1em', height: '1em' }} />
            New
          </Link>
        }
      />
      <div className="screen">
        {state.family.children.length === 0 ? (
          <NoChildren what="Jobs belong to a child. Add one and four jobs pitched at their age are set up with them, all editable." />
        ) : null}
        {state.family.children.map((c) => {
          const jobs = state.jobs.filter((j) => j.childId === c.id).sort((a, b) => rank(a) - rank(b));
          const open = jobs.filter((j) => j.status === 'open').length;
          const worth = jobs.filter((j) => j.status === 'open').reduce((n, j) => n + j.coins, 0);

          return (
            <div key={c.id}>
              <p className="eyebrow">
                {avatarGlyph(c.avatar)} {c.name} — {plural(open, 'job to do', 'jobs to do')}
                {open > 0 ? `, worth ${worth}` : ''}
              </p>

              {jobs.length === 0 ? (
                <Empty glyph="📋" title={`No jobs for ${c.name} yet`} body="Two or three is plenty to start with." />
              ) : (
                <div className="rows">
                  {jobs.map((j) => (
                    <div key={j.id} className={j.status === 'approved' ? 'row2 soft' : 'row2'}>
                      <span className="art" aria-hidden="true">
                        {j.icon}
                      </span>
                      <span className="mid">
                        <p className="t">{j.title}</p>
                        <p className="s">
                          {STATUS[j.status].word}
                          {j.repeatDays.length > 0
                            ? ` · every ${j.repeatDays.map((d) => weekday(d).slice(0, 3)).join(', ')}`
                            : ' · one-off'}
                          {j.autoApprove ? ' · pays itself' : ''}
                          {j.decidedAt ? ` · ${stamp(j.decidedAt)}` : ''}
                        </p>
                      </span>
                      <span className="end">
                        <Pill kind={STATUS[j.status].pill}>
                          {j.coins}
                          <Icon name="coin" />
                        </Pill>
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Reopening is separate from editing on purpose: "do it again" is
                  a different act from "this was worth the wrong amount", and a
                  child watching over your shoulder can tell which is which. */}
              <div className="btnrow">
                <Link className="btn sm sun auto" to={`/parent/jobs/new?child=${c.id}`}>
                  <Icon name="plus" />
                  Add a job for {c.name}
                </Link>
              </div>

              {jobs.some((j) => j.status === 'approved' || j.status === 'not_yet') ? (
                <details>
                  <summary className="meta" style={{ cursor: 'pointer', padding: '6px 0' }}>
                    Reopen or remove a job
                  </summary>
                  <div className="rows">
                    {jobs
                      .filter((j) => j.status === 'approved' || j.status === 'not_yet')
                      .map((j) => (
                        <div key={j.id} className="row2 soft">
                          <span className="art" aria-hidden="true">
                            {j.icon}
                          </span>
                          <span className="mid">
                            <p className="t">{j.title}</p>
                            <p className="s">
                              {coinWord(j.coins)} · {STATUS[j.status].word}
                            </p>
                          </span>
                          <span className="end">
                            <button
                              className="btn sm ghost auto"
                              onClick={() => dispatch({ t: 'job/reopen', jobId: j.id })}
                            >
                              Reopen
                            </button>
                            <button
                              className="btn sm quiet auto"
                              onClick={() => dispatch({ t: 'job/delete', jobId: j.id })}
                            >
                              Remove
                            </button>
                          </span>
                        </div>
                      ))}
                  </div>
                  <p className="meta">
                    Removing a job does not take back coins already paid for it. Those are theirs, and the story keeps
                    the line.
                  </p>
                </details>
              ) : null}
            </div>
          );
        })}
      </div>
    </>
  );
}
