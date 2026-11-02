// Calm brand slate shown when a portrait screen has nothing to play (never a blank or error screen).
export function AdSlate({ note }: { note?: string }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-[3%] bg-[var(--mygd-neutral-950)] text-center">
      <span aria-hidden="true" className="h-[0.4%] w-[15%] bg-[var(--mygd-brand-500)]" />
      <span className="font-bold uppercase leading-tight tracking-[0.06em] text-white" style={{ fontSize: "clamp(16px, 4.5cqh, 96px)" }}>
        My German
        <br />
        Döner
      </span>
      {note ? (
        <span className="whitespace-pre-line text-[var(--mygd-neutral-400)]" style={{ fontSize: "clamp(10px, 1.2cqh, 28px)" }}>
          {note}
        </span>
      ) : null}
    </div>
  );
}
