import { SurfaceRoot } from "@/ui";
import { SiteHeader } from "./SiteHeader";
import { Hero } from "./Hero";
import { MenuSection } from "./MenuSection";
import { Locations } from "./Locations";
import { SiteFooter } from "./SiteFooter";

export function HomePage() {
  return (
    <SurfaceRoot surface="order">
      <SiteHeader />
      <main>
        <Hero />
        <MenuSection />
        <Locations />
      </main>
      <SiteFooter />
    </SurfaceRoot>
  );
}
