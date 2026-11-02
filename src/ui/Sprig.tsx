/**
 * Sprig — the mascot. Exists in four moods and appears only where the app
 * needs a face: waiting, celebrating, being told "not yet", and putting
 * something right. Sprig never sells, never nags, and never appears on a
 * spending screen. Selling to a child with a cartoon is the exact behaviour
 * the ethics charter rules out.
 */
export type Mood = 'neutral' | 'cheer' | 'wait' | 'fix';

export function Sprig({ mood = 'neutral', className = 'sprig' }: { mood?: Mood; className?: string }) {
  const ink = 'var(--ink)';
  return (
    <svg className={className} viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      {/* Stem */}
      <path d="M50 92V70" stroke={ink} strokeWidth="5.5" strokeLinecap="round" fill="none" />
      {/* Leaves */}
      <path
        d="M50 72c-13 3-21-3-22-14 12-3 20 2 22 14z"
        fill="var(--sprout)"
        stroke={ink}
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <path
        d="M50 72c13 3 21-3 22-14-12-3-20 2-22 14z"
        fill="var(--sprout)"
        stroke={ink}
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      {/* Head */}
      <circle cx="50" cy="42" r="27" fill="var(--sprout-tint)" stroke={ink} strokeWidth="4" />
      {/* Sprig's own two shoots */}
      <path
        d="M44 16c-1-6-5-9-10-9 0 6 4 10 10 9zM56 16c1-6 5-9 10-9 0 6-4 10-10 9z"
        fill="var(--sprout)"
        stroke={ink}
        strokeWidth="3"
        strokeLinejoin="round"
      />

      {mood === 'cheer' ? (
        <>
          {/* Eyes shut with delight */}
          <path
            d="M35 39q5-5 10 0M55 39q5-5 10 0"
            stroke={ink}
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
          />
          <path d="M39 49q11 12 22 0z" fill={ink} />
          <circle cx="30" cy="48" r="4.5" fill="var(--berry)" opacity=".45" />
          <circle cx="70" cy="48" r="4.5" fill="var(--berry)" opacity=".45" />
          {/* Arms up */}
          <path
            d="M25 66L14 55M75 66l11-11"
            stroke={ink}
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
          />
        </>
      ) : mood === 'wait' ? (
        <>
          <circle cx="41" cy="41" r="3.6" fill={ink} />
          <circle cx="59" cy="41" r="3.6" fill={ink} />
          <path d="M43 53h14" stroke={ink} strokeWidth="4" strokeLinecap="round" fill="none" />
          <circle cx="76" cy="26" r="3" fill={ink} opacity=".35" />
          <circle cx="85" cy="20" r="4" fill={ink} opacity=".25" />
        </>
      ) : mood === 'fix' ? (
        <>
          <circle cx="41" cy="42" r="3.6" fill={ink} />
          <circle cx="59" cy="42" r="3.6" fill={ink} />
          {/* One brow up: on it, not sorry */}
          <path d="M35 32q6-4 11-1" stroke={ink} strokeWidth="3.5" strokeLinecap="round" fill="none" />
          <path d="M54 31h11" stroke={ink} strokeWidth="3.5" strokeLinecap="round" fill="none" />
          <path d="M42 53q8 5 16-1" stroke={ink} strokeWidth="4" strokeLinecap="round" fill="none" />
          {/* Sleeve rolled up */}
          <path d="M76 66l9-6" stroke={ink} strokeWidth="5" strokeLinecap="round" fill="none" />
        </>
      ) : (
        <>
          <circle cx="41" cy="41" r="3.8" fill={ink} />
          <circle cx="59" cy="41" r="3.8" fill={ink} />
          <path d="M41 52q9 7 18 0" stroke={ink} strokeWidth="4" strokeLinecap="round" fill="none" />
        </>
      )}
    </svg>
  );
}

/**
 * The goal plant. Growth is a metaphor, and metaphor comprehension arrives
 * around age 8 — which is why the plant starts at tier 2 and a four-year-old
 * gets countable coins instead. A five-year-old reads a picture of a plant as
 * a plant, not as their savings.
 */
export function GoalPlant({
  progress,
  className = 'plant',
}: {
  progress: number;
  className?: string;
}) {
  const p = Math.max(0, Math.min(1, progress));
  const stage = p >= 1 ? 4 : p >= 0.72 ? 3 : p >= 0.42 ? 2 : p >= 0.14 ? 1 : 0;
  const ink = 'var(--ink)';

  return (
    <svg className={className} viewBox="0 0 60 68" aria-hidden="true" focusable="false">
      {/* Pot */}
      <path
        d="M12 48h36l-3.5 16a3 3 0 01-3 2.5H18.5a3 3 0 01-3-2.5z"
        fill="var(--berry-tint)"
        stroke={ink}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path d="M10 44h40v5H10z" fill="var(--berry)" stroke={ink} strokeWidth="3" strokeLinejoin="round" />

      {stage === 0 && <ellipse cx="30" cy="41" rx="4.5" ry="3.4" fill={ink} />}

      {stage >= 1 && (
        <path
          d={stage === 1 ? 'M30 44V33' : stage === 2 ? 'M30 44V25' : 'M30 44V15'}
          stroke="var(--sprout-deep)"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />
      )}

      {stage >= 1 && (
        <path
          d="M30 34c-8 2-13-2-13-9 7-2 12 1 13 9z"
          fill="var(--sprout)"
          stroke={ink}
          strokeWidth="2.6"
          strokeLinejoin="round"
        />
      )}

      {stage >= 2 && (
        <path
          d="M30 28c8 2 13-2 13-9-7-2-12 1-13 9z"
          fill="var(--sprout)"
          stroke={ink}
          strokeWidth="2.6"
          strokeLinejoin="round"
        />
      )}

      {stage >= 3 && (
        <path
          d="M30 20c-7 1-11-2-11-8 6-2 10 1 11 8z"
          fill="var(--sprout)"
          stroke={ink}
          strokeWidth="2.6"
          strokeLinejoin="round"
        />
      )}

      {stage >= 4 && (
        <>
          <circle cx="30" cy="12" r="7.5" fill="var(--sun)" stroke={ink} strokeWidth="3" />
          <circle cx="30" cy="12" r="2.6" fill="var(--sun-deep)" />
        </>
      )}
    </svg>
  );
}
