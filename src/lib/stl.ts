import { createCardBaseGeometry, createRaisedElementGeometries, geometryToAsciiStl } from "./geometry3d";
import { Design } from "../shared/design";

export function designToAsciiStl(design: Design) {
  const geometries = [
    createCardBaseGeometry(design),
    ...createRaisedElementGeometries(design).map((item) => item.geometry),
  ];

  try {
    return geometryToAsciiStl(design.name, geometries);
  } finally {
    for (const geometry of geometries) {
      geometry.dispose();
    }
  }
}
