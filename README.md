# OG Business Cards

A low-cost web app for designing business cards in 2D and exporting them as SVG, PNG, PDF, or browser-generated STL files for 3D printing.

## MVP Features

- US standard business card canvas: `3.5in x 2in`
- Front/back card sides
- Drag text and shape elements anywhere on the card
- Import simple SVG logo paths
- Add QR placeholders
- Choose fonts, colors, element depth, and print mode
- Print modes: raised, engraved, or full through-cut
- Browser-side STL export for cheap hosting
- Printability warnings for thin details, off-card elements, and invalid engraving depth
- Cloudflare Pages/Workers/D1 backend skeleton
- Stripe Checkout skeleton for paid STL export credits

## Tech Stack

- React + Vite + TypeScript
- Konva.js for the 2D editor
- Three.js for 3D preview
- Cloudflare Pages + Workers + D1 for cheap hosting
- Stripe Checkout for `$5` STL export credits

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
```

5. Deploy:

```bash
npm run worker:deploy
```

## Billing Rule

Each user gets two free STL exports. After that, the app sends them to Stripe Checkout for a `$5` STL export credit.

The current MVP uses the `X-User-Email` header as a lightweight development identity mechanism. Replace this with production magic-link or OAuth auth before taking real payments.
