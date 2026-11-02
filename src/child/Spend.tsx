import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChildCtx } from './ChildFrame';
import { useStore } from '../data/store';
import { CoinRow, Pill, Stepper, TopBar, useAutoRead } from '../ui/bits';
import { Icon } from '../ui/Icons';
import { Sprig } from '../ui/Sprig';
import { SPEND_CATEGORIES, SPEND_REASONS, reasonText } from '../data/catalog';
import type { SpendCategoryId } from '../data/types';
import { coinWord, plural } from '../lib/format';
import { spentThisWeek } from '../lib/ledger';

type Step = 'amount' | 'what' | 'check' | 'pause' | 'sent';

/**
 * Asking to spend.
 *
 * Four screens, and the third one is the point. "Before you ask" is the only
 * place in the app that shows a child what a purchase costs them in the terms
 * they actually care about — coins left, and how much further their goal moves
 * away. Keeping the coins is offered as an equal choice, and it pays a badge
 * rather than coins, so restraint never becomes another way to shop.
 */
export default function Spend() {
  const { child, balances, goal } = useChildCtx();
  const { state, dispatch } = useStore();
  const nav = useNavigate();

  const [step, setStep] = useState<Step>('amount');
  const [coins, setCoins] = useState(1);
  const [what, setWhat] = useState<SpendCategoryId | null>(null);
  const [said, setSaid] = useState('');
  const [count, setCount] = useState(5);

  const pending = state.spendRequests.find((s) => s.childId === child.id && s.status === 'pending');
  const decided = state.spendRequests.find((s) => s.childId === child.id && !s.seenByChild && s.status !== 'pending');

  const spent = spentThisWeek(state.entries, child.id);
  const weeklyLeft = Math.max(0, child.limits.weekly - spent);
  const cap = Math.max(0, Math.min(child.limits.perRequest, balances.available, weeklyLeft));

  const categories = SPEND_CATEGORIES.filter((c) => child.limits.categories.includes(c.id));
  const escrow = goal ? (balances.goals[goal.id] ?? 0) : 0;

  /* Countdown for the wait-and-count step. */
  useEffect(() => {
    if (step !== 'pause') return;
    if (count <= 0) return;
    const t = window.setTimeout(() => setCount((c) => c - 1), 1000);
    return () => window.clearTimeout(t);
  }, [step, count]);

  /* --- A decision the child has not seen yet ----------------------------- */
  if (decided) {
    const cat = SPEND_CATEGORIES.find((c) => c.id === decided.category);
    const parent = state.family.parents.find((p) => p.id === decided.decidedBy);
    const who = parent?.label ?? 'A grown-up';
    const yes = decided.status === 'approved';
    const readText = yes
      ? `${who} said yes. You spent ${coinWord(decided.coins)}.`
      : `${who} said not this time. ${reasonText(SPEND_REASONS, decided.reasonId)} You still have your ${coinWord(decided.coins)}.`;
    return (
      <Result
        yes={yes}
        who={who}
        coins={decided.coins}
        emoji={cat?.emoji ?? '🎁'}
        said={decided.said}
        reason={reasonText(SPEND_REASONS, decided.reasonId)}
        note={decided.parentNote}
        nextStep={decided.nextStep}
        left={balances.available}
        tier={child.tier}
        readText={readText}
        readAloud={child.prefs.readAloud}
        onDone={() => {
          dispatch({ t: 'spend/seen', id: decided.id });
          nav(`/child/${child.id}`);
        }}
      />
    );
  }

  /* --- Already waiting --------------------------------------------------- */
  if (pending || step === 'sent') {
    const req = pending;
    const readText = `You asked for ${coinWord(req?.coins ?? coins)}. A grown-up will answer.`;
    return (
      <Sent
        coins={req?.coins ?? coins}
        left={balances.available}
        readText={readText}
        readAloud={child.prefs.readAloud}
        onCancel={req ? () => dispatch({ t: 'spend/withdraw', id: req.id }) : undefined}
        onHome={() => nav(`/child/${child.id}`)}
      />
    );
  }

  /* --- Nothing to spend -------------------------------------------------- */
  if (cap < 1) {
    const why =
      balances.available < 1
        ? 'Your jar is empty just now. Finish a job and it will fill up again.'
        : weeklyLeft < 1
          ? 'That is all the coins for this week. You can ask again in a few days.'
          : `A grown-up set ${coinWord(child.limits.perRequest)} as the most you can ask for at once.`;
    return (
      <>
        <TopBar title="Ask to spend" back={`/child/${child.id}`} readText={why} />
        <div className="screen center">
          <Sprig mood="wait" className="sprig lg" />
          <p className="h2">Not right now</p>
          <p className="body">{why}</p>
          <div className="spacer" />
          <button className="btn sun huge" onClick={() => nav(`/child/${child.id}/jobs`)}>
            <Icon name="jobs" />
            Find a job to do
          </button>
        </div>
      </>
    );
  }

  /* --- 1. How many coins ------------------------------------------------- */
  if (step === 'amount') {
    const readText = `How many coins? You have ${coinWord(balances.available)}.`;
    return (
      <StepFrame title="Ask to spend" back={`/child/${child.id}`} readText={readText} readAloud={child.prefs.readAloud}>
        <p className="h1">How many coins?</p>
        <div className="jar" style={{ width: '100%' }}>
          <p className="jarlabel">You have</p>
          <p className="bal" style={{ fontSize: 'var(--fs-h)' }}>
            <Icon name="coin" />
            {balances.available}
          </p>
        </div>
        {/* Counting, not typing. A keypad asks a child to compose a quantity out
            of digits; a stepper asks them to count, which is the skill actually
            under construction at this age. */}
        <Stepper value={Math.min(coins, cap)} onChange={setCoins} min={1} max={cap} showCoins />
        {cap < child.limits.perRequest && cap < balances.available ? (
          <p className="meta">You can ask for up to {coinWord(cap)} right now.</p>
        ) : null}
        <div className="spacer" />
        <button className="btn green huge" onClick={() => setStep('what')}>
          Next
          <Icon name="arrowr" />
        </button>
      </StepFrame>
    );
  }

  /* --- 2. What for ------------------------------------------------------- */
  if (step === 'what') {
    const readText = 'What is it for? Pick a picture.';
    return (
      <StepFrame title="What for?" back={true} readText={readText} readAloud={child.prefs.readAloud}>
        <p className="h1">What is it for?</p>
        <div className="grid2">
          {categories.map((c) => (
            <button
              key={c.id}
              className={what === c.id ? 'tile ready' : 'tile'}
              aria-pressed={what === c.id}
              onClick={() => setWhat(c.id)}
            >
              <span className="art" style={{ background: c.tint }} aria-hidden="true">
                {c.emoji}
              </span>
              <p className="name">{c.label}</p>
            </button>
          ))}
        </div>

        {/* Optional words. A reason is required; typing one is not. */}
        {what && child.tier >= 2 ? (
          <div className="field">
            <label htmlFor="said">Want to say what it is?</label>
            <input
              id="said"
              value={said}
              onChange={(e) => setSaid(e.target.value)}
              placeholder="The second book in the series"
            />
          </div>
        ) : null}

        <div className="spacer" />
        <button className="btn green huge" disabled={!what} onClick={() => setStep('check')}>
          Next
          <Icon name="arrowr" />
        </button>
      </StepFrame>
    );
  }

  /* --- 3. Before you ask ------------------------------------------------- */
  if (step === 'check') {
    const cat = categories.find((c) => c.id === what);
    const after = balances.available - coins;
    const readText = `Before you ask. You have ${coinWord(balances.available)}. If you spend ${coinWord(coins)} you will have ${coinWord(after)}.`;
    const big = child.limits.pauseBigAsks && coins > child.limits.perRequest / 2;
    return (
      <StepFrame title="Before you ask" back={true} readText={readText} readAloud={child.prefs.readAloud}>
        <p className="h1">Before you ask</p>

        <div className="split">
          <div>
            <span className="k">Now</span>
            <span className="v">{balances.available}</span>
          </div>
          <div className="b-spend">
            <span className="k">After</span>
            <span className="v">{after}</span>
          </div>
        </div>

        {child.tier === 1 ? (
          <div className="card soft">
            <p className="meta">You have</p>
            <CoinRow n={balances.available} />
            <p className="meta">You would have</p>
            <CoinRow n={after} />
          </div>
        ) : (
          <p className="sum" style={{ fontSize: 'var(--fs-body)' }}>
            {balances.available} − {coins} = {after}
          </p>
        )}

        <div className="card t-berry">
          <p className="body">
            {coinWord(coins)} for {cat?.label.toLowerCase() ?? 'something'}
            {said.trim() ? ` — ${said.trim()}` : ''}.
          </p>
        </div>

        {/* The other thing those coins were for. Not a guilt trip — the number
            is just true, and a nine-year-old can weigh it. */}
        {goal && child.tier >= 2 ? (
          <div className="card t-sky">
            <p className="body">
              Your <b>{goal.name.toLowerCase()}</b> still needs{' '}
              {plural(Math.max(0, goal.target - escrow), 'coin', 'coins')}.
            </p>
          </div>
        ) : null}

        <div className="spacer" />

        <button
          className="btn green huge"
          onClick={() => {
            if (big) {
              setCount(5);
              setStep('pause');
              return;
            }
            send();
          }}
        >
          <Icon name="talk" />
          Ask a grown-up
        </button>
        <button
          className="btn ghost"
          onClick={() => {
            dispatch({ t: 'coins/kept', childId: child.id, coins });
            nav(`/child/${child.id}`);
          }}
        >
          <Icon name="seed" />
          Keep my coins
        </button>
      </StepFrame>
    );
  }

  /* --- 3b. The pause ----------------------------------------------------- */
  const readTextPause = 'Have a think. Count to five with Sprig.';
  return (
    <StepFrame title="Have a think" back={true} readText={readTextPause} readAloud={child.prefs.readAloud}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--gap)' }}>
        <Sprig mood="wait" className="sprig lg" />
        <p className="h1">Have a think</p>
        <p className="body" style={{ textAlign: 'center' }}>
          This is a big ask. Count to five, then decide.
        </p>
        <p className="bal">{count}</p>
      </div>
      <div className="spacer" />
      <button className="btn green huge" disabled={count > 0} onClick={send}>
        <Icon name="talk" />
        {count > 0 ? `Wait ${count}` : 'Yes, ask a grown-up'}
      </button>
      <button
        className="btn ghost"
        onClick={() => {
          dispatch({ t: 'coins/kept', childId: child.id, coins });
          nav(`/child/${child.id}`);
        }}
      >
        <Icon name="seed" />
        I&apos;ll keep my coins
      </button>
    </StepFrame>
  );

  function send() {
    if (!what) return;
    dispatch({
      t: 'spend/request',
      childId: child.id,
      coins,
      category: what,
      ...(said.trim() ? { said: said.trim() } : {}),
    });
    setStep('sent');
  }
}

/* ========================================================================== */

function StepFrame({
  title,
  back,
  readText,
  readAloud,
  children,
}: {
  title: string;
  back: string | true;
  readText: string;
  readAloud: boolean;
  children: React.ReactNode;
}) {
  useAutoRead(readAloud, readText);
  return (
    <>
      <TopBar title={title} back={back} readText={readText} />
      <div className="screen">{children}</div>
    </>
  );
}

function Sent({
  coins,
  left,
  readText,
  readAloud,
  onCancel,
  onHome,
}: {
  coins: number;
  left: number;
  readText: string;
  readAloud: boolean;
  onCancel?: () => void;
  onHome: () => void;
}) {
  useAutoRead(readAloud, readText);
  return (
    <>
      <TopBar title="Asked" readText={readText} />
      <div className="screen center">
        <Sprig mood="wait" className="sprig lg" />
        <h2 className="h1">Asked!</h2>
        <p className="body">
          A grown-up will have a look at your <b>{coinWord(coins)}</b>.
        </p>
        <Pill kind="wait">
          <Icon name="hourglass" />
          Waiting for an answer
        </Pill>
        {/* Still true: nothing has left the jar. */}
        <div className="card soft" style={{ width: '100%', alignItems: 'center' }}>
          <p className="body">
            You still have all <b>{left}</b> of your coins until they say yes.
          </p>
        </div>
        <div className="spacer" />
        <button className="btn green huge" onClick={onHome}>
          OK
        </button>
        {onCancel ? (
          <button className="btn quiet" onClick={onCancel}>
            Never mind, take it back
          </button>
        ) : null}
      </div>
    </>
  );
}

function Result({
  yes,
  who,
  coins,
  emoji,
  said,
  reason,
  note,
  nextStep,
  left,
  tier,
  readText,
  readAloud,
  onDone,
}: {
  yes: boolean;
  who: string;
  coins: number;
  emoji: string;
  said?: string;
  reason: string;
  note?: string;
  nextStep?: string;
  left: number;
  tier: 1 | 2 | 3;
  readText: string;
  readAloud: boolean;
  onDone: () => void;
}) {
  useAutoRead(readAloud, readText);
  return (
    <>
      <TopBar title={yes ? 'Yes!' : 'Not this time'} readText={readText} />
      <div className="screen center">
        {yes ? (
          <>
            <p className="confetti" aria-hidden="true">
              ✨🎉✨
            </p>
            <Sprig mood="cheer" className="sprig lg grow-in" />
            <h2 className="h1">{who} said yes!</h2>
            <div className="jar" style={{ width: '100%' }}>
              <p className="jarlabel">You spent</p>
              <p className="bal">
                <span aria-hidden="true">{emoji}</span>
                {coins}
              </p>
              {tier >= 2 ? (
                <p className="sum">
                  {left + coins} − {coins} = {left}
                </p>
              ) : (
                <CoinRow n={left} />
              )}
            </div>
            <p className="body">
              You have <b>{coinWord(left)}</b> left.
            </p>
          </>
        ) : (
          <>
            <Sprig mood="fix" className="sprig lg" />
            <h2 className="h1">Not this time</h2>
            <div className="bubble" style={{ textAlign: 'left', width: '100%' }}>
              <span className="who">{who} said</span>
              {reason}
              {note ? <> {note}</> : null}
            </div>
            {nextStep ? (
              <div className="card t-sky" style={{ width: '100%' }}>
                <p className="body">{nextStep}</p>
              </div>
            ) : null}
            <div className="card t-sun" style={{ width: '100%', alignItems: 'center' }}>
              <p className="body" style={{ textAlign: 'center' }}>
                You still have your <b>{coinWord(coins)}</b>.
              </p>
              <CoinRow n={coins} />
            </div>
          </>
        )}
        {said?.trim() ? <p className="meta">You asked for: {said.trim()}</p> : null}
        <div className="spacer" />
        <button className="btn green huge" onClick={onDone}>
          OK
        </button>
      </div>
    </>
  );
}
