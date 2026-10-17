import type { Option } from "../../../domain/types";
import { ColorSwatch } from "../../primitives/ColorSwatch";
import { ShapeIcon } from "../../primitives/ShapeIcon";
import styles from "./Legend.module.css";

export interface LegendItem {
  readonly id: string;
  readonly label: string;
  readonly color: string;
  readonly icon: string;
  /** Block shape of a habit. Replaces the color square when set. */
  readonly shape?: Option["shape"];
  readonly count: number;
}

export interface LegendProps {
  readonly items: readonly LegendItem[];
  /** Days that point at a deleted option. Shown as an extra gray line when above zero. */
  readonly unknownCount?: number;
  readonly unknownLabel: string;
}

/** The legend of a tracker with how often each option was used. */
export function Legend({ items, unknownCount = 0, unknownLabel }: LegendProps) {
  return (
    <ul class={styles["legend"] ?? ""}>
      {items.map((item) => (
        <li key={item.id} class={styles["item"] ?? ""}>
          {item.shape === undefined || item.shape === "" ? (
            <ColorSwatch color={item.color} />
          ) : (
            <ShapeIcon shape={item.shape} color={item.color} />
          )}
          <span class={styles["label"] ?? ""}>
            {item.icon === "" ? "" : `${item.icon} `}
            {item.label}
          </span>
          <span class={styles["count"] ?? ""}>{item.count}</span>
        </li>
      ))}
      {unknownCount > 0 ? (
        <li class={styles["item"] ?? ""}>
          <ColorSwatch color="#9a9a9a" />
          <span class={styles["label"] ?? ""}>{unknownLabel}</span>
          <span class={styles["count"] ?? ""}>{unknownCount}</span>
        </li>
      ) : null}
    </ul>
  );
}
