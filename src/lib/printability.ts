import { CardElement, Design, getCardSize, getElementSize, PRINT_DEFAULTS } from "../shared/design";

export interface PrintWarning {
  id: string;
  severity: "warning" | "error";
  message: string;
}

export function validatePrintability(design: Design): PrintWarning[] {
  const warnings: PrintWarning[] = [];
  const size = getCardSize(design);
  const elements = design.side.elements;

  if (design.thicknessMm < 0.8) {
    warnings.push({
      id: "thickness",
      severity: "error",
      message: "Card thickness is below 0.8mm.",
    });
  }

  for (const element of elements) {
    const bounds = getElementSize(element);
    if (bounds.widthMm < PRINT_DEFAULTS.minimumFeatureMm || bounds.heightMm < PRINT_DEFAULTS.minimumFeatureMm) {
      warnings.push({
        id: element.id,
        severity: "warning",
        message: `${labelFor(element)} has a feature thinner than ${PRINT_DEFAULTS.minimumFeatureMm}mm.`,
      });
    }

    if (element.xMm < 0 || element.yMm < 0 || element.xMm + bounds.widthMm > size.widthMm || element.yMm + bounds.heightMm > size.heightMm) {
      warnings.push({
        id: element.id,
        severity: "error",
        message: `${labelFor(element)} extends outside the card.`,
      });
    }

    if (element.mode === "engraved" && element.depthMm >= design.thicknessMm) {
      warnings.push({
        id: element.id,
        severity: "error",
        message: `${labelFor(element)} engraving is deeper than the card thickness.`,
      });
    }

    if (element.type === "text" && element.mode === "cut" && hasDetachedCutTextIslands(element.text)) {
      warnings.push({
        id: element.id,
        severity: "warning",
        message: `${labelFor(element)} has enclosed areas, so the preview and STL remove those island plastics for a printable full cut-through card.`,
      });
    }
  }

  for (let i = 0; i < elements.length; i += 1) {
    for (let j = i + 1; j < elements.length; j += 1) {
      if (gapBetween(elements[i], elements[j]) < PRINT_DEFAULTS.minimumGapMm) {
        warnings.push({
          id: `${elements[i].id}-${elements[j].id}`,
          severity: "warning",
          message: `Two details are closer than ${PRINT_DEFAULTS.minimumGapMm}mm.`,
        });
      }
    }
  }

  return warnings;
}

export function hasDetachedCutTextIslands(text: string) {
  return /[04689@AaBbDdeGgOoPpQqR]/.test(text);
}

function gapBetween(a: CardElement, b: CardElement) {
  const aSize = getElementSize(a);
  const bSize = getElementSize(b);
  const xGap = Math.max(0, Math.max(b.xMm - (a.xMm + aSize.widthMm), a.xMm - (b.xMm + bSize.widthMm)));
  const yGap = Math.max(0, Math.max(b.yMm - (a.yMm + aSize.heightMm), a.yMm - (b.yMm + bSize.heightMm)));
  return Math.sqrt(xGap * xGap + yGap * yGap);
}

function labelFor(element: CardElement) {
  if (element.type === "text") {
    return `"${element.text}"`;
  }
  if (element.type === "svg-logo") {
    return "SVG logo";
  }
  if (element.type === "qr") {
    return "QR code";
  }
  return "Shape";
}
