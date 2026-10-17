import { fireEvent, render, screen } from "@testing-library/preact";
import { describe, expect, it, vi } from "vitest";
import { TrackerListItem } from "./TrackerListItem";

describe("TrackerListItem", () => {
  it("is a button named by title and detail, and opens on tap", () => {
    const onOpen = vi.fn<() => void>();
    render(
      <TrackerListItem title="Wetter" icon="🌤️" detail="3 Tage eingetragen" onOpen={onOpen} />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Wetter.*3 Tage eingetragen/ }));
    expect(onOpen).toHaveBeenCalledOnce();
  });
});
