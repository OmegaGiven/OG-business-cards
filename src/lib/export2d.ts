import jsPDF from "jspdf";
import { createQrMatrix } from "./qr";
import { CardElement, Design, getCardSize, getElementSize } from "../shared/design";

export function designToSvg(design: Design) {
  const size = getCardSize(design);
  const content = design.side.elements.map(elementToSvg).join("\n");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size.widthMm}mm" height="${size.heightMm}mm" viewBox="0 0 ${size.widthMm} ${size.heightMm}">
  <rect width="${size.widthMm}" height="${size.heightMm}" fill="${design.side.backgroundColor}" />
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

export async function exportPngFromDesign(design: Design) {
  const size = getCardSize(design);
  const svg = designToSvg(design);
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  const image = new Image();
  image.decoding = "async";
  const scale = 6;

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("Could not render SVG preview."));
    image.src = url;
  });

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(size.widthMm * scale);
  canvas.height = Math.round(size.heightMm * scale);
  const context = canvas.getContext("2d");
  if (!context) {
    URL.revokeObjectURL(url);
    throw new Error("Canvas export is not available.");
  }

  context.fillStyle = design.side.backgroundColor;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  URL.revokeObjectURL(url);
  downloadUrl(`${safeName(design.name)}.png`, canvas.toDataURL("image/png"));
}

export function exportPdf(design: Design) {
  const size = getCardSize(design);
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
  if (element.type === "qr") {
    const matrix = createQrMatrix(element.value);
    const moduleSize = element.widthMm / matrix.size;
    const modules = matrix.modules
      .map(({ row, col }) => `<rect x="${col * moduleSize}" y="${row * moduleSize}" width="${moduleSize}" height="${moduleSize}" />`)
      .join("");
    return `<g transform="${transform}" fill="${element.color}">${modules}</g>`;
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
