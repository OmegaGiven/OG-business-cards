import { CARD_SIZES, CardElement, Design, getElementSize } from "../shared/design";

interface Box {
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
  depth: number;
}

export function designToAsciiStl(design: Design) {
  const size = CARD_SIZES[design.cardSize];
  const solids: string[] = [`solid ${design.name.replace(/\s+/g, "_")}`];
  const baseAreas = subtractCutouts(
    { x: 0, y: 0, z: 0, width: size.widthMm, height: size.heightMm, depth: design.thicknessMm },
    design.sides.front.elements.filter((element) => element.mode === "cut"),
  );
  for (const area of baseAreas) {
    solids.push(...boxToFacets(area));
  }

  for (const element of design.sides.front.elements) {
    if (element.mode === "raised") {
      solids.push(...raisedElementFacets(element, design.thicknessMm));
    }
  }

  solids.push(`endsolid ${design.name.replace(/\s+/g, "_")}`);
  return solids.join("\n");
}

function subtractCutouts(base: Box, cutElements: CardElement[]) {
  let boxes = [base];
  for (const element of cutElements) {
    const size = getElementSize(element);
    const cutout: Box = {
      x: element.xMm,
      y: element.yMm,
      z: 0,
      width: size.widthMm,
      height: size.heightMm,
      depth: base.depth,
    };
    boxes = boxes.flatMap((box) => subtractRectFromBox(box, cutout));
  }
  return boxes.filter((box) => box.width > 0.05 && box.height > 0.05);
}

function subtractRectFromBox(box: Box, cutout: Box): Box[] {
  const ix0 = Math.max(box.x, cutout.x);
  const iy0 = Math.max(box.y, cutout.y);
  const ix1 = Math.min(box.x + box.width, cutout.x + cutout.width);
  const iy1 = Math.min(box.y + box.height, cutout.y + cutout.height);

  if (ix0 >= ix1 || iy0 >= iy1) {
    return [box];
  }

  const x0 = box.x;
  const x1 = box.x + box.width;
  const y0 = box.y;
  const y1 = box.y + box.height;

  return [
    { ...box, x: x0, y: y0, width: x1 - x0, height: iy0 - y0 },
    { ...box, x: x0, y: iy1, width: x1 - x0, height: y1 - iy1 },
    { ...box, x: x0, y: iy0, width: ix0 - x0, height: iy1 - iy0 },
    { ...box, x: ix1, y: iy0, width: x1 - ix1, height: iy1 - iy0 },
  ];
}

function raisedElementFacets(element: CardElement, baseThickness: number) {
  const size = getElementSize(element);
  return boxToFacets({
    x: element.xMm,
    y: element.yMm,
    z: baseThickness,
    width: size.widthMm,
    height: size.heightMm,
    depth: element.depthMm,
  });
}

function boxToFacets(box: Box) {
  const x0 = box.x;
  const x1 = box.x + box.width;
  const y0 = box.y;
  const y1 = box.y + box.height;
  const z0 = box.z;
  const z1 = box.z + box.depth;
  const v = {
    nbl: [x0, y0, z0],
    nbr: [x1, y0, z0],
    ntl: [x0, y1, z0],
    ntr: [x1, y1, z0],
    fbl: [x0, y0, z1],
    fbr: [x1, y0, z1],
    ftl: [x0, y1, z1],
    ftr: [x1, y1, z1],
  } as const;

  return [
    facet([0, 0, -1], v.nbl, v.ntl, v.ntr),
    facet([0, 0, -1], v.nbl, v.ntr, v.nbr),
    facet([0, 0, 1], v.fbl, v.fbr, v.ftr),
    facet([0, 0, 1], v.fbl, v.ftr, v.ftl),
    facet([0, -1, 0], v.nbl, v.nbr, v.fbr),
    facet([0, -1, 0], v.nbl, v.fbr, v.fbl),
    facet([0, 1, 0], v.ntl, v.ftl, v.ftr),
    facet([0, 1, 0], v.ntl, v.ftr, v.ntr),
    facet([-1, 0, 0], v.nbl, v.fbl, v.ftl),
    facet([-1, 0, 0], v.nbl, v.ftl, v.ntl),
    facet([1, 0, 0], v.nbr, v.ntr, v.ftr),
    facet([1, 0, 0], v.nbr, v.ftr, v.fbr),
  ];
}

function facet(normal: readonly number[], a: readonly number[], b: readonly number[], c: readonly number[]) {
  return `facet normal ${normal.join(" ")}
  outer loop
    vertex ${a.join(" ")}
    vertex ${b.join(" ")}
    vertex ${c.join(" ")}
  endloop
endfacet`;
}
