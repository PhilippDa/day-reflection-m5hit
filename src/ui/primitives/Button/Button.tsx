import type { ComponentChildren } from "preact";
import styles from "./Button.module.css";

export interface ButtonProps {
  readonly variant?: "primary" | "secondary" | "danger" | "ghost";
  readonly type?: "button" | "submit";
  readonly disabled?: boolean;
  readonly expanded?: boolean;
  /** Only when the visible text alone does not say enough. */
  readonly label?: string;
  readonly onClick?: () => void;
  readonly children: ComponentChildren;
}

export function Button({
  variant = "secondary",
  type = "button",
  disabled = false,
  expanded,
  label,
  onClick,
  children,
}: ButtonProps) {
  return (
    <button
      type={type}
      class={`${styles["button"] ?? ""} ${styles[variant] ?? ""}`}
      disabled={disabled}
      aria-expanded={expanded}
      aria-label={label}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
