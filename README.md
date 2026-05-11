# OG Tools

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
- Lid maker tool:
- Circular or square lids
- Inner-fit lids for openings and outer-fit lids that wrap around the outside of an object
- Round lid diameter input is explicit: opening inner diameter in inner mode, object outer diameter in outer mode
- Dimension entry in millimeters or inches
- Lip walls default to `2mm`
- Browser-generated STL with a top plate and underside rim
- Browser-side STL export for cheap hosting
- Printability warnings for thin details, off-card elements, and invalid engraving depth
- Cloudflare Pages/Workers/D1 backend skeleton
- Google SSO skeleton that stores saves and free export usage by verified email
- Stripe Checkout skeleton for `$1.99` paid model exports

## Tech Stack

- React + Vite + TypeScript
- Konva.js for the 2D editor
- Three.js for 3D preview
- Cloudflare Pages + Workers + D1 for cheap hosting
- Stripe Checkout for `$1.99` paid model exports

## Local Development

```bash
npm install
npm run dev
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
npx wrangler d1 migrations apply og-business-cards
```

4. Add production secrets:

```bash
npx wrangler pages secret put STRIPE_SECRET_KEY
npx wrangler pages secret put STRIPE_WEBHOOK_SECRET
npx wrangler pages secret put APP_URL
npx wrangler pages secret put AUTH_SECRET
npx wrangler pages secret put GOOGLE_CLIENT_ID
npx wrangler pages secret put GOOGLE_CLIENT_SECRET
```

5. Deploy:

```bash
npm run worker:deploy
```

## Billing Rule

Each user gets two free model exports. After that, the app sends them to Stripe Checkout for a `$1.99` paid model export.

Credits are stored against the signed-in Google account email. The backend still accepts the `X-User-Email` header as a local development fallback, but production should use Google SSO.

## Google SSO

Create a Google OAuth web client with this redirect URL:

```txt
https://your-domain.com/api/auth/google/callback
```

Set `APP_URL` to the deployed site origin, for example:

```txt
https://your-domain.com
```
