import { fireEvent, render, screen } from "@testing-library/preact";
import { describe, expect, it, vi } from "vitest";
import { DraftTextField } from "./DraftTextField";

describe("DraftTextField", () => {
  it("commits while typing", () => {
    const onCommit = vi.fn<(value: string) => void>();
    render(<DraftTextField label="Name" value="Wetter" onCommit={onCommit} />);
    fireEvent.input(screen.getByLabelText("Name"), { target: { value: "Wetter 2" } });
    expect(onCommit).toHaveBeenCalledWith("Wetter 2");
  });

  it("does not commit a blank value, and puts the saved value back on blur", () => {
    const onCommit = vi.fn<(value: string) => void>();
    render(<DraftTextField label="Name" value="Wetter" onCommit={onCommit} />);
    const input = screen.getByLabelText<HTMLInputElement>("Name");
    fireEvent.input(input, { target: { value: "  " } });
    expect(onCommit).not.toHaveBeenCalled();
    expect(input.value).toBe("  ");
    fireEvent.blur(input);
    expect(input.value).toBe("Wetter");
  });

  it("commits an empty value when that is allowed", () => {
    const onCommit = vi.fn<(value: string) => void>();
    render(<DraftTextField label="Symbol" value="☀️" allowEmpty onCommit={onCommit} />);
    fireEvent.input(screen.getByLabelText("Symbol"), { target: { value: "" } });
    expect(onCommit).toHaveBeenCalledWith("");
  });

  it("keeps a trailing space while typing", () => {
    render(<DraftTextField label="Name" value="Wetter" onCommit={() => undefined} />);
    const input = screen.getByLabelText<HTMLInputElement>("Name");
    fireEvent.input(input, { target: { value: "Wetter " } });
    expect(input.value).toBe("Wetter ");
  });
});
