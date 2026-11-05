// Runs once when the server starts. A misconfigured production server must not start half-working.
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { readProductionEnv } = await import("@/lib/env-check");
  const problems = readProductionEnv(process.env);
  if (problems.length > 0) {
    console.error(`Refusing to start: ${problems.join(" ")}`);
    process.exit(1);
  }
}
