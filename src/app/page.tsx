import type { Metadata } from "next";
import { HomePage } from "@/features/home/HomePage";

export const metadata: Metadata = {
  title: "My German Döner — Berlin döner in Cyprus",
  description: "The first real German döner in Cyprus. See the menu, find our stores in Emba and Limassol, and order online.",
  robots: { index: true, follow: true },
};

export default function PublicSitePage() {
  return <HomePage />;
}
