export function extractSafeSvgPathData(svgText: string): string {
  const parser = new DOMParser();
  const document = parser.parseFromString(svgText, "image/svg+xml");
  if (document.querySelector("parsererror")) {
    throw new Error("Invalid SVG file.");
  }

  if (document.querySelector("script, foreignObject, iframe, object, embed")) {
    throw new Error("SVG contains unsupported active content.");
  }

  const path = document.querySelector("path[d]");
  const d = path?.getAttribute("d");
  if (!d) {
    throw new Error("MVP 3D export supports SVG files with at least one path.");
  }

  return d;
}
