import React from "react";

export interface NumericKeypadProps {
  value?: string;
  onDigit: (digit: string) => void;
  onBackspace: () => void;
  onClear: () => void;
  onSubmit?: () => void;
  allowDecimal?: boolean;
  submitLabel?: string;
  className?: string;
}

export function NumericKeypad({
  value = "",
  onDigit,
  onBackspace,
  onClear,
  onSubmit,
  allowDecimal = true,
  submitLabel = "Confirm",
  className = "",
}: NumericKeypadProps): React.JSX.Element {
  const keys = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    [allowDecimal ? "." : "C", "0", "←"],
  ];

  return (
    <div
      data-keypad="operational"
      data-cell-min="72px"
      className={`flex flex-col gap-2 p-3 bg-canvas border border-border rounded-2xl w-full max-w-sm ${className}`}
    >
      {/* Display readout if value is provided */}
      {value !== undefined && (
        <div className="flex items-center justify-end px-4 py-3 bg-surface border border-border rounded-xl min-h-[56px]">
          <span className="text-2xl font-bold tabular-nums text-text tracking-wider">
            {value || "0"}
          </span>
        </div>
      )}

      {/* 3x4 Grid of 72px tactile keys */}
      <div className="grid grid-cols-3 gap-2">
        {keys.flat().map((k, idx) => {
          const isAction = k === "←" || k === "C";
          return (
            <button
              key={`${k}-${idx}`}
              type="button"
              onClick={() => {
                if (k === "←") onBackspace();
                else if (k === "C") onClear();
                else onDigit(k);
              }}
              className={`min-h-[72px] h-[72px] flex items-center justify-center rounded-xl text-xl font-bold select-none transition-colors active:scale-[0.97] border ${
                isAction
                  ? "bg-surface-hover text-text-secondary border-border hover:bg-surface-raised"
                  : "bg-surface text-text border-border hover:border-accent hover:bg-accent-subtle shadow-sm"
              }`}
            >
              {k}
            </button>
          );
        })}
      </div>

      {/* Bottom Submit Action if provided */}
      {onSubmit && (
        <button
          type="button"
          onClick={onSubmit}
          className="min-h-[56px] h-14 mt-1 flex items-center justify-center w-full bg-accent hover:bg-accent-hover active:scale-[0.98] text-on-accent font-bold text-lg rounded-xl shadow-sm transition-all"
        >
          {submitLabel}
        </button>
      )}
    </div>
  );
}
