import { useState } from 'react';
import { AVATARS, KEY_CELLS } from '../data/catalog';
import { Icon } from './Icons';
import { tierForAge } from '../data/seed';
import type { Tier } from '../data/types';

export interface ChildDraft {
  name: string;
  age: number;
  avatar: string;
  pictureKey: string[];
}

/** What choosing an age actually changes, in the parent's language. */
const LEVEL_NOTE: Record<Tier, string> = {
  1: 'Coins get counted as pictures rather than typed as numbers, one thing happens per screen, and asking to spend is three taps with no keypad anywhere.',
  2: 'The arithmetic becomes visible — 47 − 8 = 39 — money splits into Spend, Save and Share, and a savings goal grows as a plant.',
  3: 'Percentages, “2 weeks at 20/wk”, and a rough real-world equivalent behind a tilde: ~ $1.40. Everything is denser and there are more actions per screen.',
};

/**
 * Adding a child.
 *
 * Age is asked for once and does everything: it picks the interface level, and
 * the level is what makes the app right for a five-year-old and not patronising
 * to a ten-year-old. So the consequence of the number is stated on the screen
 * where the number is chosen, rather than buried in a settings page called
 * "advanced" that no parent opens.
 *
 * The animal and the three pictures are login. A child who cannot read their own
 * name reliably can find their own frog in a second, which is the whole reason
 * this is not a username and a password.
 */
export default function ChildForm({
  taken,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  /** Avatars already used in this family — two frogs would break login. */
  taken: string[];
  submitLabel: string;
  onSubmit: (draft: ChildDraft) => void;
  onCancel: () => void;
}) {
  const free = AVATARS.filter((a) => !taken.includes(a.key));
  const [name, setName] = useState('');
  const [age, setAge] = useState(7);
  const [avatar, setAvatar] = useState(free[0]?.key ?? '');
  const [key, setKey] = useState<string[]>([]);

  const tier = tierForAge(age);
  const ready = name.trim().length > 0 && avatar !== '' && key.length === 3;

  return (
    <>
      <div className="field">
        <label htmlFor="kidname">What do you call them?</label>
        <p className="hint">The name they know themselves by. It is what the app says back to them.</p>
        <input
          id="kidname"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Mia"
          autoComplete="off"
        />
      </div>

      <p className="eyebrow">How old are they?</p>
      <div className="chips">
        {[4, 5, 6, 7, 8, 9, 10].map((n) => (
          <button key={n} className="chip" aria-pressed={age === n} onClick={() => setAge(n)}>
            {n}
          </button>
        ))}
      </div>
      <div className="card soft">
        <p className="eyebrow">
          {name.trim() || 'They'} will get level {tier} of 3
        </p>
        <p className="meta">{LEVEL_NOTE[tier]}</p>
        <p className="meta">You can move them up or down later without losing a single coin.</p>
      </div>

      <p className="eyebrow">Their animal</p>
      <p className="hint">This is how they find themselves on the way in — faces first, names second.</p>
      <div className="chips">
        {AVATARS.map((a) => {
          const used = taken.includes(a.key);
          return (
            <button
              key={a.key}
              className="chip"
              aria-pressed={avatar === a.key}
              disabled={used}
              onClick={() => setAvatar(a.key)}
              style={used ? { opacity: 0.35 } : undefined}
            >
              <span aria-hidden="true" style={{ fontSize: '1.4em' }}>
                {a.glyph}
              </span>
              {used ? 'taken' : a.name}
            </button>
          );
        })}
      </div>

      <p className="eyebrow">Their three pictures</p>
      <p className="hint">
        Tap three, in the order they will tap them. This is not a password — it stops a sibling opening the wrong app,
        which is the only threat a five-year-old actually faces. Pick something they will remember out loud.
      </p>
      <div className="keydots" style={{ margin: '2px 0 6px' }}>
        {[0, 1, 2].map((i) => (
          <i key={i} className={i < key.length ? 'on' : undefined} />
        ))}
      </div>
      <div className="keygrid">
        {KEY_CELLS.map((g) => (
          <button
            key={g}
            className="pincell"
            onClick={() => setKey((k) => (k.length >= 3 ? k : [...k, g]))}
            aria-label={`Picture ${g}`}
          >
            <span aria-hidden="true">{g}</span>
          </button>
        ))}
      </div>
      {key.length > 0 ? (
        <div className="card t-sun">
          <p className="eyebrow">In this order</p>
          <p className="h2" style={{ letterSpacing: '0.15em' }}>
            {key.join(' ')}
          </p>
          <button className="btn quiet" onClick={() => setKey([])}>
            Start again
          </button>
        </div>
      ) : null}

      <div className="spacer" />

      <button className="btn green" disabled={!ready} onClick={() => ready && onSubmit({ name, age, avatar, pictureKey: key })}>
        <Icon name="check" />
        {submitLabel}
      </button>
      <button className="btn quiet" onClick={onCancel}>
        Cancel
      </button>
    </>
  );
}
