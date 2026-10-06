"use client";

import { useState } from "react";
import { Archive, Bell, ClipboardList, Flame, Inbox, LayoutDashboard, Leaf, Plus, Printer, Trash2 } from "lucide-react";
import {
  AppShell, Avatar, Badge, Banner, Button, ButtonGroup, Card, CardHeader, CardSection, Checkbox, DescriptionList, EmptyState,
  ErrorState, Filters, IconButton, IndexTable, Kbd, Layout, LayoutSection, Menu, Modal, Page, PriceTag, ProgressBar, Radio,
  SearchField, SegmentedControl, Select, Sheet, Skeleton, Spinner, Stat, SurfaceRoot, Switch, Tabs, TextField, Textarea,
  Thumbnail, ToastProvider, Tooltip, useToast, type Column, type SortState, type Surface, type Tone,
  StatusBadge, ProductTile, NumericKeypad, OrderTicket, OfflineBanner, HACCPReading, PrinterStatus,
} from "@/ui";

const SURFACES: Surface[] = ["admin", "pos", "staff", "kds", "order", "kiosk", "display", "board"];
const TONES: Tone[] = ["neutral", "info", "success", "warning", "critical", "highlight", "accent"];

interface OrderRow {
  id: string;
  customer: string;
  status: "Open" | "Ready" | "Done";
  total: number;
}

const ORDERS: OrderRow[] = [
  { id: "EMBA-0412", customer: "Walk-in", status: "Open", total: 14.5 },
  { id: "EMBA-0413", customer: "Kiosk order 1042", status: "Ready", total: 22 },
  { id: "EMBA-0414", customer: "Walk-in", status: "Done", total: 7.9 },
];

const STATUS_TONE: Record<OrderRow["status"], Tone> = { Open: "warning", Ready: "success", Done: "neutral" };

const COLUMNS: Column<OrderRow>[] = [
  { id: "id", header: "Order", cell: (r) => <span className="font-mono">{r.id}</span>, sortable: true },
  { id: "customer", header: "Customer", cell: (r) => r.customer },
  { id: "status", header: "Status", cell: (r) => <Badge tone={STATUS_TONE[r.status]} dot>{r.status}</Badge> },
  { id: "total", header: "Total", cell: (r) => <PriceTag amount={r.total} />, align: "end", sortable: true },
];

function sortOrders(rows: OrderRow[], sort: SortState): OrderRow[] {
  const dir = sort.direction === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    if (sort.columnId === "total") return (a.total - b.total) * dir;
    return a.id.localeCompare(b.id) * dir;
  });
}

function ToastDemo() {
  const { show } = useToast();
  return (
    <ButtonGroup>
      <Button variant="secondary" onClick={() => show({ tone: "success", message: "Order EMBA-0413 marked ready" })}>
        Success toast
      </Button>
      <Button variant="secondary" onClick={() => show({ tone: "critical", message: "Kitchen printer offline" })}>
        Critical toast
      </Button>
    </ButtonGroup>
  );
}

function Showcase() {
  const [tab, setTab] = useState("open");
  const [size, setSize] = useState<"s" | "m" | "l">("m");
  const [query, setQuery] = useState("");
  const [storeOpen, setStoreOpen] = useState(true);
  const [modal, setModal] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<SortState>({ columnId: "id", direction: "asc" });
  const [loadingTable, setLoadingTable] = useState(false);
  const [keypadInput, setKeypadInput] = useState("18.70");

  const visible = sortOrders(ORDERS.filter((o) => o.id.toLowerCase().includes(query.toLowerCase())), sort);

  return (
    <Page
      title="UI kit"
      subtitle="Every component, variant and state — switch theme in the top bar and density in the selector."
      badges={<Badge tone="accent">Dev only</Badge>}
      primaryAction={<Button icon={Plus}>Primary action</Button>}
      secondaryActions={
        <Menu
          label="More actions"
          items={[
            { id: "archive", label: "Archive", icon: Archive, onSelect: () => {} },
            { id: "delete", label: "Delete", icon: Trash2, critical: true, onSelect: () => {} },
          ]}
        />
      }
    >
      <Layout>
        <LayoutSection>
          <Card>
            <CardHeader title="Buttons" description="Variants, sizes and states" />
            <div className="flex flex-wrap gap-2">
              {(["primary", "secondary", "tertiary", "critical", "plain"] as const).map((v) => (
                <Button key={v} variant={v}>
                  {v}
                </Button>
              ))}
            </div>
            <CardSection className="mt-4">
              <div className="flex flex-wrap items-center gap-2">
                {(["sm", "md", "lg", "xl"] as const).map((s) => (
                  <Button key={s} size={s} variant="secondary">
                    Size {s}
                  </Button>
                ))}
                <Button loading>Paying</Button>
                <Button disabled>Disabled</Button>
                <Tooltip content="Reprint kitchen ticket">
                  <IconButton icon={Printer} label="Reprint" variant="secondary" />
                </Tooltip>
              </div>
            </CardSection>
          </Card>

          <Card padding="none">
            <div className="px-4 pt-4">
              <CardHeader
                title="Orders"
                actions={
                  <Button size="sm" variant="secondary" onClick={() => setLoadingTable((v) => !v)}>
                    Toggle loading
                  </Button>
                }
              />
              <Tabs label="Order status" selected={tab} onSelect={setTab} tabs={[{ id: "open", label: "Open", badge: <Badge>2</Badge> }, { id: "done", label: "Done" }]} />
            </div>
            <div id={`tabpanel-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`} className="space-y-3 p-4">
              <div className="flex flex-wrap items-center gap-3">
                <SearchField id="order-search" value={query} onChange={setQuery} className="w-64" />
                <Filters chips={query ? [{ key: "q", label: `Search: ${query}` }] : []} onRemove={() => setQuery("")} onClearAll={() => setQuery("")} />
              </div>
              <IndexTable
                label="Orders"
                rows={visible}
                rowKey={(r) => r.id}
                columns={COLUMNS}
                selectable
                selected={selected}
                onSelectionChange={setSelected}
                bulkActions={<Button size="sm" variant="secondary" icon={Archive}>Archive</Button>}
                sort={sort}
                onSortChange={setSort}
                loading={loadingTable}
                empty={<EmptyState icon={Inbox} title="No matching orders" description="Try a different search." />}
              />
            </div>
          </Card>

          <Card>
            <CardHeader title="Forms" />
            <div className="grid gap-4 md:grid-cols-2">
              <TextField id="g-name" label="Product name" placeholder="Classic Döner" hint="Shown on the menu board" />
              <TextField id="g-price" label="Price" prefix="€" error="Price is required" />
              <Select id="g-loc" label="Location" placeholder="Choose a location" defaultValue="" options={[{ value: "emba", label: "Emba" }, { value: "paphos", label: "Paphos" }]} />
              <Textarea id="g-note" label="Kitchen note" />
              <div className="space-y-2">
                <Checkbox id="g-veg" label="Vegetarian" hint="Adds the leaf badge" />
                <Radio id="g-r1" name="g-size" label="Regular" defaultChecked />
                <Radio id="g-r2" name="g-size" label="Large" />
              </div>
              <div className="space-y-3">
                <Switch id="g-open" label="Store open" checked={storeOpen} onChange={setStoreOpen} />
                <SegmentedControl label="Portion" value={size} onChange={setSize} options={[{ value: "s", label: "S" }, { value: "m", label: "M" }, { value: "l", label: "L" }]} />
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="States" />
            <div className="grid gap-4 md:grid-cols-2">
              <Skeleton variant="card" />
              <Skeleton variant="text" lines={4} />
              <EmptyState icon={ClipboardList} title="No checklists due" description="Opening checks appear here at 09:00." />
              <ErrorState description="The supplier list could not be loaded." onRetry={() => {}} />
            </div>
          </Card>
        </LayoutSection>

        <LayoutSection variant="aside">
          <Card>
            <CardHeader title="Badges" />
            <div className="flex flex-wrap gap-2">
              {TONES.map((t) => (
                <Badge key={t} tone={t}>
                  {t}
                </Badge>
              ))}
              <Badge tone="success" icon={Leaf}>Veggie</Badge>
              <Badge tone="critical" icon={Flame}>Spicy</Badge>
            </div>
          </Card>
          <Banner tone="warning" title="Low stock: lamb" action={<Button size="sm" variant="secondary">Reorder</Button>}>
            2.4 kg left — below par level.
          </Banner>
          <Banner tone="info" title="New kiosk order" onDismiss={() => {}} />
          <Card>
            <CardHeader title="Today" />
            <div className="grid grid-cols-2 gap-4">
              <Stat label="Revenue" value={<PriceTag amount={1284.5} size="lg" />} delta={{ value: "+8%", trend: "up" }} />
              <Stat label="Avg ticket" value="4:12" delta={{ value: "-12s", trend: "down" }} />
            </div>
            <CardSection className="mt-4">
              <ProgressBar value={72} label="Daily target" />
            </CardSection>
          </Card>
          <Card>
            <CardHeader title="Details" />
            <DescriptionList
              items={[
                { term: "Price", description: <PriceTag amount={9.5} /> },
                { term: "Was", description: <PriceTag amount={11} strike /> },
                { term: "Shortcut", description: <Kbd>Esc</Kbd> },
              ]}
            />
            <CardSection className="mt-2">
              <div className="flex items-center gap-3">
                <Thumbnail alt="Döner box" />
                <Avatar name="Rico Meyer" />
                <Spinner label="Syncing" />
              </div>
            </CardSection>
          </Card>
          <OfflineBanner mode="local-mode" queuedCount={3} lastSync="14:02:11" />
          <Card>
            <CardHeader title="Operations Domain Components (v1.0)" description="FOH, KDS, HACCP & Peripherals" />
            <div className="space-y-6">
              <div>
                <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Status Badges</h4>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge status="online" />
                  <StatusBadge status="ready" />
                  <StatusBadge status="paid" />
                  <StatusBadge status="preparing" />
                  <StatusBadge status="waiting" />
                  <StatusBadge status="low-stock" />
                  <StatusBadge status="late" />
                  <StatusBadge status="failed" />
                  <StatusBadge status="offline" />
                  <StatusBadge status="sold-out" />
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Product Tiles (POS)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <ProductTile title="Classic German Döner" price={7.5} availability="available" description="Spit-roasted chicken/beef, red cabbage, garlic sauce" />
                  <ProductTile title="Halloumi Dürüm Box" price={8.2} availability="low-stock" stockCount={4} description="Crisp flatbread, grilled halloumi, herb salad" />
                  <ProductTile title="Spicy Garlic Döner" price={9.9} availability="sold-out" description="Seasonal special with chili garlic cream" />
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Kitchen Tickets & 72px Keypad</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                  <div className="space-y-3">
                    <OrderTicket
                      orderNumber="147"
                      channel="takeaway"
                      elapsedSeconds={140}
                      items={[
                        { name: "Classic Döner", quantity: 2, modifiers: ["NO ONION", "EXTRA GARLIC"] },
                        { name: "Crispy Fries", quantity: 1 },
                      ]}
                      onBump={() => {}}
                    />
                    <OrderTicket
                      orderNumber="142"
                      channel="dine-in"
                      elapsedSeconds={510}
                      items={[
                        { name: "Dürüm Plate", quantity: 1, modifiers: ["MILD SAUCE"] },
                        { name: "Ayran 250ml", quantity: 2 },
                      ]}
                      onBump={() => {}}
                    />
                  </div>
                  <div>
                    <NumericKeypad
                      value={keypadInput}
                      onDigit={(d) => setKeypadInput((prev) => (prev === "0" ? d : prev + d))}
                      onBackspace={() => setKeypadInput((prev) => (prev.length > 1 ? prev.slice(0, -1) : ""))}
                      onClear={() => setKeypadInput("")}
                      onSubmit={() => {}}
                      submitLabel="Tender Cash"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Statutory HACCP & Network Printers</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <HACCPReading
                    category="cold_storage"
                    temperature={3.2}
                    locationName="Walk-in Cold Room #1"
                    recordedBy="A. Müller"
                    timestamp="Today 14:15"
                  />
                  <HACCPReading
                    category="cooked_holding"
                    temperature={58.5}
                    locationName="Steam Table Hot Well"
                    recordedBy="M. Fischer"
                    timestamp="Today 14:10"
                    onCorrectiveAction={() => {}}
                  />
                  <PrinterStatus
                    name="Indoor Kitchen Thermal"
                    ipAddress="192.168.1.77"
                    port={9100}
                    status="online"
                    onTestPrint={() => {}}
                  />
                  <PrinterStatus
                    name="Outdoor Grill Receipt"
                    ipAddress="192.168.1.78"
                    port={9100}
                    status="offline"
                  />
                </div>
              </div>
            </div>
          </Card>
          <Card>
            <CardHeader title="Overlays" />
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => setModal(true)}>
                Open modal
              </Button>
              <Button variant="secondary" onClick={() => setSheet(true)}>
                Open sheet
              </Button>
              <ToastDemo />
            </div>
          </Card>
        </LayoutSection>
      </Layout>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="Edit item"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(false)}>
              Cancel
            </Button>
            <Button onClick={() => setModal(false)}>Save</Button>
          </>
        }
      >
        <div className="space-y-3">
          <TextField id="m-name" label="Name" defaultValue="Classic Döner" />
          <div className="flex items-center gap-2">
            <Menu label="Item actions" items={[{ id: "dup", label: "Duplicate", onSelect: () => {} }]} />
            <Button variant="critical" onClick={() => setConfirm(true)}>
              Delete…
            </Button>
          </div>
        </div>
      </Modal>
      <Modal
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Delete item?"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirm(false)}>
              Keep
            </Button>
            <Button variant="critical" onClick={() => setConfirm(false)}>
              Delete
            </Button>
          </>
        }
      >
        This cannot be undone.
      </Modal>
      <Sheet open={sheet} side="right" onClose={() => setSheet(false)} title="Cart">
        <EmptyState icon={Bell} title="Your cart is empty" />
      </Sheet>
    </Page>
  );
}

export function Gallery() {
  const [surface, setSurface] = useState<Surface>("admin");
  return (
    <SurfaceRoot key={surface} surface={surface}>
      <ToastProvider>
        <AppShell
          surface={surface}
          nav={[
            { href: "/dev/ui", label: "UI kit", icon: LayoutDashboard, active: true },
            { href: "/admin", label: "Admin", icon: ClipboardList },
          ]}
          topBarSlot={
            <label className="flex items-center gap-2 text-sm">
              <span>Density</span>
              <select aria-label="Density" value={surface} onChange={(e) => setSurface(e.target.value as Surface)} className="h-8 rounded-md bg-surface px-2 text-text">
                {SURFACES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
          }
        >
          <Showcase />
        </AppShell>
      </ToastProvider>
    </SurfaceRoot>
  );
}
