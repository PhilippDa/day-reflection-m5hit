import { useState } from "preact/hooks";
import { PRESETS } from "../../../domain/presets";
import { de } from "../../../i18n/de";
import { PresetRow } from "../../patterns/PresetRow";
import { Button } from "../../primitives/Button";
import { useStore } from "../../StoreContext";
import styles from "./PresetGallery.module.css";

/** Starter trackers to tick. Nothing is ticked by default, health data least of all. */
export function PresetGallery() {
  const store = useStore();
  const [chosen, setChosen] = useState<readonly string[]>([]);
  const existing = new Set(store.trackers.value.map((tracker) => tracker.title));
  const available = PRESETS.filter((preset) => !existing.has(preset.title));

  if (available.length === 0) {
    return <p class={styles["hint"] ?? ""}>{de.gallery.allAdded}</p>;
  }
  return (
    <div class={styles["gallery"] ?? ""}>
      <ul class={styles["list"] ?? ""}>
        {available.map((preset) => (
          <li key={preset.key}>
            <PresetRow
              title={preset.title}
              icon={preset.icon}
              description={preset.description}
              kindLabel={de.gallery.kinds[preset.kind]}
              sensitiveLabel={preset.sensitive ? de.gallery.sensitive : ""}
              checked={chosen.includes(preset.key)}
              onChange={(checked) => {
                setChosen((current) =>
                  checked ? [...current, preset.key] : current.filter((key) => key !== preset.key),
                );
              }}
            />
          </li>
        ))}
      </ul>
      <Button
        variant="primary"
        disabled={chosen.length === 0}
        onClick={() => {
          store.addPresets(chosen);
          setChosen([]);
        }}
      >
        {de.gallery.add(chosen.length)}
      </Button>
    </div>
  );
}
