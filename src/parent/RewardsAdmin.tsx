import { useState } from 'react';
import { useStore } from '../data/store';
import { TopBar, Sheet, Stepper, SwitchRow, Pill } from '../ui/bits';
import { Icon } from '../ui/Icons';
import { SHELVES } from '../data/catalog';
import { earnedThisWeek } from '../lib/ledger';
import { coinWord, newId, weeksAtRate } from '../lib/format';
import type { Reward, ShelfId, Tier } from '../data/types';

const TIER_LABEL: Record<Tier, string> = { 1: '4–6', 2: '7–8', 3: '9–10' };

const EMOJI = ['💛', '📖', '🍿', '🎲', '🎨', '🍦', '🧁', '🎡', '🏊', '🎬', '🧸', '📚', '🚲', '🪁', '⏰', '📺'];

/**
 * The shelf.
 *
 * SHELVES order is the argument, and it is not alphabetical: "Time with you"
 * comes first and "Things" comes last, because the cheapest reward in the app is
 * also the best one and a parent scanning this screen should meet it first.
 *
 * Everything here is priced in coins. There is no field for a real price, and
 * `realWorldHint` is a sentence a parent types — "we'll go after school" — never
 * an amount, because the moment a reward has a price the app is a shop.
 */
export default function RewardsAdmin() {
  const { state, dispatch } = useStore();
  const [editing, setEditing] = useState<Reward | null>(null);

  const rates = state.family.children.map((c) => ({
    child: c,
    perWeek: earnedThisWeek(state.entries, c.id),
  }));

  function blank(shelf: ShelfId): Reward {
    return {
      id: newId('rw'),
      shelf,
      name: '',
      emoji: '🎁',
      coins: 20,
      tiers: [1, 2, 3],
      active: true,
    };
  }

  return (
    <>
      <TopBar title="Rewards" />
      <div className="screen">
        <div className="card t-sprout">
          <p className="body">
            Coins buy things from this shelf and nothing else. You decide what is on it, what it costs, and when it
            happens — so a reward is a promise between you and your child, not a purchase.
          </p>
        </div>

        {SHELVES.map((s) => {
          const rewards = state.rewards.filter((r) => r.shelf === s.id);
          const on = rewards.filter((r) => r.active).length;
          return (
            <div key={s.id}>
              <p className="eyebrow">
                {s.emoji} {s.label} — {on} on the shelf
              </p>
              <p className="hint">{s.blurb}</p>

              <div className="rows">
                {rewards.map((r) => (
                  <div key={r.id} className={r.active ? 'row2' : 'row2 soft'}>
                    <span className="art" aria-hidden="true">
                      {r.emoji}
                    </span>
                    <span className="mid">
                      <p className="t" style={r.active ? undefined : { color: 'var(--ink-soft)' }}>
                        {r.name}
                      </p>
                      <p className="s">
                        {r.tiers.map((t) => TIER_LABEL[t]).join(' · ')}
                        {r.realWorldHint ? ` · ${r.realWorldHint}` : ''}
                        {r.stock !== undefined ? ` · ${r.stock} left` : ''}
                      </p>
                    </span>
                    <span className="end">
                      <Pill kind={r.active ? 'count' : 'notyet'}>
                        {r.coins}
                        <Icon name="coin" />
                      </Pill>
                      <button className="btn sm ghost auto" onClick={() => setEditing(r)}>
                        Edit
                      </button>
                    </span>
                  </div>
                ))}
              </div>

              <div className="btnrow">
                <button className="btn sm ghost auto" onClick={() => setEditing(blank(s.id))}>
                  <Icon name="plus" />
                  Add to {s.label.toLowerCase()}
                </button>
              </div>
            </div>
          );
        })}

        <div className="card soft">
          <p className="eyebrow">On pricing</p>
          <p className="meta">
            Aim for one or two weeks of earning. Sooner than that and the coins stop meaning anything; much longer and a
            seven-year-old cannot hold the thread. Their current rate:
          </p>
          {rates.map((r) => (
            <p key={r.child.id} className="meta">
              {r.child.name}: {coinWord(r.perWeek)} this week
            </p>
          ))}
        </div>
      </div>

      {editing ? (
        <Editor
          reward={editing}
          rates={rates}
          isNew={!state.rewards.some((r) => r.id === editing.id)}
          onClose={() => setEditing(null)}
          onSave={(r) => {
            dispatch({ t: 'reward/upsert', reward: r });
            setEditing(null);
          }}
          onToggle={() => {
            dispatch({ t: 'reward/toggle', rewardId: editing.id });
            setEditing(null);
          }}
        />
      ) : null}
    </>
  );
}

/* ========================================================================== */

function Editor({
  reward,
  rates,
  isNew,
  onClose,
  onSave,
  onToggle,
}: {
  reward: Reward;
  rates: { child: { id: string; name: string; tier: Tier }; perWeek: number }[];
  isNew: boolean;
  onClose: () => void;
  onSave: (r: Reward) => void;
  onToggle: () => void;
}) {
  const [draft, setDraft] = useState<Reward>(reward);
  const set = (patch: Partial<Reward>) => setDraft((d) => ({ ...d, ...patch }));

  function toggleTier(t: Tier) {
    const has = draft.tiers.includes(t);
    const next = has ? draft.tiers.filter((x) => x !== t) : [...draft.tiers, t].sort();
    if (next.length === 0) return; // A reward offered to nobody is just clutter.
    set({ tiers: next as Tier[] });
  }

  return (
    <Sheet onClose={onClose}>
      <p className="h2">{isNew ? 'New reward' : draft.name}</p>

      <div className="field">
        <label htmlFor="rname">What it is</label>
        <p className="hint">In the child&apos;s words. “Pick the film on Friday”, not “Media selection privilege”.</p>
        <input id="rname" value={draft.name} onChange={(e) => set({ name: e.target.value })} placeholder="Pick the film" />
      </div>

      <div className="field">
        <label>Picture</label>
        <div className="chips">
          {EMOJI.map((g) => (
            <button key={g} className="chip" aria-pressed={draft.emoji === g} onClick={() => set({ emoji: g })}>
              {g}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label>Shelf</label>
        <div className="seg">
          {SHELVES.map((s) => (
            <button key={s.id} aria-pressed={draft.shelf === s.id} onClick={() => set({ shelf: s.id })}>
              {s.emoji}
            </button>
          ))}
        </div>
        <p className="hint">{SHELVES.find((s) => s.id === draft.shelf)?.label}</p>
      </div>

      <div className="field">
        <label>Costs</label>
        <Stepper value={draft.coins} onChange={(n) => set({ coins: n })} min={1} max={300} step={1} label="coins" />
        {rates.map((r) =>
          draft.tiers.includes(r.child.tier) ? (
            <p key={r.child.id} className="hint">
              {r.child.name}: {weeksAtRate(draft.coins, r.perWeek) ?? 'no earnings yet this week to judge by'}
            </p>
          ) : null,
        )}
      </div>

      <div className="field">
        <label>Offered to</label>
        <div className="chips">
          {([1, 2, 3] as Tier[]).map((t) => (
            <button key={t} className="chip" aria-pressed={draft.tiers.includes(t)} onClick={() => toggleTier(t)}>
              {TIER_LABEL[t]}
            </button>
          ))}
        </div>
        <p className="hint">
          A shelf a five-year-old cannot reach is a shelf of disappointments. Leave the long ones to the older levels.
        </p>
      </div>

      <div className="field">
        <label htmlFor="hint">Your note to them (optional)</label>
        <p className="hint">
          What happens after they unlock it. Never a price — this is the only real-world detail children see.
        </p>
        <input
          id="hint"
          value={draft.realWorldHint ?? ''}
          onChange={(e) => set({ realWorldHint: e.target.value })}
          placeholder="We'll go on Saturday morning."
        />
      </div>

      <SwitchRow
        on={draft.active}
        onToggle={() => set({ active: !draft.active })}
        title="On the shelf"
        hint="Off hides it from the children without deleting anything they have already unlocked."
      />

      <div className="spacer" />

      <button className="btn green" disabled={draft.name.trim().length === 0} onClick={() => onSave({ ...draft, name: draft.name.trim() })}>
        <Icon name="check" />
        {isNew ? 'Put it on the shelf' : 'Save'}
      </button>
      {!isNew ? (
        <button className="btn quiet" onClick={onToggle}>
          {reward.active ? 'Take it off the shelf' : 'Put it back on the shelf'}
        </button>
      ) : null}
      <button className="btn quiet" onClick={onClose}>
        Cancel
      </button>
    </Sheet>
  );
}
