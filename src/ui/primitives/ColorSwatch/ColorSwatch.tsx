import styles from "./ColorSwatch.module.css";

export interface ColorSwatchProps {
  /** `#rrggbb`, taken from the data. Applied as a custom property, never inline colors. */
  readonly color: string;
}

/** A small colored square with a dark outline, so white and pale colors stay visible. */
export function ColorSwatch({ color }: ColorSwatchProps) {
  return <span class={styles["swatch"] ?? ""} style={{ "--swatch": color }} aria-hidden="true" />;
}
