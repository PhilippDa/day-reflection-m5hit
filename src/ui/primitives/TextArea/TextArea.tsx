import { Field } from "../Field";
import styles from "./TextArea.module.css";

export interface TextAreaProps {
  readonly label: string;
  readonly value: string;
  readonly onInput: (value: string) => void;
  readonly placeholder?: string;
  readonly hideLabel?: boolean;
  readonly rows?: number;
}

export function TextArea({
  label,
  value,
  onInput,
  placeholder,
  hideLabel,
  rows = 3,
}: TextAreaProps) {
  return (
    <Field label={label} hideLabel={hideLabel ?? false}>
      <textarea
        class={styles["control"] ?? ""}
        rows={rows}
        value={value}
        placeholder={placeholder}
        onInput={(event) => {
          onInput(event.currentTarget.value);
        }}
      />
    </Field>
  );
}
