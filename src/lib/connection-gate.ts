// Caps long-lived connections (SSE) so one client, or a flood, cannot exhaust the single server process.
export function createConnectionGate({ total, perKey }: { total: number; perKey: number }) {
  const counts = new Map<string, number>();
  let open = 0;
  return {
    /** Returns a release function, or null when a limit is reached. */
    acquire(key: string): (() => void) | null {
      const current = counts.get(key) ?? 0;
      if (open >= total || current >= perKey) return null;
      counts.set(key, current + 1);
      open += 1;
      let released = false;
      return () => {
        if (released) return;
        released = true;
        open -= 1;
        const left = (counts.get(key) ?? 1) - 1;
        if (left > 0) counts.set(key, left);
        else counts.delete(key);
      };
    },
  };
}
