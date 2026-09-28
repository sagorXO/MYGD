import { notFound } from "next/navigation";
import { Gallery } from "./Gallery";

export const metadata = { title: "UI kit — MYGD" };

export default function DevUiPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <Gallery />;
}
