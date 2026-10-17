import { Icon } from "../../icons";
import styles from "./IconPicker.module.css";

export interface IconPickerProps {
  /** Names the picker, for example "Symbol". */
  readonly label: string;
  /** The stored icon: a name from `names`, an older emoji, or empty. */
  readonly value: string;
  readonly names: readonly string[];
  /** Spoken name of an icon, for example "Regen". */
  readonly nameOf: (name: string) => string;
  /** Text of the choice that removes the icon. */
  readonly noneLabel: string;
  readonly onChange: (value: string) => void;
}

/** The current icon on a button that opens a grid of icons to tap, closing again after a pick. */
export function IconPicker({ label, value, names, nameOf, noneLabel, onChange }: IconPickerProps) {
  const current = value === "" ? noneLabel : names.includes(value) ? nameOf(value) : value;
  const shown = value === "" || names.includes(value) ? names : [value, ...names];
  return (
    <details class={styles["picker"] ?? ""}>
      <summary class={styles["summary"] ?? ""} aria-label={`${label}: ${current}`}>
        <span class={styles["label"] ?? ""}>{label}</span>
        {value === "" ? <span class={styles["none"] ?? ""}>–</span> : <Icon name={value} />}
      </summary>
      <fieldset class={styles["group"] ?? ""}>
        <legend class={styles["legend"] ?? ""}>{label}</legend>
        <div class={styles["grid"] ?? ""}>
          {[...(value === "" ? [] : [""]), ...shown].map((name) => (
            <button
              key={name}
              type="button"
              class={`${styles["choice"] ?? ""} ${name === value ? (styles["selected"] ?? "") : ""}`}
              aria-label={name === "" ? noneLabel : names.includes(name) ? nameOf(name) : name}
              aria-pressed={name === value}
              onClick={(event) => {
                onChange(name);
                event.currentTarget.closest("details")?.removeAttribute("open");
              }}
            >
              {name === "" ? <span aria-hidden="true">–</span> : <Icon name={name} />}
            </button>
          ))}
        </div>
      </fieldset>
    </details>
  );
}
