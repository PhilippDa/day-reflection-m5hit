import { fireEvent, render, screen } from "@testing-library/preact";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./Button";

describe("Button", () => {
  it("is a button with its text as the name and calls onClick", () => {
    const onClick = vi.fn<() => void>();
    render(<Button onClick={onClick}>Speichern</Button>);
    fireEvent.click(screen.getByRole("button", { name: "Speichern" }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("does not click when disabled", () => {
    const onClick = vi.fn<() => void>();
    render(
      <Button disabled onClick={onClick}>
        Speichern
      </Button>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Speichern" }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("does not submit forms unless asked to", () => {
    render(<Button>Normal</Button>);
    expect(screen.getByRole("button").getAttribute("type")).toBe("button");
  });

  it("exposes the expanded state", () => {
    render(<Button expanded>Mehr</Button>);
    expect(screen.getByRole("button").getAttribute("aria-expanded")).toBe("true");
  });
});
