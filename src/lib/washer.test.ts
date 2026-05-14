import { describe, expect, it } from "vitest";
import { createInitialWasherDesign, createWasherGeometry, washerToAsciiStl } from "./washer";

describe("washerToAsciiStl", () => {
  it("exports a washer as ASCII STL", () => {
    const washer = createInitialWasherDesign();
    const stl = washerToAsciiStl(washer);

    expect(stl).toContain("facet normal");
    expect(stl).toContain("endsolid");
    expect(stl).not.toContain("NaN");
  });

  it("creates geometry with an inner hole", () => {
    const washer = createInitialWasherDesign();
    const geometry = createWasherGeometry(washer);

    geometry.computeBoundingBox();
    expect(geometry.boundingBox?.max.x).toBeCloseTo((washer.outerDiameterMm - washer.toleranceMm) / 2, 1);
    expect(geometry.boundingBox?.min.x).toBeCloseTo(-(washer.outerDiameterMm - washer.toleranceMm) / 2, 1);
    geometry.dispose();
  });
});
