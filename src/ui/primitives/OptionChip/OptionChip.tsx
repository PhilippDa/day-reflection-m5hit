import type { Option } from "../../../domain/types";
import { ColorSwatch } from "../ColorSwatch";
import { ShapeIcon } from "../ShapeIcon";
import styles from "./OptionChip.module.css";
import { Icon } from "../../icons";

export interface OptionChipProps {
  readonly label: string;
  readonly color: string;
  /** Emoji shown in front of the label, left out when empty. */
  readonly icon?: string;
  /** Block shape of a habit. Replaces the color square when set. */
  readonly shape?: Option["shape"];
  readonly selected: boolean;
  readonly onClick: () => void;
}

/** A legend entry you can tap. A toggle: the pressed state is also announced to screen readers. */
export function OptionChip({
  label,
  color,
  icon = "",
  shape = "",
  selected,
  onClick,
}: OptionChipProps) {
  return (
    <button
      type="button"
      class={`${styles["chip"] ?? ""} ${selected ? (styles["selected"] ?? "") : ""}`}
      aria-pressed={selected}
      onClick={onClick}
    >
      {shape === "" ? <ColorSwatch color={color} /> : <ShapeIcon shape={shape} color={color} />}
      {icon === "" ? null : <Icon name={icon} />}
      <span>{label}</span>
      {selected ? <Icon name="check" class={styles["check"] ?? ""} /> : null}
    </button>
  );
}
