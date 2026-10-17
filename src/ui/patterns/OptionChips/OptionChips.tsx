import type { Option } from "../../../domain/types";
import { OptionChip } from "../../primitives/OptionChip";

export interface OptionChipsProps {
  readonly options: readonly Option[];
  /** Ids of the picked options. */
  readonly picked: readonly string[];
  readonly onToggle: (optionId: string) => void;
}

/** A tracker's legend as tappable chips. */
export function OptionChips({ options, picked, onToggle }: OptionChipsProps) {
  return (
    <>
      {options.map((option) => (
        <OptionChip
          key={option.id}
          label={option.label}
          color={option.color}
          icon={option.icon}
          shape={option.shape}
          selected={picked.includes(option.id)}
          onClick={() => {
            onToggle(option.id);
          }}
        />
      ))}
    </>
  );
}
