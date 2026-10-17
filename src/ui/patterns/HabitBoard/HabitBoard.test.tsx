import { render, screen } from "@testing-library/preact";
import { describe, expect, it } from "vitest";
import { layoutBoard, type HabitBoardItem } from "../../../domain/board";
import { HabitBoard } from "./HabitBoard";

const items: HabitBoardItem[] = [
  { key: "a", dateKey: "2026-10-01", optionId: "o1", shape: "o" },
  { key: "b", dateKey: "2026-10-02", optionId: "o2", shape: "single" },
];

describe("HabitBoard", () => {
  it("draws one rect per block cell, plus the playing field", () => {
    const { container } = render(
      <HabitBoard layout={layoutBoard(items)} colorOf={() => "#f6c945"} label="Board" />,
    );
    expect(container.querySelectorAll("g rect")).toHaveLength(5);
    expect(container.querySelectorAll("svg > rect")).toHaveLength(1);
  });

  it("is described by its label", () => {
    render(
      <HabitBoard layout={layoutBoard(items)} colorOf={() => "#f6c945"} label="Board: 2 Blöcke" />,
    );
    expect(screen.getByTitle("Board: 2 Blöcke")).toBeTruthy();
  });

  it("colors every block by its item", () => {
    const { container } = render(
      <HabitBoard
        layout={layoutBoard(items)}
        colorOf={(item) => (item.optionId === "o1" ? "#111111" : "#222222")}
        label="Board"
      />,
    );
    const styles = [...container.querySelectorAll("g")].map((g) => g.getAttribute("style") ?? "");
    expect(styles[0]).toContain("#111111");
    expect(styles[1]).toContain("#222222");
  });

  it("keeps a playing field for an empty month and grows with the stack", () => {
    const empty = render(
      <HabitBoard layout={layoutBoard([])} colorOf={() => "#fff"} label="Leer" />,
    );
    expect(empty.container.querySelector("svg")?.getAttribute("viewBox")).toBe("0 0 10 6");
    empty.unmount();
    const tall = layoutBoard(
      Array.from({ length: 30 }, (_unused, index) => ({
        key: `k${String(index)}`,
        dateKey: "2026-10-01",
        optionId: "o",
        shape: "i" as const,
      })),
    );
    const { container } = render(<HabitBoard layout={tall} colorOf={() => "#fff"} label="Voll" />);
    expect(container.querySelector("svg")?.getAttribute("viewBox")).toBe(
      `0 0 10 ${String(tall.height)}`,
    );
  });
});
