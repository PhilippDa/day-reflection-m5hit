import { useEffect, useState } from "preact/hooks";

/** The whole sequence should take about this long, however many cells there are. */
const TOTAL_MS = 1000;
/** Few cells should not crawl in. */
const MAX_STEP_MS = 40;
/** How long one cell takes to appear. Keep in sync with `intro.module.css`. */
const CELL_MS = 300;

/** Delay between two neighbours in the sequence. */
export function introStep(count: number): number {
  return count <= 0 ? 0 : Math.min(MAX_STEP_MS, TOTAL_MS / count);
}

/** Time until the last of `count` cells has finished appearing. */
export function introDuration(count: number): number {
  return introStep(count) * Math.max(count - 1, 0) + CELL_MS;
}

/** The inline style that gives a container its step. */
export function introVars(count: number): Record<string, string> {
  return { "--step": `${String(introStep(count))}ms` };
}

/**
 * True while the cells of a freshly shown view fade in, then false for good. Remount the component
 * (with a `key`) to play it again. The cells are visible without the intro class, so a tap later on
 * never replays or delays anything.
 */
export function useIntro(count: number): boolean {
  const [active, setActive] = useState(count > 0);
  useEffect(() => {
    const timer = setTimeout(() => {
      setActive(false);
    }, introDuration(count));
    return () => {
      clearTimeout(timer);
    };
    // Only the count at the moment the view appears matters.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return active;
}
