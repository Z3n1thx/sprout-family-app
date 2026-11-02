import { useNavigate } from 'react-router-dom';
import { useStore } from '../data/store';
import { avatarGlyph } from '../data/catalog';
import { Icon } from '../ui/Icons';
import { Empty } from '../ui/bits';

/**
 * Who's playing.
 *
 * Faces first, names second, and sized for the youngest hand in the house: a
 * pre-reader picks their own animal in about a second but cannot reliably pick
 * their name out of three words. Recognition beats recall, so nothing here
 * asks a child to read.
 *
 * The empty state is the one screen here written for an adult, because a child
 * arriving at an empty app cannot fix it and should not be asked to.
 */
export default function ChildPicker() {
  const nav = useNavigate();
  const { state } = useStore();
  const kids = state.family.children;

  return (
    <div className="app" data-tier="1">
      <header className="tbar">
        <button className="back" onClick={() => nav('/')}>
          <Icon name="arrowl" style={{ width: '1.1em', height: '1.1em' }} />
          Back
        </button>
        <h1 className="h2">Who&apos;s playing?</h1>
        <button className="grownup" onClick={() => nav('/parent/sign-in')}>
          <Icon name="lock" style={{ width: 14, height: 14 }} />
          Grown-ups
        </button>
      </header>

      <div className="screen center">
        {kids.length === 0 ? (
          <>
            <Empty
              glyph="🌱"
              title="Nobody here yet"
              body="A grown-up needs to add you first. Go and find one — it takes about a minute."
            />
            <button className="btn ghost" onClick={() => nav('/parent/sign-in')}>
              <Icon name="lock" />
              I am the grown-up
            </button>
          </>
        ) : (
          <div className="avatars">
            {kids.map((c) => (
              <button key={c.id} className="who" onClick={() => nav(`/child/${c.id}/key`)}>
                <span className="face" aria-hidden="true">
                  {avatarGlyph(c.avatar)}
                </span>
                <p className="nm">{c.name}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
