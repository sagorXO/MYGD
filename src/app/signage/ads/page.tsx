// Portrait-screen ad player: /signage/ads?screen=1..4 (the same numbers as the menu boards).
import { ScreenNumberSchema, AD_SCREEN_MIN, AD_SCREEN_MAX } from "@/modules/signage/ads/ads.schema";
import { AdPlayer } from "@/modules/signage/ads/components/AdPlayer";
import { AdSlate } from "@/modules/signage/ads/components/AdSlate";

export const dynamic = "force-dynamic";

export default async function SignageAdsPage({ searchParams }: { searchParams: Promise<{ screen?: string }> }) {
  const parsed = ScreenNumberSchema.safeParse((await searchParams).screen);
  if (!parsed.success) {
    return (
      <div className="fixed inset-0 cursor-none bg-black">
        <AdSlate note={`Add ?screen=${AD_SCREEN_MIN}–${AD_SCREEN_MAX} to this address`} />
      </div>
    );
  }
  return <AdPlayer screen={parsed.data} />;
}
