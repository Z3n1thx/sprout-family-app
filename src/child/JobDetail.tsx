import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useChildCtx } from './ChildFrame';
import { useStore } from '../data/store';
import { CoinRow, Pill, TopBar, useAutoRead } from '../ui/bits';
import { Icon } from '../ui/Icons';
import { Sprig } from '../ui/Sprig';
import { DISPUTE_PHRASES, JOB_REASONS, reasonText } from '../data/catalog';
import { coinWord, nowIso, plural } from '../lib/format';
import { chime } from '../lib/sound';

/**
 * One job, in whichever of its five states it is in.
 *
 * The state a child is in decides what the screen is *for*, so each branch has
 * exactly one primary action. The important one is "not yet": it names the
 * reason in the parent's own words, says the coins are still waiting, and offers
 * fixing it first and arguing second. A child who has just been told no is not
 * in a position to read a list of options.
 */
export default function JobDetail() {
  const { jobId } = useParams();
  const { child } = useChildCtx();
  const { state, dispatch } = useStore();
  const nav = useNavigate();
  const job = state.jobs.find((j) => j.id === jobId);

  const [composing, setComposing] = useState(false);

  useEffect(() => {
    if (job && !job.seenByChild) dispatch({ t: 'job/seen', jobId: job.id });
  }, [job, dispatch]);

  useEffect(() => {
    if (job?.status === 'approved') chime('earn', child.prefs.sound);
  }, [job?.status, child.prefs.sound]);

  if (!job) {
    return (
      <>
        <TopBar title="Job" back={`/child/${child.id}/jobs`} />
        <div className="screen center">
          <p className="body">That job has gone.</p>
        </div>
      </>
    );
  }

  const parent = state.family.parents.find((p) => p.id === job.decidedBy);
  const whoLabel = parent?.label ?? 'A grown-up';
  const reason = reasonText(JOB_REASONS, job.reasonId);

  /* --- Approved ---------------------------------------------------------- */
  if (job.status === 'approved') {
    const readText = `Yes! ${whoLabel} said your ${job.title.toLowerCase()} is done. You got ${coinWord(job.coins)}.`;
    return (
      <Approved
        job={job}
        whoLabel={whoLabel}
        readText={readText}
        readAloud={child.prefs.readAloud}
        onDone={() => nav(`/child/${child.id}`)}
        backTo={`/child/${child.id}/jobs`}
      />
    );
  }

  /* --- Waiting ----------------------------------------------------------- */
  if (job.status === 'submitted' || job.status === 'disputed') {
    const readText =
      job.status === 'disputed'
        ? `You asked a grown-up to look at your ${job.title.toLowerCase()} again.`
        : `A grown-up will check your ${job.title.toLowerCase()}. ${coinWord(job.coins)} are on the way.`;
    return (
      <Waiting
        title={job.title}
        icon={job.icon}
        coins={job.coins}
        disputed={job.status === 'disputed'}
        readText={readText}
        readAloud={child.prefs.readAloud}
        backTo={`/child/${child.id}/jobs`}
      />
    );
  }

  /* --- Not yet ----------------------------------------------------------- */
  if (job.status === 'not_yet') {
    if (composing) {
      return (
        <DisputeComposer
          title={job.title}
          whoLabel={whoLabel}
          onCancel={() => setComposing(false)}
          onSend={(phrases, seconds, photo) => {
            dispatch({
              t: 'job/dispute',
              jobId: job.id,
              dispute: {
                createdAt: nowIso(),
                phrases,
                ...(seconds ? { voiceNoteSeconds: seconds } : {}),
                ...(photo ? { photo: 'attached' } : {}),
              },
            });
            setComposing(false);
          }}
        />
      );
    }
    return (
      <NotYet
        job={job}
        whoLabel={whoLabel}
        reason={reason}
        readAloud={child.prefs.readAloud}
        backTo={`/child/${child.id}/jobs`}
        onFix={() => dispatch({ t: 'job/submit', jobId: job.id })}
        onArgue={() => setComposing(true)}
      />
    );
  }

  /* --- Open -------------------------------------------------------------- */
  const readText = `${job.title}. ${job.detail ?? ''} You will get ${coinWord(job.coins)}.`;
  return (
    <Open
      job={job}
      readText={readText}
      readAloud={child.prefs.readAloud}
      backTo={`/child/${child.id}/jobs`}
      onDid={(photo) => dispatch({ t: 'job/submit', jobId: job.id, ...(photo ? { photo: 'attached' } : {}) })}
    />
  );
}

/* ========================================================================== */

function Open({
  job,
  readText,
  readAloud,
  backTo,
  onDid,
}: {
  job: { title: string; icon: string; coins: number; detail?: string; autoApprove: boolean };
  readText: string;
  readAloud: boolean;
  backTo: string;
  onDid: (photo: boolean) => void;
}) {
  const [photo, setPhoto] = useState(false);
  useAutoRead(readAloud, readText);
  return (
    <>
      <TopBar title="A job" back={backTo} readText={readText} />
      <div className="screen center">
        <span style={{ fontSize: 72 }} aria-hidden="true">
          {job.icon}
        </span>
        <h2 className="h1">{job.title}</h2>
        {job.detail ? <p className="body">{job.detail}</p> : null}

        <div className="jar" style={{ width: '100%' }}>
          <p className="jarlabel">You will get</p>
          <p className="bal">
            <Icon name="coin" />
            {job.coins}
          </p>
          <CoinRow n={job.coins} />
        </div>

        {job.autoApprove ? (
          <p className="meta">This one pays as soon as you say you have done it.</p>
        ) : (
          <p className="meta">A grown-up checks this one first.</p>
        )}

        <div className="spacer" />

        {photo ? (
          <p className="meta">
            <Icon name="camera" style={{ width: 16, height: 16 }} /> Photo added
          </p>
        ) : (
          <button className="btn ghost" onClick={() => setPhoto(true)}>
            <Icon name="camera" />
            Add a photo
          </button>
        )}

        <button className="btn green huge" onClick={() => onDid(photo)}>
          <Icon name="check" />
          I did it!
        </button>
      </div>
    </>
  );
}

/* ========================================================================== */

function Waiting({
  title,
  icon,
  coins,
  disputed,
  readText,
  readAloud,
  backTo,
}: {
  title: string;
  icon: string;
  coins: number;
  disputed: boolean;
  readText: string;
  readAloud: boolean;
  backTo: string;
}) {
  useAutoRead(readAloud, readText);
  return (
    <>
      <TopBar title="Waiting" back={backTo} readText={readText} />
      <div className="screen center">
        <Sprig mood="wait" className="sprig lg" />
        <h2 className="h1">{disputed ? 'Asked for another look' : 'Nice work!'}</h2>
        <p className="body">
          {disputed ? 'A grown-up will look at' : 'A grown-up will check'} your{' '}
          <b>{title.toLowerCase()}</b>.
        </p>

        <div className="card t-sun" style={{ width: '100%', alignItems: 'center' }}>
          <span style={{ fontSize: 34 }} aria-hidden="true">
            {icon}
          </span>
          <Pill kind="wait">
            <Icon name="hourglass" />
            Waiting to be checked
          </Pill>
          <p className="body" style={{ textAlign: 'center' }}>
            {coinWord(coins)} are on the way.
          </p>
        </div>

        {/* True as written: nothing has moved yet, and the ledger has no entry
            for this job until a grown-up approves it. */}
        <p className="meta">Your coins arrive when a grown-up says yes.</p>
      </div>
    </>
  );
}

/* ========================================================================== */

function Approved({
  job,
  whoLabel,
  readText,
  readAloud,
  onDone,
  backTo,
}: {
  job: { title: string; icon: string; coins: number; parentNote?: string };
  whoLabel: string;
  readText: string;
  readAloud: boolean;
  onDone: () => void;
  backTo: string;
}) {
  useAutoRead(readAloud, readText);
  return (
    <>
      <TopBar title="Done!" back={backTo} readText={readText} />
      <div className="screen center">
        <p className="confetti" aria-hidden="true">
          ✨🎉✨
        </p>
        <Sprig mood="cheer" className="sprig lg grow-in" />
        <h2 className="h1">Yes! You did it.</h2>
        <p className="body">
          {whoLabel} says your <b>{job.title.toLowerCase()}</b> is done.
        </p>

        <div className="jar" style={{ width: '100%' }}>
          <p className="jarlabel">You earned</p>
          <p className="bal">
            <Icon name="coin" />+{job.coins}
          </p>
          <CoinRow n={job.coins} fresh={job.coins} />
        </div>

        {job.parentNote ? (
          <div className="bubble" style={{ textAlign: 'left', width: '100%' }}>
            <span className="who">{whoLabel} said</span>
            {job.parentNote}
          </div>
        ) : null}

        <div className="spacer" />
        <button className="btn green huge" onClick={onDone}>
          Back to my coins
        </button>
      </div>
    </>
  );
}

/* ========================================================================== */

/**
 * "Not yet" — never "rejected", and never red. Slate is used here precisely
 * because it is not the colour of error: the work is unfinished, not wrong.
 */
function NotYet({
  job,
  whoLabel,
  reason,
  readAloud,
  backTo,
  onFix,
  onArgue,
}: {
  job: { title: string; icon: string; coins: number; parentNote?: string; declineCount: number };
  whoLabel: string;
  reason: string;
  readAloud: boolean;
  backTo: string;
  onFix: () => void;
  onArgue: () => void;
}) {
  const readText = `${whoLabel} said not yet about your ${job.title.toLowerCase()}. ${reason} ${job.parentNote ?? ''} Your ${coinWord(job.coins)} are still waiting for you.`;
  useAutoRead(readAloud, readText);
  return (
    <>
      <TopBar title="Not yet" back={backTo} readText={readText} />
      <div className="screen center">
        <Sprig mood="fix" className="sprig lg" />
        <h2 className="h1">Not yet</h2>
        <p className="body">
          {whoLabel} had a look at your <b>{job.title.toLowerCase()}</b>.
        </p>

        <div className="bubble" style={{ textAlign: 'left', width: '100%' }}>
          <span className="who">{whoLabel} said</span>
          {reason}
          {job.parentNote ? <> {job.parentNote}</> : null}
        </div>

        {/* Gain framing. The coins were never taken away, because they were
            never handed over — and saying so is the difference between a setback
            and a punishment. */}
        <div className="card t-sun" style={{ width: '100%', alignItems: 'center' }}>
          <p className="body" style={{ textAlign: 'center' }}>
            Your <b>{coinWord(job.coins)}</b> are still waiting for you.
          </p>
          <CoinRow n={job.coins} />
        </div>

        <div className="spacer" />

        <button className="btn green huge" onClick={onFix}>
          <Icon name="check" />
          I&apos;ll fix it
        </button>
        <button className="btn quiet" onClick={onArgue}>
          <Icon name="talk" style={{ width: 16, height: 16 }} />
          That&apos;s not right — ask again
        </button>
        {job.declineCount > 1 ? (
          <p className="meta">You have asked about this {plural(job.declineCount, 'time', 'times')}.</p>
        ) : null}
      </div>
    </>
  );
}

/* ========================================================================== */

/**
 * The dispute composer.
 *
 * Chips first, then a mic, then a camera. Typing is last on purpose: at seven it
 * is the slowest of the four, and a child who cannot spell "because" still
 * deserves to be able to make a case.
 */
function DisputeComposer({
  title,
  whoLabel,
  onCancel,
  onSend,
}: {
  title: string;
  whoLabel: string;
  onCancel: () => void;
  onSend: (phrases: string[], seconds: number, photo: boolean) => void;
}) {
  const [picked, setPicked] = useState<string[]>([]);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [photo, setPhoto] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!recording) return;
    timer.current = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(timer.current);
  }, [recording]);

  const something = picked.length > 0 || seconds > 0 || photo;

  return (
    <>
      <TopBar title="Ask again" />
      <div className="screen">
        <p className="body">
          Tell {whoLabel} about your <b>{title.toLowerCase()}</b>. Pick what happened.
        </p>

        <div className="chips">
          {DISPUTE_PHRASES.map((p) => {
            const on = picked.includes(p);
            return (
              <button
                key={p}
                className="chip"
                aria-pressed={on}
                onClick={() => setPicked(on ? picked.filter((x) => x !== p) : [...picked, p])}
              >
                {on ? <Icon name="check" style={{ width: 15, height: 15 }} /> : null}
                {p}
              </button>
            );
          })}
        </div>

        <div className="btnrow">
          <button
            className={recording ? 'btn berry' : 'btn ghost'}
            onClick={() => setRecording((r) => !r)}
            aria-pressed={recording}
          >
            <Icon name="mic" />
            {recording ? `Stop (${seconds}s)` : seconds > 0 ? `${seconds}s note` : 'Say it'}
          </button>
          <button className={photo ? 'btn sky' : 'btn ghost'} onClick={() => setPhoto((p) => !p)} aria-pressed={photo}>
            <Icon name="camera" />
            {photo ? 'Photo added' : 'Show it'}
          </button>
        </div>

        <div className="spacer" />

        <button
          className="btn green huge"
          disabled={!something}
          onClick={() => {
            setRecording(false);
            onSend(picked, seconds, photo);
          }}
        >
          Send to {whoLabel}
        </button>
        <button className="btn quiet" onClick={onCancel}>
          Never mind
        </button>
        <p className="meta">
          {whoLabel} decides in the end — but they will see exactly what you said.
        </p>
      </div>
    </>
  );
}
