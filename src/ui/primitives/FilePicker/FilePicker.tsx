import { useRef } from "preact/hooks";
import { Button } from "../Button";
import styles from "./FilePicker.module.css";

export interface FilePickerProps {
  readonly label: string;
  /** For example `application/json`. */
  readonly accept: string;
  readonly onPick: (file: File) => void;
}

/** A button that opens the system file chooser. The native input stays hidden. */
export function FilePicker({ label, accept, onPick }: FilePickerProps) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <>
      <Button
        onClick={() => {
          input.current?.click();
        }}
      >
        {label}
      </Button>
      <input
        ref={input}
        class={styles["input"] ?? ""}
        type="file"
        accept={accept}
        tabIndex={-1}
        aria-hidden="true"
        data-testid="file-input"
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          // Reset, so choosing the same file again still fires a change.
          event.currentTarget.value = "";
          if (file) {
            onPick(file);
          }
        }}
      />
    </>
  );
}
