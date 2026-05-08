import { describe, expect, it } from "vitest";
import { createInitialDesign } from "../shared/design";
import { designToAsciiStl } from "./stl";

describe("designToAsciiStl", () => {
  it("exports an ASCII STL with a base and raised geometry", () => {
    const design = createInitialDesign();
    const stl = designToAsciiStl(design);
    expect(stl).toContain("solid");
    expect(stl).toContain("facet normal");
    expect(stl).toContain("endsolid");
  });
});
