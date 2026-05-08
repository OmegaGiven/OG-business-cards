import { describe, expect, it } from "vitest";
import { mmToPx, pxToMm } from "./design";

describe("millimeter pixel conversion", () => {
  it("round-trips values with a fixed scale", () => {
    expect(pxToMm(mmToPx(25.4, 8), 8)).toBe(25.4);
  });
});
