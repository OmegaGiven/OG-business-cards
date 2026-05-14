# OG-3dmodeler

OG-3dmodeler is a phone-friendly browser app for making small, practical 3D-printable models. The main branch is a static prototype: users design models, preview them in 3D, and export STL or 2D files directly in the browser.

<img width="906" height="1043" alt="image" src="https://github.com/user-attachments/assets/38dd15bd-cc96-4e02-9752-62cb16f098dc" />
<img width="884" height="1079" alt="image" src="https://github.com/user-attachments/assets/30b2f304-4a20-4949-953a-46c3e02bb9eb" />

## Current Tools

### Business Card Modeler

- Front-only card design for reliable STL generation
- Preset card sizes: US standard, EU standard, square, and custom dimensions
- 2D editor with text, QR codes, SVG logo import, color, depth, raised/engraved/cut-through modes, zoom, pan, undo/redo, and delete
- 3D preview with raised details and cut-through geometry
- Printability warnings for off-card elements, QR cut-through, thin details, tight gaps, engraving depth, and cut-through text islands
- Nozzle diameter and tolerance settings for printability checks
- SVG, PNG, PDF, and STL export

### Lid Maker

- Circular or square lids
- Inner-fit lids for openings and outer-fit lids that wrap around the outside of an object
- Explicit diameter/dimension labels for opening inner dimensions vs object outer dimensions
- Top thickness, lip height, lip wall, lip inset, nozzle diameter, and tolerance controls
- Tolerance changes generated fit clearance
- Interactive 3D preview and STL export

### Washer Maker

- Inner diameter, outer diameter, and height controls
- Nozzle and tolerance checks for thin washer walls, small holes, and very low heights
- Tolerance adjusts generated OD/ID fit
- Interactive 3D preview and STL export

## Prototype Behavior

- No accounts, payments, or hosted backend are required on `main`
- Designs are saved locally in the browser
- STL generation happens in the browser
- STL files are downloaded locally and can be opened in a slicer
- The experimental local slicing/printing bridge lives on the `bridge-print-flow` branch

## Tech Stack

- React + Vite + TypeScript
- Konva.js for the 2D business card editor
- Three.js for 3D previews and STL geometry
- Browser-side STL generation
- GitHub Pages for the static hosted prototype

## Local Development

Install dependencies:

```bash
npm install
```

Run the web app:

```bash
npm run dev
```

Run on your local network for phone testing:

```bash
npm run dev -- --host 0.0.0.0
```

Run tests:

```bash
npm test
```

Build:

```bash
npm run build
```

## GitHub Pages Deployment

The repository includes a GitHub Actions workflow at `.github/workflows/pages.yml`.

1. Open the GitHub repo settings.
2. Go to **Pages**.
3. Set **Source** to **GitHub Actions**.
4. Push to `main`.

The workflow builds the Vite app and deploys `dist` to:

```txt
https://OmegaGiven.github.io/OG-3dmodeler/
```

## Bridge Branch

The local slice/print bridge was moved off `main` and preserved on:

```bash
git checkout bridge-print-flow
```

Use that branch if you want to continue experimenting with sending generated STL files to a local slicer or printer service.
