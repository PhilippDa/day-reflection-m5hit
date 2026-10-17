import styles from "./ToggleGroup.module.css";

export interface ToggleOption {
  readonly value: string;
  /** What is shown on the button. */
  readonly label: string;
  /** Spoken name when `label` alone is not enough, for example an emoji. */
  readonly name?: string;
}

export interface ToggleGroupProps {
  readonly label: string;
  readonly options: readonly ToggleOption[];
  readonly value: string | null;
  /** Tapping the selected option again reports `null`. */
  readonly onChange: (value: string | null) => void;
}

export function ToggleGroup({ label, options, value, onChange }: ToggleGroupProps) {
  return (
    <fieldset class={styles["group"] ?? ""}>
      <legend class={styles["legend"] ?? ""}>{label}</legend>
      <div class={styles["options"] ?? ""}>
        {options.map((option) => {
          const pressed = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              class={`${styles["option"] ?? ""} ${pressed ? (styles["pressed"] ?? "") : ""}`}
              aria-pressed={pressed}
              aria-label={option.name}
              onClick={() => {
                onChange(pressed ? null : option.value);
              }}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
