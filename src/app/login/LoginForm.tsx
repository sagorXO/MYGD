"use client";

import { useState, type FormEvent } from "react";
import { Banner, Button, TextField } from "@/ui";

export function LoginForm({ next, notice }: { next: string; notice?: string }) {
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), pin }),
      });
      const data: { success?: boolean; error?: string } = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        setError(data.error ?? "Sign-in failed. Try again.");
        setPin("");
        return;
      }
      window.location.assign(next);
    } catch {
      setError("Can't reach the store server. Check the network and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      {notice && <Banner tone="warning" title={notice} />}
      {error && <Banner tone="critical" title={error} />}
      <TextField
        id="username"
        label="Username"
        autoComplete="username"
        autoCapitalize="none"
        spellCheck={false}
        required
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <TextField
        id="pin"
        label="PIN"
        type="password"
        inputMode="numeric"
        autoComplete="current-password"
        pattern="[0-9]{4,8}"
        maxLength={8}
        required
        value={pin}
        onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
      />
      <Button type="submit" variant="primary" size="lg" fullWidth loading={submitting} disabled={!username.trim() || pin.length < 4}>
        Sign in
      </Button>
    </form>
  );
}
