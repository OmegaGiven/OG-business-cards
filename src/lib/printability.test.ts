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
    design.side.elements[0].xMm = 200;
    expect(validatePrintability(design).some((warning) => warning.severity === "error")).toBe(true);
  });

  it("warns when cut-through text has detached islands that will be removed", () => {
    const design = createInitialDesign();
    design.side.elements = [
      {
        id: "cut-text",
        type: "text",
        text: "BOB",
        fontFamily: "Inter",
        fontSizeMm: 5,
        xMm: 5,
        yMm: 5,
        rotationDeg: 0,
        color: "#111111",
        mode: "cut",
        depthMm: 1.2,
      },
    ];

    expect(validatePrintability(design).some((warning) => warning.id === "cut-text" && warning.severity === "warning")).toBe(true);
  });

  it("does not allow cut-through QR codes", () => {
    const design = createInitialDesign();
    design.side.elements = [
      {
        id: "qr-cut",
        type: "qr",
        value: "https://example.com",
        widthMm: 14,
        heightMm: 14,
        xMm: 5,
        yMm: 5,
        rotationDeg: 0,
        color: "#111111",
        mode: "cut",
        depthMm: 1.2,
      },
    ];

    expect(validatePrintability(design).some((warning) => warning.id === "qr-cut" && warning.severity === "error")).toBe(true);
  });

  it("uses nozzle and tolerance settings for feature and gap warnings", () => {
    const design = createInitialDesign();
    design.nozzleDiameterMm = 1;
    design.toleranceMm = 0.4;
    design.side.elements = [
      {
        id: "tiny",
        type: "shape",
        shape: "rect",
        widthMm: 1.5,
        heightMm: 1.5,
        xMm: 5,
        yMm: 5,
        rotationDeg: 0,
        color: "#111111",
        mode: "raised",
        depthMm: 0.6,
      },
      {
        id: "near",
        type: "shape",
        shape: "rect",
        widthMm: 5,
        heightMm: 5,
        xMm: 6.8,
        yMm: 5,
        rotationDeg: 0,
        color: "#111111",
        mode: "raised",
        depthMm: 0.6,
      },
    ];

    const warnings = validatePrintability(design);
    expect(warnings.some((warning) => warning.id === "tiny" && warning.message.includes("1mm nozzle"))).toBe(true);
    expect(warnings.some((warning) => warning.id === "tiny-near" && warning.message.includes("nozzle/tolerance"))).toBe(true);
  });
});
