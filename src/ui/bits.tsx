import { useEffect, useRef, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from './Icons';
import { speak, speechAvailable, stopSpeaking } from '../lib/speech';
import { coinWord } from '../lib/format';

/* Shared pieces. None of these take a tier: they read the CSS custom
   properties the shell has already set, which is what keeps a component from
   ever branching on a child's age. */

/* --- Top bar -------------------------------------------------------------- */

export function TopBar({
  title,
  back,
  backLabel = 'Back',
  readText,
  right,
}: {
  title: string;
  /** Route to go back to, or `true` for history-back. */
  back?: string | true;
  backLabel?: string;
  /** When present, an ear button reads this out. */
  readText?: string;
  right?: ReactNode;
}) {
  const nav = useNavigate();
  return (
    <header className="tbar">
      {back ? (
        <button className="back" onClick={() => (back === true ? nav(-1) : nav(back))}>
          <Icon name="arrowl" style={{ width: '1.1em', height: '1.1em' }} />
          {backLabel}
        </button>
      ) : null}
      <h1 className="h2">{title}</h1>
      {readText && speechAvailable() ? (
        <button className="ear" aria-label="Read this page out loud" onClick={() => speak(readText)}>
          <Icon name="ear" />
        </button>
      ) : null}
      {right}
    </header>
  );
}

/** Reads a screen once on arrival. On by default at tier 1, off above it. */
export function useAutoRead(enabled: boolean, text: string) {
  const said = useRef(false);
  useEffect(() => {
    if (!enabled || said.current || !text.trim()) return;
    said.current = true;
    const t = window.setTimeout(() => speak(text), 420);
    return () => window.clearTimeout(t);
  }, [enabled, text]);
  useEffect(() => () => stopSpeaking(), []);
}

/* --- Coins ---------------------------------------------------------------- */

/**
 * Individually drawn coins. At tier 1 the coins *are* the balance and the
 * numeral is the caption, because quantity is still physical at five. Capped
 * at 24 drawn: past that, subitising has long since given out and a wall of
 * coins is just noise.
 */
export function CoinRow({ n, fresh = 0, max = 24 }: { n: number; fresh?: number; max?: number }) {
  const drawn = Math.min(n, max);
  const cells = [];
  for (let i = 0; i < drawn; i++) {
    const isNew = i >= drawn - fresh;
    cells.push(<Icon key={i} name="coin" className={isNew ? 'new' : undefined} />);
  }
  return (
    <div className="coinrow" aria-hidden="true">
      {cells}
      {n > max ? <span className="meta" style={{ alignSelf: 'center' }}>+{n - max}</span> : null}
    </div>
  );
}

export function Balance({ coins, fresh = 0 }: { coins: number; fresh?: number }) {
  return (
    <p className="bal">
      <Icon name="coin" />
      <span aria-label={coinWord(coins)}>{coins}</span>
      {fresh > 0 ? <span className="vh">, {coinWord(fresh)} just arrived</span> : null}
    </p>
  );
}

/* --- Status pills --------------------------------------------------------- */

export type PillKind = 'wait' | 'done' | 'notyet' | 'open' | 'count';

export function Pill({ kind, children }: { kind: PillKind; children: ReactNode }) {
  return <span className={`pill ${kind}`}>{children}</span>;
}

/* --- Progress bar --------------------------------------------------------- */

export function Bar({ value, max, escrow = false }: { value: number; max: number; escrow?: boolean }) {
  const w = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div
      className={escrow ? 'bar escrow' : 'bar'}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <i style={{ width: `${w}%` }} />
    </div>
  );
}

/* --- Stepper -------------------------------------------------------------- */

/**
 * Coin counting, not a number pad. A keypad asks a child to compose a quantity
 * from digits; a stepper asks them to count, which is the skill actually under
 * construction at 4-6.
 */
export function Stepper({
  value,
  onChange,
  min = 0,
  max = 99,
  step = 1,
  label = 'coins',
  showCoins = false,
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  showCoins?: boolean;
}) {
  return (
    <>
      <div className="stepper">
        <button
          aria-label={`One fewer ${label}`}
          disabled={value - step < min}
          onClick={() => onChange(Math.max(min, value - step))}
        >
          −
        </button>
        <div className="val" aria-live="polite">
          <Icon name="coin" />
          <span>{value}</span>
        </div>
        <button
          aria-label={`One more ${label}`}
          disabled={value + step > max}
          onClick={() => onChange(Math.min(max, value + step))}
        >
          +
        </button>
      </div>
      {showCoins ? <CoinRow n={value} /> : null}
    </>
  );
}

/* --- Switch row ----------------------------------------------------------- */

export function SwitchRow({
  on,
  onToggle,
  title,
  hint,
  disabled = false,
}: {
  on: boolean;
  onToggle: () => void;
  title: string;
  hint?: string;
  disabled?: boolean;
}) {
  return (
    <button className="swrow" role="switch" aria-checked={on} disabled={disabled} onClick={onToggle}>
      <span className="mid">
        <p>{title}</p>
        {hint ? <small>{hint}</small> : null}
      </span>
      <span className="sw" aria-checked={on} />
    </button>
  );
}

/* --- Chrome --------------------------------------------------------------- */

export function Sheet({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  return (
    <div
      className="sheet"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div>{children}</div>
    </div>
  );
}

export function Toast({ children }: { children: ReactNode }) {
  return (
    <div className="toast" role="status">
      {children}
    </div>
  );
}

/** An empty screen is an invitation to act, not a shrug. */
export function Empty({ glyph, title, body }: { glyph: string; title: string; body?: string }) {
  return (
    <div className="empty">
      <span className="g" aria-hidden="true">
        {glyph}
      </span>
      <p className="h2">{title}</p>
      {body ? <p className="meta">{body}</p> : null}
    </div>
  );
}

export function Spacer() {
  return <div className="spacer" />;
}
