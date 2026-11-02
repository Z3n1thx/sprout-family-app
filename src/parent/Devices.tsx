import { useState } from 'react';
import { useStore } from '../data/store';
import { TopBar, Sheet, Toast } from '../ui/bits';
import { Icon } from '../ui/Icons';
import { avatarGlyph } from '../data/catalog';
import { encodeSnapshot, deviceId, isNativeShell, joinLink, makeCode } from '../lib/pair';
import { shortDate } from '../lib/format';
import type { Device } from '../data/types';

/**
 * Devices.
 *
 * This screen tells the truth about a design decision, which is the only honest
 * way to ship it. Sprout has no server, so there is no account that a second
 * device signs into and no sync that quietly reconciles two phones. A join link
 * *is* the family — encrypted with the family code — and it is as current as the
 * moment it was made.
 *
 * That has a real cost and the screen names it rather than hiding it behind the
 * word "sync": two devices drift apart, and the fix is a fresh link. In exchange
 * there is nothing to breach, no children's data on anyone's disk but yours, and
 * no third party in the middle of a five-year-old's pocket money.
 */
export default function Devices() {
  const { state, dispatch } = useStore();
  const me = deviceId();

  /* In the installed app there is no address another phone could open, so the
     same payload is handed over as text to paste rather than dressed up as a
     link. The two paths differ only in the wrapper and the words — calling it a
     "code" would collide with the family code, which is the other half. */
  const native = isNativeShell();
  const thing = native ? 'join text' : 'join link';
  const Thing = native ? 'Join text' : 'Join link';

  const [link, setLink] = useState('');
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState('');
  const [confirmCode, setConfirmCode] = useState(false);
  const [renaming, setRenaming] = useState<Device | null>(null);
  const [draftName, setDraftName] = useState('');

  const say = (m: string) => {
    setToast(m);
    window.setTimeout(() => setToast(''), 2200);
  };

  const copy = async (text: string, what: string) => {
    try {
      await navigator.clipboard.writeText(text);
      say(`${what} copied`);
    } catch {
      say('Copying was blocked — select it by hand');
    }
  };

  const makeLink = async () => {
    setBusy(true);
    try {
      const payload = await encodeSnapshot(state, state.family.code);
      setLink(native ? payload : joinLink(payload));
    } catch {
      say('That did not work. Try once more.');
    } finally {
      setBusy(false);
    }
  };

  const regenerate = () => {
    dispatch({ t: 'family/code', code: makeCode() });
    setLink('');
    setConfirmCode(false);
    say('New code. Anything you sent before is dead.');
  };

  const kidName = (id?: string) => state.family.children.find((c) => c.id === id);

  return (
    <>
      <TopBar title="Devices" back="/parent/children" backLabel="Family" />
      <div className="screen">
        {/* --- The code ----------------------------------------------------- */}
        <div className="card t-sky">
          <p className="eyebrow">Your family code</p>
          <p className="h1" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.12em' }}>
            {state.family.code || '— — — —'}
          </p>
          <button className="btn quiet" onClick={() => copy(state.family.code, 'Code')}>
            Copy the code
          </button>
        </div>

        {/* --- How this works ---------------------------------------------- */}
        <div className="card soft">
          <p className="eyebrow">Two halves, sent separately</p>
          <p className="body">
            The <b>{thing}</b> below carries your whole family, sealed with your code. The <b>code</b> is what opens it.
            Send the {thing} however suits you, tell the other person the code some other way — say it out loud, if they
            are in the house — and neither half is much use on its own.
          </p>
          <p className="meta">
            There is no Sprout server. A code typed into a fresh device cannot go and find your family, because there is
            nowhere for it to look. That is why a {thing} is needed at all.
          </p>
        </div>

        {/* --- The link ---------------------------------------------------- */}
        <p className="eyebrow">Add a device</p>
        {link === '' ? (
          <button className="btn green" disabled={busy} onClick={makeLink}>
            <Icon name="plus" />
            {busy ? 'Sealing…' : `Make a ${thing}`}
          </button>
        ) : (
          <>
            <div className="field">
              <label htmlFor="link">{Thing}</label>
              <p className="hint">
                A snapshot of the family as it is right now — every child, job, coin and reward. Long, because it is the
                data and not an address.
                {native
                  ? ' Copy it, send it to the other phone, and paste it into Join a family there.'
                  : ''}
              </p>
              <textarea
                id="link"
                readOnly
                value={link}
                onFocus={(e) => e.currentTarget.select()}
                spellCheck={false}
                style={{ fontFamily: 'var(--font-mono)', fontSize: 11, minHeight: 92 }}
              />
            </div>
            <button className="btn green" onClick={() => copy(link, Thing)}>
              Copy the {thing}
            </button>
            <button className="btn ghost" onClick={makeLink} disabled={busy}>
              Make a fresh one
            </button>
            <div className="card t-berry">
              <p className="eyebrow">Before you send it</p>
              <p className="body">
                Anyone holding this {thing} <i>and</i> your code has your children&apos;s Sprout. Send it to your own
                device or one other grown-up — not to a group chat — and delete the message afterwards. If it goes
                somewhere it should not, make a new code below: everything made under the old one stops opening,
                permanently.
              </p>
            </div>
          </>
        )}

        {/* --- Paired devices ----------------------------------------------- */}
        <p className="eyebrow">On this family</p>
        <div className="rows">
          {state.family.devices.map((d) => {
            const kid = kidName(d.childId);
            const mine = d.id === me;
            return (
              <div key={d.id} className={mine ? 'row2 t-sprout' : 'row2'}>
                <span className="art" aria-hidden="true">
                  {kid ? avatarGlyph(kid.avatar) : '📱'}
                </span>
                <span className="mid">
                  <p className="t">
                    {d.name}
                    {mine ? ' — this one' : ''}
                  </p>
                  <p className="s">
                    {kid ? `${kid.name}'s device` : 'A grown-up device'} · added {shortDate(d.addedAt)}
                    {d.lastSeen && d.lastSeen !== d.addedAt ? ` · last signed in ${shortDate(d.lastSeen)}` : ''}
                  </p>
                </span>
                <span className="end">
                  <button
                    className="btn quiet"
                    onClick={() => {
                      setRenaming(d);
                      setDraftName(d.name);
                    }}
                  >
                    Rename
                  </button>
                </span>
              </div>
            );
          })}
        </div>

        {state.family.devices.length > 1 ? (
          <details>
            <summary className="meta">Unlink a device</summary>
            <div className="rows" style={{ marginTop: 8 }}>
              {state.family.devices
                .filter((d) => d.id !== me)
                .map((d) => (
                  <button
                    key={d.id}
                    className="row2"
                    onClick={() => {
                      dispatch({ t: 'device/remove', deviceId: d.id });
                      say(`${d.name} unlinked`);
                    }}
                  >
                    <span className="art" aria-hidden="true">
                      ✕
                    </span>
                    <span className="mid">
                      <p className="t">Forget {d.name}</p>
                      <p className="s">Takes it off this list. It does not wipe the copy already on it.</p>
                    </span>
                  </button>
                ))}
            </div>
            <p className="meta" style={{ marginTop: 8 }}>
              Unlinking is bookkeeping, not control — the other device still holds whatever it was given. To make that
              copy useless for joining anything new, change the code.
            </p>
          </details>
        ) : null}

        {/* --- New code ----------------------------------------------------- */}
        <p className="eyebrow">Change the code</p>
        <p className="hint">
          A new code invalidates every {thing} you have ever sent. Nothing already on a device is affected, and no coins
          move.
        </p>
        {confirmCode ? (
          <>
            <button className="btn green" onClick={regenerate}>
              <Icon name="check" />
              Yes, make a new code
            </button>
            <button className="btn quiet" onClick={() => setConfirmCode(false)}>
              Keep {state.family.code}
            </button>
          </>
        ) : (
          <button className="btn ghost" onClick={() => setConfirmCode(true)}>
            <Icon name="lock" />
            Make a new code
          </button>
        )}
      </div>

      {renaming ? (
        <Sheet onClose={() => setRenaming(null)}>
          <h2 className="h2">Rename this device</h2>
          <div className="field">
            <label htmlFor="dn">Name</label>
            <input id="dn" value={draftName} onChange={(e) => setDraftName(e.target.value)} autoComplete="off" />
          </div>
          <button
            className="btn green"
            disabled={draftName.trim() === ''}
            onClick={() => {
              dispatch({ t: 'device/rename', deviceId: renaming.id, name: draftName });
              setRenaming(null);
            }}
          >
            Save
          </button>
          <button className="btn quiet" onClick={() => setRenaming(null)}>
            Cancel
          </button>
        </Sheet>
      ) : null}

      {toast ? <Toast>{toast}</Toast> : null}
    </>
  );
}
