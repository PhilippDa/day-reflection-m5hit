import styles from "./StarRating.module.css";
import { Icon } from "../../icons";

export interface StarRatingProps {
  /** 0 to 5, where 0 means unrated. */
  readonly value: number;
  /** Names the group, for example "Bewertung". */
  readonly label: string;
  /** Accessible name of one star button, for example "3 Sterne". */
  readonly starLabel: (stars: number) => string;
  /** Tapping the current rating again clears it to 0. */
  readonly onChange: (value: number) => void;
}

const STARS = [1, 2, 3, 4, 5] as const;

/** Five stars to tap. Each one is a toggle button, so it works with keyboard and screen readers. */
export function StarRating({ value, label, starLabel, onChange }: StarRatingProps) {
  return (
    <fieldset class={styles["group"] ?? ""}>
      <legend class={styles["legend"] ?? ""}>{label}</legend>
      <div class={styles["stars"] ?? ""}>
        {STARS.map((stars) => (
          <button
            key={stars}
            type="button"
            class={`${styles["star"] ?? ""} ${stars <= value ? (styles["on"] ?? "") : ""}`}
            aria-label={starLabel(stars)}
            aria-pressed={stars === value}
            onClick={() => {
              onChange(stars === value ? 0 : stars);
            }}
          >
            <Icon name={stars <= value ? "star_fill" : "star"} />
          </button>
        ))}
      </div>
    </fieldset>
  );
}
