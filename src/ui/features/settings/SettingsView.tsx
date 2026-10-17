import { useId, useState } from "preact/hooks";
import type { ImportMode } from "../../../domain/merge";
import { de } from "../../../i18n/de";
import { formatDateTime } from "../../../i18n/format";
import { DayHeader } from "../../patterns/DayHeader";
import { ImportPreview } from "../../patterns/ImportPreview";
import { Button } from "../../primitives/Button";
import { FilePicker } from "../../primitives/FilePicker";
import { Notice } from "../../primitives/Notice";
import { useStore } from "../../StoreContext";
import { MyTrackers, NewTrackerForm, TrackerEditor } from "../editor";
import { PresetGallery } from "../presets";
import styles from "./SettingsView.module.css";

type Message = { readonly tone: "info" | "error"; readonly text: string };

export function SettingsView() {
  const store = useStore();
  const backupHeadingId = useId();
  const trackersHeadingId = useId();
  const [message, setMessage] = useState<Message | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const myHeadingId = useId();
  const createHeadingId = useId();
  const lastExportedAt = store.lastExportedAt.value;
  const pending = store.pendingImport.value;
  const importError = store.importError.value;

  async function exportBackup() {
    setMessage(null);
    const outcome = await store.exportBackup();
    if (outcome === "shared") {
      setMessage({ tone: "info", text: de.settings.backup.exported });
    } else if (outcome === "downloaded") {
      setMessage({ tone: "info", text: de.settings.backup.downloaded });
    } else if (outcome === "failed") {
      setMessage({ tone: "error", text: de.settings.backup.exportFailed });
    }
  }

  async function pickFile(file: File) {
    setMessage(null);
    try {
      store.readImport(await file.text());
    } catch {
      setMessage({ tone: "error", text: de.settings.backup.importReadFailed });
    }
  }

  async function applyImport(mode: ImportMode) {
    await store.confirmImport(mode);
    setMessage({ tone: "info", text: de.settings.backup.imported });
  }

  if (editing !== null) {
    return (
      <TrackerEditor
        trackerId={editing}
        onBack={() => {
          setEditing(null);
        }}
      />
    );
  }

  return (
    <main class={styles["page"] ?? ""}>
      <DayHeader title={de.settings.title} />

      <section class={styles["section"] ?? ""} aria-labelledby={myHeadingId}>
        <h2 class={styles["heading"] ?? ""} id={myHeadingId}>
          {de.myTrackers.heading}
        </h2>
        <MyTrackers onEdit={setEditing} />
      </section>

      <section class={styles["section"] ?? ""} aria-labelledby={createHeadingId}>
        <h2 class={styles["heading"] ?? ""} id={createHeadingId}>
          {de.create.heading}
        </h2>
        <NewTrackerForm onCreated={setEditing} />
      </section>

      <section class={styles["section"] ?? ""} aria-labelledby={trackersHeadingId}>
        <h2 class={styles["heading"] ?? ""} id={trackersHeadingId}>
          {de.settings.trackers.heading}
        </h2>
        <PresetGallery />
      </section>

      <section class={styles["section"] ?? ""} aria-labelledby={backupHeadingId}>
        <h2 class={styles["heading"] ?? ""} id={backupHeadingId}>
          {de.settings.backup.heading}
        </h2>
        <p>
          {lastExportedAt === null
            ? de.settings.backup.neverExported
            : de.settings.backup.lastExport(formatDateTime(lastExportedAt))}
        </p>
        <div class={styles["actions"] ?? ""}>
          <Button
            variant="primary"
            onClick={() => {
              void exportBackup();
            }}
          >
            {de.settings.backup.export}
          </Button>
          <FilePicker
            label={de.settings.backup.import}
            accept="application/json,.json"
            onPick={(file) => {
              void pickFile(file);
            }}
          />
        </div>
        {message ? <Notice tone={message.tone}>{message.text}</Notice> : null}
        {store.saveFailed.value ? <Notice tone="error">{de.errors.saveFailed}</Notice> : null}
        {importError ? (
          <Notice tone="error">
            {de.settings.backup.importErrors[importError.code]}
            {importError.code === "invalid" && importError.path !== ""
              ? ` (${importError.path})`
              : ""}
          </Notice>
        ) : null}
        {pending ? (
          <ImportPreview
            days={pending.summary.days}
            marks={pending.summary.marks}
            logItems={pending.summary.logItems}
            onMerge={() => {
              void applyImport("merge");
            }}
            onReplace={() => {
              void applyImport("replace");
            }}
            onCancel={store.cancelImport}
          />
        ) : null}
      </section>
    </main>
  );
}
