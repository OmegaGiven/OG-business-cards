import { describe, expect, it } from "vitest";
import { Box3 } from "three";
import { createInitialDesign } from "../shared/design";
import { createRaisedElementGeometries } from "./geometry3d";
import { designToAsciiStl } from "./stl";

describe("designToAsciiStl", () => {
  it("exports an ASCII STL with a base and raised geometry", () => {
    const design = createInitialDesign();
    const stl = designToAsciiStl(design);
    expect(stl).toContain("solid");
    expect(stl).toContain("facet normal");
    expect(stl).toContain("endsolid");
  });

  it("fits 3d text geometry into the same bounds used by the 2d editor", () => {
    const design = createInitialDesign();
    const text = design.side.elements.find((element) => element.type === "text");
    if (!text || text.type !== "text") {
      throw new Error("Initial design is missing text");
    }

    text.text = "WIDE";
    text.fontSizeMm = 5;
    design.side.elements = [text];
    const box = new Box3();
    for (const item of createRaisedElementGeometries(design)) {
      item.geometry.computeBoundingBox();
      box.union(item.geometry.boundingBox as Box3);
      item.geometry.dispose();
    }

    expect(box.max.x - box.min.x).toBeCloseTo(Math.max(8, text.text.length * text.fontSizeMm * 0.55), 1);
    expect(box.max.y - box.min.y).toBeCloseTo(text.fontSizeMm * 1.2, 1);
  });

  it("exports cut text that overlaps the card edge without bad geometry", () => {
    const design = createInitialDesign();
    design.side.elements = [
      {
        id: "edge-cut",
        type: "text",
        text: "EDGE",
        fontFamily: "Inter",
        fontSizeMm: 9,
        xMm: -8,
        yMm: 4,
        rotationDeg: 0,
        color: "#111111",
        mode: "cut",
        depthMm: 1.2,
      },
    ];

    const stl = designToAsciiStl(design);
    expect(stl).toContain("facet normal");
    expect(stl).not.toContain("NaN");
  });
});
