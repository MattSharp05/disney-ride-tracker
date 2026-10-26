import { useMemo, useRef, useState } from 'react';
import { CATEGORIES, PARKS, RIDES, type ParkId, type Ride } from './data/rides';
import { averageOf, blankLog, useAppState, type AppState, type RideLog } from './store';

type Filter = 'all' | 'todo' | 'done';
type Sort = 'land' | 'rating' | 'name';

const PARK_KEY = 'ride-log-park';

function initialPark(): ParkId {
  try {
    const p = localStorage.getItem(PARK_KEY) as ParkId | null;
    if (p && PARKS.some((x) => x.id === p)) return p;
  } catch {
    /* ignore */
  }
  return 'mk';
}

export default function App() {
  const { state, updateLog, addCustom, removeCustom, replaceAll } = useAppState();
  const [park, setPark] = useState<ParkId>(initialPark);
  const [filter, setFilter] = useState<Filter>('all');
  const [sort, setSort] = useState<Sort>('land');
  const [open, setOpen] = useState<string | null>(null);
  const [menu, setMenu] = useState(false);

  const choosePark = (p: ParkId) => {
    setPark(p);
    setOpen(null);
    try {
      localStorage.setItem(PARK_KEY, p);
    } catch {
      /* ignore */
    }
  };

  const allRides = useMemo(() => [...RIDES, ...state.custom], [state.custom]);
  const parkRides = allRides.filter((r) => r.park === park);
  const riddenCount = parkRides.filter((r) => state.logs[r.id]?.ridden).length;

  const totals = useMemo(() => {
    const t = { done: 0, all: allRides.length };
    allRides.forEach((r) => state.logs[r.id]?.ridden && t.done++);
    return t;
  }, [allRides, state.logs]);

  const visible = parkRides.filter((r) => {
    const done = !!state.logs[r.id]?.ridden;
    return filter === 'all' || (filter === 'done' ? done : !done);
  });

  const scoreFor = (r: Ride) => {
    const log = state.logs[r.id];
    return log?.ratings.overall || averageOf(log) || 0;
  };

  const groups: [string, Ride[]][] = useMemo(() => {
    if (sort === 'land') {
      const map = new Map<string, Ride[]>();
      visible.forEach((r) => map.set(r.land, [...(map.get(r.land) ?? []), r]));
      return [...map.entries()];
    }
    const sorted = [...visible].sort((a, b) =>
      sort === 'name' ? a.name.localeCompare(b.name) : scoreFor(b) - scoreFor(a),
    );
    return [['', sorted]];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, sort, state.logs]);

  const parkInfo = PARKS.find((p) => p.id === park)!;
  const pct = parkRides.length ? Math.round((riddenCount / parkRides.length) * 100) : 0;

  return (
    <div className={`app park-${park}`}>
      <header className="masthead">
        <div className="masthead-top">
          <p className="brand">Ride Log</p>
          <button className="ghost-btn" onClick={() => setMenu(true)} aria-label="Backup and settings">
            Backup
          </button>
        </div>
        <h1>{parkInfo.name}</h1>
        <div className="progress" aria-label={`${riddenCount} of ${parkRides.length} ridden`}>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <p>
            <strong>{riddenCount}</strong> of {parkRides.length} ridden here
            <span className="muted"> · {totals.done} of {totals.all} across all four parks</span>
          </p>
        </div>
      </header>

      <nav className="park-tabs" aria-label="Parks">
        {PARKS.map((p) => {
          const rides = allRides.filter((r) => r.park === p.id);
          const done = rides.filter((r) => state.logs[r.id]?.ridden).length;
          return (
            <button
              key={p.id}
              className={`park-tab tab-${p.id}`}
              aria-pressed={p.id === park}
              onClick={() => choosePark(p.id)}
            >
              <span className="park-tab-name">{p.short}</span>
              <span className="park-tab-count">
                {done}/{rides.length}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="toolbar">
        <div className="seg" role="group" aria-label="Show">
          {(['all', 'todo', 'done'] as Filter[]).map((f) => (
            <button key={f} aria-pressed={filter === f} onClick={() => setFilter(f)}>
              {f === 'all' ? 'All' : f === 'todo' ? 'Not yet' : 'Ridden'}
            </button>
          ))}
        </div>
        <label className="sort">
          <span className="sr-only">Sort by</span>
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
            <option value="land">By land</option>
            <option value="rating">My top rated</option>
            <option value="name">A–Z</option>
          </select>
        </label>
      </div>

      <main>
        {visible.length === 0 && (
          <p className="empty">
            {filter === 'done'
              ? 'Nothing punched yet. Tap the stub on a ride once you’ve ridden it.'
              : 'Every ride here is punched. Nice work — pick another park.'}
          </p>
        )}
        {groups.map(([land, rides]) => (
          <section key={land || 'all'} className="land">
            {land && <h2>{land}</h2>}
            <ul>
              {rides.map((r, i) => (
                <RideTicket
                  key={r.id}
                  ride={r}
                  rank={sort === 'rating' && scoreFor(r) > 0 ? i + 1 : undefined}
                  log={state.logs[r.id] ?? blankLog()}
                  open={open === r.id}
                  onToggleOpen={() => setOpen(open === r.id ? null : r.id)}
                  onUpdate={(fn) => updateLog(r.id, fn)}
                  onRemove={r.custom ? () => removeCustom(r.id) : undefined}
                />
              ))}
            </ul>
          </section>
        ))}

        <AddRide park={park} parkName={parkInfo.short} onAdd={addCustom} />
      </main>

      {menu && <BackupSheet state={state} onClose={() => setMenu(false)} onRestore={replaceAll} />}
    </div>
  );
}

function RideTicket({
  ride,
  rank,
  log,
  open,
  onToggleOpen,
  onUpdate,
  onRemove,
}: {
  ride: Ride;
  rank?: number;
  log: RideLog;
  open: boolean;
  onToggleOpen: () => void;
  onUpdate: (fn: (l: RideLog) => RideLog) => void;
  onRemove?: () => void;
}) {
  const avg = averageOf(log);
  const panelId = `panel-${ride.id}`;

  const punch = () =>
    onUpdate((l) =>
      l.ridden
        ? { ...l, ridden: false }
        : { ...l, ridden: true, count: Math.max(1, l.count), lastRidden: new Date().toISOString() },
    );

  const rate = (cat: string, v: number) =>
    onUpdate((l) => ({ ...l, ratings: { ...l.ratings, [cat]: l.ratings[cat] === v ? 0 : v } }));

  return (
    <li className={`ticket ${log.ridden ? 'is-ridden' : ''} ${open ? 'is-open' : ''}`}>
      <div className="ticket-row">
        <button
          className="ticket-body"
          onClick={onToggleOpen}
          aria-expanded={open}
          aria-controls={panelId}
        >
          {rank && <span className="rank">{rank}</span>}
          <span className="ticket-text">
            <span className="ride-name">{ride.name}</span>
            <span className="ride-meta">
              {ride.note ? <em>{ride.note}</em> : ride.custom ? 'Added by you' : ride.land}
            </span>
          </span>
          {avg !== null && (
            <span className="score" aria-label={`Average rating ${avg.toFixed(1)} of 5`}>
              {avg.toFixed(1)}
            </span>
          )}
        </button>
        <button
          className="stub"
          onClick={punch}
          aria-pressed={log.ridden}
          aria-label={log.ridden ? `Mark ${ride.name} as not ridden` : `Mark ${ride.name} as ridden`}
        >
          <span className="hole" aria-hidden="true" />
          <span className="stub-label">{log.ridden ? 'Ridden' : 'Ride it'}</span>
        </button>
      </div>

      {open && (
        <div className="panel" id={panelId}>
          <div className="ratings">
            {CATEGORIES.map((c) => (
              <div className="rating" key={c.id}>
                <div className="rating-label">
                  <span>{c.label}</span>
                  <small>{c.hint}</small>
                </div>
                <div className="pips" role="radiogroup" aria-label={c.label}>
                  {[1, 2, 3, 4, 5].map((v) => (
                    <button
                      key={v}
                      role="radio"
                      aria-checked={log.ratings[c.id] === v}
                      aria-label={`${v} of 5`}
                      className={(log.ratings[c.id] ?? 0) >= v ? 'on' : ''}
                      onClick={() => rate(c.id, v)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="panel-row">
            <span>Times ridden</span>
            <div className="stepper">
              <button
                aria-label="One fewer"
                onClick={() =>
                  onUpdate((l) => {
                    const count = Math.max(0, l.count - 1);
                    return { ...l, count, ridden: count > 0 ? l.ridden : false };
                  })
                }
              >
                −
              </button>
              <output>{log.count}</output>
              <button
                aria-label="One more"
                onClick={() =>
                  onUpdate((l) => ({
                    ...l,
                    count: l.count + 1,
                    ridden: true,
                    lastRidden: new Date().toISOString(),
                  }))
                }
              >
                +
              </button>
            </div>
          </div>
          {log.lastRidden && (
            <p className="last">
              Last ridden{' '}
              {new Date(log.lastRidden).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          )}

          <label className="notes">
            <span>Notes</span>
            <textarea
              rows={2}
              placeholder="Wait time, best seat, who you rode with…"
              value={log.notes}
              onChange={(e) => onUpdate((l) => ({ ...l, notes: e.target.value }))}
            />
          </label>

          {onRemove && (
            <button className="text-btn danger" onClick={onRemove}>
              Remove this ride
            </button>
          )}
        </div>
      )}
    </li>
  );
}

function AddRide({
  park,
  parkName,
  onAdd,
}: {
  park: ParkId;
  parkName: string;
  onAdd: (park: ParkId, name: string, land: string) => void;
}) {
  const [show, setShow] = useState(false);
  const [name, setName] = useState('');
  const [land, setLand] = useState('');

  if (!show)
    return (
      <button className="add-toggle" onClick={() => setShow(true)}>
        + Add a ride to {parkName}
      </button>
    );

  return (
    <form
      className="add-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        onAdd(park, name.trim(), land.trim());
        setName('');
        setLand('');
        setShow(false);
      }}
    >
      <label>
        <span>Ride name</span>
        <input autoFocus value={name} onChange={(e) => setName(e.target.value)} required />
      </label>
      <label>
        <span>Land (optional)</span>
        <input value={land} onChange={(e) => setLand(e.target.value)} />
      </label>
      <div className="add-actions">
        <button type="button" className="text-btn" onClick={() => setShow(false)}>
          Cancel
        </button>
        <button type="submit" className="solid-btn">
          Add ride
        </button>
      </div>
    </form>
  );
}

function BackupSheet({
  state,
  onClose,
  onRestore,
}: {
  state: AppState;
  onClose: () => void;
  onRestore: (s: AppState) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState('');

  const download = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `ride-log-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    setMsg('Backup downloaded.');
  };

  const restore = async (f: File) => {
    try {
      const data = JSON.parse(await f.text());
      if (!data || typeof data.logs !== 'object') throw new Error();
      onRestore(data);
      setMsg('Backup restored.');
    } catch {
      setMsg('That file isn’t a Ride Log backup. Choose a .json file you downloaded from here.');
    }
  };

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title" onClick={(e) => e.stopPropagation()}>
        <h2 id="sheet-title">Backup</h2>
        <p>
          Your log is saved in this browser. Download a backup to move it to another device or keep it safe.
        </p>
        <div className="sheet-actions">
          <button className="solid-btn" onClick={download}>
            Download backup
          </button>
          <button className="ghost-btn" onClick={() => fileRef.current?.click()}>
            Restore from file
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => e.target.files?.[0] && restore(e.target.files[0])}
          />
        </div>
        {msg && <p className="sheet-msg" role="status">{msg}</p>}
        <button className="text-btn" onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  );
}
