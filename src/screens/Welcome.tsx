import { useNavigate } from 'react-router-dom';
import { Sprig } from '../ui/Sprig';
import { Icon } from '../ui/Icons';
import { hasFamily, useStore } from '../data/store';

/**
 * The front door.
 *
 * The play-money promise is stated here, before either door, in the same words
 * both audiences get. A child needs to know the coins are a game they can win;
 * a parent needs to know there is nothing to connect and nothing to leak. One
 * sentence does both jobs, and it is the only place in the app that mentions
 * banks at all.
 *
 * Before a family exists this is a different screen with the same face: two ways
 * in, set up or join, and no demo. An app that opens onto invented children
 * makes the first real question "how do I clear this out?"
 */
export default function Welcome() {
  const nav = useNavigate();
  const { state } = useStore();
  const ready = hasFamily(state);

  return (
    <div className="app" data-tier="2">
      <div className="screen center">
        <Sprig mood="cheer" className="sprig lg" />
        <p className="eyebrow">Play money. Real jobs.</p>
        <h1 className="h1" style={{ fontSize: 40 }}>
          Sprout
        </h1>
        <p className="body" style={{ maxWidth: 300 }}>
          Earn coins for jobs around the house. Save them up. Swap them for
          something good.
        </p>

        <div style={{ height: 8 }} />

        {ready ? (
          <>
            <button className="btn green huge" onClick={() => nav('/child')}>
              <Icon name="seed" />
              I&apos;m a kid
            </button>
            <button className="btn ghost" onClick={() => nav('/parent/sign-in')}>
              <Icon name="people" />
              I&apos;m a grown-up
            </button>
          </>
        ) : (
          <>
            <button className="btn green huge" onClick={() => nav('/setup')}>
              <Icon name="seed" />
              Set up my family
            </button>
            <button className="btn ghost" onClick={() => nav('/join')}>
              <Icon name="people" />
              Join with a code
            </button>
          </>
        )}

        <div className="card soft" style={{ marginTop: 14, textAlign: 'left' }}>
          <p className="meta" style={{ display: 'flex', gap: 8 }}>
            <Icon name="shield" style={{ width: 20, height: 20, flex: 'none', color: 'var(--sprout-deep)' }} />
            <span>
              Coins are pretend. They are worth what your family agrees they are
              worth, and nothing else. Sprout has no card, no bank and no way to
              send money anywhere.
            </span>
          </p>
        </div>

        <p className="meta" style={{ marginTop: 10 }}>
          {ready ? state.family.name : 'Nothing to sign up for. Nothing leaves this device.'}
        </p>
      </div>
    </div>
  );
}
