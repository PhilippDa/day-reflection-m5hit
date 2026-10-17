import { Field } from "../Field";
import styles from "./Select.module.css";

export interface SelectOption {
  readonly value: string;
  readonly label: string;
}

export interface SelectProps {
  readonly label: string;
  readonly value: string;
  readonly options: readonly SelectOption[];
  readonly onChange: (value: string) => void;
  readonly hideLabel?: boolean;
}

export function Select({ label, value, options, onChange, hideLabel }: SelectProps) {
  return (
    <Field label={label} hideLabel={hideLabel ?? false}>
      <select
        class={styles["control"] ?? ""}
        value={value}
        onChange={(event) => {
          onChange(event.currentTarget.value);
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}
