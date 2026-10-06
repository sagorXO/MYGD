import { SurfaceRoot } from "@/ui";
import { StoreProvider } from "./StoreContext";
import { SiteHeader } from "./SiteHeader";
import { Hero } from "./Hero";
import { MenuSection } from "./MenuSection";
import { Locations } from "./Locations";
import { SiteFooter } from "./SiteFooter";
import { MobileOrderBar } from "./MobileOrderBar";

export function HomePage() {
  return (
    <StoreProvider>
      <SurfaceRoot surface="order">
        <SiteHeader />
        <main>
          <Hero />
          <MenuSection />
          <Locations />
        </main>
        <SiteFooter />
        <MobileOrderBar />
      </SurfaceRoot>
    </StoreProvider>
  );
}
