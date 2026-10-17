import { useState } from "preact/hooks";
import { TextField } from "../TextField";

export interface DraftTextFieldProps {
  readonly label: string;
  /** The saved value. */
  readonly value: string;
  /** Called while typing, but only with values that are allowed. */
  readonly onCommit: (value: string) => void;
  /** When false (the default), a blank value is never committed and the field resets on blur. */
  readonly allowEmpty?: boolean;
  readonly hideLabel?: boolean;
  readonly placeholder?: string;
}

/**
 * A text field for data that must not become blank. It saves as you type, but while the field is
 * blank nothing is saved. Leaving it blank puts the saved value back.
 */
export function DraftTextField({
  label,
  value,
  onCommit,
  allowEmpty = false,
  hideLabel,
  placeholder,
}: DraftTextFieldProps) {
  const [draft, setDraft] = useState(value);
  return (
    <TextField
      label={label}
      value={draft}
      hideLabel={hideLabel ?? false}
      {...(placeholder === undefined ? {} : { placeholder })}
      onInput={(next) => {
        setDraft(next);
        if (allowEmpty || next.trim() !== "") {
          onCommit(next);
        }
      }}
      onBlur={() => {
        setDraft(value);
      }}
    />
  );
}
