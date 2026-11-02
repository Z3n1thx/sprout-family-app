import { useChildCtx } from './ChildFrame';
import { useStore } from '../data/store';
import { Empty, TopBar, useAutoRead } from '../ui/bits';
import { Icon } from '../ui/Icons';
import { groupByDay, storyLines, type StoryLine } from '../lib/ledger';
import { approxMoney, coinWord } from '../lib/format';
import type { Entry } from '../data/types';

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * One line, one sentence. Nothing on this screen is called a transaction, a
 * debit or a balance adjustment — a seven-year-old has no use for any of those
 * words, and a five-year-old is put off by them.
 */
function sentence(e: Entry): string {
  switch (e.kind) {
    case 'allowance':
      return 'Pocket money';
    case 'savings-bonus':
      return 'Saving bonus';
    case 'bonus':
      return `A bonus — ${e.label}`;
    case 'spend':
      return `You spent ${coinWord(e.coins)} on ${e.label}`;
    default:
      return cap(e.label);
  }
}

export default function Story() {
  const { child } = useChildCtx();
  const { state } = useStore();

  const lines = storyLines(state.entries, child.id);
  const days = groupByDay(lines);

  const readText = lines[0]
    ? `Your story. The newest thing: ${sentence(lines[0].entry)}.`
    : 'Your story is empty so far.';
  useAutoRead(child.prefs.readAloud, readText);

  return (
    <>
      <TopBar title="My story" back={child.tier === 3 ? undefined : `/child/${child.id}`} readText={readText} />
      <div className="screen">
        {lines.length === 0 ? (
          <Empty glyph="📖" title="Nothing here yet" body="Finish a job and it will show up." />
        ) : null}

        {days.map((group) => (
          <section key={group.day} className="story">
            <h2 className="storyday">{group.day}</h2>
            {group.lines.map((l) => (
              <Row key={l.entry.id} line={l} tier={child.tier} />
            ))}
          </section>
        ))}

        {child.tier === 3 && lines.length > 0 ? (
          <p className="approx">
            Everything you have now: {approxMoney(lines[0]!.after)} of pretend money
          </p>
        ) : null}
      </div>
    </>
  );
}

function Row({ line, tier }: { line: StoryLine; tier: 1 | 2 | 3 }) {
  const { entry, kind, before, after } = line;
  return (
    <div className="srow">
      <span className="art" aria-hidden="true">
        {entry.icon}
      </span>
      <span className="txt">
        {sentence(entry)}
        {/* The running sum from 7-8, where addition within 100 is fluent and the
            history can double as arithmetic practice. It is the same fold that
            produces the number on the jar, so the two cannot disagree. */}
        {tier >= 2 && kind !== 'move' ? (
          <>
            <br />
            <span className="sum">
              {before} {kind === 'in' ? '+' : '−'} {entry.coins} = {after}
            </span>
          </>
        ) : null}
      </span>
      {kind === 'move' ? (
        <span className="amt">
          <Icon name="arrowr" />
        </span>
      ) : (
        <span className={`amt ${kind}`}>
          {kind === 'in' ? '+' : '−'}
          {entry.coins}
          <Icon name="coin" />
        </span>
      )}
    </div>
  );
}
