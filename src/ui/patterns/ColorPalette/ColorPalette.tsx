import styles from "./ColorPalette.module.css";

export interface ColorPaletteProps {
  readonly label: string;
  readonly colors: readonly string[];
  /** The current `#rrggbb`. A color outside `colors` is shown as an extra, selected swatch. */
  readonly value: string;
  /** Spoken name of a color, for example "Gelb". */
  readonly colorName: (color: string) => string;
  readonly onChange: (color: string) => void;
}

/** A grid of marker colors to pick from. Each swatch is a toggle button with a spoken name. */
export function ColorPalette({ label, colors, value, colorName, onChange }: ColorPaletteProps) {
  const shown = colors.includes(value) ? colors : [value, ...colors];
  return (
    <fieldset class={styles["group"] ?? ""}>
      <legend class={styles["legend"] ?? ""}>{label}</legend>
      <div class={styles["grid"] ?? ""}>
        {shown.map((color) => (
          <button
            key={color}
            type="button"
            class={`${styles["swatch"] ?? ""} ${color === value ? (styles["selected"] ?? "") : ""}`}
            style={{ "--swatch": color }}
            aria-label={colorName(color)}
            aria-pressed={color === value}
            onClick={() => {
              onChange(color);
            }}
          />
        ))}
      </div>
    </fieldset>
  );
}
