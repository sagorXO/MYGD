// Manager screen: portrait-screen ads (images and videos on the 4 menu-board screens).
import { SurfaceRoot } from "@/ui";
import { AdsManager } from "@/modules/signage/ads/components/AdsManager";

export const metadata = { title: "Screen ads · MYGD admin" };

export default function AdminAdsPage() {
  return (
    <SurfaceRoot surface="admin" className="min-h-screen">
      <AdsManager />
    </SurfaceRoot>
  );
}
