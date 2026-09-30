import { notFound } from "next/navigation";
import { HomePage } from "@/features/home/HomePage";

export default function HomePreview() {
  if (process.env.NODE_ENV === "production") notFound();
  return <HomePage />;
}
