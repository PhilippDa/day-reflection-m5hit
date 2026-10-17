import styles from "./Checkbox.module.css";

export interface CheckboxProps {
  readonly label: string;
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
}

export function Checkbox({ label, checked, onChange }: CheckboxProps) {
  return (
    <label class={styles["row"] ?? ""}>
      <input
        class={styles["box"] ?? ""}
        type="checkbox"
        checked={checked}
        onChange={(event) => {
          onChange(event.currentTarget.checked);
        }}
      />
      <span class={checked ? (styles["done"] ?? "") : ""}>{label}</span>
    </label>
  );
}
