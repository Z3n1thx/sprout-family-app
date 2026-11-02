import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { rewardsForTier, useStore } from '../data/store';
import { useParent } from './ParentFrame';
import { TopBar, Stepper, CoinRow } from '../ui/bits';
import NoChildren from './NoChildren';
import { Icon } from '../ui/Icons';
import { avatarGlyph } from '../data/catalog';
import { foldBalances } from '../lib/ledger';
import { approxMoney, coinWord, plural, weekday } from '../lib/format';
import type { Bucket } from '../data/types';

type Kind = 'allowance' | 'bonus' | 'correction';
type Where = 'spend' | 'save' | 'share' | 'split';

const KINDS: { id: Kind; label: string; icon: string; hint: string }[] = [
  {
    id: 'allowance',
    label: 'Pocket money',
    icon: '🪙',
    hint: 'The same amount, on the same day. Predictable money is what makes saving thinkable.',
  },
  {
    id: 'bonus',
    label: 'A bonus',
    icon: '⭐',
    hint: 'For something outside the job list. Say what it was for — a bonus with no reason attached teaches nothing.',
  },
  {
    id: 'correction',
    label: 'Fix a mistake',
    icon: '🔧',
    hint: 'Corrects your own slip. It appears in their story like everything else, in your words.',
  },
];

/**
 * Adding coins.
 *
 * The one screen where a grown-up creates money out of nothing, so it carries
 * two obligations. Every entry needs a child-facing sentence, previewed here
 * exactly as it will read in My Story — no adjustment ever appears as a silent
 * change to the number. And taking coins back is a visible correction with a
 * reason, never a quiet edit, because a balance a child cannot trust is worse
 * than no balance at all.
 */
export default function AddCoins() {
  const { childId } = useParams();
  const { state, dispatch } = useStore();
  const parent = useParent();
  const nav = useNavigate();

  const [target, setTarget] = useState(childId ?? '');
  const [kind, setKind] = useState<Kind>('bonus');
  const [coins, setCoins] = useState(5);
  const [where, setWhere] = useState<Where>('spend');
  const [label, setLabel] = useState('');
  const [takeAway, setTakeAway] = useState(false);
  const [done, setDone] = useState(false);

  /* Fall back to the first child rather than to a blank screen: the URL may name
     a child who has since been removed. */
  const child = state.family.children.find((c) => c.id === target) ?? state.family.children[0];
  if (!child) {
    return (
      <>
        <TopBar title="Add coins" back="/parent" backLabel="Family" />
        <div className="screen">
          <NoChildren what="Coins go to somebody. Add a child and this is where their pocket money, bonuses and corrections come from." />
        </div>
      </>
    );
  }

  const b = foldBalances(state.entries, child.id);
  const spec = KINDS.find((k) => k.id === kind)!;
  const out = kind === 'correction' && takeAway;
  const capped = out ? Math.min(coins, b.available) : coins;
  const after = out ? b.available - capped : b.available + capped;

  /* Splitting is three entries, not one. Remainder goes to Spend: a child who
     is short a coin should be short in the jar they can actually see. */
  const parts: { bucket: Bucket; coins: number }[] =
    where === 'split'
      ? (() => {
          const each = Math.floor(capped / 3);
          const rest = capped - each * 3;
          return [
            { bucket: 'spend' as Bucket, coins: each + rest },
            { bucket: 'save' as Bucket, coins: each },
            { bucket: 'share' as Bucket, coins: each },
          ].filter((p) => p.coins > 0);
        })()
      : [{ bucket: where as Bucket, coins: capped }];

  /* What this unlocks. Not a nudge to spend — a parent asking "is 5 enough to
     matter?" deserves the honest answer, which is usually "not yet". */
  const shelf = rewardsForTier(state.rewards, child.tier);
  const opens = shelf
    .filter((r) => r.coins > b.available && r.coins <= after)
    .sort((x, y) => x.coins - y.coins)
    .slice(0, 2);
  const goal = state.goals.find((g) => g.childId === child.id);
  const escrow = goal ? (b.goals[goal.id] ?? 0) : 0;

  const storyText =
    kind === 'allowance'
      ? 'Pocket money'
      : kind === 'bonus'
        ? `A bonus — ${label.trim() || 'say what for'}`
        : cap(label.trim() || 'say what you fixed');

  const needsLabel = kind !== 'allowance' && label.trim().length === 0;

  const give = () => {
    if (needsLabel || capped < 1) return;
    for (const p of parts) {
      dispatch({
        t: 'coins/add',
        childId: child.id,
        by: parent.id,
        coins: p.coins,
        bucket: p.bucket,
        kind,
        label: kind === 'allowance' ? 'pocket money' : label.trim(),
        icon: spec.icon,
        direction: out ? 'out' : 'in',
      });
    }
    setDone(true);
  };

  if (done) {
    return (
      <>
        <TopBar title="Done" back="/parent" backLabel="Family" />
        <div className="screen">
          <div className="card t-sprout">
            <p className="h2">
              {out ? 'Taken back' : 'Added'}: {coinWord(capped)}
            </p>
            <p className="body">
              {child.name} now has {after} available. It is already in their story — they will see it next time they
              open Sprout.
            </p>
            <p className="meta">No notification was sent. Coins waiting to be found is a nicer thing than a buzz.</p>
          </div>
          <button className="btn green" onClick={() => nav('/parent')}>
            Back to the family
          </button>
          <button
            className="btn ghost"
            onClick={() => {
              setDone(false);
              setLabel('');
              setCoins(5);
            }}
          >
            Add more coins
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <TopBar title="Add coins" back="/parent" backLabel="Family" />
      <div className="screen">
        {/* --- Who ---------------------------------------------------------- */}
        {state.family.children.length > 1 ? (
          <>
            <p className="eyebrow">Who for</p>
            <div className="seg">
              {state.family.children.map((c) => (
                <button key={c.id} aria-pressed={c.id === child.id} onClick={() => setTarget(c.id)}>
                  {avatarGlyph(c.avatar)} {c.name}
                </button>
              ))}
            </div>
          </>
        ) : null}

        {/* --- Why ---------------------------------------------------------- */}
        <p className="eyebrow">What kind</p>
        <div className="seg">
          {KINDS.map((k) => (
            <button
              key={k.id}
              aria-pressed={k.id === kind}
              onClick={() => {
                setKind(k.id);
                setTakeAway(k.id === 'correction');
                if (k.id === 'allowance') setCoins(child.allowance.coins);
              }}
            >
              {k.icon} {k.label}
            </button>
          ))}
        </div>
        <p className="hint">{spec.hint}</p>

        {kind === 'allowance' && child.allowance.active ? (
          <div className="card soft">
            <p className="meta">
              {child.name} already gets {coinWord(child.allowance.coins)} every {weekday(child.allowance.weekday)}{' '}
              automatically. This is on top of that.
            </p>
          </div>
        ) : null}

        {kind === 'correction' ? (
          <div className="seg">
            <button aria-pressed={!takeAway} onClick={() => setTakeAway(false)}>
              Give coins
            </button>
            <button aria-pressed={takeAway} onClick={() => setTakeAway(true)}>
              Take coins back
            </button>
          </div>
        ) : null}

        {/* --- How many ----------------------------------------------------- */}
        <p className="eyebrow">How many</p>
        <div className="chips">
          {[1, 2, 5, 10, 20].map((n) => (
            <button key={n} className="chip" aria-pressed={coins === n} onClick={() => setCoins(n)}>
              {n}
            </button>
          ))}
        </div>
        <Stepper value={coins} onChange={setCoins} min={1} max={99} label="coins" showCoins />
        <p className="meta">
          {coinWord(capped)} · {approxMoney(capped)} if your family counts a coin as 10¢
        </p>
        {out && coins > b.available ? (
          <p className="hint">
            {child.name} only has {b.available}. Taking more than they have would put them below zero, so this is
            capped at {b.available}.
          </p>
        ) : null}

        {/* --- Which jar ---------------------------------------------------- */}
        <p className="eyebrow">{out ? 'Out of which jar' : 'Into which jar'}</p>
        <div className="seg">
          {(['spend', 'save', 'share', 'split'] as Where[])
            .filter((w) => !(out && w === 'split'))
            .map((w) => (
              <button key={w} aria-pressed={where === w} onClick={() => setWhere(w)}>
                {w === 'split' ? 'Split ⅓' : cap(w)}
              </button>
            ))}
        </div>
        {where === 'split' ? (
          <p className="hint">
            {parts.map((p) => `${p.coins} ${p.bucket}`).join(' · ')} — three entries in their story, so the split is
            something they can see rather than something that happened to them.
          </p>
        ) : null}

        {/* --- The words --------------------------------------------------- */}
        {kind !== 'allowance' ? (
          <div className="field">
            <label htmlFor="what">
              {kind === 'bonus' ? 'What was it for?' : 'What are you fixing?'}
            </label>
            <p className="hint">
              {kind === 'bonus'
                ? 'A few words. “helping with the shopping”.'
                : 'A whole short sentence. “I paid you twice for the bins.”'}
            </p>
            <input
              id="what"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={kind === 'bonus' ? 'helping with the shopping' : 'I paid you twice for the bins'}
            />
          </div>
        ) : null}

        {/* --- Preview ----------------------------------------------------- */}
        <div className="card t-sky">
          <p className="eyebrow">{child.name}&apos;s story will read</p>
          <div className="srow">
            <span className="art" aria-hidden="true">
              {spec.icon}
            </span>
            <span className="txt">{storyText}</span>
            <span className={out ? 'amt out' : 'amt in'}>
              {out ? '−' : '+'}
              {capped}
            </span>
          </div>
          {!out && capped <= 12 ? <CoinRow n={capped} fresh={capped} /> : null}
          <p className="meta">
            {b.available} → {after} available
            {goal ? ` · ${goal.emoji} ${goal.name}: ${escrow} of ${goal.target} set aside` : ''}
          </p>
        </div>

        {opens.length > 0 ? (
          <div className="card soft">
            <p className="eyebrow">This puts within reach</p>
            {opens.map((r) => (
              <p key={r.id} className="meta">
                {r.emoji} {r.name} — {coinWord(r.coins)}
              </p>
            ))}
            <p className="meta">
              {plural(opens.length, 'reward', 'rewards')} they could not afford before. Worth knowing before you round
              up.
            </p>
          </div>
        ) : null}

        <div className="spacer" />

        <button className="btn green" disabled={needsLabel || capped < 1} onClick={give}>
          <Icon name="check" />
          {out ? `Take back ${capped}` : `Give ${capped} to ${child.name}`}
        </button>
        {needsLabel ? <p className="hint">Add a few words first — the child sees them.</p> : null}
      </div>
    </>
  );
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
