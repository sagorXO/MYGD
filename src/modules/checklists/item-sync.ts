// Works out how to load a section's tasks from the data file without disturbing past records.
// [ADR] Context: past entries point at a task's row, so matching rows by position would put old readings
// and sign-offs under different words after someone inserted a task.
// Decision: a task is identified by its exact text within its section. Reworded text is a new task, and the
// old row retires. Rows only change position through a temporary spot, because position is unique per section.
// Consequence: history keeps the words staff actually saw. Fixing a typo creates a new task for future shifts.
export interface ExistingItem {
  id: string;
  label: string;
  position: number;
  isActive: boolean;
}

export interface IncomingItem {
  label: string;
  position: number;
}

export interface ItemSyncPlan {
  /** Rows to park on an unused negative position before anything else moves. */
  moveAside: { id: string; position: number }[];
  /** Rows to mark inactive. They stay parked. */
  retire: string[];
  /** Rows to bring up to date, at their final position. */
  update: { id: string; label: string; position: number }[];
  create: IncomingItem[];
}

export function planItemSync(existing: ExistingItem[], incoming: IncomingItem[]): ItemSyncPlan {
  const labels = incoming.map((i) => i.label);
  const duplicate = labels.find((label, index) => labels.indexOf(label) !== index);
  if (duplicate !== undefined) throw new Error(`The same task appears twice in one section: ${duplicate}`);

  const byLabel = new Map<string, ExistingItem>();
  for (const row of existing) {
    const known = byLabel.get(row.label);
    if (!known || (row.isActive && !known.isActive)) byLabel.set(row.label, row);
  }

  const update: ItemSyncPlan["update"] = [];
  const create: IncomingItem[] = [];
  for (const wanted of incoming) {
    const row = byLabel.get(wanted.label);
    if (row) update.push({ id: row.id, label: wanted.label, position: wanted.position });
    else create.push(wanted);
  }

  const kept = new Set(update.map((u) => u.id));
  const target = new Map(update.map((u) => [u.id, u.position]));
  const wantedPositions = new Set(incoming.map((i) => i.position));
  const retire = existing.filter((r) => r.isActive && !kept.has(r.id)).map((r) => r.id);
  const mustMove = existing.filter((r) => {
    if (kept.has(r.id)) return target.get(r.id) !== r.position;
    return r.isActive || wantedPositions.has(r.position);
  });

  let free = Math.min(0, ...existing.map((r) => r.position)) - 1;
  const moveAside = mustMove.map((r) => ({ id: r.id, position: free-- }));
  return { moveAside, retire, update, create };
}
