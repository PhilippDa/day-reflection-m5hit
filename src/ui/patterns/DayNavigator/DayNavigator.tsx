import { de } from "../../../i18n/de";
import { Button } from "../../primitives/Button";
import { DayHeader } from "../DayHeader";
import styles from "./DayNavigator.module.css";

export interface DayNavigatorProps {
  readonly title: string;
  readonly subtitle?: string;
  readonly isToday: boolean;
  readonly canGoNext: boolean;
  readonly onPrevious: () => void;
  readonly onNext: () => void;
  readonly onToday: () => void;
}

/** The page heading plus buttons to move between days. */
export function DayNavigator({
  title,
  subtitle,
  isToday,
  canGoNext,
  onPrevious,
  onNext,
  onToday,
}: DayNavigatorProps) {
  return (
    <div class={styles["navigator"] ?? ""}>
      <DayHeader title={title} {...(subtitle === undefined ? {} : { subtitle })} />
      <div class={styles["buttons"] ?? ""}>
        <Button variant="secondary" onClick={onPrevious}>
          {`‹ ${de.dayNav.previous}`}
        </Button>
        <Button variant="secondary" disabled={!canGoNext} onClick={onNext}>
          {`${de.dayNav.next} ›`}
        </Button>
        {isToday ? null : (
          <Button variant="ghost" onClick={onToday}>
            {de.dayNav.today}
          </Button>
        )}
      </div>
    </div>
  );
}
