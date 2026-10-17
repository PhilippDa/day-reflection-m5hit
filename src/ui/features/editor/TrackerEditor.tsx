import { useId } from "preact/hooks";
import { MARKER_COLORS } from "../../../domain/palette";
import { VIEWS_BY_KIND } from "../../../domain/schema";
import { de } from "../../../i18n/de";
import { OptionEditRow } from "../../patterns/OptionEditRow";
import { Button } from "../../primitives/Button";
import { ConfirmButton } from "../../primitives/ConfirmButton";
import { DraftTextField } from "../../primitives/DraftTextField";
import { Select } from "../../primitives/Select";
import { useStore } from "../../StoreContext";
import styles from "./Editor.module.css";
import { ICON_NAMES } from "../../../domain/icons";
import { iconName } from "../../../i18n/format";
import { IconPicker } from "../../patterns/IconPicker";
import { Icon } from "../../icons";

export interface TrackerEditorProps {
  readonly trackerId: string;
  readonly onBack: () => void;
}

/** Edits one tracker: name, emoji, view, legend, and deletion. Changes are saved as you go. */
export function TrackerEditor({ trackerId, onBack }: TrackerEditorProps) {
  const store = useStore();
  const legendId = useId();
  const tracker = store.trackers.value.find((candidate) => candidate.id === trackerId);
  if (!tracker) {
    return (
      <main class={styles["page"] ?? ""}>
        <Button variant="ghost" label={de.editor.backLabel} onClick={onBack}>
          <Icon name="chevron_left" /> {de.editor.back}
        </Button>
      </main>
    );
  }
  const views = VIEWS_BY_KIND[tracker.kind];
  const usage = store.trackerUsage(tracker.id);

  function addOption() {
    if (!tracker) {
      return;
    }
    const used = new Set(tracker.options.map((option) => option.color));
    const color = MARKER_COLORS.find((candidate) => !used.has(candidate)) ?? MARKER_COLORS[0];
    store.addOption(tracker.id, {
      label: de.editor.defaultOption(tracker.options.length + 1),
      color,
      icon: "",
      shape: "",
    });
  }

  return (
    <main class={styles["page"] ?? ""}>
      <Button variant="ghost" label={de.editor.backLabel} onClick={onBack}>
        <Icon name="chevron_left" /> {de.editor.back}
      </Button>
      <h1 class={styles["title"] ?? ""}>{de.editor.title}</h1>

      <div class={styles["form"] ?? ""}>
        <DraftTextField
          label={de.editor.nameLabel}
          value={tracker.title}
          onCommit={(title) => {
            store.updateTracker(tracker.id, { title });
          }}
        />
        <IconPicker
          label={de.editor.iconLabel}
          value={tracker.icon}
          names={ICON_NAMES}
          nameOf={iconName}
          noneLabel={de.editor.iconNone}
          onChange={(icon) => {
            store.updateTracker(tracker.id, { icon });
          }}
        />
        {views.length > 1 ? (
          <Select
            label={de.editor.viewLabel}
            value={tracker.view}
            options={views.map((view) => ({ value: view, label: de.editor.views[view] }))}
            onChange={(value) => {
              const view = views.find((candidate) => candidate === value);
              if (view) {
                store.updateTracker(tracker.id, { view });
              }
            }}
          />
        ) : null}
      </div>

      {tracker.kind === "log" ? null : (
        <section class={styles["section"] ?? ""} aria-labelledby={legendId}>
          <h2 id={legendId}>{de.editor.legendHeading}</h2>
          <p class={styles["hint"] ?? ""}>{de.editor.legendHint}</p>
          <div class={styles["options"] ?? ""}>
            {tracker.options.map((option, index) => (
              <OptionEditRow
                key={option.id}
                option={option}
                showShape={tracker.kind === "habits"}
                usedOnDays={store.optionDays(tracker.id, option.id)}
                canDelete={tracker.options.length > 1}
                canMoveUp={index > 0}
                canMoveDown={index < tracker.options.length - 1}
                onChange={(patch) => {
                  store.updateOption(tracker.id, option.id, patch);
                }}
                onMove={(delta) => {
                  store.moveOption(tracker.id, option.id, delta);
                }}
                onDelete={() => {
                  store.deleteOption(tracker.id, option.id);
                }}
              />
            ))}
          </div>
          <Button onClick={addOption}>{de.editor.addOption}</Button>
        </section>
      )}

      <section class={styles["section"] ?? ""}>
        <p class={styles["hint"] ?? ""}>{de.editor.deleteWarning(usage.days, usage.items)}</p>
        <div class={styles["actions"] ?? ""}>
          <ConfirmButton
            label={de.editor.deleteTracker}
            confirmLabel={de.editor.confirmDeleteTracker}
            cancelLabel={de.editor.cancel}
            onConfirm={() => {
              store.deleteTracker(tracker.id);
              onBack();
            }}
          />
        </div>
      </section>
    </main>
  );
}
