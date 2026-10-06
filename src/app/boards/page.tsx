import { redirect } from "next/navigation";

// [ADR] Context: the overhead menu screens are now run from ScreenyPro, a hosted signage service.
// Decision: /boards no longer renders our own board; it sends the screen to the ScreenyPro dashboard.
// Consequence: screens no longer follow our database (prices, sold-out, offers) automatically;
// the in-app board (src/modules/signage) is kept but unused by this route.
const SCREENYPRO_DASHBOARD = "https://screenypro.com/dashboard";

export default function MenuBoardsPage() {
  redirect(SCREENYPRO_DASHBOARD);
}
