import React from "react";

export type HaccpCategory = "cold_storage" | "cooked_holding";

export interface HaccpValidationResult {
  pass: boolean;
  label: string;
}

export function validateHaccpTemperature(
  category: HaccpCategory | string,
  temperature: number
): HaccpValidationResult {
  if (category === "cold_storage") {
    if (temperature >= 0.0 && temperature <= 5.0) {
      return { pass: true, label: "Within range (0–5°C)" };
    }
    return { pass: false, label: "Outside permitted range — Corrective action required" };
  }

  if (category === "cooked_holding") {
    if (temperature >= 63.0) {
      return { pass: true, label: "Within range (≥63°C)" };
    }
    return { pass: false, label: "Below holding threshold — Corrective action required" };
  }

  return { pass: true, label: "Temperature logged" };
}

export interface HACCPReadingProps {
  category: HaccpCategory | string;
  temperature: number;
  locationName?: string;
  recordedBy?: string;
  timestamp?: string;
  onCorrectiveAction?: () => void;
  className?: string;
}

export function HACCPReading({
  category,
  temperature,
  locationName,
  recordedBy,
  timestamp,
  onCorrectiveAction,
  className = "",
}: HACCPReadingProps): React.JSX.Element {
  const result = validateHaccpTemperature(category, temperature);

  return (
    <div
      data-haccp-pass={result.pass}
      role="region"
      aria-label="HACCP Temperature Reading"
      className={`p-4 rounded-xl border transition-all ${
        result.pass
          ? "bg-surface border-border text-text"
          : "bg-danger-subtle border-danger text-danger"
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          {locationName && (
            <h4 className="font-semibold text-sm text-text-secondary uppercase tracking-wider">
              {locationName}
            </h4>
          )}
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-bold tabular-nums tracking-tight">
              {temperature.toFixed(1)}°C
            </span>
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                result.pass
                  ? "bg-success-subtle text-success border-success/30"
                  : "bg-danger text-on-accent border-transparent"
              }`}
            >
              {result.pass ? "PASS" : "FAIL"}
            </span>
          </div>
          <p className="text-xs mt-2 font-medium opacity-90">{result.label}</p>
        </div>

        <div className="text-right text-xs text-text-secondary tabular-nums space-y-0.5">
          {timestamp && <div>{timestamp}</div>}
          {recordedBy && <div>Staff: {recordedBy}</div>}
        </div>
      </div>

      {!result.pass && onCorrectiveAction && (
        <div className="mt-3 pt-3 border-t border-danger/30 flex justify-end">
          <button
            type="button"
            onClick={onCorrectiveAction}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-danger text-on-accent hover:opacity-90 active:scale-[0.98] transition-all"
          >
            Log Corrective Action
          </button>
        </div>
      )}
    </div>
  );
}
