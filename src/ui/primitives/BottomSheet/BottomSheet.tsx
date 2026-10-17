import type { ComponentChildren } from "preact";
import { useEffect, useId, useRef } from "preact/hooks";
import styles from "./BottomSheet.module.css";

export interface BottomSheetProps {
  readonly title: string;
  readonly closeLabel: string;
  readonly onClose: () => void;
  readonly children: ComponentChildren;
}

/** A modal panel that slides up from the bottom. Escape and a tap on the backdrop close it. */
export function BottomSheet({ title, closeLabel, onClose, children }: BottomSheetProps) {
  const titleId = useId();
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeButton.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div class={styles["root"] ?? ""}>
      <div class={styles["backdrop"] ?? ""} aria-hidden="true" onClick={onClose} />
      <dialog open class={styles["sheet"] ?? ""} aria-modal="true" aria-labelledby={titleId}>
        <h2 class={styles["title"] ?? ""} id={titleId}>
          {title}
        </h2>
        <div class={styles["body"] ?? ""}>{children}</div>
        <button ref={closeButton} type="button" class={styles["close"] ?? ""} onClick={onClose}>
          {closeLabel}
        </button>
      </dialog>
    </div>
  );
}
