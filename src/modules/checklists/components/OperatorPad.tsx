"use client";

import { useState } from "react";
import { Banner, Modal, NumericKeypad } from "@/ui";
import type { Operator } from "../rules";
import { enterPin } from "./checklistApi";

interface OperatorPadProps {
  open: boolean;
  onClose: () => void;
  onSignedIn: (operator: Operator) => void;
}

export function OperatorPad({ open, onClose, onSignedIn }: OperatorPadProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const close = () => { setPin(""); setError(null); onClose(); };
  const submit = async () => {
    if (busy) return;
    setBusy(true);
    const res = await enterPin(pin);
    setBusy(false);
    setPin("");
    if (!res.ok) return setError(res.error);
    setError(null);
    onSignedIn(res.data.operator);
  };

  return (
    <Modal open={open} onClose={close} title="Enter your PIN" size="sm">
      <div className="flex flex-col items-center gap-3">
        {error && <Banner tone="critical" title={error} />}
        <NumericKeypad value={"•".repeat(pin.length) || " "} allowDecimal={false} submitLabel={busy ? "Checking" : "Continue"} onDigit={(d) => setPin((v) => (v.length < 8 ? v + d : v))} onBackspace={() => setPin((v) => v.slice(0, -1))} onClear={() => setPin("")} onSubmit={submit} />
      </div>
    </Modal>
  );
}
