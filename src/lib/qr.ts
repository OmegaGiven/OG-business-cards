import QRCode from "qrcode";

export interface QrModule {
  row: number;
  col: number;
}

export interface QrMatrix {
  size: number;
  modules: QrModule[];
}

export function createQrMatrix(value: string): QrMatrix {
  const qr = QRCode.create(value || " ");
  const size = qr.modules.size;
  const modules: QrModule[] = [];

  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      if (qr.modules.get(row, col)) {
        modules.push({ row, col });
      }
    }
  }

  return { size, modules };
}
