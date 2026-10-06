import { SurfaceRoot } from "@/ui";
import OrderClient from "./OrderClient";

export default function MobilePreOrderPage() {
  return (
    <SurfaceRoot surface="order">
      <OrderClient />
    </SurfaceRoot>
  );
}
