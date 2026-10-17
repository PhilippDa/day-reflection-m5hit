import { useState } from "preact/hooks";
import { MARKER_COLORS } from "../../../domain/palette";
import { VIEWS_BY_KIND } from "../../../domain/schema";
import type { TrackerKind } from "../../../domain/types";
import { de } from "../../../i18n/de";
import { Button } from "../../primitives/Button";
import { TextField } from "../../primitives/TextField";
import { ToggleGroup } from "../../primitives/ToggleGroup";
import { useStore } from "../../StoreContext";
import styles from "./Editor.module.css";

const KINDS: readonly TrackerKind[] = ["choice", "habits", "log"];

export interface NewTrackerFormProps {
  /** Called with the id of the new tracker, so the editor can open it. */
  readonly onCreated: (trackerId: string) => void;
}

/** Name, emoji and kind: the three things that cannot be changed later (kind) or start every tracker. */
export function NewTrackerForm({ onCreated }: NewTrackerFormProps) {
  const store = useStore();
  const [title, setTitle] = useState("");
  const [icon, setIcon] = useState("✨");
  const [kind, setKind] = useState<TrackerKind>("choice");

  function create() {
    const view = VIEWS_BY_KIND[kind][0];
    const id = store.createTracker({
      title,
      icon,
      kind,
      view,
      options:
        kind === "log"
          ? []
          : [{ label: de.editor.defaultOption(1), color: MARKER_COLORS[0], icon: "", shape: "" }],
    });
    if (id !== null) {
      setTitle("");
      onCreated(id);
    }
  }

  return (
    <form
      class={styles["form"] ?? ""}
      onSubmit={(event) => {
        event.preventDefault();
        create();
      }}
    >
      <TextField
        label={de.editor.nameLabel}
        value={title}
        placeholder={de.create.namePlaceholder}
        onInput={setTitle}
      />
      <TextField label={de.editor.iconLabel} value={icon} onInput={setIcon} />
      <ToggleGroup
        label={de.create.kindLabel}
        options={KINDS.map((value) => ({ value, label: de.create.kinds[value] }))}
        value={kind}
        onChange={(value) => {
          const next = KINDS.find((candidate) => candidate === value);
          if (next) {
            setKind(next);
          }
        }}
      />
      <Button variant="primary" type="submit" disabled={title.trim() === ""}>
        {de.create.submit}
      </Button>
    </form>
  );
}
