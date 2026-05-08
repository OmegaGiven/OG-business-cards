export const CARD_SIZES = {
  "us-standard": {
    label: "US Standard",
    widthMm: 88.9,
    heightMm: 50.8,
  },
} as const;

export const PRINT_DEFAULTS = {
  thicknessMm: 1.2,
  raisedDepthMm: 0.6,
  engravedDepthMm: 0.4,
  minimumFeatureMm: 0.8,
  minimumGapMm: 0.6,
} as const;

export type CardSize = keyof typeof CARD_SIZES;
export type CardSideName = "front" | "back";
export type ElementMode = "raised" | "engraved" | "cut";

export interface Design {
  id: string;
  ownerId: string;
  name: string;
  cardSize: CardSize;
  thicknessMm: number;
  sides: {
    front: CardSide;
    back?: CardSide;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CardSide {
  backgroundColor: string;
  elements: CardElement[];
}

export type CardElement = TextElement | SvgLogoElement | ShapeElement | QrElement;

export interface BaseElement {
  id: string;
  xMm: number;
  yMm: number;
  rotationDeg: number;
  color: string;
  mode: ElementMode;
  depthMm: number;
}

export interface TextElement extends BaseElement {
  type: "text";
  text: string;
  fontFamily: string;
  fontSizeMm: number;
}

export interface SvgLogoElement extends BaseElement {
  type: "svg-logo";
  svgPathData: string;
  widthMm: number;
  heightMm: number;
}

export interface ShapeElement extends BaseElement {
  type: "shape";
  shape: "rect" | "circle";
  widthMm: number;
  heightMm: number;
}

export interface QrElement extends BaseElement {
  type: "qr";
  value: string;
  widthMm: number;
  heightMm: number;
}

export function createInitialDesign(): Design {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    ownerId: "local",
    name: "OG business card",
    cardSize: "us-standard",
    thicknessMm: PRINT_DEFAULTS.thicknessMm,
    sides: {
      front: {
        backgroundColor: "#f7f3e8",
        elements: [
          {
            id: crypto.randomUUID(),
            type: "text",
            text: "Your Name",
            fontFamily: "Inter",
            fontSizeMm: 6.4,
            xMm: 8,
            yMm: 15,
            rotationDeg: 0,
            color: "#1c1c1a",
            mode: "raised",
            depthMm: PRINT_DEFAULTS.raisedDepthMm,
          },
          {
            id: crypto.randomUUID(),
            type: "text",
            text: "Founder / Maker",
            fontFamily: "Inter",
            fontSizeMm: 3.4,
            xMm: 8,
            yMm: 23,
            rotationDeg: 0,
            color: "#46544a",
            mode: "raised",
            depthMm: PRINT_DEFAULTS.raisedDepthMm,
          },
          {
            id: crypto.randomUUID(),
            type: "shape",
            shape: "rect",
            widthMm: 20,
            heightMm: 8,
            xMm: 61,
            yMm: 14,
            rotationDeg: 0,
            color: "#cf4f35",
            mode: "cut",
            depthMm: PRINT_DEFAULTS.thicknessMm,
          },
        ],
      },
      back: {
        backgroundColor: "#1e2a2f",
        elements: [],
      },
    },
    createdAt: now,
    updatedAt: now,
  };
}

export function getElementSize(element: CardElement) {
  if (element.type === "text") {
    return {
      widthMm: Math.max(8, element.text.length * element.fontSizeMm * 0.55),
      heightMm: element.fontSizeMm * 1.2,
    };
  }
  return {
    widthMm: element.widthMm,
    heightMm: element.heightMm,
  };
}

export function mmToPx(mm: number, scale: number) {
  return mm * scale;
}

export function pxToMm(px: number, scale: number) {
  return px / scale;
}
