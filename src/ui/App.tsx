import { ChangeEvent, useMemo, useRef, useState } from "react";
import { ArrowDownToLine, BadgePlus, Box, Circle, CreditCard, Download, FileText, Image, Save, Square, Type } from "lucide-react";
import { Layer, Rect, Stage, Text as KonvaText } from "react-konva";
import QRCode from "qrcode";
import { authorizeStlExport, createStlCheckout, saveDesignToCloud } from "../lib/api";
import { designToSvg, downloadText, downloadUrl, exportPdf, safeName } from "../lib/export2d";
import { validatePrintability } from "../lib/printability";
import { extractSafeSvgPathData } from "../lib/sanitizeSvg";
import { designToAsciiStl } from "../lib/stl";
import { loadLocalDesign, loadUserEmail, saveLocalDesign, saveUserEmail } from "../lib/storage";
import {
  CARD_SIZES,
  CardElement,
  CardSideName,
  createInitialDesign,
  Design,
  getElementSize,
  mmToPx,
  PRINT_DEFAULTS,
  pxToMm,
} from "../shared/design";
import { ThreePreview } from "./ThreePreview";

const SCALE = 8;
const FONTS = ["Inter", "Arial", "Georgia", "Courier New", "Trebuchet MS"];

export function App() {
  const [design, setDesign] = useState<Design>(() => loadLocalDesign() ?? createInitialDesign());
  const [activeSide, setActiveSide] = useState<CardSideName>("front");
  const [selectedId, setSelectedId] = useState(design.sides.front.elements[0]?.id ?? "");
  const [email, setEmail] = useState(loadUserEmail());
  const [status, setStatus] = useState("");
  const stageRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const size = CARD_SIZES[design.cardSize];
  const side = design.sides[activeSide] ?? design.sides.front;
  const selected = side.elements.find((element) => element.id === selectedId);
  const warnings = useMemo(() => validatePrintability(design), [design]);

  function updateDesign(updater: (current: Design) => Design) {
    setDesign((current) => {
      const next = { ...updater(current), updatedAt: new Date().toISOString() };
      saveLocalDesign(next);
      return next;
    });
  }

  function updateSelected(patch: Partial<CardElement>) {
    if (!selected) {
      return;
    }
    updateDesign((current) => ({
      ...current,
      sides: {
        ...current.sides,
        [activeSide]: {
          ...side,
          elements: side.elements.map((element) =>
            element.id === selected.id ? ({ ...element, ...patch } as CardElement) : element,
          ),
        },
      },
    }));
  }

  function addText() {
    const element: CardElement = {
      id: crypto.randomUUID(),
      type: "text",
      text: "New text",
      fontFamily: "Inter",
      fontSizeMm: 4.2,
      xMm: 10,
      yMm: 10,
      rotationDeg: 0,
      color: "#1c1c1a",
      mode: "raised",
      depthMm: PRINT_DEFAULTS.raisedDepthMm,
    };
    appendElement(element);
  }

  function addShape(shape: "rect" | "circle") {
    const element: CardElement = {
      id: crypto.randomUUID(),
      type: "shape",
      shape,
      widthMm: 14,
      heightMm: 8,
      xMm: 12,
      yMm: 30,
      rotationDeg: 0,
      color: shape === "rect" ? "#cf4f35" : "#2f7c6b",
      mode: "raised",
      depthMm: PRINT_DEFAULTS.raisedDepthMm,
    };
    appendElement(element);
  }

  async function addQr() {
    const value = window.prompt("QR code value", "https://example.com");
    if (!value) {
      return;
    }
    await QRCode.toDataURL(value);
    const element: CardElement = {
      id: crypto.randomUUID(),
      type: "qr",
      value,
      widthMm: 14,
      heightMm: 14,
      xMm: 68,
      yMm: 29,
      rotationDeg: 0,
      color: "#1c1c1a",
      mode: "raised",
      depthMm: PRINT_DEFAULTS.raisedDepthMm,
    };
    appendElement(element);
  }

  function appendElement(element: CardElement) {
    updateDesign((current) => ({
      ...current,
      sides: {
        ...current.sides,
        [activeSide]: {
          ...side,
          elements: [...side.elements, element],
        },
      },
    }));
    setSelectedId(element.id);
  }

  async function importSvg(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    try {
      const svg = await file.text();
      const path = extractSafeSvgPathData(svg);
      appendElement({
        id: crypto.randomUUID(),
        type: "svg-logo",
        svgPathData: path,
        widthMm: 18,
        heightMm: 18,
        xMm: 62,
        yMm: 9,
        rotationDeg: 0,
        color: "#1c1c1a",
        mode: "raised",
        depthMm: PRINT_DEFAULTS.raisedDepthMm,
      });
      setStatus("SVG logo imported.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not import SVG.");
    } finally {
      event.target.value = "";
    }
  }

  async function saveCloud() {
    if (!email.includes("@")) {
      setStatus("Enter an email before saving to Cloudflare.");
      return;
    }
    saveUserEmail(email);
    await saveDesignToCloud(design, email);
    setStatus("Design saved.");
  }

  async function exportStl() {
    if (email.includes("@")) {
      const result = await authorizeStlExport(email);
      if (!result.allowed) {
        const checkout = await createStlCheckout(email);
        window.location.href = checkout.checkoutUrl;
        return;
      }
    }

    const stl = designToAsciiStl(design);
    downloadText(`${safeName(design.name)}.stl`, stl, "model/stl");
    setStatus(email.includes("@") ? "STL export authorized and downloaded." : "Local STL downloaded without cloud billing.");
  }

  function exportPng() {
    const url = stageRef.current?.toDataURL({ pixelRatio: 3 });
    if (url) {
      downloadUrl(`${safeName(design.name)}.png`, url);
    }
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div>
          <p className="eyebrow">OG Business Cards</p>
          <input
            className="title-input"
            value={design.name}
            onChange={(event) => updateDesign((current) => ({ ...current, name: event.target.value }))}
          />
        </div>

        <div className="field">
          <label>Email for saves and paid STL export</label>
          <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
        </div>

        <div className="segmented">
          <button className={activeSide === "front" ? "active" : ""} onClick={() => setActiveSide("front")}>Front</button>
          <button className={activeSide === "back" ? "active" : ""} onClick={() => setActiveSide("back")}>Back</button>
        </div>

        <div className="tool-grid">
          <IconButton label="Add text" icon={<Type size={18} />} onClick={addText} />
          <IconButton label="Rectangle" icon={<Square size={18} />} onClick={() => addShape("rect")} />
          <IconButton label="Circle" icon={<Circle size={18} />} onClick={() => addShape("circle")} />
          <IconButton label="QR code" icon={<BadgePlus size={18} />} onClick={addQr} />
          <IconButton label="SVG logo" icon={<Image size={18} />} onClick={() => fileInputRef.current?.click()} />
          <IconButton label="Save" icon={<Save size={18} />} onClick={saveCloud} />
        </div>
        <input ref={fileInputRef} type="file" accept=".svg,image/svg+xml" hidden onChange={importSvg} />

        <Controls selected={selected} updateSelected={updateSelected} />

        <div className="export-list">
          <button onClick={() => downloadText(`${safeName(design.name)}.svg`, designToSvg(design, activeSide), "image/svg+xml")}>
            <FileText size={17} /> SVG
          </button>
          <button onClick={exportPng}>
            <Download size={17} /> PNG
          </button>
          <button onClick={() => exportPdf(design)}>
            <FileText size={17} /> PDF
          </button>
          <button onClick={exportStl}>
            <Box size={17} /> STL
          </button>
          <button onClick={async () => email.includes("@") && (window.location.href = (await createStlCheckout(email)).checkoutUrl)}>
            <CreditCard size={17} /> Buy STL credit
          </button>
        </div>

        <p className="status">{status}</p>
      </aside>

      <section className="workspace">
        <div className="editor-header">
          <div>
            <strong>{size.label}</strong>
            <span>{size.widthMm}mm x {size.heightMm}mm x {design.thicknessMm}mm</span>
          </div>
          <label>
            Thickness
            <input
              type="number"
              min="0.8"
              step="0.1"
              value={design.thicknessMm}
              onChange={(event) => updateDesign((current) => ({ ...current, thicknessMm: Number(event.target.value) }))}
            />
          </label>
        </div>

        <div className="canvas-row">
          <div className="canvas-wrap">
            <Stage ref={stageRef} width={mmToPx(size.widthMm, SCALE)} height={mmToPx(size.heightMm, SCALE)}>
              <Layer>
                <Rect width={mmToPx(size.widthMm, SCALE)} height={mmToPx(size.heightMm, SCALE)} fill={side.backgroundColor} />
                {side.elements.map((element) => (
                  <DesignNode
                    key={element.id}
                    element={element}
                    selected={element.id === selectedId}
                    onSelect={() => setSelectedId(element.id)}
                    onDragEnd={(x, y) => updateSelectedPosition(element.id, x, y)}
                  />
                ))}
              </Layer>
            </Stage>
          </div>
          <ThreePreview design={design} />
        </div>

        <div className="warnings">
          {warnings.length === 0 ? (
            <span>Printability checks are clear.</span>
          ) : (
            warnings.map((warning) => (
              <button key={warning.id} className={warning.severity} onClick={() => setSelectedId(warning.id.split("-")[0])}>
                {warning.message}
              </button>
            ))
          )}
        </div>
      </section>
    </main>
  );

  function updateSelectedPosition(id: string, x: number, y: number) {
    updateDesign((current) => ({
      ...current,
      sides: {
        ...current.sides,
        [activeSide]: {
          ...side,
          elements: side.elements.map((element) =>
            element.id === id ? { ...element, xMm: pxToMm(x, SCALE), yMm: pxToMm(y, SCALE) } : element,
          ),
        },
      },
    }));
  }
}

function DesignNode(props: {
  element: CardElement;
  selected: boolean;
  onSelect: () => void;
  onDragEnd: (x: number, y: number) => void;
}) {
  const { element } = props;
  const size = getElementSize(element);
  const common = {
    x: mmToPx(element.xMm, SCALE),
    y: mmToPx(element.yMm, SCALE),
    rotation: element.rotationDeg,
    draggable: true,
    onClick: props.onSelect,
    onTap: props.onSelect,
    onDragEnd: (event: any) => props.onDragEnd(event.target.x(), event.target.y()),
    shadowColor: props.selected ? "#2f7c6b" : "transparent",
    shadowBlur: props.selected ? 8 : 0,
  };

  if (element.type === "text") {
    return (
      <KonvaText
        {...common}
        text={element.text}
        fontFamily={element.fontFamily}
        fontSize={mmToPx(element.fontSizeMm, SCALE)}
        fill={element.mode === "cut" ? "#ffffff" : element.color}
        stroke={element.mode === "cut" ? "#cf4f35" : undefined}
        strokeWidth={element.mode === "cut" ? 1 : 0}
      />
    );
  }

  return (
    <Rect
      {...common}
      width={mmToPx(size.widthMm, SCALE)}
      height={mmToPx(size.heightMm, SCALE)}
      fill={element.mode === "cut" ? "#ffffff" : element.color}
      stroke={element.mode === "cut" ? "#cf4f35" : props.selected ? "#2f7c6b" : undefined}
      strokeWidth={element.mode === "cut" || props.selected ? 2 : 0}
      cornerRadius={element.type === "shape" && element.shape === "circle" ? mmToPx(size.heightMm / 2, SCALE) : 2}
    />
  );
}

function Controls(props: { selected?: CardElement; updateSelected: (patch: Partial<CardElement>) => void }) {
  const { selected } = props;
  if (!selected) {
    return <div className="panel-empty">Select an element to edit it.</div>;
  }

  return (
    <div className="panel">
      <label>
        Mode
        <select value={selected.mode} onChange={(event) => props.updateSelected({ mode: event.target.value as CardElement["mode"] })}>
          <option value="raised">Raised</option>
          <option value="engraved">Engraved</option>
          <option value="cut">Cut through</option>
        </select>
      </label>
      <label>
        Color
        <input type="color" value={selected.color} onChange={(event) => props.updateSelected({ color: event.target.value })} />
      </label>
      <label>
        Depth mm
        <input type="number" min="0.1" step="0.1" value={selected.depthMm} onChange={(event) => props.updateSelected({ depthMm: Number(event.target.value) })} />
      </label>
      <label>
        Rotation
        <input type="number" value={selected.rotationDeg} onChange={(event) => props.updateSelected({ rotationDeg: Number(event.target.value) })} />
      </label>
      {selected.type === "text" && (
        <>
          <label>
            Text
            <input value={selected.text} onChange={(event) => props.updateSelected({ text: event.target.value } as Partial<CardElement>)} />
          </label>
          <label>
            Font
            <select value={selected.fontFamily} onChange={(event) => props.updateSelected({ fontFamily: event.target.value } as Partial<CardElement>)}>
              {FONTS.map((font) => <option key={font}>{font}</option>)}
            </select>
          </label>
          <label>
            Font size mm
            <input type="number" min="1" step="0.2" value={selected.fontSizeMm} onChange={(event) => props.updateSelected({ fontSizeMm: Number(event.target.value) } as Partial<CardElement>)} />
          </label>
        </>
      )}
      {"widthMm" in selected && (
        <>
          <label>
            Width mm
            <input type="number" min="1" step="0.5" value={selected.widthMm} onChange={(event) => props.updateSelected({ widthMm: Number(event.target.value) } as Partial<CardElement>)} />
          </label>
          <label>
            Height mm
            <input type="number" min="1" step="0.5" value={selected.heightMm} onChange={(event) => props.updateSelected({ heightMm: Number(event.target.value) } as Partial<CardElement>)} />
          </label>
        </>
      )}
    </div>
  );
}

function IconButton(props: { label: string; icon: React.ReactNode; onClick: () => void }) {
  return (
    <button className="icon-button" title={props.label} aria-label={props.label} onClick={props.onClick}>
      {props.icon}
    </button>
  );
}
