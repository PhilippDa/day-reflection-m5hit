import { cleanup } from "@testing-library/preact";
import { afterEach } from "vitest";

// Testing Library only cleans up automatically when test globals are on. They are off here.
afterEach(() => {
  cleanup();
});
