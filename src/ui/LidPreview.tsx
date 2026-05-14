import { createLidGeometries, LidDesign } from "../lib/lid";
import { GeometryPreview } from "./GeometryPreview";

export function LidPreview({ design }: { design: LidDesign }) {
  return (
    <GeometryPreview
      ariaLabel="3D lid preview"
      maxDimension={Math.max(design.diameterMm, design.widthMm, design.heightMm)}
      createGeometries={() => createLidGeometries(design)}
    />
  );
}
