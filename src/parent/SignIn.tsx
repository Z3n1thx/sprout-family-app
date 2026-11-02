import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../data/store';
import { Icon } from '../ui/Icons';
import { deviceId, guessDeviceName } from '../lib/pair';
import { nowIso } from '../lib/format';

/**
 * The grown-up door.
 *
 * A PIN and nothing else. A parent approving a job is usually standing next to
 * the child who asked, on the child's device, with about four seconds of patience
 * available — four taps fits that, and an email and password would not.
 *
 * There is deliberately no second, "stronger" credential. With no server to
 * authenticate against, an email and password stored in this browser would be
 * exactly as strong as the PIN and would collect an address the app has no use
 * for. What the PIN honestly does is keep the coin-making screen out of a
 * child's hands; it is described that way wherever it is asked for.
 */
export default function SignIn() {
  const { state, dispatch, setSession } = useStore();
  const nav = useNavigate();

  const parents = state.family.parents;
  const [parentId, setParentId] = useState(parents[0]?.id ?? '');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const parent = parents.find((p) => p.id === parentId);

  function enter(id: string) {
    /* Sign-in is the honest moment to stamp a device: it is the one action only a
       grown-up can take, so the device list stays a list of real sign-ins. */
    dispatch({
      t: 'device/register',
      device: { id: deviceId(), name: guessDeviceName(), kind: 'parent', addedAt: nowIso(), lastSeen: nowIso() },
    });
    setSession({ role: 'parent', childId: null, parentId: id });
    nav('/parent', { replace: true });
  }

  function submitPin(next: string) {
    setPin(next);
    setError('');
    if (next.length < 4) return;
    if (parent && next === parent.pin) enter(parent.id);
    else {
      setError('That PIN does not match. Try again.');
      setPin('');
    }
  }

  if (parents.length === 0) {
    return (
      <div className="app" data-tier="p">
        <header className="tbar">
          <Link to="/" className="back">
            <Icon name="arrowl" style={{ width: '1.1em', height: '1.1em' }} />
            Back
          </Link>
          <h1 className="h2">Grown-ups</h1>
        </header>
        <div className="screen">
          <div className="card soft">
            <p className="h2">No family on this device yet</p>
            <p className="body">Set one up, or join one you already have on another phone.</p>
          </div>
          <button className="btn green" onClick={() => nav('/setup')}>
            Set up my family
          </button>
          <button className="btn ghost" onClick={() => nav('/join')}>
            Join with a code
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app" data-tier="p">
      <header className="tbar">
        <Link to="/" className="back">
          <Icon name="arrowl" style={{ width: '1.1em', height: '1.1em' }} />
          Back
        </Link>
        <h1 className="h2">Grown-ups</h1>
      </header>

      <div className="screen">
        {parents.length > 1 ? (
          <>
            <p className="eyebrow">Who is this?</p>
            <div className="seg">
              {parents.map((p) => (
                <button
                  key={p.id}
                  aria-pressed={p.id === parentId}
                  onClick={() => {
                    setParentId(p.id);
                    setPin('');
                    setError('');
                  }}
                >
                  {p.label} ({p.name})
                </button>
              ))}
            </div>
          </>
        ) : null}

        <div className="field">
          <label htmlFor="pin">{parent?.label ?? 'Your'} PIN</label>
          <div className="keydots" style={{ margin: '4px 0 2px' }}>
            {[0, 1, 2, 3].map((i) => (
              <i key={i} className={i < pin.length ? 'on' : undefined} />
            ))}
          </div>
          <input
            id="pin"
            inputMode="numeric"
            autoComplete="off"
            type="password"
            value={pin}
            maxLength={4}
            onChange={(e) => submitPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="4 digits"
          />
        </div>

        {error ? <p className="body" style={{ color: 'var(--berry-deep)' }}>{error}</p> : null}

        <div className="spacer" />

        {/* The same promise the child sees on the front door, in adult words. */}
        <div className="card t-sprout">
          <p className="body" style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <Icon name="shield" style={{ width: '1.4em', height: '1.4em', color: 'var(--sprout-deep)', flex: 'none' }} />
            <span>
              Sprout holds no money. Coins are a family currency you set the meaning of, redeemed for rewards you
              choose. There is no card, no bank link, and no payment of any kind — and nothing leaves this device.
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
