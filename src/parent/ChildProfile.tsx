import { useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../data/store';
import { TopBar, Stepper, SwitchRow, Pill } from '../ui/bits';
import { Icon } from '../ui/Icons';
import { SPEND_CATEGORIES, avatarGlyph } from '../data/catalog';
import { foldBalances, spentThisWeek } from '../lib/ledger';
import { approxMoney, coinWord, plural, weekday } from '../lib/format';
import type { SpendCategoryId, Tier } from '../data/types';

const LEVELS: { tier: Tier; label: string; what: string }[] = [
  {
    tier: 1,
    label: 'Ages 4–6',
    what: 'Three tabs. Coins are counted as pictures, not typed as numbers — asking for five means tapping five times. No jars, no sums, no percentages. Biggest text, biggest buttons, slowest celebrations.',
  },
  {
    tier: 2,
    label: 'Ages 7–8',
    what: 'Five tabs. Three jars — Spend, Save, Share — and the arithmetic shown in full: 47 − 8 = 39. The goal plant appears, because a plant standing for saving needs a child who reads metaphors.',
  },
  {
    tier: 3,
    label: 'Ages 9–10',
    what: 'Everything, plus rate and proportion: “2 weeks at 20/wk”, a percentage on the goal bar, and a “~ $1.40” estimate always behind a tilde. Denser text, quicker animations.',
  },
];

/**
 * One child's settings.
 *
 * The interface level is first because it is the most consequential control in
 * the whole app and the easiest to set wrong: it is chosen by what the child can
 * read and count, not by their birthday. Everything below it is a limit, and
 * every limit is phrased as what the child will be told — a cap that produces a
 * silent failure is worse than no cap.
 */
export default function ChildProfile() {
  const { childId } = useParams();
  const { state, dispatch } = useStore();
  const nav = useNavigate();

  const child = state.family.children.find((c) => c.id === childId);
  if (!child) {
    return (
      <>
        <TopBar title="Child" back="/parent/children" />
        <div className="screen center">
          <p className="body">No such child.</p>
          <button className="btn ghost" onClick={() => nav('/parent/children')}>
            Back to the children
          </button>
        </div>
      </>
    );
  }

  const b = foldBalances(state.entries, child.id);
  const spent = spentThisWeek(state.entries, child.id);
  const level = LEVELS.find((l) => l.tier === child.tier)!;

  const limits = (patch: Partial<typeof child.limits>) =>
    dispatch({ t: 'child/limits', childId: child.id, patch });
  const prefs = (patch: Partial<typeof child.prefs>) => dispatch({ t: 'child/prefs', childId: child.id, patch });

  function toggleCategory(id: SpendCategoryId) {
    const has = child!.limits.categories.includes(id);
    const next = has ? child!.limits.categories.filter((x) => x !== id) : [...child!.limits.categories, id];
    limits({ categories: next });
  }

  return (
    <>
      <TopBar title={child.name} back="/parent/children" backLabel="Children" />
      <div className="screen">
        <div className="row2 soft">
          <span className="art" aria-hidden="true">
            {avatarGlyph(child.avatar)}
          </span>
          <span className="mid">
            <p className="t">
              {child.name}, {child.age}
            </p>
            <p className="s">
              {b.available} available · {b.save} saved · spent {spent} of {child.limits.weekly} this week
            </p>
          </span>
          <span className="end">
            <Pill kind="count">
              {b.total}
              <Icon name="coin" />
            </Pill>
          </span>
        </div>

        {/* --- Level -------------------------------------------------------- */}
        <p className="eyebrow">Interface level</p>
        <div className="seg">
          {LEVELS.map((l) => (
            <button
              key={l.tier}
              aria-pressed={child.tier === l.tier}
              onClick={() => dispatch({ t: 'child/update', childId: child.id, patch: { tier: l.tier } })}
            >
              {l.label}
            </button>
          ))}
        </div>
        <div className="card t-sky">
          <p className="body">{level.what}</p>
          <p className="meta">
            Set this by what {child.name} can read and count, not by their age. Changing it changes nothing about their
            coins, jobs or history — only how the app talks to them.
          </p>
        </div>

        {/* --- Spending ----------------------------------------------------- */}
        <p className="eyebrow">Asking to spend</p>

        <div className="field">
          <label>Most in one ask</label>
          <Stepper
            value={child.limits.perRequest}
            onChange={(n) => limits({ perRequest: n })}
            min={1}
            max={200}
            label="coins"
          />
          <p className="hint">
            {child.name} is told this before they ask, not after: the counter stops at {child.limits.perRequest} and says
            why. {approxMoney(child.limits.perRequest)} at ten cents a coin.
          </p>
        </div>

        <div className="field">
          <label>Most in a week</label>
          <Stepper value={child.limits.weekly} onChange={(n) => limits({ weekly: n })} min={1} max={500} label="coins" />
          <p className="hint">
            A rolling seven days. {spent} spent so far this week.
            {child.limits.weekly < child.limits.perRequest
              ? ' This is below a single ask, so the per-ask limit can never be reached — probably not what you meant.'
              : ''}
          </p>
        </div>

        <SwitchRow
          on={child.limits.pauseBigAsks}
          onToggle={() => limits({ pauseBigAsks: !child.limits.pauseBigAsks })}
          title="Pause on big asks"
          hint={`Anything over ${Math.floor(child.limits.perRequest / 2)} coins gets a short wait-and-count step before it can be sent. It never refuses ${child.name} — it just puts a few seconds between wanting and asking, which is the only part of "think about it" that works at this age.`}
        />

        <div className="field">
          <label>What they can ask for</label>
          <div className="chips">
            {SPEND_CATEGORIES.map((c) => (
              <button
                key={c.id}
                className="chip"
                aria-pressed={child.limits.categories.includes(c.id)}
                onClick={() => toggleCategory(c.id)}
              >
                {c.emoji} {c.label}
              </button>
            ))}
          </div>
          <p className="hint">
            {child.limits.categories.length === 0
              ? `With none picked, ${child.name} cannot ask to spend at all — rewards still work.`
              : `${child.name} picks from ${plural(child.limits.categories.length, 'category', 'categories')} when asking.`}
          </p>
        </div>

        {/* --- Pocket money ------------------------------------------------- */}
        <p className="eyebrow">Pocket money</p>
        <SwitchRow
          on={child.allowance.active}
          onToggle={() => dispatch({ t: 'child/allowance', childId: child.id, patch: { active: !child.allowance.active } })}
          title="Pays automatically"
          hint="Money that arrives whatever happens. It is the half of this that is not a wage — a child with no predictable income has nothing to plan with."
        />
        {child.allowance.active ? (
          <>
            <div className="field">
              <label>How much</label>
              <Stepper
                value={child.allowance.coins}
                onChange={(n) => dispatch({ t: 'child/allowance', childId: child.id, patch: { coins: n } })}
                min={1}
                max={100}
                label="coins"
              />
            </div>
            <div className="field">
              <label>Which day</label>
              <div className="chips">
                {[0, 1, 2, 3, 4, 5, 6].map((d) => (
                  <button
                    key={d}
                    className="chip"
                    aria-pressed={child.allowance.weekday === d}
                    onClick={() => dispatch({ t: 'child/allowance', childId: child.id, patch: { weekday: d } })}
                  >
                    {weekday(d).slice(0, 3)}
                  </button>
                ))}
              </div>
              <p className="hint">
                {coinWord(child.allowance.coins)} every {weekday(child.allowance.weekday)}.
              </p>
            </div>
          </>
        ) : null}

        <SwitchRow
          on={child.savingsBonus}
          onToggle={() => dispatch({ t: 'child/update', childId: child.id, patch: { savingsBonus: !child.savingsBonus } })}
          title="Saving bonus"
          hint="One extra coin each Sunday for every ten left in the Save jar. The gentlest possible version of interest, and the first time waiting visibly pays."
        />

        {/* --- Senses ------------------------------------------------------- */}
        <p className="eyebrow">Reading and senses</p>
        <SwitchRow
          on={child.prefs.readAloud}
          onToggle={() => prefs({ readAloud: !child.prefs.readAloud })}
          title="Read screens aloud"
          hint="Each screen reads itself once on arrival, and the ear button repeats it. For a child who cannot yet read the words, this is the difference between using the app and being shown it."
        />
        <SwitchRow
          on={child.prefs.beginnerFont}
          onToggle={() => prefs({ beginnerFont: !child.prefs.beginnerFont })}
          title="Beginner letters"
          hint="Single-storey a and g, matching the letters taught in reception. Worth turning on for a four- or five-year-old even if they can read."
        />
        <SwitchRow
          on={child.prefs.reducedMotion}
          onToggle={() => prefs({ reducedMotion: !child.prefs.reducedMotion })}
          title="Less movement"
          hint="No confetti, no growing, no bouncing. The system setting does this too — this is here for a child whose parent has not found that switch."
        />
        <SwitchRow
          on={child.prefs.sound}
          onToggle={() => prefs({ sound: !child.prefs.sound })}
          title="Sound"
          hint="Two sounds exist: coins arriving and a reward unlocking. Nothing plays on a “not yet”, a spend or a mistake — losing has no jingle."
        />

        <div className="card soft">
          <p className="meta">
            None of these four is a paid feature, on any plan. A child does not get a smaller app because of what a
            parent can afford.
          </p>
        </div>

        <div className="spacer" />

        <div className="btnrow">
          <button className="btn sun auto" onClick={() => nav(`/parent/add-coins/${child.id}`)}>
            <Icon name="plus" />
            Add coins
          </button>
          <button className="btn ghost auto" onClick={() => nav(`/parent/jobs/new?child=${child.id}`)}>
            <Icon name="jobs" />
            New job
          </button>
        </div>
      </div>
    </>
  );
}
