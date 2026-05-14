import { describe, expect, it } from "vitest";
import { Box3 } from "three";
import { createInitialLidDesign, createLidGeometries, lidToAsciiStl } from "./lid";

describe("lidToAsciiStl", () => {
  it("exports a circular lid with printable geometry", () => {
    const lid = createInitialLidDesign();
    lid.shape = "round";

    const stl = lidToAsciiStl(lid);
    expect(stl).toContain("facet normal");
    expect(stl).toContain("endsolid");
    expect(stl).not.toContain("NaN");
  });

  it("exports a square lid with a top and rim pieces", () => {
    const lid = createInitialLidDesign();
    lid.shape = "square";
    const geometries = createLidGeometries(lid);

    expect(geometries).toHaveLength(5);
    for (const geometry of geometries) {
      geometry.dispose();
    }

    const stl = lidToAsciiStl(lid);
    expect(stl).toContain("facet normal");
    expect(stl).not.toContain("NaN");
  });

  it("expands outer-fit lids beyond the entered object size", () => {
    const lid = createInitialLidDesign();
    lid.shape = "square";
    lid.fit = "outer";
    lid.widthMm = 50;
    lid.heightMm = 30;
    lid.rimInsetMm = 1;
    lid.rimWallMm = 2;
    const box = new Box3();
    const geometries = createLidGeometries(lid);

    for (const geometry of geometries) {
      geometry.computeBoundingBox();
      box.union(geometry.boundingBox as Box3);
      geometry.dispose();
    }

    expect(box.max.x - box.min.x).toBeCloseTo(56.2, 1);
    expect(box.max.y - box.min.y).toBeCloseTo(36.2, 1);
  });
});
