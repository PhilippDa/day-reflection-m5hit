import styles from "./PresetRow.module.css";
import { Icon } from "../../icons";

export interface PresetRowProps {
  readonly title: string;
  readonly icon: string;
  readonly description: string;
  /** What the tracker records, for example "Eine Auswahl pro Tag". */
  readonly kindLabel: string;
  /** Marks health data. Left out when empty. */
  readonly sensitiveLabel?: string;
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
}

/** One starter tracker in the gallery, with a checkbox. */
export function PresetRow({
  title,
  icon,
  description,
  kindLabel,
  sensitiveLabel = "",
  checked,
  onChange,
}: PresetRowProps) {
  return (
    <label class={`${styles["row"] ?? ""} ${checked ? (styles["checked"] ?? "") : ""}`}>
      <input
        class={styles["box"] ?? ""}
        type="checkbox"
        checked={checked}
        onChange={(event) => {
          onChange(event.currentTarget.checked);
        }}
      />
      <span class={styles["icon"] ?? ""}>
        <Icon name={icon} />
      </span>
      <span class={styles["text"] ?? ""}>
        <span class={styles["title"] ?? ""}>{title}</span>
        <span class={styles["description"] ?? ""}>{description}</span>
        <span class={styles["meta"] ?? ""}>
          {kindLabel}
          {sensitiveLabel === "" ? "" : ` · ${sensitiveLabel}`}
        </span>
      </span>
    </label>
  );
}
