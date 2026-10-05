import { SurfaceRoot, Card, Logo } from "@/ui";
import { safeNextPath } from "@/lib/auth/redirect";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Sign in — MYGD" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const next = safeNextPath(first(params.next));
  const notice = first(params.denied)
    ? "Your account can't open that page. Sign in with a manager account."
    : first(params.config)
      ? "Sign-in is not configured on this server (SESSION_SECRET). Contact the administrator."
      : undefined;

  return (
    <SurfaceRoot surface="admin" className="flex items-center justify-center bg-canvas p-6">
      <main className="w-full max-w-sm">
        <Card padding="md">
          <div className="mb-6 flex flex-col items-center gap-3 text-center">
            <Logo size={56} />
            <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-text">Staff sign in</h1>
          </div>
          <LoginForm next={next} notice={notice} />
        </Card>
      </main>
    </SurfaceRoot>
  );
}
