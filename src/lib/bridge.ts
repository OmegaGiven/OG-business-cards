import { downloadBlob, safeName } from "./export2d";

const BRIDGE_URL_KEY = "og-modeler-bridge-url";

export function defaultBridgeUrl() {
  return `http://${window.location.hostname}:8787`;
}

export function loadBridgeUrl() {
  return localStorage.getItem(BRIDGE_URL_KEY) ?? defaultBridgeUrl();
}

export function saveBridgeUrl(url: string) {
  localStorage.setItem(BRIDGE_URL_KEY, url);
}

export async function sendModelToBridge(input: {
  bridgeUrl: string;
  filename: string;
  stl: string;
  action?: "slice" | "print";
}) {
  const response = await fetch(`${input.bridgeUrl.replace(/\/$/, "")}/api/slice`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filename: input.filename,
      action: input.action ?? "print",
      fileBase64: textToBase64(input.stl),
    }),
  });

  const body = await response.json() as {
    error?: string;
    filename?: string;
    fileBase64?: string;
    contentType?: string;
    printed?: boolean;
    message?: string;
  };

  if (!response.ok) {
    throw new Error(body.error ?? "Bridge request failed.");
  }

  if (body.fileBase64 && body.filename) {
    downloadBlob(body.filename, base64ToBytes(body.fileBase64), body.contentType ?? "application/octet-stream");
  }

  return {
    printed: Boolean(body.printed),
    message: body.message ?? "Bridge completed.",
  };
}

export function stlFilename(name: string) {
  return `${safeName(name)}.stl`;
}

function textToBase64(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function base64ToBytes(value: string) {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}
