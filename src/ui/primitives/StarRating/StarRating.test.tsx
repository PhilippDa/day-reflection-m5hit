import { fireEvent, render, screen } from "@testing-library/preact";
import { describe, expect, it, vi } from "vitest";
import { StarRating } from "./StarRating";

function rating(value: number, onChange: (value: number) => void = () => undefined) {
  render(
    <StarRating
      value={value}
      label="Bewertung"
      starLabel={(stars) => `${String(stars)} Sterne`}
      onChange={onChange}
    />,
  );
}

describe("StarRating", () => {
  it("is a group of five toggle buttons with the current rating pressed", () => {
    rating(3);
    expect(screen.getByRole("group", { name: "Bewertung" })).toBeTruthy();
    expect(screen.getAllByRole("button")).toHaveLength(5);
    expect(screen.getByRole("button", { name: "3 Sterne" }).getAttribute("aria-pressed")).toBe(
      "true",
    );
    expect(screen.getByRole("button", { name: "4 Sterne" }).getAttribute("aria-pressed")).toBe(
      "false",
    );
  });

  it("reports the tapped star", () => {
    const onChange = vi.fn<(value: number) => void>();
    rating(0, onChange);
    fireEvent.click(screen.getByRole("button", { name: "4 Sterne" }));
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it("clears the rating when the current star is tapped again", () => {
    const onChange = vi.fn<(value: number) => void>();
    rating(4, onChange);
    fireEvent.click(screen.getByRole("button", { name: "4 Sterne" }));
    expect(onChange).toHaveBeenCalledWith(0);
  });

  it("shows no pressed star for an unrated item", () => {
    rating(0);
    for (const button of screen.getAllByRole("button")) {
      expect(button.getAttribute("aria-pressed")).toBe("false");
    }
  });
});
