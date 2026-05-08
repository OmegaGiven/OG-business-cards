import { describe, expect, it } from "vitest";
import { createInitialDesign } from "../shared/design";
import { validatePrintability } from "./printability";

describe("validatePrintability", () => {
  it("warns when card thickness is too thin", () => {
    const design = { ...createInitialDesign(), thicknessMm: 0.4 };
    expect(validatePrintability(design).some((warning) => warning.id === "thickness")).toBe(true);
  });

  it("errors when an element extends beyond the card", () => {
    const design = createInitialDesign();
    design.sides.front.elements[0].xMm = 200;
    expect(validatePrintability(design).some((warning) => warning.severity === "error")).toBe(true);
  });
});
