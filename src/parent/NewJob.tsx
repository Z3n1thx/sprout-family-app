import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../data/store';
import { TopBar, Stepper, SwitchRow } from '../ui/bits';
import NoChildren from './NoChildren';
import { Icon } from '../ui/Icons';
import { avatarGlyph, templatesFor, type JobTemplate } from '../data/catalog';
import { coinWord, weekday } from '../lib/format';

const TIER_WORD: Record<number, string> = {
  1: 'a 4–6 year old',
  2: 'a 7–8 year old',
  3: 'a 9–10 year old',
};

/**
 * Creating a job.
 *
 * The template list is filtered by the child's interface level, and that is the
 * most useful thing on the screen. The commonest failure in chore apps is an
 * adult assigning an adult-shaped task to a five-year-old — "tidy your room" is
 * four jobs and an executive-function problem — and then declining it. So a
 * parent adding a job for a five-year-old is shown jobs a five-year-old can
 * finish alone, and has to go out of their way to invent one that isn't.
 */
export default function NewJob() {
  const [params] = useSearchParams();
  const { state, dispatch } = useStore();
  const nav = useNavigate();

  const [target, setTarget] = useState(params.get('child') ?? '');
  const [picked, setPicked] = useState<JobTemplate | null>(null);
  const [custom, setCustom] = useState(false);
  const [title, setTitle] = useState('');
  const [detail, setDetail] = useState('');
  const [icon, setIcon] = useState('✅');
  const [coins, setCoins] = useState(3);
  const [days, setDays] = useState<number[]>([]);
  const [autoApprove, setAutoApprove] = useState(false);

  /* Fall back to the first child rather than to a blank screen: ?child= may name
     one who has since been removed. */
  const child = state.family.children.find((c) => c.id === target) ?? state.family.children[0];
  if (!child) {
    return (
      <>
        <TopBar title="New job" back="/parent/jobs" backLabel="Jobs" />
        <div className="screen">
          <NoChildren what="A job belongs to somebody. Add a child and four jobs for their age are set up with them, all editable." />
        </div>
      </>
    );
  }

  const templates = templatesFor(child.tier);
  const ready = title.trim().length > 0 && coins >= 1;

  function choose(t: JobTemplate) {
    setPicked(t);
    setCustom(false);
    setTitle(t.title);
    setIcon(t.icon);
    setCoins(t.coins);
    setDetail(t.detail ?? '');
  }

  const create = () => {
    if (!ready) return;
    dispatch({
      t: 'job/create',
      job: {
        childId: child.id,
        title: title.trim(),
        icon,
        coins,
        autoApprove,
        repeatDays: days,
        ...(detail.trim() ? { detail: detail.trim() } : {}),
      },
    });
    nav('/parent/jobs');
  };

  return (
    <>
      <TopBar title="New job" back="/parent/jobs" backLabel="Jobs" />
      <div className="screen">
        {/* --- Who ---------------------------------------------------------- */}
        {state.family.children.length > 1 ? (
          <>
            <p className="eyebrow">Who for</p>
            <div className="seg">
              {state.family.children.map((c) => (
                <button
                  key={c.id}
                  aria-pressed={c.id === child.id}
                  onClick={() => {
                    setTarget(c.id);
                    setPicked(null);
                    setCustom(false);
                    setTitle('');
                  }}
                >
                  {avatarGlyph(c.avatar)} {c.name}
                </button>
              ))}
            </div>
          </>
        ) : null}

        <div className="card soft">
          <p className="meta">
            Showing jobs {TIER_WORD[child.tier]} can finish on their own. {child.name} is {child.age}.
          </p>
        </div>

        {/* --- Which job ---------------------------------------------------- */}
        <p className="eyebrow">Pick a job</p>
        <div className="rows">
          {templates.map((t) => (
            <button
              key={t.title}
              className={picked?.title === t.title ? 'row2 t-sprout' : 'row2'}
              aria-pressed={picked?.title === t.title}
              onClick={() => choose(t)}
            >
              <span className="art" aria-hidden="true">
                {t.icon}
              </span>
              <span className="mid">
                <p className="t">{t.title}</p>
                {t.detail ? <p className="s">{t.detail}</p> : null}
              </span>
              <span className="end">
                <span className="pill count">
                  {t.coins}
                  <Icon name="coin" />
                </span>
              </span>
            </button>
          ))}
        </div>

        <button
          className="btn ghost"
          onClick={() => {
            setCustom(true);
            setPicked(null);
            setTitle('');
            setDetail('');
          }}
          aria-pressed={custom}
        >
          Write my own
        </button>

        {custom || picked ? (
          <>
            <div className="field">
              <label htmlFor="title">What {child.name} will read</label>
              <p className="hint">
                One thing, one verb. If it needs the word “and”, it is two jobs — and two jobs is two chances to
                finish something.
              </p>
              <input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Feed the cat"
              />
            </div>

            <div className="field">
              <label htmlFor="detail">What finished looks like (optional)</label>
              <p className="hint">The sentence that prevents an argument later. “Bowl filled, water topped up.”</p>
              <input
                id="detail"
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                placeholder="Bowl filled, water topped up."
              />
            </div>

            {custom ? (
              <div className="field">
                <label htmlFor="icon">Picture</label>
                <p className="hint">A child at this level finds the job by its picture before they read the words.</p>
                <div className="chips">
                  {['✅', '🧺', '🍽️', '🪥', '🛏️', '🌱', '🐟', '📚', '🧹', '🗑️', '👟', '🎒'].map((g) => (
                    <button key={g} className="chip" aria-pressed={icon === g} onClick={() => setIcon(g)}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {/* --- Worth ---------------------------------------------------- */}
            <p className="eyebrow">Worth</p>
            <Stepper value={coins} onChange={setCoins} min={1} max={30} label="coins" showCoins />
            <p className="hint">
              Keep the same job at the same price each week. A price that moves teaches that effort is negotiable, which
              is the opposite of the lesson.
            </p>

            {/* --- When ----------------------------------------------------- */}
            <p className="eyebrow">Comes back on</p>
            <div className="chips">
              {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                <button
                  key={d}
                  className="chip"
                  aria-pressed={days.includes(d)}
                  onClick={() => setDays((ds) => (ds.includes(d) ? ds.filter((x) => x !== d) : [...ds, d]))}
                >
                  {weekday(d).slice(0, 3)}
                </button>
              ))}
            </div>
            <p className="hint">
              {days.length === 0
                ? 'No days picked — a one-off job that disappears once it is paid.'
                : `Reappears every ${days.map((d) => weekday(d)).join(', ')}.`}
            </p>

            <SwitchRow
              on={autoApprove}
              onToggle={() => setAutoApprove(!autoApprove)}
              title="Pays itself"
              hint="No check from you — the coins land the moment they tap done. Good for reading; less good for anything you would want to look at."
            />

            <div className="spacer" />

            <button className="btn green" disabled={!ready} onClick={create}>
              <Icon name="check" />
              Add {title.trim() || 'the job'} for {coinWord(coins)}
            </button>
            <p className="meta">
              {child.name} sees it next time they open Sprout. Nothing buzzes, and there is no deadline on it.
            </p>
          </>
        ) : null}
      </div>
    </>
  );
}
