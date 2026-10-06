// Menu-board views derived from the single menu source (src/lib/menu/mygd-menu.ts).
// Used by the seed (writes MenuBoardConfig rows) and as the offline fallback for the screens.
import { MYGD_MENU_BOARDS, findMenuSection, allMenuItems, type MenuBoardDef } from "./mygd-menu";

export interface BoardItemView {
  readonly id: string;
  readonly sku: string;
  readonly name: string;
  readonly desc?: string;
  readonly price: number;
  readonly imageUrl: string;
  /** Section heading the item is printed under, e.g. "My Wraps". */
  readonly section: string;
  readonly sectionNote?: string;
  readonly isAvailable: boolean;
}

export function boardItems(board: MenuBoardDef): BoardItemView[] {
  const bySku = new Map(allMenuItems().map((i) => [i.sku, i]));
  return board.sectionSlugs.flatMap((slug) => {
    const section = findMenuSection(slug);
    if (!section) throw new Error(`Menu board ${board.screenNumber} references unknown section "${slug}"`);
    return section.items.map((item) => ({
      id: item.sku,
      sku: item.sku,
      name: item.name,
      desc: item.description,
      price: item.price,
      imageUrl: bySku.get(item.sku)?.imageUrl ?? section.imageUrl,
      section: section.name,
      sectionNote: section.note,
      isAvailable: true,
    }));
  });
}

/** Offline fallback for /boards (SignageScreenConfig shape). */
export function buildSignageScreens(now: string = new Date().toISOString()) {
  return Object.fromEntries(
    MYGD_MENU_BOARDS.map((board) => [
      board.screenNumber,
      {
        screenNumber: board.screenNumber,
        title: board.title,
        subtitle: board.subtitle,
        layoutType: board.layoutType,
        activeDaypart: "AUTO" as const,
        bannerMessage: board.bannerMessage,
        updatedAt: now,
        items: boardItems(board).map((i) => ({
          id: i.id,
          sku: i.sku,
          name: i.name,
          description: i.desc,
          priceEUR: i.price,
          imageUrl: i.imageUrl,
          isAvailable: i.isAvailable,
          section: i.section,
          sectionNote: i.sectionNote,
        })),
      },
    ]),
  );
}

/** Offline fallback for the admin board editor and /api/menuboards (MenuBoardScreenConfig shape). */
export function buildBoardConfigs() {
  return Object.fromEntries(
    MYGD_MENU_BOARDS.map((board) => [
      board.screenNumber,
      {
        slotId: board.screenNumber,
        screenNumber: board.screenNumber,
        title: board.title,
        subtitle: board.subtitle,
        layoutType: board.layoutType,
        activeDaypart: "AUTO",
        items: boardItems(board).map((i) => ({
          id: i.id,
          sku: i.sku,
          name: i.name,
          desc: i.desc,
          price: i.price,
          imageUrl: i.imageUrl,
          isAvailable: i.isAvailable,
          section: i.section,
          sectionNote: i.sectionNote,
        })),
      },
    ]),
  );
}

interface RawBoardItem {
  id?: string;
  sku?: string;
  name?: string;
  desc?: string;
  description?: string;
  price?: number;
  priceEUR?: number;
  imageUrl?: string;
  isAvailable?: boolean;
  isSoldOut?: boolean;
  section?: string;
  sectionNote?: string;
}

/** Normalises an item from /api/menuboards (stored as {desc, price}) to the signage shape. */
export function toSignageItem(raw: RawBoardItem, index: number) {
  return {
    id: raw.id ?? raw.sku ?? `item-${index}`,
    sku: raw.sku ?? raw.id ?? `item-${index}`,
    name: raw.name ?? "",
    description: raw.description ?? raw.desc,
    priceEUR: raw.priceEUR ?? raw.price ?? 0,
    imageUrl: raw.imageUrl,
    isAvailable: raw.isAvailable !== false && raw.isSoldOut !== true,
    section: raw.section,
    sectionNote: raw.sectionNote,
  };
}
