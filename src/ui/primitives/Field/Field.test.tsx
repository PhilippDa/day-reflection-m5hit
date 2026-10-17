import { render, screen } from "@testing-library/preact";
import { describe, expect, it } from "vitest";
import { Field } from "./Field";

describe("Field", () => {
  it("labels its control", () => {
    render(
      <Field label="Name">
        <input />
      </Field>,
    );
    expect(screen.getByLabelText("Name")).toBeTruthy();
  });

  it("keeps a hidden label available to assistive technology", () => {
    render(
      <Field label="Suche" hideLabel>
        <input />
      </Field>,
    );
    expect(screen.getByRole("textbox", { name: "Suche" })).toBeTruthy();
  });
});
