import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = { title: "MY GERMAN DÖNER · Screen" };

// Unattended screens: no site chrome, no cursor, nothing interactive.
export default function SignageLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
