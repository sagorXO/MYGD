// MY GERMAN DÖNER — Portrait-screen ad playlist rules (pure, no I/O).
// Used by the /signage/ads player and the admin API. Times are evaluated in the store's
// time zone (passed in, read from the playlist record), never the screen's or the server's.

export const IMAGE_MIN_SECONDS = 3;
export const IMAGE_MAX_SECONDS = 120;
const MINUTES_PER_DAY = 24 * 60;

export type AdMediaKind = "IMAGE" | "VIDEO";

export interface PlaylistItem {
  id: string;
  position: number;
  mediaType: AdMediaKind;
  /** Seconds on screen. Required for images; optional cap for videos. */
  durationSeconds: number | null;
  /** Measured length of the video file, from the upload probe. */
  mediaDurationMs: number | null;
  /** Inclusive. */
  startsAt: Date | null;
  /** Exclusive. */
  endsAt: Date | null;
  /** ISO weekdays, 1 = Monday … 7 = Sunday. Empty = every day. */
  daysOfWeek: readonly number[];
  /** Minutes after local midnight, inclusive. A window may cross midnight (start > end). */
  startMinute: number | null;
  /** Minutes after local midnight, exclusive. */
  endMinute: number | null;
  isActive: boolean;
}

export type PlaylistErrorCode =
  | "DUPLICATE_POSITION"
  | "DURATION_REQUIRED"
  | "DURATION_OUT_OF_RANGE"
  | "INVALID_TIME_WINDOW"
  | "INVALID_DATE_RANGE"
  | "INVALID_WEEKDAY";

export interface PlaylistError {
  itemId: string;
  code: PlaylistErrorCode;
  message: string;
}

interface LocalTime {
  weekday: number; // 1–7
  minute: number; // 0–1439
}

const WEEKDAY_INDEX: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };

function localTime(now: Date, timeZone: string): LocalTime {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const weekday = WEEKDAY_INDEX[get("weekday")];
  if (!weekday) throw new Error(`Could not read the weekday for time zone ${timeZone}`);
  return { weekday, minute: Number(get("hour")) * 60 + Number(get("minute")) };
}

function previousWeekday(weekday: number): number {
  return weekday === 1 ? 7 : weekday - 1;
}

function dayAllowed(item: PlaylistItem, weekday: number): boolean {
  return item.daysOfWeek.length === 0 || item.daysOfWeek.includes(weekday);
}

function withinDateRange(item: PlaylistItem, now: Date): boolean {
  const t = now.getTime();
  if (item.startsAt && t < item.startsAt.getTime()) return false;
  if (item.endsAt && t >= item.endsAt.getTime()) return false;
  return true;
}

function withinDayAndWindow(item: PlaylistItem, local: LocalTime): boolean {
  const { startMinute: start, endMinute: end } = item;
  if (start === null || end === null) return dayAllowed(item, local.weekday);
  if (start < end) return dayAllowed(item, local.weekday) && local.minute >= start && local.minute < end;
  // Crosses midnight: the part after midnight belongs to the previous day's schedule.
  if (local.minute >= start) return dayAllowed(item, local.weekday);
  if (local.minute < end) return dayAllowed(item, previousWeekday(local.weekday));
  return false;
}

export function isItemActive(item: PlaylistItem, now: Date, timeZone: string): boolean {
  if (!item.isActive) return false;
  if (!withinDateRange(item, now)) return false;
  return withinDayAndWindow(item, localTime(now, timeZone));
}

export function activeItems<T extends PlaylistItem>(items: readonly T[], now: Date, timeZone: string): T[] {
  return items.filter((i) => isItemActive(i, now, timeZone)).sort((a, b) => a.position - b.position);
}

export function itemDurationMs(item: PlaylistItem): number {
  if (item.durationSeconds !== null) return item.durationSeconds * 1000;
  if (item.mediaType === "VIDEO" && item.mediaDurationMs !== null) return item.mediaDurationMs;
  throw new Error(`Item ${item.id} has no duration and no known media length`);
}

/** The item after `currentId`, wrapping around; the first item if `currentId` is unknown. */
export function nextItem<T extends PlaylistItem>(list: readonly T[], currentId: string | null): T | null {
  if (list.length === 0) return null;
  const index = list.findIndex((i) => i.id === currentId);
  return list[(index + 1) % list.length] ?? null;
}

function isMinute(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value < MINUTES_PER_DAY;
}

function itemErrors(item: PlaylistItem): PlaylistError[] {
  const errors: PlaylistError[] = [];
  const add = (code: PlaylistErrorCode, message: string) => errors.push({ itemId: item.id, code, message });

  if (item.mediaType === "IMAGE" && item.durationSeconds === null) {
    add("DURATION_REQUIRED", "An image needs a duration in seconds.");
  }
  if (item.durationSeconds !== null && (item.durationSeconds < IMAGE_MIN_SECONDS || item.durationSeconds > IMAGE_MAX_SECONDS)) {
    add("DURATION_OUT_OF_RANGE", `Duration must be ${IMAGE_MIN_SECONDS}–${IMAGE_MAX_SECONDS} seconds.`);
  }
  const { startMinute: start, endMinute: end } = item;
  if ((start === null) !== (end === null)) {
    add("INVALID_TIME_WINDOW", "Set both the start and end time, or neither.");
  } else if (start !== null && end !== null && (!isMinute(start) || !isMinute(end) || start === end)) {
    add("INVALID_TIME_WINDOW", "Times must be 00:00–23:59 and the window cannot be empty.");
  }
  if (item.startsAt && item.endsAt && item.endsAt.getTime() <= item.startsAt.getTime()) {
    add("INVALID_DATE_RANGE", "The end date must be after the start date.");
  }
  if (item.daysOfWeek.some((d) => !Number.isInteger(d) || d < 1 || d > 7)) {
    add("INVALID_WEEKDAY", "Weekdays are 1 (Monday) to 7 (Sunday).");
  }
  return errors;
}

export function validatePlaylist(items: readonly PlaylistItem[]): PlaylistError[] {
  const seen = new Set<number>();
  const errors: PlaylistError[] = [];
  for (const item of items) {
    if (seen.has(item.position)) {
      errors.push({ itemId: item.id, code: "DUPLICATE_POSITION", message: `Position ${item.position} is used twice.` });
    }
    seen.add(item.position);
    errors.push(...itemErrors(item));
  }
  return errors;
}

/** After an item fails to load: try the next one, or rest once the whole list has failed in a row. */
export function afterPlaybackFailure(consecutiveFailures: number, listLength: number): "SKIP" | "REST" {
  return consecutiveFailures >= listLength ? "REST" : "SKIP";
}
