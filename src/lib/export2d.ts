import jsPDF from "jspdf";
import { CARD_SIZES, CardElement, Design, getElementSize } from "../shared/design";

export function designToSvg(design: Design, sideName: "front" | "back" = "front") {
  const size = CARD_SIZES[design.cardSize];
  const side = design.sides[sideName] ?? design.sides.front;
  const content = side.elements.map(elementToSvg).join("\n");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size.widthMm}mm" height="${size.heightMm}mm" viewBox="0 0 ${size.widthMm} ${size.heightMm}">
  <rect width="${size.widthMm}" height="${size.heightMm}" fill="${side.backgroundColor}" />
  ${content}
</svg>`;
}

export function downloadText(filename: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  downloadUrl(filename, url);
  URL.revokeObjectURL(url);
}

export function downloadUrl(filename: string, url: string) {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
}

export function exportPdf(design: Design) {
  const size = CARD_SIZES[design.cardSize];
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: [size.widthMm, size.heightMm],
  });
  const svg = designToSvg(design);
  pdf.html(svg, {
    callback: () => {
      pdf.save(`${safeName(design.name)}.pdf`);
    },
    x: 0,
    y: 0,
    width: size.widthMm,
    windowWidth: size.widthMm * 8,
  });
}

export function safeName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "business-card";
}

function elementToSvg(element: CardElement) {
  const transform = `translate(${element.xMm} ${element.yMm}) rotate(${element.rotationDeg})`;
  if (element.type === "text") {
    return `<text transform="${transform}" font-family="${escapeXml(element.fontFamily)}" font-size="${element.fontSizeMm}" fill="${element.color}">${escapeXml(element.text)}</text>`;
  }
  if (element.type === "svg-logo") {
    return `<path transform="${transform}" d="${escapeXml(element.svgPathData)}" fill="${element.color}" />`;
  }

  const size = getElementSize(element);
  if (element.type === "shape" && element.shape === "circle") {
    return `<ellipse transform="${transform}" cx="${size.widthMm / 2}" cy="${size.heightMm / 2}" rx="${size.widthMm / 2}" ry="${size.heightMm / 2}" fill="${element.color}" />`;
  }
  return `<rect transform="${transform}" width="${size.widthMm}" height="${size.heightMm}" fill="${element.color}" />`;
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
