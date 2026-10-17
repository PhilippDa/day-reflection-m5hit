import { useState } from "preact/hooks";
import { Button } from "../Button";

export interface ConfirmButtonProps {
  readonly label: string;
  readonly confirmLabel: string;
  readonly cancelLabel: string;
  readonly onConfirm: () => void;
  readonly disabled?: boolean;
}

/** A destructive action that needs a second tap: first the label, then confirm or cancel. */
export function ConfirmButton({
  label,
  confirmLabel,
  cancelLabel,
  onConfirm,
  disabled = false,
}: ConfirmButtonProps) {
  const [confirming, setConfirming] = useState(false);
  if (!confirming) {
    return (
      <Button
        variant="ghost"
        disabled={disabled}
        onClick={() => {
          setConfirming(true);
        }}
      >
        {label}
      </Button>
    );
  }
  return (
    <>
      <Button variant="danger" onClick={onConfirm}>
        {confirmLabel}
      </Button>
      <Button
        onClick={() => {
          setConfirming(false);
        }}
      >
        {cancelLabel}
      </Button>
    </>
  );
}
