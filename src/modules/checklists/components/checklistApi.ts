// Browser calls for the checklist screens.
import type { EntryInput, Operator, StockStatusValue } from "../rules";
import type { Board, Phase, StockRow } from "../board.types";

export type ApiResult<T> = { ok: true; data: T } | { ok: false; status: number; code?: string; error: string };

async function call<T>(path: string, method = "GET", body?: unknown): Promise<ApiResult<T>> {
  try {
    const res = await fetch(path, {
      method,
      cache: "no-store",
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const json = (await res.json().catch(() => null)) as ({ error?: string; code?: string } & T) | null;
    if (res.ok && json) return { ok: true, data: json };
    return { ok: false, status: res.status, code: json?.code, error: json?.error ?? "Something went wrong. Try again." };
  } catch {
    return { ok: false, status: 0, error: "No connection. This was not saved. Check the network and try again." };
  }
}

export const fetchBoard = () => call<{ board: Board }>("/api/checklists/board");
export const fetchStock = () => call<{ stock: StockRow[] }>("/api/checklists/stock");
export const enterPin = (pin: string) => call<{ operator: Operator }>("/api/checklists/operator", "POST", { pin });
export const saveEntry = (itemId: string, input: EntryInput) => call(`/api/checklists/items/${itemId}/entry`, "PUT", input);
export const verifyItem = (itemId: string) => call(`/api/checklists/items/${itemId}/verify`, "POST");
export const checkIn = (sectionId: string) => call(`/api/checklists/sections/${sectionId}/check-in`, "POST");
export const finishRun = (station: string, phase: Phase) => call("/api/checklists/runs/finish", "POST", { station, phase });
export const setOpeningTime = (openingTime: string) => call("/api/checklists/settings/opening-time", "PUT", { openingTime });
export const saveStock = (input: { stockItemId: string; count?: number | null; status?: StockStatusValue | null }) => call("/api/checklists/stock", "PUT", input);
