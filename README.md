# OG-Modeler

A low-cost web app with multiple browser-based design tools for creating simple 3D-printable models and exports.

## MVP Features

- Tool navigation between separate model generators
- Business card STL tool:
- Preset card sizes including US standard `3.5in x 2in`, EU standard `85mm x 55mm`, square, and custom dimensions
- Custom card size entry in millimeters or inches
- Front-only card design surface, because a back side would make the printable STL workflow unreliable
- Mobile-friendly editing with a top action bar, tap-to-select, drag-to-move, and double-tap text editing
- Dedicated export screen with a card preview and save/export actions
- Import simple SVG logo paths
- Add QR placeholders
- Choose fonts, colors, element depth, and print mode
- Print modes: raised, engraved, or full through-cut
- Nozzle diameter and tolerance settings for printability warnings
- Lid maker tool:
- Circular or square lids
- Inner-fit lids for openings and outer-fit lids that wrap around the outside of an object
- Round lid diameter input is explicit: opening inner diameter in inner mode, object outer diameter in outer mode
- Dimension entry in millimeters or inches
- Lip walls default to `2mm`
- Lid tolerance changes generated fit clearance for inner/outer lids
- Browser-generated STL with a top plate and underside rim
- Washer tool:
- Inner diameter, outer diameter, and height inputs
- Nozzle and tolerance checks for thin washer walls and small holes
- Browser-generated STL washer export
- Browser-side STL export for cheap hosting
- Printability warnings for thin details, off-card elements, and invalid engraving depth
- Cloudflare Pages/Workers/D1 backend skeleton
- Local-only prototype flow with no sign-in or payments

## Tech Stack

- React + Vite + TypeScript
- Konva.js for the 2D editor
- Three.js for 3D preview
- Cloudflare Pages + Workers + D1 for cheap hosting

## Local Development

```bash
npm install
npm run dev
```

Run the local slice/print bridge:

```bash
npm run bridge
```

Run tests:

```bash
npm test
```

Build:

```bash
npm run build
```

## Cloudflare Setup

1. Create a Cloudflare D1 database.
2. Replace `database_id` in `wrangler.toml`.
3. Apply the schema:

```bash
npx wrangler d1 migrations apply og-modeler
```

4. Add production secrets when backend features are enabled:

```bash
npx wrangler pages secret put APP_URL
```

5. Deploy:

```bash
npm run worker:deploy
```

Set `APP_URL` to the deployed site origin when using Cloudflare Functions, for example:

```txt
https://your-domain.com
```

## Local Print Bridge

The browser app can send generated STL files to a local bridge service at a URL such as:

```txt
http://10.115.91.3:8787
```

The bridge accepts the model, runs a configured slicer, and then either:

- runs a configured print command, or
- returns the sliced file to the browser for download.

Start the bridge:

```bash
npm run bridge
```

Configure slicing with environment variables:

```bash
OG_SLICER_COMMAND="your-slicer-command {input} {output} {outputDir}" npm run bridge
```

Placeholders:

- `{input}`: generated STL from OG-Modeler
- `{output}`: expected sliced output, usually `.gcode.3mf`
- `{outputDir}`: temporary job directory

If your slicer writes to a different path, set:

```bash
OG_SLICED_OUTPUT="/path/or/template/to/output.gcode.3mf"
```

To send the sliced file to a printer, configure:

```bash
OG_PRINT_COMMAND="your-printer-send-command {output}" npm run bridge
```

If `OG_PRINT_COMMAND` is not set, the bridge returns the sliced file to the phone/browser instead of printing.
