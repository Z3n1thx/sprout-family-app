import { useChildCtx } from './ChildFrame';
import { useStore } from '../data/store';
import { TopBar, useAutoRead } from '../ui/bits';
import { BADGES } from '../data/catalog';
import { dayLabel } from '../lib/ledger';

/**
 * The badge case.
 *
 * Badges are the intrinsic channel and they are structurally unbuyable: there is
 * no code path that turns coins into a badge, and the screen says so in those
 * words. The moment an achievement becomes purchasable it stops being an
 * achievement, so locked badges show how to earn them rather than what they cost.
 */
export default function Badges() {
  const { child } = useChildCtx();
  const { state } = useStore();

  const mine = state.badges.filter((b) => b.childId === child.id);
  const available = BADGES.filter((b) => b.tiers.includes(child.tier));
  const earned = available.filter((b) => mine.some((m) => m.key === b.key));
  const locked = available.filter((b) => !mine.some((m) => m.key === b.key));

  const readText = `Your badges. You have earned ${earned.length} of ${available.length}. Badges cannot be bought with coins.`;
  useAutoRead(child.prefs.readAloud, readText);

  return (
    <>
      <TopBar title="My badges" back={`/child/${child.id}`} readText={readText} />
      <div className="screen">
        <div className="card t-grape">
          <p className="body">
            Badges can&apos;t be bought with coins. You can only earn them.
          </p>
        </div>

        {earned.length > 0 ? (
          <>
            <p className="eyebrow">Earned</p>
            <div className="bgrid">
              {earned.map((b) => {
                const got = mine.find((m) => m.key === b.key);
                return (
                  <div key={b.key} className="bdg">
                    <span className="g" aria-hidden="true">
                      {b.glyph}
                    </span>
                    <p className="n">{b.name}</p>
                    {got ? <p className="n" style={{ fontWeight: 600, opacity: 0.7 }}>{dayLabel(got.earnedAt)}</p> : null}
                  </div>
                );
              })}
            </div>
          </>
        ) : null}

        {locked.length > 0 ? (
          <>
            <p className="eyebrow">Still to earn</p>
            <div className="rows">
              {locked.map((b) => (
                <div key={b.key} className="row2 soft">
                  <span className="art" aria-hidden="true" style={{ filter: 'grayscale(1)', opacity: 0.5 }}>
                    {b.glyph}
                  </span>
                  <span className="mid">
                    <p className="t">{b.name}</p>
                    <p className="s">{b.how}</p>
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </>
  );
}
