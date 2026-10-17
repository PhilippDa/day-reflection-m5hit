import { fireEvent, render, screen } from "@testing-library/preact";
import { describe, expect, it, vi } from "vitest";
import type { Option } from "../../../domain/types";
import { OptionChips } from "./OptionChips";

const options: Option[] = [
  { id: "a", label: "Sonnig", color: "#f6c945", icon: "", shape: "" },
  { id: "b", label: "Regen", color: "#8fd0f0", icon: "", shape: "" },
];

describe("OptionChips", () => {
  it("shows one chip per option and marks the picked ones", () => {
    render(<OptionChips options={options} picked={["b"]} onToggle={() => undefined} />);
    expect(screen.getByRole("button", { name: "Sonnig" }).getAttribute("aria-pressed")).toBe(
      "false",
    );
    expect(screen.getByRole("button", { name: "Regen" }).getAttribute("aria-pressed")).toBe("true");
  });

  it("reports the id of the tapped option", () => {
    const onToggle = vi.fn<(id: string) => void>();
    render(<OptionChips options={options} picked={[]} onToggle={onToggle} />);
    fireEvent.click(screen.getByRole("button", { name: "Regen" }));
    expect(onToggle).toHaveBeenCalledWith("b");
  });
});
