import { fireEvent, render, screen } from "@testing-library/preact";
import { describe, expect, it, vi } from "vitest";
import { TabBar } from "./TabBar";

const tabs = [
  { id: "a", label: "Eins" },
  { id: "b", label: "Zwei" },
] as const;

describe("TabBar", () => {
  it("is a named navigation that marks the active tab as current", () => {
    render(<TabBar label="Hauptnavigation" tabs={tabs} active="b" onSelect={() => undefined} />);
    expect(screen.getByRole("navigation", { name: "Hauptnavigation" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Zwei" }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("button", { name: "Eins" }).getAttribute("aria-current")).toBeNull();
  });

  it("reports the chosen tab", () => {
    const onSelect = vi.fn<(id: "a" | "b") => void>();
    render(<TabBar label="Navigation" tabs={tabs} active="a" onSelect={onSelect} />);
    fireEvent.click(screen.getByRole("button", { name: "Zwei" }));
    expect(onSelect).toHaveBeenCalledWith("b");
  });
});
