import type { ReadonlySignal } from "@preact/signals";
import { useState } from "preact/hooks";
import { de } from "../i18n/de";
import { LoadErrorView } from "./features/load-error";
import { SettingsView } from "./features/settings";
import { TodayView } from "./features/today";
import { TrackersView } from "./features/trackers";
import { Button } from "./primitives/Button";
import { Notice } from "./primitives/Notice";
import { TabBar } from "./primitives/TabBar";
import { useStore } from "./StoreContext";
import styles from "./App.module.css";

type Screen = "today" | "trackers" | "settings";

const TABS = [
  { id: "today", label: de.nav.today },
  { id: "trackers", label: de.nav.trackers },
  { id: "settings", label: de.nav.settings },
] as const;

export interface AppProps {
  /** Present when the app runs with a service worker. */
  readonly update?: { readonly available: ReadonlySignal<boolean>; readonly apply: () => void };
}

export function App({ update }: AppProps) {
  const store = useStore();
  const status = store.status.value;
  const reminder = store.backupReminder.value;
  const [screen, setScreen] = useState<Screen>("today");

  if (status === "error") {
    return <LoadErrorView />;
  }
  if (status === "loading") {
    return (
      <main>
        <output>{de.loading}</output>
      </main>
    );
  }
  return (
    <div class={styles["shell"] ?? ""}>
      {update?.available.value ? (
        <div class={styles["reminder"] ?? ""}>
          <Notice tone="info">
            {de.update.available}{" "}
            <Button variant="ghost" onClick={update.apply}>
              {de.update.action}
            </Button>
          </Notice>
        </div>
      ) : null}
      {reminder && screen !== "settings" ? (
        <div class={styles["reminder"] ?? ""}>
          <Notice tone="warning">
            {de.backupReminder[reminder]}{" "}
            <Button
              variant="ghost"
              onClick={() => {
                setScreen("settings");
              }}
            >
              {de.backupReminder.action}
            </Button>
          </Notice>
        </div>
      ) : null}
      {screen === "today" ? <TodayView /> : null}
      {screen === "trackers" ? <TrackersView /> : null}
      {screen === "settings" ? <SettingsView /> : null}
      <TabBar label={de.nav.label} tabs={TABS} active={screen} onSelect={setScreen} />
    </div>
  );
}
