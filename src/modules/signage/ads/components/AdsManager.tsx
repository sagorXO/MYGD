"use client";
// MY GERMAN DÖNER — Manager screen for the screen ads (/admin/ads): 4 portrait boards, 2 landscape TVs.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, ImageIcon, MonitorPlay, Upload, Video } from "lucide-react";
import { Badge, Banner, Button, Card, EmptyState, IconButton, Page, Select, Skeleton, Switch, TextField } from "@/ui";
import { AD_SCREEN_MAX, AD_SCREEN_MIN, defaultOrientation, defaultScreenName, formatClock, type AdOrientationKind } from "../ads.schema";
import { MEDIA_URL_PREFIX } from "../feed";
import { itemStatus, screenOnline } from "../status";
import { adsApi, toPlaylistItem, type AdminItem, type AdminOverview, type ItemBody } from "./adsApi";
import { durationText, lastSeenText, scheduleText, statusLabel } from "./format";
import { ItemEditor } from "./ItemEditor";

const DEFAULT_PLAYLIST_NAME = "Main playlist";
const DEFAULT_IMAGE_SECONDS = 8;
const ACCEPT = "image/jpeg,image/png,image/webp,video/mp4";
const SCREENS = Array.from({ length: AD_SCREEN_MAX - AD_SCREEN_MIN + 1 }, (_, i) => AD_SCREEN_MIN + i);
const CLOCK_TICK_MS = 30_000;

function bodyOf(i: AdminItem, patch: Partial<ItemBody> = {}): ItemBody {
  return {
    mediaId: i.media.id,
    durationSeconds: i.durationSeconds,
    startsAt: i.startsAt,
    endsAt: i.endsAt,
    daysOfWeek: i.daysOfWeek,
    window: i.startMinute !== null && i.endMinute !== null ? { from: formatClock(i.startMinute), to: formatClock(i.endMinute) } : null,
    isActive: i.isActive,
    ...patch,
  };
}

export function AdsManager() {
  const [data, setData] = useState<AdminOverview | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [playlistId, setPlaylistId] = useState<string | null>(null);
  const [newPlaylistName, setNewPlaylistName] = useState<string | null>(null); // null = form closed
  const [now, setNow] = useState(() => new Date());
  const fileInput = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      setData(await adsApi.overview());
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Could not load screen ads.");
    }
  }, []);

  useEffect(() => {
    void load();
    const t = window.setInterval(() => setNow(new Date()), CLOCK_TICK_MS);
    return () => window.clearInterval(t);
  }, [load]);

  const run = useCallback(
    async (action: () => Promise<unknown>) => {
      setBusy(true);
      setActionError(null);
      try {
        await action();
        await load();
      } catch (err) {
        setActionError(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
        setBusy(false);
      }
    },
    [load],
  );

  const playlist = data?.playlists.find((p) => p.id === playlistId) ?? data?.playlists[0] ?? null;
  const playingOn = data && playlist ? data.displays.filter((d) => d.playlistId === playlist.id).map((d) => d.name) : [];
  const items = useMemo(() => playlist?.items ?? [], [playlist]);
  const selected = items.find((i) => i.id === selectedId) ?? null;
  const showingCount = playlist ? items.filter((i) => itemStatus(toPlaylistItem(i), now, playlist.timeZone) === "SHOWING").length : 0;

  const upload = (files: FileList | null) => {
    if (!files || files.length === 0 || !playlist) return;
    void run(async () => {
      for (const file of Array.from(files)) {
        const { media } = await adsApi.upload(file);
        await adsApi.addItem(playlist.id, {
          mediaId: media.id,
          durationSeconds: media.mediaType === "IMAGE" ? DEFAULT_IMAGE_SECONDS : null,
          startsAt: null,
          endsAt: null,
          daysOfWeek: [],
          window: null,
          isActive: true,
        });
      }
    });
    if (fileInput.current) fileInput.current.value = "";
  };

  const move = (index: number, delta: -1 | 1) => {
    if (!playlist) return;
    const ids = items.map((i) => i.id);
    const target = index + delta;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    void run(() => adsApi.reorder(playlist.id, ids));
  };

  const createPlaylist = (name: string) =>
    void run(async () => {
      const { playlist: created } = await adsApi.createPlaylist(name);
      setPlaylistId(created.id);
      setSelectedId(null);
      setNewPlaylistName(null);
    });

  const remove = (item: AdminItem) => {
    if (!window.confirm(`Remove ${item.media.fileName} from the playlist? The screens stop showing it.`)) return;
    void run(async () => {
      await adsApi.removeItem(item.id);
      setSelectedId(null);
    });
  };

  if (loadError && !data) {
    return (
      <Page title="Screen ads">
        <Banner tone="critical" title="Screen ads could not be loaded" action={<Button onClick={() => void load()}>Try again</Button>}>
          {loadError}
        </Banner>
      </Page>
    );
  }

  if (!data) {
    return (
      <Page title="Screen ads" subtitle="What the 4 portrait screens and 2 landscape TVs play">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {SCREENS.map((n) => (
            <Skeleton key={n} variant="card" />
          ))}
        </div>
        <Skeleton variant="block" className="mt-6 h-96" />
      </Page>
    );
  }

  return (
    <Page
      title="Screen ads"
      subtitle="Each screen plays its own playlist. Changes reach the screens within a few seconds."
      width="full"
      primaryAction={
        playlist ? (
          <div className="flex flex-col items-end gap-1">
            <Button variant="primary" icon={Upload} loading={busy} onClick={() => fileInput.current?.click()}>
              Upload media
            </Button>
            <span className="text-xs text-text-secondary">JPG, PNG, WebP or MP4 (H.264) · portrait 1080 × 1920 · landscape 1920 × 1080</span>
            <input ref={fileInput} type="file" accept={ACCEPT} multiple className="sr-only" aria-label="Choose ad files" onChange={(e) => upload(e.target.files)} />
          </div>
        ) : undefined
      }
    >
      {actionError ? <Banner tone="critical" title={actionError} onDismiss={() => setActionError(null)} className="mb-4" /> : null}

      <section aria-label="Screens" className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {SCREENS.map((n) => {
          const d = data.displays.find((x) => x.screenNumber === n) ?? null;
          const online = screenOnline(d?.lastSeenAt ? new Date(d.lastSeenAt) : null, now);
          const orientation = d?.orientation ?? defaultOrientation(n);
          return (
            <Card key={n} className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-text">{d?.name ?? defaultScreenName(n)}</span>
                <Badge tone={online ? "success" : "neutral"} dot>
                  {online ? "Online" : "Offline"}
                </Badge>
              </div>
              <span className="text-xs text-text-secondary">{lastSeenText(d?.lastSeenAt ?? null, playlist?.timeZone)} · /signage/ads?screen={n}</span>
              <Select
                id={`screen-${n}-playlist`}
                label="Plays"
                value={d?.playlistId ?? ""}
                disabled={busy}
                options={[{ value: "", label: "Nothing (brand slate)" }, ...data.playlists.map((p) => ({ value: p.id, label: p.name }))]}
                onChange={(e) => void run(() => adsApi.assign(n, e.target.value || null))}
              />
              <Select
                id={`screen-${n}-orientation`}
                label="Orientation"
                value={orientation}
                disabled={busy}
                options={[
                  { value: "PORTRAIT", label: "Portrait (1080 × 1920)" },
                  { value: "LANDSCAPE", label: "Landscape (1920 × 1080)" },
                ]}
                onChange={(e) => void run(() => adsApi.assign(n, d?.playlistId ?? null, e.target.value as AdOrientationKind))}
              />
            </Card>
          );
        })}
      </section>

      {!playlist ? (
        <Card>
          <EmptyState
            icon={MonitorPlay}
            title="No playlist yet"
            description="Create a playlist, upload images or videos, then choose it for a screen above."
            action={
              <Button variant="primary" loading={busy} onClick={() => createPlaylist(DEFAULT_PLAYLIST_NAME)}>
                Create playlist
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="flex flex-wrap items-start gap-6">
          <Card padding="none" className="min-w-0 flex-[999_1_600px] overflow-hidden">
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border-subtle px-5 py-4">
              <div className="min-w-56">
                <Select
                  id="ad-playlist"
                  label="Playlist"
                  value={playlist.id}
                  options={data.playlists.map((p) => ({ value: p.id, label: p.name }))}
                  onChange={(e) => {
                    setPlaylistId(e.target.value);
                    setSelectedId(null);
                  }}
                />
              </div>
              {newPlaylistName === null ? (
                <Button variant="secondary" onClick={() => setNewPlaylistName("")}>
                  New playlist
                </Button>
              ) : (
                <form
                  className="flex flex-wrap items-end gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (newPlaylistName.trim()) createPlaylist(newPlaylistName.trim());
                  }}
                >
                  <TextField id="ad-new-playlist" label="New playlist name" value={newPlaylistName} maxLength={60} onChange={(e) => setNewPlaylistName(e.target.value)} />
                  <Button type="submit" variant="primary" loading={busy} disabled={!newPlaylistName.trim()}>
                    Create
                  </Button>
                  <Button variant="tertiary" onClick={() => setNewPlaylistName(null)}>
                    Cancel
                  </Button>
                </form>
              )}
            </div>
            <p className="border-b border-border-subtle px-5 py-2.5 text-sm text-text-secondary">
              {playingOn.length > 0 ? `Playing on: ${playingOn.join(", ")}` : "Not on any screen yet. Choose it in a screen card above."} · Use the arrows to change the order
            </p>
            {items.length === 0 ? (
              <EmptyState icon={Upload} title="The playlist is empty" description="Upload an image or video to start. Screens show the brand slate until then." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] border-collapse text-sm">
                  <thead>
                    <tr className="text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
                      <th scope="col" className="px-5 py-2.5">#</th>
                      <th scope="col" className="px-2 py-2.5">Media</th>
                      <th scope="col" className="px-2 py-2.5">Shows for</th>
                      <th scope="col" className="px-2 py-2.5">Schedule</th>
                      <th scope="col" className="px-2 py-2.5">Active</th>
                      <th scope="col" className="px-5 py-2.5"><span className="sr-only">Order</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => {
                      const status = statusLabel(itemStatus(toPlaylistItem(item), now, playlist.timeZone), item, playlist.timeZone);
                      const isSelected = item.id === selectedId;
                      const url = `${MEDIA_URL_PREFIX}${item.media.storageKey}`;
                      return (
                        <tr key={item.id} className={`border-t border-border-subtle ${isSelected ? "bg-accent-subtle" : ""} ${item.isActive ? "" : "opacity-60"}`}>
                          <td className="px-5 py-2.5 font-semibold tabular-nums text-text">{item.position}</td>
                          <td className="px-2 py-2.5">
                            <button type="button" onClick={() => setSelectedId(item.id)} className="flex items-center gap-3 rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
                              {item.media.mediaType === "IMAGE" ? (
                                // eslint-disable-next-line @next/next/no-img-element -- our own media route
                                <img src={url} alt="" className="h-12 w-[27px] rounded-sm bg-neutral-900 object-cover" />
                              ) : (
                                <video src={url} muted preload="metadata" className="h-12 w-[27px] rounded-sm bg-neutral-900 object-cover" />
                              )}
                              <span className="flex flex-col gap-0.5">
                                <span className="flex items-center gap-1.5 font-medium text-text">
                                  {item.media.mediaType === "IMAGE" ? <ImageIcon aria-hidden className="h-3.5 w-3.5" /> : <Video aria-hidden className="h-3.5 w-3.5" />}
                                  {item.media.fileName}
                                </span>
                                {status ? <Badge tone={status.tone}>{status.text}</Badge> : null}
                              </span>
                            </button>
                          </td>
                          <td className="px-2 py-2.5 tabular-nums text-text-secondary">{durationText(item)}</td>
                          <td className="px-2 py-2.5 text-text-secondary">{scheduleText(item, playlist.timeZone)}</td>
                          <td className="px-2 py-2.5">
                            <Switch id={`active-${item.id}`} labelHidden label={`Active: ${item.media.fileName}`} checked={item.isActive} disabled={busy} onChange={(next) => void run(() => adsApi.saveItem(item.id, bodyOf(item, { isActive: next })))} />
                          </td>
                          <td className="px-5 py-2.5">
                            <div className="flex justify-end gap-1">
                              <IconButton icon={ArrowUp} label={`Move ${item.media.fileName} up`} disabled={busy || index === 0} onClick={() => move(index, -1)} />
                              <IconButton icon={ArrowDown} label={`Move ${item.media.fileName} down`} disabled={busy || index === items.length - 1} onClick={() => move(index, 1)} />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <div className="border-t border-border-subtle px-5 py-3 text-sm text-text-secondary">
              {items.length} items · {showingCount} showing now
            </div>
          </Card>

          <div className="w-full flex-[1_1_340px] lg:max-w-[420px]">
            {selected ? (
              <ItemEditor item={selected} timeZone={playlist.timeZone} busy={busy} onSave={(body) => void run(() => adsApi.saveItem(selected.id, body))} onRemove={() => remove(selected)} />
            ) : (
              <Card>
                <EmptyState title="Select an item" description="Click a row to change how long it shows and when." />
              </Card>
            )}
          </div>
        </div>
      )}
    </Page>
  );
}
