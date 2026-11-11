import Link from "next/link";
import { SurfaceRoot } from "@/ui";

export const metadata = { title: "MY GERMAN DÖNER — Staff" };

const LINKS = [
  { href: "/staff/checklists", title: "Shift checklists", text: "Opening, during-shift and closing tasks, temperatures and the stock count." },
  { href: "/admin/ads", title: "Screen ads", text: "Upload images and videos and choose what plays on each screen. Managers only." },
];

export default function HomePage() {
  return (
    <SurfaceRoot surface="staff">
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-6 px-4 py-10">
        <div>
          <p className="font-bold tracking-wide">MY <span className="text-accent">GERMAN</span> DÖNER</p>
          <h1 className="mt-2 text-[28px] font-bold leading-9">Staff systems</h1>
        </div>
        <nav aria-label="Staff systems" className="flex flex-col gap-3">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="rounded-lg border border-border bg-surface px-4 py-4 hover:border-accent focus-visible:outline focus-visible:outline-2">
              <span className="block text-lg font-semibold">{l.title}</span>
              <span className="block text-sm text-text-secondary">{l.text}</span>
            </Link>
          ))}
        </nav>
        <p className="text-sm text-text-secondary">Each screen asks you to sign in first.</p>
      </main>
    </SurfaceRoot>
  );
}
