import { Field } from "../Field";
import styles from "./DateField.module.css";

export interface DateFieldProps {
  readonly label: string;
  /** `YYYY-MM-DD`, or an empty string while the user clears the field. */
  readonly value: string;
  /** Latest day that can be picked, `YYYY-MM-DD`. */
  readonly max?: string;
  readonly onInput: (value: string) => void;
}

export function DateField({ label, value, max, onInput }: DateFieldProps) {
  return (
    <Field label={label} hideLabel={false}>
      <input
        class={styles["control"] ?? ""}
        type="date"
        value={value}
        max={max}
        onInput={(event) => {
          onInput(event.currentTarget.value);
        }}
      />
    </Field>
  );
}
