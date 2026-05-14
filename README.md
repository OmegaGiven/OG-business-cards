# OG-3dmodeler

OG-3dmodeler is a phone-friendly browser app for making small, practical 3D-printable models. It is currently a local-first prototype: users can design models, preview them in 3D, export STL files, or send generated STLs to a local bridge service for slicing and optional printing.

## Current Tools

- **Business card modeler**
- Front-only card design for reliable STL generation
- Preset card sizes: US standard, EU standard, square, and custom dimensions
- 2D editor with text, QR codes, SVG logo import, color, depth, raised/engraved/cut-through modes, zoom, pan, undo/redo, and delete
- 3D preview with raised details and cut-through geometry
- Printability warnings for off-card elements, QR cut-through, thin details, tight gaps, engraving depth, and cut-through text islands
- Nozzle diameter and tolerance settings for printability checks
- SVG, PNG, PDF, and STL export

- **Lid maker**
- Circular or square lids
- Inner-fit lids for openings and outer-fit lids that wrap around the outside of an object
- Explicit diameter/dimension labels for opening inner dimensions vs object outer dimensions
- Top thickness, lip height, lip wall, lip inset, nozzle diameter, and tolerance controls
- Tolerance changes generated fit clearance
- Interactive 3D preview and STL export

- **Washer maker**
- Inner diameter, outer diameter, and height controls
- Nozzle and tolerance checks for thin washer walls, small holes, and very low heights
- Tolerance adjusts generated OD/ID fit
- Interactive 3D preview and STL export

## Prototype Behavior

- No sign-in
- No payment flow
- Designs are saved locally in the browser
- STL generation happens in the browser
- Optional bridge sends generated STL files to a local slicer/printer workflow

## Tech Stack

- React + Vite + TypeScript
- Konva.js for the 2D business card editor
- Three.js for 3D previews and STL geometry
- Browser-side STL generation
- Optional local Node.js slice/print bridge
- Cloudflare Pages/Workers/D1 skeleton remains available for future hosted backend features

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

## Local Print Bridge

The bridge is a small local Node.js service that lets the phone/browser send completed STL models to a computer, Raspberry Pi, NAS, or other machine that can run slicer/printer commands.

Flow:

```txt
Phone browser -> OG-3dmodeler -> local bridge -> slicer -> printer or sliced file download
```

Start the bridge:

```bash
npm run bridge
```

By default it listens on:

```txt
http://0.0.0.0:8787
```

From another device on your network, use your computer's LAN IP, for example:

```txt
http://10.115.91.3:8787
```

Health check:

```bash
curl http://127.0.0.1:8787/health
```

### Configure Slicing

Set `OG_SLICER_COMMAND` to the command that slices an input STL into a printer-ready output file.

```bash
OG_SLICER_COMMAND="your-slicer-command {input} {output} {outputDir}" npm run bridge
```

Placeholders:

- `{input}`: generated STL from OG-3dmodeler
- `{output}`: expected sliced output, usually `.gcode.3mf`
- `{outputDir}`: temporary job directory

If your slicer writes to a different path, set:

```bash
OG_SLICED_OUTPUT="/path/or/template/to/output.gcode.3mf"
```

### Configure Printing

If `OG_PRINT_COMMAND` is set, the bridge runs it after slicing:

```bash
OG_PRINT_COMMAND="your-printer-send-command {output}" npm run bridge
```

If `OG_PRINT_COMMAND` is not set, the bridge returns the sliced file to the browser for download instead of printing.

### Bridge Environment Variables

- `OG_BRIDGE_PORT`: bridge port, default `8787`
- `OG_BRIDGE_HOST`: bind host, default `0.0.0.0`
- `OG_BRIDGE_WORK_DIR`: temporary bridge job directory
- `OG_BRIDGE_MAX_BODY_BYTES`: max upload size, default `25MB`
- `OG_SLICER_COMMAND`: slicer command template
- `OG_SLICED_OUTPUT`: optional sliced output path template
- `OG_PRINT_COMMAND`: optional printer-send command template

## Cloudflare Setup

Cloudflare deployment is still scaffolded, but the prototype currently works without auth, payments, or a required backend.

1. Create a Cloudflare D1 database if future backend features need it.
2. Replace `database_id` in `wrangler.toml`.
3. Apply the schema:

```bash
npx wrangler d1 migrations apply og-3dmodeler
```

Deploy:

```bash
npm run worker:deploy
```
