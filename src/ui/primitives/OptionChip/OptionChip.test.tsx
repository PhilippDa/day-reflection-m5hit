import { fireEvent, render, screen } from "@testing-library/preact";
import { describe, expect, it, vi } from "vitest";
import { OptionChip } from "./OptionChip";

describe("OptionChip", () => {
  it("is a toggle button named by its label, with the pressed state", () => {
    render(
      <OptionChip label="Sonnig" color="#f6c945" icon="☀️" selected onClick={() => undefined} />,
    );
    const chip = screen.getByRole("button", { name: /Sonnig/ });
    expect(chip.getAttribute("aria-pressed")).toBe("true");
  });

  it("is not pressed when not selected", () => {
    render(<OptionChip label="Regen" color="#8fd0f0" selected={false} onClick={() => undefined} />);
    expect(screen.getByRole("button", { name: "Regen" }).getAttribute("aria-pressed")).toBe(
      "false",
    );
  });

  it("calls back on a tap", () => {
    const onClick = vi.fn<() => void>();
    render(<OptionChip label="Regen" color="#8fd0f0" selected={false} onClick={onClick} />);
    fireEvent.click(screen.getByRole("button", { name: "Regen" }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("shows a block shape instead of the color square for a habit", () => {
    const { container } = render(
      <OptionChip
        label="Lesen"
        color="#4a90d9"
        shape="o"
        selected={false}
        onClick={() => undefined}
      />,
    );
    expect(container.querySelectorAll("svg rect")).toHaveLength(4);
  });
});
