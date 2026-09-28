"use client";

import type { ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { choiceClasses } from "@/ui/forms/Checkbox";
import { Skeleton } from "@/ui/primitives/Skeleton";

export interface Column<Row> {
  id: string;
  header: string;
  cell: (row: Row) => ReactNode;
  align?: "start" | "end";
  sortable?: boolean;
  width?: string;
}

export type SortState = { columnId: string; direction: "asc" | "desc" };

interface IndexTableProps<Row> {
  label: string;
  rows: Row[];
  rowKey: (row: Row) => string;
  columns: Column<Row>[];
  selectable?: boolean;
  selected?: Set<string>;
  onSelectionChange?: (next: Set<string>) => void;
  bulkActions?: ReactNode;
  sort?: SortState;
  onSortChange?: (sort: SortState) => void;
  loading?: boolean;
  empty?: ReactNode;
  onRowClick?: (row: Row) => void;
  className?: string;
}

const LOADING_ROWS = 5;
const NO_SELECTION: ReadonlySet<string> = new Set();

export function IndexTable<Row>({
  label,
  rows,
  rowKey,
  columns,
  selectable = false,
  selected = NO_SELECTION as Set<string>,
  onSelectionChange,
  bulkActions,
  sort,
  onSortChange,
  loading = false,
  empty,
  onRowClick,
  className,
}: IndexTableProps<Row>) {
  const keys = rows.map(rowKey);
  const allSelected = keys.length > 0 && keys.every((k) => selected.has(k));
  const toggleAll = () => onSelectionChange?.(allSelected ? new Set() : new Set(keys));
  const toggle = (k: string) => {
    const next = new Set(selected);
    if (next.has(k)) next.delete(k);
    else next.add(k);
    onSelectionChange?.(next);
  };
  const colSpan = columns.length + (selectable ? 1 : 0);

  return (
    <div className={cn("overflow-hidden rounded-lg bg-surface shadow-card", className)}>
      {selectable && selected.size > 0 && (
        <div className="flex items-center gap-3 border-b border-border-subtle bg-accent-subtle px-4 py-2 text-sm">
          <span className="font-medium text-accent-text">{selected.size} selected</span>
          {bulkActions}
        </div>
      )}
      <div className="overflow-x-auto">
        <table aria-label={label} aria-busy={loading || undefined} className="w-full border-collapse text-sm">
          <thead className="bg-canvas text-left text-text-secondary">
            <tr>
              {selectable && (
                <th scope="col" className="w-10 px-4 py-2">
                  <input type="checkbox" aria-label="Select all" checked={allSelected} onChange={toggleAll} className={choiceClasses(false)} />
                </th>
              )}
              {columns.map((c) => {
                const active = sort?.columnId === c.id;
                const ariaSort = active ? (sort?.direction === "asc" ? "ascending" : "descending") : undefined;
                const SortIcon = active ? (sort?.direction === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
                return (
                  <th
                    key={c.id}
                    scope="col"
                    aria-sort={ariaSort}
                    style={c.width ? { width: c.width } : undefined}
                    className={cn("px-4 py-2 font-medium", c.align === "end" && "text-right")}
                  >
                    {c.sortable && onSortChange ? (
                      <button
                        type="button"
                        onClick={() => onSortChange({ columnId: c.id, direction: active && sort?.direction === "asc" ? "desc" : "asc" })}
                        className="inline-flex items-center gap-1 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                      >
                        {c.header}
                        <SortIcon aria-hidden width={14} height={14} />
                      </button>
                    ) : (
                      c.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {loading &&
              Array.from({ length: LOADING_ROWS }, (_, i) => (
                <tr key={`loading-${i}`}>
                  <td colSpan={colSpan} className="p-0">
                    <Skeleton variant="table-row" />
                  </td>
                </tr>
              ))}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={colSpan} className="px-4 py-10 text-center text-text-secondary">
                  {empty ?? "Nothing to show"}
                </td>
              </tr>
            )}
            {!loading &&
              rows.map((row) => {
                const k = rowKey(row);
                const isSelected = selected.has(k);
                return (
                  <tr
                    key={k}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    tabIndex={onRowClick ? 0 : undefined}
                    onKeyDown={
                      onRowClick
                        ? (e) => {
                            if (e.target !== e.currentTarget) return;
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              onRowClick(row);
                            }
                          }
                        : undefined
                    }
                    className={cn("border-t border-border-subtle", onRowClick && "cursor-pointer hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus", isSelected && "bg-accent-subtle")}
                  >
                    {selectable && (
                      <td className="px-4 py-2" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" aria-label={`Select row ${k}`} checked={isSelected} onChange={() => toggle(k)} className={choiceClasses(false)} />
                      </td>
                    )}
                    {columns.map((c) => (
                      <td key={c.id} className={cn("px-4 py-2 text-text", c.align === "end" && "text-right tabular-nums")}>
                        {c.cell(row)}
                      </td>
                    ))}
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
