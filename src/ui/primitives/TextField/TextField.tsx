import { Field } from "../Field";
import styles from "./TextField.module.css";

export interface TextFieldProps {
  readonly label: string;
  readonly value: string;
  readonly onInput: (value: string) => void;
  readonly onBlur?: () => void;
  readonly placeholder?: string;
  readonly hideLabel?: boolean;
}

export function TextField({
  label,
  value,
  onInput,
  onBlur,
  placeholder,
  hideLabel,
}: TextFieldProps) {
  return (
    <Field label={label} hideLabel={hideLabel ?? false}>
      <input
        class={styles["control"] ?? ""}
        type="text"
        value={value}
        placeholder={placeholder}
        onBlur={onBlur}
        onInput={(event) => {
          onInput(event.currentTarget.value);
        }}
      />
    </Field>
  );
}
