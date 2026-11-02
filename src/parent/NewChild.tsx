import { useNavigate } from 'react-router-dom';
import { useStore } from '../data/store';
import { makeChild, starterJobs } from '../data/seed';
import { TopBar } from '../ui/bits';
import ChildForm, { type ChildDraft } from '../ui/ChildForm';

/**
 * Adding a child later.
 *
 * The same form as setup, on purpose. A second child added eight months in gets
 * the identical treatment as the first — including the age note, which is the
 * part a parent has forgotten by then.
 */
export default function NewChild() {
  const { state, dispatch } = useStore();
  const nav = useNavigate();

  const add = (d: ChildDraft) => {
    const child = makeChild(d);
    dispatch({ t: 'child/add', child, jobs: starterJobs(child) });
    nav(`/parent/children/${child.id}`, { replace: true });
  };

  return (
    <>
      <TopBar title="Add a child" back="/parent/children" backLabel="Family" />
      <div className="screen">
        <div className="card soft">
          <p className="meta">
            They start with four jobs picked for their age and the family reward shelf. Everything is editable and
            nothing is charged to anyone — coins begin at zero.
          </p>
        </div>
        <ChildForm
          taken={state.family.children.map((c) => c.avatar)}
          submitLabel="Add them"
          onSubmit={add}
          onCancel={() => nav('/parent/children')}
        />
      </div>
    </>
  );
}
