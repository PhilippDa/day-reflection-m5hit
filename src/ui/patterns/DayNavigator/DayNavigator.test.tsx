import { fireEvent, render, screen } from "@testing-library/preact";
import { describe, expect, it, vi } from "vitest";
import { DayNavigator, type DayNavigatorProps } from "./DayNavigator";

function setup(overrides: Partial<DayNavigatorProps> = {}) {
  const onPrevious = vi.fn<() => void>();
  const onNext = vi.fn<() => void>();
  const onToday = vi.fn<() => void>();
  render(
    <DayNavigator
      title="Heute"
      subtitle="Samstag, 17. Oktober 2026"
      isToday
      canGoNext={false}
      onPrevious={onPrevious}
      onNext={onNext}
      onToday={onToday}
      {...overrides}
    />,
  );
  return { onPrevious, onNext, onToday };
}

describe("DayNavigator", () => {
  it("shows the heading and moves to the previous day", () => {
    const { onPrevious } = setup();
    expect(screen.getByRole("heading", { level: 1, name: "Heute" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "‹ Vortag" }));
    expect(onPrevious).toHaveBeenCalledOnce();
  });

  it("cannot go forward from today and offers no way back to today", () => {
    setup();
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Folgetag ›" }).disabled).toBe(
      true,
    );
    expect(screen.queryByRole("button", { name: "Zu heute" })).toBeNull();
  });

  it("goes forward and back to today from a past day", () => {
    const { onNext, onToday } = setup({ isToday: false, canGoNext: true });
    fireEvent.click(screen.getByRole("button", { name: "Folgetag ›" }));
    fireEvent.click(screen.getByRole("button", { name: "Zu heute" }));
    expect(onNext).toHaveBeenCalledOnce();
    expect(onToday).toHaveBeenCalledOnce();
  });
});
