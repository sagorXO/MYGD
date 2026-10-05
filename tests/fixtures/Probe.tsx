export function Probe({ label }: { label: string }) {
  return <span data-probe={label}>{label}</span>;
}
