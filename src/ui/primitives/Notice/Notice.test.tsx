import { render, screen } from "@testing-library/preact";
import { describe, expect, it } from "vitest";
import { Notice } from "./Notice";

describe("Notice", () => {
  it("announces an error as an alert", () => {
    render(<Notice tone="error">Kaputt</Notice>);
    expect(screen.getByRole("alert").textContent).toBe("Kaputt");
  });

  it("announces other tones politely as a status", () => {
    render(<Notice tone="warning">Achtung</Notice>);
    expect(screen.getByRole("status").textContent).toBe("Achtung");
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
