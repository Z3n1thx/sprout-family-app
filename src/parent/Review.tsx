import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../data/store';
import { useParent } from './ParentFrame';
import { TopBar, Pill } from '../ui/bits';
import { Icon } from '../ui/Icons';
import {
  JOB_REASONS,
  SPEND_REASONS,
  avatarGlyph,
  categoryOf,
  reasonText,
  shelfLabel,
  type Reason,
} from '../data/catalog';
import { foldBalances, spentThisWeek } from '../lib/ledger';
import { coinWord, plural, stamp } from '../lib/format';
import type { Child, Job } from '../data/types';

/**
 * One decision, one screen.
 *
 * Two rules shape it. A decline always carries a reason, because the child is
 * shown that reason in the parent's own words — so the screen previews exactly
 * what they will read before it is sent. And the primary action is always the
 * generous one, because a parent tapping through four approvals at bedtime
 * should not have "no" under their thumb.
 */
export default function Review() {
  const { kind, itemId } = useParams();
  const { state, dispatch } = useStore();
  const parent = useParent();
  const nav = useNavigate();

  const [reasonId, setReasonId] = useState('');
  const [note, setNote] = useState('');
  const [nextStep, setNextStep] = useState('');
  const [declining, setDeclining] = useState(false);

  const back = () => nav('/parent');

  const job = kind === 'job' || kind === 'dispute' ? state.jobs.find((j) => j.id === itemId) : undefined;
  const req = kind === 'spend' ? state.spendRequests.find((s) => s.id === itemId) : undefined;
  const red = kind === 'reward' ? state.redemptions.find((r) => r.id === itemId) : undefined;

  const childId = job?.childId ?? req?.childId ?? red?.childId;
  const child = state.family.children.find((c) => c.id === childId);

  if (!child || (!job && !req && !red)) {
    return (
      <>
        <TopBar title="Already handled" back="/parent" />
        <div className="screen center">
          <p className="body">Someone dealt with this one already.</p>
          <button className="btn ghost" onClick={back}>
            Back to the family
          </button>
        </div>
      </>
    );
  }

  const reasons: Reason[] = job ? JOB_REASONS : SPEND_REASONS;
  const preview = reasonText(reasons, reasonId);

  /* --- What is being decided --------------------------------------------- */

  let title = '';
  let coins = 0;
  let icon = '🎁';
  let lines: { k: string; v: string }[] = [];
  let said: string | undefined;

  if (job) {
    title = job.title;
    coins = job.coins;
    icon = job.icon;
    lines = [
      { k: 'Said done', v: job.submittedAt ? stamp(job.submittedAt) : '—' },
      ...(job.detail ? [{ k: 'What it means', v: job.detail }] : []),
      ...(job.photo ? [{ k: 'Photo', v: 'Added by ' + child.name }] : []),
      ...(job.declineCount > 0
        ? [{ k: 'Sent back before', v: plural(job.declineCount, 'time', 'times') }]
        : []),
    ];
  } else if (req) {
    const cat = categoryOf(req.category);
    const b = foldBalances(state.entries, child.id);
    const spent = spentThisWeek(state.entries, child.id);
    title = `${coinWord(req.coins)} for ${cat.label.toLowerCase()}`;
    coins = req.coins;
    icon = cat.emoji;
    said = req.said;
    lines = [
      { k: 'Asked', v: stamp(req.createdAt) },
      { k: 'Has now', v: `${b.available} available (${b.spend} spend, ${b.save} save, ${b.share} share)` },
      { k: 'After this', v: `${b.available - req.coins} left` },
      { k: 'Spent this week', v: `${spent} of ${child.limits.weekly} allowed` },
      { k: 'Per-ask limit', v: coinWord(child.limits.perRequest) },
    ];
  } else if (red) {
    const reward = state.rewards.find((r) => r.id === red.rewardId);
    const b = foldBalances(state.entries, child.id);
    title = reward?.name ?? 'A reward';
    coins = red.coins;
    icon = reward?.emoji ?? '🎁';
    lines = [
      { k: 'Asked', v: stamp(red.createdAt) },
      { k: 'Shelf', v: reward ? shelfLabel(reward.shelf) : '—' },
      ...(reward?.realWorldHint ? [{ k: 'Your note', v: reward.realWorldHint }] : []),
      { k: 'Has now', v: `${b.available} available` },
      { k: 'After this', v: `${b.available - red.coins} left` },
    ];
  }

  /* --- Decisions ---------------------------------------------------------- */

  function approve() {
    if (job) dispatch({ t: 'job/approve', jobId: job.id, by: parent.id, ...(note.trim() ? { note: note.trim() } : {}) });
    else if (req)
      dispatch({
        t: 'spend/decide',
        id: req.id,
        by: parent.id,
        approve: true,
        ...(note.trim() ? { note: note.trim() } : {}),
        ...(nextStep.trim() ? { nextStep: nextStep.trim() } : {}),
      });
    else if (red)
      dispatch({
        t: 'reward/decide',
        id: red.id,
        by: parent.id,
        approve: true,
        ...(note.trim() ? { note: note.trim() } : {}),
      });
    back();
  }

  function decline() {
    if (!reasonId) return;
    if (job) dispatch({ t: 'job/decline', jobId: job.id, by: parent.id, reasonId, ...(note.trim() ? { note: note.trim() } : {}) });
    else if (req)
      dispatch({
        t: 'spend/decide',
        id: req.id,
        by: parent.id,
        approve: false,
        reasonId,
        ...(note.trim() ? { note: note.trim() } : {}),
        ...(nextStep.trim() ? { nextStep: nextStep.trim() } : {}),
      });
    else if (red)
      dispatch({
        t: 'reward/decide',
        id: red.id,
        by: parent.id,
        approve: false,
        reasonId,
        ...(note.trim() ? { note: note.trim() } : {}),
      });
    back();
  }

  const approveWord = job ? 'Approve and pay the coins' : red ? 'Grant it' : 'Yes, they can spend it';

  return (
    <>
      <TopBar title={kind === 'dispute' ? 'Another look' : 'Review'} back="/parent" backLabel="Family" />
      <div className="screen">
        <div className="row2 t-sun">
          <span className="art" aria-hidden="true">
            {icon}
          </span>
          <span className="mid">
            <p className="t">{title}</p>
            <p className="s">
              {avatarGlyph(child.avatar)} {child.name}, {child.age}
            </p>
          </span>
          <span className="end">
            <Pill kind="wait">
              {coins}
              <Icon name="coin" />
            </Pill>
          </span>
        </div>

        {said?.trim() ? (
          <div className="card t-sky">
            <p className="eyebrow">{child.name} said</p>
            <p className="body">“{said.trim()}”</p>
          </div>
        ) : null}

        {/* --- The dispute ------------------------------------------------- */}
        {kind === 'dispute' && job?.dispute ? <DisputeCard child={child} job={job} /> : null}

        <table className="tbl">
          <tbody>
            {lines.map((l) => (
              <tr key={l.k}>
                <th scope="row">{l.k}</th>
                <td>{l.v}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* A job that keeps coming back is usually the wrong job, not a child
            who keeps failing. Said once, quietly, and only when it is true. */}
        {job && job.declineCount >= 2 ? (
          <div className="card t-slate">
            <p className="body">
              This one has gone back {plural(job.declineCount, 'time', 'times')}. It may be worth changing the job or
              what it is worth, rather than the answer.
            </p>
          </div>
        ) : null}

        {/* --- History ----------------------------------------------------- */}
        {job && job.history.length > 0 ? (
          <>
            <p className="eyebrow">What happened</p>
            <table className="tbl">
              <tbody>
                {job.history.map((h, i) => (
                  <tr key={i}>
                    <th scope="row">{stamp(h.at)}</th>
                    <td>{h.what}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : null}

        {/* --- Optional words --------------------------------------------- */}
        <div className="field">
          <label htmlFor="note">Add a note {declining ? '' : '(optional)'}</label>
          <p className="hint">{child.name} reads this exactly as you type it.</p>
          <textarea
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={job ? 'The floor was clear — thank you.' : 'We can get it on Saturday.'}
          />
        </div>

        {req ? (
          <div className="field">
            <label htmlFor="next">Then what happens? (optional)</label>
            <p className="hint">Answers the question a child asks next. “I&apos;ll order it tonight.”</p>
            <input
              id="next"
              value={nextStep}
              onChange={(e) => setNextStep(e.target.value)}
              placeholder="I'll get it with you on Saturday."
            />
          </div>
        ) : null}

        <div className="spacer" />

        {/* --- The decision ------------------------------------------------ */}
        {!declining ? (
          <>
            <button className="btn green" onClick={approve}>
              <Icon name="check" />
              {approveWord}
            </button>
            <button className="btn ghost" onClick={() => setDeclining(true)}>
              Not yet — say why
            </button>
          </>
        ) : (
          <>
            <p className="eyebrow">Pick a reason — {child.name} will see it</p>
            <div className="chips">
              {reasons.map((r) => (
                <button
                  key={r.id}
                  className="chip"
                  aria-pressed={reasonId === r.id}
                  onClick={() => setReasonId(r.id)}
                >
                  {r.label}
                </button>
              ))}
            </div>

            {/* The whole argument for making a reason mandatory, made visible:
                the parent sees the child's screen before they send it. */}
            {preview ? (
              <div className="card t-slate">
                <p className="eyebrow">{child.name} will read</p>
                <p className="body">
                  {preview}
                  {note.trim() ? ` ${note.trim()}` : ''}
                </p>
                <p className="meta">
                  Their {coinWord(coins)} {job ? 'stay waiting on the job' : 'stay in their jar'}. Nothing is taken
                  away.
                </p>
              </div>
            ) : null}

            <button className="btn slate" disabled={!reasonId} onClick={decline}>
              Send “not yet”
            </button>
            <button
              className="btn quiet"
              onClick={() => {
                setDeclining(false);
                setReasonId('');
              }}
            >
              Back to the decision
            </button>
          </>
        )}
      </div>
    </>
  );
}

/* ========================================================================== */

/**
 * The child's appeal, shown in full. A dispute that a parent can dismiss
 * without reading is not a right of appeal; a dispute that overrides them is
 * not parental authority. So: everything the child said, plainly, and the
 * decision still theirs.
 */
function DisputeCard({ child, job }: { child: Child; job: Job }) {
  const d = job.dispute;
  if (!d) return null;
  return (
    <div className="card t-berry">
      <p className="eyebrow">{child.name} asked you to look again</p>
      {d.phrases.map((p) => (
        <p key={p} className="body">
          “{p}”
        </p>
      ))}
      {d.typed?.trim() ? <p className="body">“{d.typed.trim()}”</p> : null}
      {d.voiceNoteSeconds ? (
        <p className="meta" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon name="mic" style={{ width: '1.1em', height: '1.1em' }} />
          Voice note, {d.voiceNoteSeconds} seconds — on this device only
        </p>
      ) : null}
      <p className="meta">Sent {stamp(d.createdAt)}. You decide either way; they just get to be heard first.</p>
    </div>
  );
}
