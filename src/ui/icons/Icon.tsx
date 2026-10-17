import { ICON_PATHS } from "./paths";
import styles from "./Icon.module.css";

export interface IconProps {
  /** A name from `ICON_PATHS`. Anything else, such as an emoji from older data, is shown as text. */
  readonly name: string;
  /** Extra class, for example to color or size it from a parent. */
  readonly class?: string;
}

/** A Material Symbols icon in the current text color, hidden from screen readers. */
export function Icon({ name, class: extra = "" }: IconProps) {
  const path = ICON_PATHS[name];
  const className = `${styles["icon"] ?? ""} ${extra}`.trim();
  if (path === undefined) {
    return (
      <span class={className} aria-hidden="true">
        {name}
      </span>
    );
  }
  return (
    <svg class={className} viewBox="0 -960 960 960" aria-hidden="true" focusable="false">
      <path d={path} />
    </svg>
  );
}
