import { fireEvent, render, screen } from "@testing-library/preact";
import { describe, expect, it, vi } from "vitest";
import { IconPicker } from "./IconPicker";

const names = ["sunny", "rainy"];
const nameOf = (name: string) => (name === "sunny" ? "Sonne" : "Regen");

function picker(value: string, onChange: (value: string) => void = () => undefined) {
  return render(
    <IconPicker
      label="Symbol"
      value={value}
      names={names}
      nameOf={nameOf}
      noneLabel="Kein Symbol"
      onChange={onChange}
    />,
  );
}

describe("IconPicker", () => {
  it("names the current icon on the summary and marks it in the grid", () => {
    const { container } = picker("rainy");
    expect(container.querySelector("summary")?.getAttribute("aria-label")).toBe("Symbol: Regen");
    expect(screen.getByRole("button", { name: "Regen" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "Sonne" }).getAttribute("aria-pressed")).toBe(
      "false",
    );
  });

  it("picks an icon and closes the grid", () => {
    const onChange = vi.fn<(value: string) => void>();
    const { container } = picker("rainy", onChange);
    const details = container.querySelector("details");
    details?.setAttribute("open", "");
    fireEvent.click(screen.getByRole("button", { name: "Sonne" }));
    expect(onChange).toHaveBeenCalledWith("sunny");
    expect(details?.hasAttribute("open")).toBe(false);
  });

  it("offers to remove the icon only when there is one", () => {
    const onChange = vi.fn<(value: string) => void>();
    const { unmount } = picker("sunny", onChange);
    fireEvent.click(screen.getByRole("button", { name: "Kein Symbol" }));
    expect(onChange).toHaveBeenCalledWith("");
    unmount();
    const empty = picker("");
    expect(empty.container.querySelector("summary")?.getAttribute("aria-label")).toBe(
      "Symbol: Kein Symbol",
    );
    expect(screen.queryByRole("button", { name: "Kein Symbol" })).toBeNull();
  });

  it("keeps an old emoji visible as an extra, selected choice", () => {
    picker("🌞");
    expect(screen.getByRole("button", { name: "🌞" }).getAttribute("aria-pressed")).toBe("true");
  });
});
