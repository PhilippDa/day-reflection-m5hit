import styles from "./DayHeader.module.css";

export interface DayHeaderProps {
  readonly title: string;
  /** Left out of the page when empty. */
  readonly subtitle?: string;
}

export function DayHeader({ title, subtitle = "" }: DayHeaderProps) {
  return (
    <header class={styles["header"] ?? ""}>
      <h1 class={styles["title"] ?? ""}>{title}</h1>
      {subtitle === "" ? null : <p class={styles["subtitle"] ?? ""}>{subtitle}</p>}
    </header>
  );
}
