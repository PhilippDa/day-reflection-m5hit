import type { ComponentChildren } from "preact";
import styles from "./TrackerListItem.module.css";

export interface TrackerListItemProps {
  readonly title: string;
  readonly icon: string;
  /** For example "12 Tage eingetragen". */
  readonly detail: string;
  readonly onOpen: () => void;
  /** Optional small preview under the text. */
  readonly children?: ComponentChildren;
}

/** One tracker on the overview: tap to open its detail screen. */
export function TrackerListItem({ title, icon, detail, onOpen, children }: TrackerListItemProps) {
  return (
    <button type="button" class={styles["item"] ?? ""} onClick={onOpen}>
      <span class={styles["icon"] ?? ""} aria-hidden="true">
        {icon}
      </span>
      <span class={styles["text"] ?? ""}>
        <span class={styles["title"] ?? ""}>{title}</span>
        <span class={styles["detail"] ?? ""}>{detail}</span>
        {children}
      </span>
      <span class={styles["chevron"] ?? ""} aria-hidden="true">
        ›
      </span>
    </button>
  );
}
