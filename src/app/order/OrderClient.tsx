"use client";

import { useMemo, useState } from "react";
import { Car, CheckCircle2, Clock, Minus, Plus, ShoppingBag, UtensilsCrossed, MapPin } from "lucide-react";
import { formatEuro } from "@/lib/i18n";
import { cn } from "@/lib/cn";
import { Badge, Button, Sheet, TextField, ThemeToggle } from "@/ui";
import {
  MENU_UPGRADE_CENTS,
  VAT_RATE,
  addLine,
  estimatedPickupMins,
  productQty,
  setQty,
  totals,
  vehicleError,
  type CartLine,
} from "@/features/order/cart";
import { CATEGORIES, MENU_ITEMS, type OrderItem } from "./menuItems";

type Channel = "DRIVE_THROUGH" | "COUNTER_PICKUP";

const eur = (cents: number) => formatEuro(cents / 100, "en");
const ACTIVE_TICKETS = 4; // TODO: replace with the live KDS queue length once exposed to this surface.
const STEPS = ["Received", "Preparing", "Ready"] as const;

function Stepper({ qty, label, onChange }: { qty: number; label: string; onChange: (next: number) => void }) {
  return (
    <div className="inline-flex items-center rounded-pill border border-border bg-surface">
      <button type="button" aria-label={`Remove one ${label}`} onClick={() => onChange(qty - 1)} className="flex h-9 w-9 items-center justify-center rounded-pill text-text hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
        <Minus size={16} />
      </button>
      <span aria-live="polite" className="w-6 text-center font-mono text-sm font-semibold tabular-nums">{qty}</span>
      <button type="button" aria-label={`Add one ${label}`} onClick={() => onChange(qty + 1)} className="flex h-9 w-9 items-center justify-center rounded-pill text-text hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
        <Plus size={16} />
      </button>
    </div>
  );
}

export default function OrderClient() {
  const [channel, setChannel] = useState<Channel>("DRIVE_THROUGH");
  const [vehicle, setVehicle] = useState("");
  const [vehicleTouched, setVehicleTouched] = useState(false);
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]["id"]>("ALL");
  const [lines, setLines] = useState<CartLine[]>([]);
  const [asking, setAsking] = useState<OrderItem | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [placed, setPlaced] = useState<{ ref: string; mins: number; channel: Channel } | null>(null);

  const mins = estimatedPickupMins(ACTIVE_TICKETS);
  const t = useMemo(() => totals(lines), [lines]);
  const vErr = vehicleError(channel, vehicle);
  const visible = MENU_ITEMS.filter((i) => category === "ALL" || i.category === category);

  const add = (item: OrderItem, asMenu = false) =>
    setLines((l) => addLine(l, { productId: item.id, name: item.name, priceCents: item.priceCents, asMenu }));

  const onAdd = (item: OrderItem) => (item.allowMealUpgrade ? setAsking(item) : add(item));

  const place = () => {
    setVehicleTouched(true);
    if (vErr || lines.length === 0) return;
    const ref = `EMBA-${new Date().toISOString().slice(2, 10).replace(/-/g, "")}-${String(Math.floor(Math.random() * 900) + 100)}`;
    setPlaced({ ref, mins, channel });
    setCartOpen(false);
    setLines([]);
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col border-x border-border bg-canvas text-text">
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-surface px-4 py-3">
        <div className="min-w-0">
          <h1 className="font-display text-sm font-bold uppercase tracking-wider">My German Döner</h1>
          <p className="flex items-center gap-1 text-xs text-text-secondary">
            <MapPin size={12} aria-hidden /> Emba Store (Paphos)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone="success" size="md" icon={Clock}>~{mins} min</Badge>
          <ThemeToggle surface="order" />
        </div>
      </header>

      {placed ? (
        <main className="flex flex-1 flex-col items-center justify-center gap-5 px-6 py-10 text-center">
          <CheckCircle2 size={56} className="text-success" aria-hidden />
          <div>
            <h2 className="font-display text-2xl font-bold uppercase">Pre-order received</h2>
            <p className="mt-1 text-sm text-text-secondary">
              Reference <strong className="font-mono text-text">{placed.ref}</strong>
            </p>
          </div>
          <ol className="flex w-full items-center gap-2" aria-label="Order progress">
            {STEPS.map((s, i) => (
              <li key={s} className="flex flex-1 flex-col items-center gap-1.5">
                <span className={cn("h-1.5 w-full rounded-pill", i === 0 ? "bg-accent" : "bg-border")} />
                <span className={cn("text-xs", i === 0 ? "font-semibold text-text" : "text-text-secondary")}>{s}</span>
              </li>
            ))}
          </ol>
          <p className="text-sm text-text-secondary">
            {placed.channel === "DRIVE_THROUGH" ? "Pull into the drive-through lane" : "Collect at the counter"} in about <strong className="text-text">{placed.mins} minutes</strong>.
          </p>
          <Button variant="secondary" size="lg" fullWidth onClick={() => setPlaced(null)}>Start a new order</Button>
        </main>
      ) : (
        <main className="flex-1 space-y-4 px-4 pb-32 pt-4">
          <div role="radiogroup" aria-label="Collection method" className="grid grid-cols-2 gap-1 rounded-lg border border-border bg-surface p-1">
            {([
              ["DRIVE_THROUGH", "Drive-through", Car],
              ["COUNTER_PICKUP", "Counter pickup", UtensilsCrossed],
            ] as const).map(([id, label, Glyph]) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={channel === id}
                onClick={() => setChannel(id)}
                className={cn(
                  "flex min-h-hit items-center justify-center gap-2 rounded-md text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus",
                  channel === id ? "bg-accent text-on-accent" : "text-text-secondary hover:text-text",
                )}
              >
                <Glyph size={16} aria-hidden /> {label}
              </button>
            ))}
          </div>

          <div className="sticky top-[60px] z-20 -mx-4 overflow-x-auto bg-canvas px-4 py-2" role="tablist" aria-label="Categories">
            <div className="flex gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  role="tab"
                  aria-selected={category === c.id}
                  onClick={() => setCategory(c.id)}
                  className={cn(
                    "min-h-hit whitespace-nowrap rounded-pill border px-4 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus",
                    category === c.id ? "border-text bg-text text-canvas" : "border-border bg-surface text-text-secondary",
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <ul className="space-y-3">
            {visible.map((item) => {
              const q = productQty(lines, item.id);
              return (
                <li key={item.id} className="flex gap-3 rounded-lg border border-border bg-surface p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.imageUrl} alt="" className="h-20 w-20 shrink-0 rounded-md object-cover" />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start gap-2">
                      <h3 className="min-w-0 flex-1 font-display text-sm font-bold leading-tight">{item.name}</h3>
                      {item.badge && <Badge tone="accent">{item.badge}</Badge>}
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-xs text-text-secondary">{item.desc}</p>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <span className="font-mono text-sm font-bold tabular-nums text-accent-text">{eur(item.priceCents)}</span>
                      {q > 0 && !item.allowMealUpgrade ? (
                        <Stepper qty={q} label={item.name} onChange={(n) => setLines((l) => setQty(l, item.id, n))} />
                      ) : (
                        <Button size="sm" icon={Plus} onClick={() => onAdd(item)} aria-label={`Add ${item.name}`}>
                          {q > 0 ? `Add (${q})` : "Add"}
                        </Button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </main>
      )}

      {!placed && t.count > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md border-t border-border bg-surface p-3">
          <Button size="xl" fullWidth icon={ShoppingBag} onClick={() => setCartOpen(true)} className="justify-between">
            <span>{t.count} {t.count === 1 ? "item" : "items"} · View order</span>
            <span className="font-mono tabular-nums">{eur(t.totalCents)}</span>
          </Button>
        </div>
      )}

      <Sheet open={asking !== null} onClose={() => setAsking(null)} title={asking ? `Add ${asking.name}` : "Add item"}>
        {asking && (
          <div className="space-y-3">
            <Button variant="secondary" size="xl" fullWidth className="justify-between" onClick={() => { add(asking); setAsking(null); }}>
              <span>Just the {asking.name.split(" (")[0]}</span>
              <span className="font-mono tabular-nums">{eur(asking.priceCents)}</span>
            </Button>
            <Button size="xl" fullWidth className="justify-between" onClick={() => { add(asking, true); setAsking(null); }}>
              <span>Make it a menu <span className="font-normal opacity-80">· fries or rice + 0.4L drink</span></span>
              <span className="font-mono tabular-nums">{eur(asking.priceCents + MENU_UPGRADE_CENTS)}</span>
            </Button>
          </div>
        )}
      </Sheet>

      <Sheet
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        title="Your order"
        footer={<Button size="xl" fullWidth onClick={place} disabled={t.count === 0}>Place pre-order · {eur(t.totalCents)}</Button>}
      >
        <ul className="divide-y divide-border-subtle">
          {lines.map((l) => (
            <li key={l.key} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{l.name}</p>
                <p className="font-mono text-xs tabular-nums text-text-secondary">{eur(l.unitCents)} each</p>
              </div>
              <Stepper qty={l.qty} label={l.name} onChange={(n) => setLines((all) => setQty(all, l.key, n))} />
            </li>
          ))}
        </ul>
        {channel === "DRIVE_THROUGH" && (
          <div className="mt-3">
            <TextField
              id="vehicle"
              label="Your vehicle"
              hint="Colour, model or plate, so we can bring it to your car."
              placeholder="White Toyota Yaris"
              value={vehicle}
              onChange={(e) => setVehicle(e.target.value)}
              onBlur={() => setVehicleTouched(true)}
              error={vehicleTouched && vErr ? vErr : undefined}
              required
            />
          </div>
        )}
        <dl className="mt-4 space-y-1 text-sm">
          <div className="flex justify-between text-text-secondary"><dt>Subtotal (excl. VAT)</dt><dd className="font-mono tabular-nums">{eur(t.netCents)}</dd></div>
          <div className="flex justify-between text-text-secondary"><dt>VAT {Math.round(VAT_RATE * 100)}%</dt><dd className="font-mono tabular-nums">{eur(t.vatCents)}</dd></div>
          <div className="flex justify-between font-semibold"><dt>Total</dt><dd className="font-mono tabular-nums">{eur(t.totalCents)}</dd></div>
        </dl>
      </Sheet>
    </div>
  );
}
