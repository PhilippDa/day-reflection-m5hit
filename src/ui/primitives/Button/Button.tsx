import type { ComponentChildren } from "preact";
import styles from "./Button.module.css";

export interface ButtonProps {
  readonly variant?: "primary" | "secondary" | "danger" | "ghost";
  readonly type?: "button" | "submit";
  readonly disabled?: boolean;
  readonly expanded?: boolean;
  readonly onClick?: () => void;
  readonly children: ComponentChildren;
}

export function Button({
  variant = "secondary",
  type = "button",
  disabled = false,
  expanded,
  onClick,
  children,
}: ButtonProps) {
  return (
    <button
      type={type}
      class={`${styles["button"] ?? ""} ${styles[variant] ?? ""}`}
      disabled={disabled}
      aria-expanded={expanded}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
