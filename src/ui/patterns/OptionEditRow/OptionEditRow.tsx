import { de } from "../../../i18n/de";
import { MARKER_COLORS } from "../../../domain/palette";
import type { OptionPatch } from "../../../domain/trackers";
import type { Option } from "../../../domain/types";
import { SHAPE_IDS } from "../../../domain/schema";
import { Button } from "../../primitives/Button";
import { ConfirmButton } from "../../primitives/ConfirmButton";
import { Select } from "../../primitives/Select";
import { DraftTextField } from "../../primitives/DraftTextField";
import { ColorPalette } from "../ColorPalette";
import styles from "./OptionEditRow.module.css";
import { ICON_NAMES } from "../../../domain/icons";
import { iconName } from "../../../i18n/format";
import { IconPicker } from "../IconPicker";

export interface OptionEditRowProps {
  readonly option: Option;
  /** Habits pick a block shape for the board. */
  readonly showShape?: boolean;
  /** On how many days the option is picked. Above zero, deleting warns first. */
  readonly usedOnDays: number;
  readonly canDelete: boolean;
  readonly canMoveUp: boolean;
  readonly canMoveDown: boolean;
  readonly onChange: (patch: OptionPatch) => void;
  readonly onMove: (delta: number) => void;
  readonly onDelete: () => void;
}

/** One legend entry in the editor: name, icon, color, order and delete. */
export function OptionEditRow({
  option,
  showShape = false,
  usedOnDays,
  canDelete,
  canMoveUp,
  canMoveDown,
  onChange,
  onMove,
  onDelete,
}: OptionEditRowProps) {
  return (
    <section class={styles["row"] ?? ""} aria-label={option.label}>
      <div class={styles["fields"] ?? ""}>
        <DraftTextField
          label={de.editor.optionLabel}
          value={option.label}
          onCommit={(label) => {
            onChange({ label });
          }}
        />
        <IconPicker
          label={de.editor.optionIconLabel}
          value={option.icon}
          names={ICON_NAMES}
          nameOf={iconName}
          noneLabel={de.editor.iconNone}
          onChange={(icon) => {
            onChange({ icon });
          }}
        />
      </div>
      {showShape ? (
        <Select
          label={de.habits.shapeLabel}
          value={option.shape === "" ? "single" : option.shape}
          options={SHAPE_IDS.map((shape) => ({ value: shape, label: de.habits.shapes[shape] }))}
          onChange={(value) => {
            const shape = SHAPE_IDS.find((candidate) => candidate === value);
            if (shape) {
              onChange({ shape });
            }
          }}
        />
      ) : null}
      <ColorPalette
        label={de.editor.colorLabel}
        colors={MARKER_COLORS}
        value={option.color}
        colorName={(color) => de.editor.colors[color] ?? de.editor.otherColor}
        onChange={(color) => {
          onChange({ color });
        }}
      />
      <div class={styles["actions"] ?? ""}>
        <Button
          disabled={!canMoveUp}
          onClick={() => {
            onMove(-1);
          }}
        >
          {`↑ ${de.editor.moveUp}`}
        </Button>
        <Button
          disabled={!canMoveDown}
          onClick={() => {
            onMove(1);
          }}
        >
          {`↓ ${de.editor.moveDown}`}
        </Button>
        <ConfirmButton
          label={de.editor.deleteOption}
          confirmLabel={de.editor.confirmDeleteOption}
          cancelLabel={de.editor.cancel}
          disabled={!canDelete}
          onConfirm={onDelete}
        />
      </div>
      {canDelete ? null : <p class={styles["hint"] ?? ""}>{de.editor.lastOption}</p>}
      {usedOnDays > 0 ? (
        <p class={styles["hint"] ?? ""}>{de.editor.usedOnDays(usedOnDays)}</p>
      ) : null}
    </section>
  );
}
