import { fireEvent, render, screen } from "@testing-library/preact";
import { describe, expect, it, vi } from "vitest";
import { LogItemRow } from "./LogItemRow";

const base = {
  title: "Wicked",
  date: "17. Oktober 2026",
  note: "",
  editLabel: "Bearbeiten: Wicked, 4 von 5 Sternen",
};

describe("LogItemRow", () => {
  it("is a button named for editing, and opens on tap", () => {
    const onEdit = vi.fn<() => void>();
    render(<LogItemRow {...base} rating={4} onEdit={onEdit} />);
    fireEvent.click(screen.getByRole("button", { name: "Bearbeiten: Wicked, 4 von 5 Sternen" }));
    expect(onEdit).toHaveBeenCalledOnce();
  });

  it("shows the stars, and none for an unrated entry", () => {
    const { container, rerender } = render(
      <LogItemRow {...base} rating={4} onEdit={() => undefined} />,
    );
    expect(container.querySelectorAll("svg")).toHaveLength(5);
    // The first four stars are filled, the fifth is an outline: their drawings differ.
    const paths = [...container.querySelectorAll("path")].map((path) => path.getAttribute("d"));
    expect(new Set(paths.slice(0, 4)).size).toBe(1);
    expect(paths[4]).not.toBe(paths[0]);
    rerender(<LogItemRow {...base} rating={0} onEdit={() => undefined} />);
    expect(container.querySelectorAll("svg")).toHaveLength(0);
    expect(screen.getByText("17. Oktober 2026")).toBeTruthy();
  });

  it("shows the note only when there is one", () => {
    const { rerender } = render(<LogItemRow {...base} rating={2} onEdit={() => undefined} />);
    expect(screen.queryByText("Schön traurig")).toBeNull();
    rerender(<LogItemRow {...base} rating={2} note="Schön traurig" onEdit={() => undefined} />);
    expect(screen.getByText("Schön traurig")).toBeTruthy();
  });
});
