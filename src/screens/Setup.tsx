import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../data/store';
import { makeChild, starterJobs } from '../data/seed';
import { deviceId, guessDeviceName, makeCode } from '../lib/pair';
import { avatarGlyph } from '../data/catalog';
import { Icon } from '../ui/Icons';
import { Sprig } from '../ui/Sprig';
import ChildForm, { type ChildDraft } from '../ui/ChildForm';
import { newId, nowIso } from '../lib/format';

type Step = 'family' | 'grownup' | 'kids' | 'child' | 'done';

const LABELS = ['Mum', 'Dad', 'Mummy', 'Daddy', 'Nana', 'Papa', 'Grandma', 'Grandad'];

/**
 * Setting up.
 *
 * Four questions, in the order a person can answer them: what your family is
 * called, who you are to your children, who the children are, and then you are
 * in. Nothing is asked that the app does not use — no email, no account, no
 * verification step, because there is no server to verify anything against and
 * asking for an address you cannot use is just collecting data for its own sake.
 *
 * The PIN is the last thing on the grown-up step and it is described honestly:
 * four digits on this device that keep the parent app out of a child's hands.
 */
export default function Setup() {
  const { state, dispatch, setSession } = useStore();
  const nav = useNavigate();

  const [step, setStep] = useState<Step>('family');
  const [familyName, setFamilyName] = useState('');
  const [label, setLabel] = useState('');
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [pin2, setPin2] = useState('');
  const [code] = useState(makeCode);
  const [parentId] = useState(() => newId('p'));

  const kids = state.family.children;

  /* --- Step 1: the family ------------------------------------------------- */

  if (step === 'family') {
    const ready = familyName.trim().length > 0;
    return (
      <Frame back={() => nav('/')} title="New family" stepNo={1}>
        <Sprig mood="cheer" className="sprig" />
        <h2 className="h1">What shall we call your family?</h2>
        <p className="body">
          It appears on the front door and nowhere else. Whatever you actually say out loud is the right answer.
        </p>
        <div className="field">
          <label htmlFor="fam">Family name</label>
          <input
            id="fam"
            value={familyName}
            onChange={(e) => setFamilyName(e.target.value)}
            placeholder="The Okonkwo-Hart family"
            autoComplete="off"
          />
        </div>
        <div className="spacer" />
        <button className="btn green" disabled={!ready} onClick={() => setStep('grownup')}>
          Next
          <Icon name="arrowr" />
        </button>
        <p className="meta">
          Everything you set up stays on this device. Sprout has no account to create and no server to send anything to.
        </p>
      </Frame>
    );
  }

  /* --- Step 2: the first grown-up ----------------------------------------- */

  if (step === 'grownup') {
    const ready = label.trim().length > 0 && name.trim().length > 0 && pin.length === 4 && pin === pin2;
    const create = () => {
      if (!ready) return;
      const device = {
        id: deviceId(),
        name: guessDeviceName(),
        kind: 'parent' as const,
        addedAt: nowIso(),
        lastSeen: nowIso(),
      };
      dispatch({
        t: 'family/create',
        name: familyName,
        code,
        parent: { id: parentId, label: label.trim(), name: name.trim(), pin },
        device,
      });
      setSession({ role: 'parent', childId: null, parentId });
      setStep('kids');
    };

    return (
      <Frame back={() => setStep('family')} title="You" stepNo={2}>
        <h2 className="h1">And who are you?</h2>

        <div className="field">
          <label htmlFor="label">What do the children call you?</label>
          <p className="hint">
            The app uses this word to their face: “Dad said not yet.” Getting it right is the difference between a
            message from a person and a message from an app.
          </p>
          <input
            id="label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Dad"
            autoComplete="off"
          />
        </div>
        <div className="chips">
          {LABELS.map((l) => (
            <button key={l} className="chip soft" aria-pressed={label === l} onClick={() => setLabel(l)}>
              {l}
            </button>
          ))}
        </div>

        <div className="field">
          <label htmlFor="pname">Your name</label>
          <input
            id="pname"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Sam"
            autoComplete="off"
          />
        </div>

        <div className="field">
          <label htmlFor="pin">Pick a 4-digit PIN</label>
          <p className="hint">
            This is what stands between a child holding the phone and the screen where coins are made. It is kept on this
            device, it is not an account, and there is nothing to recover it with — so pick one you will not forget.
          </p>
          <input
            id="pin"
            inputMode="numeric"
            type="password"
            autoComplete="new-password"
            value={pin}
            maxLength={4}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="4 digits"
          />
        </div>
        <div className="field">
          <label htmlFor="pin2">And again</label>
          <input
            id="pin2"
            inputMode="numeric"
            type="password"
            autoComplete="new-password"
            value={pin2}
            maxLength={4}
            onChange={(e) => setPin2(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="4 digits"
          />
        </div>
        {pin2.length === 4 && pin !== pin2 ? (
          <p className="body" style={{ color: 'var(--berry-deep)' }}>
            Those two do not match yet.
          </p>
        ) : null}

        <div className="spacer" />
        <button className="btn green" disabled={!ready} onClick={create}>
          <Icon name="check" />
          Create {familyName.trim()}
        </button>
      </Frame>
    );
  }

  /* --- Step 3: the children ----------------------------------------------- */

  if (step === 'child') {
    const add = (d: ChildDraft) => {
      const child = makeChild(d);
      dispatch({ t: 'child/add', child, jobs: starterJobs(child) });
      setStep('kids');
    };
    return (
      <Frame back={() => setStep('kids')} title="Add a child" stepNo={3}>
        <ChildForm
          taken={kids.map((c) => c.avatar)}
          submitLabel="Add them"
          onSubmit={add}
          onCancel={() => setStep('kids')}
        />
      </Frame>
    );
  }

  if (step === 'kids') {
    return (
      <Frame title="Children" stepNo={3}>
        <h2 className="h1">Who is earning?</h2>
        <p className="body">
          Add each child. Their age sets how the app looks and behaves for them, so a five-year-old and a ten-year-old
          get genuinely different screens rather than the same one with bigger text.
        </p>

        {kids.length > 0 ? (
          <div className="rows">
            {kids.map((c) => (
              <div key={c.id} className="row2">
                <span className="art" aria-hidden="true">
                  {avatarGlyph(c.avatar)}
                </span>
                <span className="mid">
                  <p className="t">
                    {c.name}, {c.age}
                  </p>
                  <p className="s">Level {c.tier} · 4 starter jobs added, all editable</p>
                </span>
              </div>
            ))}
          </div>
        ) : null}

        <button className="btn ghost" onClick={() => setStep('child')}>
          <Icon name="plus" />
          {kids.length === 0 ? 'Add your first child' : 'Add another child'}
        </button>

        <div className="spacer" />

        <button
          className="btn green"
          onClick={() => setStep('done')}
        >
          {kids.length === 0 ? 'Skip for now' : 'Done'}
          <Icon name="arrowr" />
        </button>
        {kids.length === 0 ? (
          <p className="meta">You can add children any time from Family. Nothing else works until you do.</p>
        ) : null}
      </Frame>
    );
  }

  /* --- Step 4: the code --------------------------------------------------- */

  return (
    <Frame title="Ready" stepNo={4}>
      <Sprig mood="cheer" className="sprig lg" />
      <h2 className="h1">{state.family.name} is set up</h2>

      <div className="card t-sky">
        <p className="eyebrow">Your family code</p>
        <p className="h1" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.12em' }}>
          {state.family.code || code}
        </p>
        <p className="meta">
          Write this down. You will need it to put this family on a second device — your co-parent&apos;s phone, or a
          tablet for the children.
        </p>
      </div>

      <div className="card soft">
        <p className="meta">
          Adding a device takes the code <i>and</i> a link you make here in Grown-ups → Devices. The code on its own
          cannot fetch your family, because there is nowhere for it to fetch it from. That is the trade for having no
          server: nothing to breach, and nothing that syncs by itself.
        </p>
      </div>

      <div className="spacer" />
      <button className="btn green" onClick={() => nav('/parent', { replace: true })}>
        <Icon name="arrowr" />
        Open {state.family.name || 'the family'}
      </button>
      <button className="btn ghost" onClick={() => nav('/parent/devices', { replace: true })}>
        Add another device now
      </button>
    </Frame>
  );
}

/** One chrome for every step, so the back arrow and the counter never move. */
function Frame({
  children,
  title,
  stepNo,
  back,
}: {
  children: React.ReactNode;
  title: string;
  stepNo: number;
  back?: () => void;
}) {
  return (
    <div className="app" data-tier="p">
      <header className="tbar">
        {back ? (
          <button className="back" onClick={back}>
            <Icon name="arrowl" style={{ width: '1.1em', height: '1.1em' }} />
            Back
          </button>
        ) : (
          <span className="back" style={{ visibility: 'hidden' }}>
            Back
          </span>
        )}
        <h1 className="h2">{title}</h1>
        <span className="pill count">{stepNo} of 4</span>
      </header>
      <div className="screen">{children}</div>
    </div>
  );
}
