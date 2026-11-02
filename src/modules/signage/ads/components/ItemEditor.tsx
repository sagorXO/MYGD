"use client";
// Side panel to edit one playlist item: duration, dates, weekdays, time window, on/off.
import { useEffect, useState } from "react";
import { Banner, Button, Card, CardHeader, Switch, TextField } from "@/ui";
import { formatClock } from "../ads.schema";
import { IMAGE_MAX_SECONDS, IMAGE_MIN_SECONDS } from "../playlist";
import { endsAtToLastDay, lastDayToEndsAt, zonedDateString, zonedDayStart } from "../zoned";
import type { AdminItem, ItemBody } from "./adsApi";
import { WEEKDAYS } from "./format";

interface Props {
  item: AdminItem;
  timeZone: string;
  busy: boolean;
  onSave: (body: ItemBody) => void;
  onRemove: () => void;
}

export function ItemEditor({ item, timeZone, busy, onSave, onRemove }: Props) {
  const isVideo = item.media.mediaType === "VIDEO";
  const [duration, setDuration] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [days, setDays] = useState<number[]>([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [active, setActive] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDuration(item.durationSeconds === null ? "" : String(item.durationSeconds));
    setStart(item.startsAt ? zonedDateString(new Date(item.startsAt), timeZone) : "");
    // The stored end is exclusive (start of the next day); show the last day it runs.
    setEnd(item.endsAt ? endsAtToLastDay(new Date(item.endsAt), timeZone) : "");
    setDays(item.daysOfWeek);
    setFrom(item.startMinute === null ? "" : formatClock(item.startMinute));
    setTo(item.endMinute === null ? "" : formatClock(item.endMinute));
    setActive(item.isActive);
    setError(null);
  }, [item, timeZone]);

  const toggleDay = (n: number) => setDays((d) => (d.includes(n) ? d.filter((x) => x !== n) : [...d, n].sort()));

  const save = () => {
    if ((from === "") !== (to === "")) return setError("Set both the From and To time, or neither.");
    const seconds = duration.trim() === "" ? null : Number(duration);
    if (!isVideo && seconds === null) return setError("An image needs a duration.");
    setError(null);
    onSave({
      mediaId: item.media.id,
      durationSeconds: seconds,
      startsAt: start ? zonedDayStart(start, timeZone).toISOString() : null,
      endsAt: end ? lastDayToEndsAt(end, timeZone).toISOString() : null,
      daysOfWeek: days,
      window: from && to ? { from, to } : null,
      isActive: active,
    });
  };

  return (
    <Card className="flex flex-col gap-4">
      <CardHeader title={`Edit item ${item.position}`} description={item.media.fileName} />
      {error ? <Banner tone="critical" title={error} /> : null}
      <TextField
        id="ad-duration"
        type="number"
        label={isVideo ? "Show for (seconds, empty = whole video)" : "Show for (seconds)"}
        min={IMAGE_MIN_SECONDS}
        max={IMAGE_MAX_SECONDS}
        value={duration}
        onChange={(e) => setDuration(e.target.value)}
        hint={`${IMAGE_MIN_SECONDS}–${IMAGE_MAX_SECONDS} seconds`}
      />
      <div className="grid grid-cols-2 gap-3">
        <TextField id="ad-start" type="date" label="First day" value={start} onChange={(e) => setStart(e.target.value)} />
        <TextField id="ad-end" type="date" label="Last day" value={end} onChange={(e) => setEnd(e.target.value)} />
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-semibold text-text">Days (none selected = every day)</legend>
        <div className="flex flex-wrap gap-1.5">
          {WEEKDAYS.map((d) => {
            const on = days.includes(d.n);
            return (
              <button
                key={d.n}
                type="button"
                aria-pressed={on}
                onClick={() => toggleDay(d.n)}
                className={`min-h-10 min-w-11 rounded-pill border px-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${
                  on ? "border-accent bg-accent-subtle text-accent-text" : "border-border-input bg-surface text-text"
                }`}
              >
                {d.short}
              </button>
            );
          })}
        </div>
      </fieldset>
      <div className="grid grid-cols-2 gap-3">
        <TextField id="ad-from" type="time" label="From" value={from} onChange={(e) => setFrom(e.target.value)} />
        <TextField id="ad-to" type="time" label="To" value={to} onChange={(e) => setTo(e.target.value)} />
      </div>
      <p className="text-xs text-text-secondary">Dates and times are in {timeZone}. A window like 21:00–02:00 runs past midnight.</p>
      <Switch id="ad-active" label="Active" checked={active} onChange={setActive} />
      <div className="flex items-center justify-between gap-3 pt-1">
        <Button variant="plain" className="text-danger" onClick={onRemove} disabled={busy}>
          Remove from playlist
        </Button>
        <Button variant="primary" onClick={save} loading={busy}>
          Save
        </Button>
      </div>
    </Card>
  );
}
