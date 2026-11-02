import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../data/store';
import { KEY_CELLS, avatarGlyph } from '../data/catalog';
import { Icon } from '../ui/Icons';
import { Sheet } from '../ui/bits';

function shuffle<T>(arr: T[]): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const a = out[i]!;
    const b = out[j]!;
    out[i] = b;
    out[j] = a;
  }
  return out;
}

/**
 * The picture key.
 *
 * Three pictures in order. It is a password a four-year-old can hold, and the
 * grid reshuffles on every attempt so a watching sibling learns nothing from
 * where the fingers went. A wrong key costs nothing but another go: there is no
 * lockout, no countdown, and no word for failure on the screen.
 */
export default function PictureKey() {
  const { id } = useParams();
  const nav = useNavigate();
  const { state, setSession } = useStore();
  const child = state.family.children.find((c) => c.id === id);

  const [round, setRound] = useState(0);
  const [taps, setTaps] = useState<string[]>([]);
  const [wrong, setWrong] = useState(false);
  const [help, setHelp] = useState(false);

  const cells = useMemo(() => shuffle(KEY_CELLS), [round]);

  if (!child) return <div className="app" data-tier="1" />;

  function tap(glyph: string) {
    setWrong(false);
    const next = [...taps, glyph];
    if (next.length < child!.pictureKey.length) {
      setTaps(next);
      return;
    }
    const ok = next.every((g, i) => g === child!.pictureKey[i]);
    if (ok) {
      setSession({ role: 'child', childId: child!.id, parentId: null });
      nav(`/child/${child!.id}`, { replace: true });
    } else {
      setTaps([]);
      setWrong(true);
      setRound((r) => r + 1);
    }
  }

  return (
    <div className="app" data-tier="1" data-font={child.prefs.beginnerFont ? 'beginner' : undefined}>
      <header className="tbar">
        <button className="back" onClick={() => nav('/child')}>
          <Icon name="arrowl" style={{ width: '1.1em', height: '1.1em' }} />
          Back
        </button>
        <h1 className="h2">Hello, {child.name}</h1>
      </header>

      <div className="screen center">
        <span className="face" style={{ fontSize: 40, width: 72, height: 72 }} aria-hidden="true">
          {avatarGlyph(child.avatar)}
        </span>
        <p className="h2">Tap your three pictures</p>

        <div className="keydots" aria-label={`${taps.length} of ${child.pictureKey.length} tapped`}>
          {child.pictureKey.map((_, i) => (
            <i key={i} className={i < taps.length ? 'on' : undefined} />
          ))}
        </div>

        {wrong ? (
          <p className="body" style={{ color: 'var(--slate)' }}>
            Not those ones. Have another go.
          </p>
        ) : null}

        <div className="keygrid" style={{ marginTop: 6 }}>
          {cells.map((g) => (
            <button key={g} className="pincell" onClick={() => tap(g)} aria-label="Picture">
              <span aria-hidden="true">{g}</span>
            </button>
          ))}
        </div>

        <button className="btn quiet" onClick={() => setHelp(true)}>
          I forgot my pictures
        </button>
      </div>

      {help ? (
        <Sheet onClose={() => setHelp(false)}>
          <h2 className="h2">Ask a grown-up</h2>
          <p className="body">
            Your pictures are a secret, so Sprout will not show them here. A
            grown-up can find them in Family, then {child.name}.
          </p>
          <button className="btn green" onClick={() => setHelp(false)}>
            OK
          </button>
        </Sheet>
      ) : null}
    </div>
  );
}
