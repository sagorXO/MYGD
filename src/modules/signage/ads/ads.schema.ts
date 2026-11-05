// MY GERMAN DÖNER — Validation for the screen-ads API (Zod, at the system boundary).
import { z } from "zod";

/**
 * 1-4: the portrait menu boards (same numbers as MenuBoardConfig).
 * 5-6: the two LED TVs in landscape for the drinks menu (Sagar, 2026-11-02).
 */
export const AD_SCREEN_MIN = 1;
export const AD_SCREEN_MAX = 6;
const LAST_PORTRAIT_SCREEN = 4;

export const AD_ORIENTATIONS = ["PORTRAIT", "LANDSCAPE"] as const;
export type AdOrientationKind = (typeof AD_ORIENTATIONS)[number];

export function defaultOrientation(screen: number): AdOrientationKind {
  return screen <= LAST_PORTRAIT_SCREEN ? "PORTRAIT" : "LANDSCAPE";
}

export function defaultScreenName(screen: number): string {
  return screen <= LAST_PORTRAIT_SCREEN ? `Portrait ${screen}` : `Landscape ${screen - LAST_PORTRAIT_SCREEN}`;
}

const CLOCK = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function parseClock(value: string): number | null {
  const m = CLOCK.exec(value);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

export function formatClock(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export const ScreenNumberSchema = z.coerce.number().int().min(AD_SCREEN_MIN).max(AD_SCREEN_MAX);

const ClockSchema = z.string().regex(CLOCK, "Use HH:MM (00:00–23:59)");
const IsoDate = z.string().datetime({ offset: true });

export const ItemInputSchema = z
  .object({
    mediaId: z.string().min(1),
    durationSeconds: z.number().int().nullable().default(null),
    startsAt: IsoDate.nullable().default(null),
    endsAt: IsoDate.nullable().default(null),
    daysOfWeek: z
      .array(z.number().int().min(1).max(7))
      .max(7)
      .default([])
      .refine((d) => new Set(d).size === d.length, "Each weekday once"),
    window: z.object({ from: ClockSchema, to: ClockSchema }).nullable().default(null),
    isActive: z.boolean().default(true),
  })
  .transform(({ window, startsAt, endsAt, ...rest }) => ({
    ...rest,
    startsAt: startsAt ? new Date(startsAt) : null,
    endsAt: endsAt ? new Date(endsAt) : null,
    startMinute: window ? (parseClock(window.from) as number) : null,
    endMinute: window ? (parseClock(window.to) as number) : null,
  }));
export type ItemInput = z.output<typeof ItemInputSchema>;

export const ItemCreateSchema = z.object({ playlistId: z.string().min(1), item: ItemInputSchema });

export const ReorderSchema = z.object({
  playlistId: z.string().min(1),
  itemIds: z
    .array(z.string().min(1))
    .min(1)
    .refine((ids) => new Set(ids).size === ids.length, "Each item once"),
});

export const PlaylistCreateSchema = z.object({ name: z.string().trim().min(1).max(60) });

export const DisplayAssignSchema = z.object({
  name: z.string().trim().min(1).max(60).optional(),
  playlistId: z.string().min(1).nullable(),
  orientation: z.enum(AD_ORIENTATIONS).optional(),
});

// --- what the screen accepts from the feed API (validated in the browser too) ---

const MEDIA_URL = /^\/api\/signage\/media\/[a-f0-9]{64}\.(jpg|png|webp|mp4)$/;
const NullableIso = z.string().datetime({ offset: true }).nullable();

export const FeedItemSchema = z.object({
  id: z.string().min(1),
  position: z.number().int(),
  mediaType: z.enum(["IMAGE", "VIDEO"]),
  mediaUrl: z.string().regex(MEDIA_URL),
  durationSeconds: z.number().int().positive().nullable(),
  mediaDurationMs: z.number().int().positive().nullable(),
  startsAt: NullableIso,
  endsAt: NullableIso,
  daysOfWeek: z.array(z.number().int().min(1).max(7)),
  startMinute: z.number().int().min(0).max(1439).nullable(),
  endMinute: z.number().int().min(0).max(1439).nullable(),
  isActive: z.boolean(),
});

export const ScreenFeedSchema = z.object({
  screenNumber: z.number().int().min(AD_SCREEN_MIN).max(AD_SCREEN_MAX),
  orientation: z.enum(AD_ORIENTATIONS),
  status: z.enum(["READY", "PAUSED", "UNASSIGNED"]),
  playlist: z
    .object({ id: z.string(), name: z.string(), timeZone: z.string().min(1), updatedAt: z.string().datetime({ offset: true }) })
    .nullable(),
  items: z.array(FeedItemSchema),
  generatedAt: z.string().datetime({ offset: true }),
});

export const FeedResponseSchema = z.object({ success: z.literal(true), feed: ScreenFeedSchema });
