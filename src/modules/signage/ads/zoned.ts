// MY GERMAN DÖNER — Calendar days in the playlist's time zone (pure).
// Dates a manager picks mean days in the store's zone, even if their laptop is set to another one.

function zoneOffsetMs(at: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(at);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const wall = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return wall - Math.floor(at.getTime() / 1000) * 1000;
}

/** The instant local midnight starts on `date` (YYYY-MM-DD) in `timeZone`. */
export function zonedDayStart(date: string, timeZone: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  const wall = Date.UTC(y, m - 1, d);
  // Two passes: the offset at the guess can differ from the offset at the answer around a clock change.
  const first = wall - zoneOffsetMs(new Date(wall), timeZone);
  return new Date(wall - zoneOffsetMs(new Date(first), timeZone));
}

/** The calendar day (YYYY-MM-DD) of an instant in `timeZone`. */
export function zonedDateString(at: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(at);
}

export function nextDateString(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
}

/** Managers pick the last day an ad runs; the database stores the exclusive end. */
export function lastDayToEndsAt(lastDay: string, timeZone: string): Date {
  return zonedDayStart(nextDateString(lastDay), timeZone);
}

export function endsAtToLastDay(endsAt: Date, timeZone: string): string {
  return zonedDateString(new Date(endsAt.getTime() - 1), timeZone);
}
