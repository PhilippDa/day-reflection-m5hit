import { useId } from "preact/hooks";
import { de } from "../../../i18n/de";
import { Button } from "../../primitives/Button";
import styles from "./ImportPreview.module.css";

export interface ImportPreviewProps {
  readonly days: number;
  readonly marks: number;
  readonly logItems: number;
  readonly onMerge: () => void;
  readonly onReplace: () => void;
  readonly onCancel: () => void;
}

/** Shows what a chosen backup file contains and asks how to apply it. */
export function ImportPreview({
  days,
  marks,
  logItems,
  onMerge,
  onReplace,
  onCancel,
}: ImportPreviewProps) {
  const headingId = useId();
  return (
    <section class={styles["panel"] ?? ""} aria-labelledby={headingId}>
      <h3 class={styles["heading"] ?? ""} id={headingId}>
        {de.settings.backup.importHeading}
      </h3>
      <p>{de.settings.backup.importSummary(days, marks, logItems)}</p>
      <p class={styles["hint"] ?? ""}>{de.settings.backup.importHint}</p>
      <div class={styles["actions"] ?? ""}>
        <Button variant="primary" onClick={onMerge}>
          {de.settings.backup.merge}
        </Button>
        <Button variant="danger" onClick={onReplace}>
          {de.settings.backup.replace}
        </Button>
        <Button onClick={onCancel}>{de.settings.backup.cancel}</Button>
      </div>
    </section>
  );
}
