import { Link } from 'react-router-dom';
import { Empty } from '../ui/bits';
import { Icon } from '../ui/Icons';

/**
 * The dead end four screens share.
 *
 * Coins go *to* somebody, jobs belong *to* somebody, insights are *about*
 * somebody. Before the first child exists those screens have nothing to say, and
 * they used to say it by rendering a title bar with nothing underneath — which
 * reads as a broken app rather than as a next step. So they all show the same
 * thing, and it is the one action that unblocks them.
 *
 * No `.screen` wrapper: one caller drops this in beside content it already has.
 */
export default function NoChildren({ what }: { what: string }) {
  return (
    <>
      <Empty glyph="🌱" title="No children yet" body={what} />
      <Link to="/parent/children/new" className="btn green">
        <Icon name="plus" />
        Add a child
      </Link>
    </>
  );
}
