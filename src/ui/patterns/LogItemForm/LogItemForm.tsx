import { de } from "../../../i18n/de";
import { Button } from "../../primitives/Button";
import { ConfirmButton } from "../../primitives/ConfirmButton";
import { DateField } from "../../primitives/DateField";
import { StarRating } from "../../primitives/StarRating";
import { TextArea } from "../../primitives/TextArea";
import { TextField } from "../../primitives/TextField";
import styles from "./LogItemForm.module.css";

export interface LogItemValues {
  readonly title: string;
  readonly date: string;
  readonly rating: number;
  readonly note: string;
}

export interface LogItemFormProps {
  readonly values: LogItemValues;
  /** Latest day that can be picked. */
  readonly maxDate: string;
  readonly canSave: boolean;
  readonly onChange: (patch: Partial<LogItemValues>) => void;
  readonly onSave: () => void;
  /** Present when an existing item is edited. */
  readonly onDelete?: () => void;
}

/** The fields of a list entry. Holds no state: the caller owns the values. */
export function LogItemForm({
  values,
  maxDate,
  canSave,
  onChange,
  onSave,
  onDelete,
}: LogItemFormProps) {
  return (
    <form
      class={styles["form"] ?? ""}
      onSubmit={(event) => {
        event.preventDefault();
        if (canSave) {
          onSave();
        }
      }}
    >
      <TextField
        label={de.log.titleLabel}
        value={values.title}
        onInput={(title) => {
          onChange({ title });
        }}
      />
      <DateField
        label={de.log.dateLabel}
        value={values.date}
        max={maxDate}
        onInput={(date) => {
          onChange({ date });
        }}
      />
      <StarRating
        label={de.log.ratingLabel}
        value={values.rating}
        starLabel={de.log.star}
        onChange={(rating) => {
          onChange({ rating });
        }}
      />
      <TextArea
        label={de.log.noteLabel}
        value={values.note}
        onInput={(note) => {
          onChange({ note });
        }}
      />
      <div class={styles["actions"] ?? ""}>
        <Button variant="primary" type="submit" disabled={!canSave}>
          {de.log.save}
        </Button>
        {onDelete ? (
          <ConfirmButton
            label={de.log.delete}
            confirmLabel={de.log.confirmDelete}
            cancelLabel={de.log.cancel}
            onConfirm={onDelete}
          />
        ) : null}
      </div>
    </form>
  );
}
