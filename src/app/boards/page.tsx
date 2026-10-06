import { SurfaceRoot } from "@/ui";
import { MenuBoard4K } from "@/modules/signage/components/MenuBoard4K";

export default function DigitalMenuBoardsPage() {
  return (
    <SurfaceRoot surface="board">
      <MenuBoard4K />
    </SurfaceRoot>
  );
}
