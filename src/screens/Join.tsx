import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useStore, hasFamily } from '../data/store';
import { BadSnapshot, WrongCode, decodeSnapshot, deviceId, guessDeviceName, isCompleteCode, isNativeShell, normalizeCode } from '../lib/pair';
import { avatarGlyph } from '../data/catalog';
import { Icon } from '../ui/Icons';
import { newId, nowIso, plural } from '../lib/format';
import type { State } from '../data/types';

/**
 * Joining a family from a second device.
 *
 * Two things are needed and the screen says so plainly, because the alternative
 * is a parent typing a code over and over into a box that can never work. There
 * is no server: the code cannot fetch a family, it can only unlock one. The link
 * carries the family; the code is what makes the link readable.
 *
 * A joining grown-up sets their own PIN rather than being handed the first
 * parent's. Two adults sharing one PIN is how a PIN stops meaning anything, and
 * the child app names the grown-up who decided — which only works if the two are
 * different people in the data.
 */
export default function Join() {
  const { state, dispatch, setSession } = useStore();
  const nav = useNavigate();
  const loc = useLocation();

  const fromLink = loc.hash.startsWith('#S') ? loc.hash.slice(1) : '';
  const [payload, setPayload] = useState(fromLink);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [found, setFound] = useState<State | null>(null);

  /* The installed app hands the family over as text to paste, not as a link — see
     isNativeShell. Only the wording changes: decodeSnapshot finds the payload by
     its marker, so a whole URL and a bare payload both work either way. */
  const thing = isNativeShell() ? 'join text' : 'join link';

  const [role, setRole] = useState<'parent' | 'child' | null>(null);
  const [childId, setChildId] = useState('');
  const [label, setLabel] = useState('');
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [deviceName, setDeviceName] = useState(guessDeviceName);

  /* A link that arrives with the code already in it saves a parent typing it out
     on a phone keyboard. It is the same secret either way. */
  useEffect(() => {
    const q = new URLSearchParams(loc.search);
    const c = q.get('code');
    if (c) setCode(normalizeCode(c));
  }, [loc.search]);

  const unlock = async () => {
    setBusy(true);
    setError('');
    try {
      const next = await decodeSnapshot(payload, code);
      setFound(next);
      const firstKid = next.family.children[0];
      if (firstKid) setChildId(firstKid.id);
    } catch (e) {
      setError(
        e instanceof WrongCode || e instanceof BadSnapshot
          ? e.message
          : `Something in that ${thing} did not add up. Make a fresh one on the first device.`,
      );
    } finally {
      setBusy(false);
    }
  };

  const join = () => {
    if (!found || !role) return;
    dispatch({ t: 'state/adopt', state: found });
    /* If this device is already in the snapshot's list — a re-join with a fresh
       link — drop the old entry so the classification below is the one that
       sticks. Registering alone would leave it as whatever it was. */
    dispatch({ t: 'device/remove', deviceId: deviceId() });

    if (role === 'parent') {
      const id = newId('p');
      dispatch({ t: 'parent/add', parent: { id, label: label.trim(), name: name.trim(), pin } });
      dispatch({
        t: 'device/register',
        device: { id: deviceId(), name: deviceName.trim() || guessDeviceName(), kind: 'parent', addedAt: nowIso(), lastSeen: nowIso() },
      });
      setSession({ role: 'parent', childId: null, parentId: id });
      nav('/parent', { replace: true });
      return;
    }

    dispatch({
      t: 'device/register',
      device: {
        id: deviceId(),
        name: deviceName.trim() || guessDeviceName(),
        kind: 'child',
        childId,
        addedAt: nowIso(),
      },
    });
    nav(`/child/${childId}/key`, { replace: true });
  };

  /* --- Unlocked: what is this device for? --------------------------------- */

  if (found) {
    const kids = found.family.children;
    const ready =
      role === 'child'
        ? childId !== ''
        : role === 'parent' && label.trim() !== '' && name.trim() !== '' && pin.length === 4;

    return (
      <Shell title="Join" back={() => setFound(null)}>
        <div className="card t-sprout">
          <p className="eyebrow">Unlocked</p>
          <p className="h2">{found.family.name}</p>
          <p className="meta">
            {plural(kids.length, 'child', 'children')}
            {kids.length > 0 ? ` · ${kids.map((c) => `${avatarGlyph(c.avatar)} ${c.name}`).join('  ')}` : ''}
          </p>
        </div>

        <p className="eyebrow">What is this device for?</p>
        <div className="seg">
          <button aria-pressed={role === 'parent'} onClick={() => setRole('parent')}>
            A grown-up
          </button>
          <button aria-pressed={role === 'child'} onClick={() => setRole('child')} disabled={kids.length === 0}>
            One of the children
          </button>
        </div>
        <p className="hint">
          A grown-up&apos;s device opens on the family overview. A child&apos;s device opens straight onto their own
          coins, and their three pictures are still asked for every time.
        </p>

        {role === 'child' ? (
          <>
            <p className="eyebrow">Whose device is it?</p>
            <div className="chips">
              {kids.map((c) => (
                <button key={c.id} className="chip" aria-pressed={childId === c.id} onClick={() => setChildId(c.id)}>
                  <span aria-hidden="true" style={{ fontSize: '1.3em' }}>
                    {avatarGlyph(c.avatar)}
                  </span>
                  {c.name}
                </button>
              ))}
            </div>
          </>
        ) : null}

        {role === 'parent' ? (
          <>
            <div className="field">
              <label htmlFor="jlabel">What do the children call you?</label>
              <input id="jlabel" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Mum" autoComplete="off" />
            </div>
            <div className="field">
              <label htmlFor="jname">Your name</label>
              <input id="jname" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ruth" autoComplete="off" />
            </div>
            <div className="field">
              <label htmlFor="jpin">Your own 4-digit PIN</label>
              <p className="hint">
                Yours, not the one on the other device. When you approve something, the child is told your name — so the
                app needs to know which of you tapped it.
              </p>
              <input
                id="jpin"
                inputMode="numeric"
                type="password"
                autoComplete="new-password"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="4 digits"
              />
            </div>
          </>
        ) : null}

        {role ? (
          <div className="field">
            <label htmlFor="dname">Call this device</label>
            <p className="hint">So you can recognise it in the device list later, and unlink it if it leaves the house.</p>
            <input id="dname" value={deviceName} onChange={(e) => setDeviceName(e.target.value)} autoComplete="off" />
          </div>
        ) : null}

        <div className="card soft">
          <p className="meta">
            Joining copies the family onto this device as it was when the {thing} was made. The two devices do not sync
            afterwards — there is no server between them — so treat one as the everyday device and make a fresh one when
            the other has fallen behind.
          </p>
        </div>

        <div className="spacer" />
        <button className="btn green" disabled={!ready} onClick={join}>
          <Icon name="check" />
          Join {found.family.name}
        </button>
      </Shell>
    );
  }

  /* --- Not unlocked yet --------------------------------------------------- */

  return (
    <Shell title="Join a family" back={() => nav('/')}>
      <h2 className="h1">Put your family on this device</h2>
      <p className="body">
        On the device that already has it, open <b>Grown-ups → Devices</b> and make a {thing}. You need the {thing} and
        the code together.
      </p>

      <div className="field">
        <label htmlFor="code">Family code</label>
        <input
          id="code"
          value={code}
          onChange={(e) => setCode(normalizeCode(e.target.value))}
          placeholder="XXXX-XXXX"
          autoComplete="off"
          spellCheck={false}
          style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.14em', textTransform: 'uppercase' }}
        />
      </div>

      {fromLink ? (
        <div className="card t-sky">
          <p className="eyebrow">Link found</p>
          <p className="meta">
            This page was opened from a join link, so there is nothing to paste. Just the code.
          </p>
        </div>
      ) : (
        <div className="field">
          <label htmlFor="payload">Paste the {thing}</label>
          <p className="hint">The whole thing, however long it looks. It is the family itself, not an address.</p>
          <textarea
            id="payload"
            value={payload}
            onChange={(e) => setPayload(e.target.value)}
            placeholder="S2.…"
            spellCheck={false}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 12, minHeight: 96 }}
          />
        </div>
      )}

      {error ? (
        <p className="body" style={{ color: 'var(--berry-deep)' }}>
          {error}
        </p>
      ) : null}

      {hasFamily(state) ? (
        <div className="card t-berry">
          <p className="eyebrow">This device already has a family</p>
          <p className="body">
            Joining replaces {state.family.name} on this device, including any coins earned here that are not in the
            {' '}{thing}. Nothing is sent anywhere — it is overwritten locally.
          </p>
        </div>
      ) : null}

      <div className="spacer" />
      <button className="btn green" disabled={busy || !isCompleteCode(code) || payload.trim() === ''} onClick={unlock}>
        <Icon name="lock" />
        {busy ? 'Unlocking…' : 'Unlock'}
      </button>
      {!isCompleteCode(code) && code !== '' ? <p className="hint">A code is eight letters and numbers.</p> : null}
    </Shell>
  );
}

function Shell({ children, title, back }: { children: React.ReactNode; title: string; back: () => void }) {
  return (
    <div className="app" data-tier="p">
      <header className="tbar">
        <button className="back" onClick={back}>
          <Icon name="arrowl" style={{ width: '1.1em', height: '1.1em' }} />
          Back
        </button>
        <h1 className="h2">{title}</h1>
      </header>
      <div className="screen">{children}</div>
    </div>
  );
}
