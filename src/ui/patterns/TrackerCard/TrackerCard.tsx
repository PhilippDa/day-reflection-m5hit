import type { ComponentChildren } from "preact";
import { useId } from "preact/hooks";
import styles from "./TrackerCard.module.css";

export interface TrackerCardProps {
  readonly title: string;
  readonly icon: string;
  /** Text of a badge next to the title, for example "Offen". Left out when empty. */
  readonly badge?: string;
  readonly children: ComponentChildren;
}

/** One tracker on a page: emoji and title on top, its content below. */
export function TrackerCard({ title, icon, badge = "", children }: TrackerCardProps) {
  const headingId = useId();
  return (
    <section class={styles["card"] ?? ""} aria-labelledby={headingId}>
      <h2 class={styles["title"] ?? ""} id={headingId}>
        <span aria-hidden="true">{icon}</span> {title}
        {badge === "" ? null : <span class={styles["badge"] ?? ""}>{badge}</span>}
      </h2>
      <div class={styles["body"] ?? ""}>{children}</div>
    </section>
  );
}
