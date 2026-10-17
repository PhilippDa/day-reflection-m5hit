import type { ComponentChildren } from "preact";
import styles from "./Notice.module.css";

export interface NoticeProps {
  /** "error" is announced at once by screen readers, the others politely. */
  readonly tone?: "info" | "warning" | "error";
  readonly children: ComponentChildren;
}

export function Notice({ tone = "info", children }: NoticeProps) {
  const className = `${styles["notice"] ?? ""} ${styles[tone] ?? ""}`;
  return tone === "error" ? (
    <div class={className} role="alert">
      {children}
    </div>
  ) : (
    <output class={className}>{children}</output>
  );
}
