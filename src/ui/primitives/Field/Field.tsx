import type { ComponentChildren } from "preact";
import styles from "./Field.module.css";

export interface FieldProps {
  readonly label: string;
  /** Hides the label visually. Screen readers still announce it. */
  readonly hideLabel?: boolean;
  readonly children: ComponentChildren;
}

/** Wraps a form control in its label, so the two are always associated. */
export function Field({ label, hideLabel = false, children }: FieldProps) {
  return (
    <label class={styles["field"] ?? ""}>
      <span class={hideLabel ? (styles["hidden"] ?? "") : (styles["label"] ?? "")}>{label}</span>
      {children}
    </label>
  );
}
