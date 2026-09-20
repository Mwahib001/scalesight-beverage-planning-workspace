# ScaleSight Beverage Planning Workspace

A synthetic RTD beverage planning demo for Harbor Coast Beverages. ScaleSight is the direct provider of the recurring analytical service. All pages and printed reports identify the data as a fictional example. Forecasts are planning ranges, not promises.

## Local development

The existing stack is Next.js 16, React 19, Tailwind 4, Recharts and Lucide. No database, authentication, submission endpoint or additional dependency is required.

```sh
pnpm install
pnpm dev
```

Run these commands yourself when ready. Production commands are `pnpm build` and `pnpm start`.

## Checks

```sh
pnpm typecheck
pnpm lint
pnpm test
```

The offline test script checks canonical calculations, demand/revenue/inventory reconciliation, dated events, production arrival timing, recommendation identity across rendered views, links and route wiring. It does not start a server or build the application. Browser hydration, interactions, responsive layout and print pagination should also be checked against your running app.

## Workspace routes

| Page | Route |
| --- | --- |
| Weekly Planning Brief | `/` |
| Revenue Forecast | `/revenue-forecast` |
| Demand Forecast | `/demand-forecast` |
| Inventory & Production | `/inventory-production` |
| SKU Planning | `/sku-planning` and `/sku-planning/[sku]` |
| Scenario Planning | `/scenario-planning` (optional `?sku=`) |
| Forecast vs Actual | `/forecast-vs-actual` |
| Intelligence Center | `/intelligence-center` |
| Assumptions | `/assumptions` |
| Executive Planning Brief | `/executive-brief` |
| Managed Intelligence | `/managed-intelligence` |

Existing inventory, forecast, scenario and legacy brief URLs redirect to their corresponding new pages.

## Data and calculation conventions

- `data/planning.ts` owns the planning snapshot, SKU inputs, prices, event offsets, incoming orders, navigation and labels. Change `AS_OF` to re-date the demo.
- `data/history.json` contains the committed seeded fixture: 78 weekly observations per SKU, with immutable prior forecasts. Dates are offsets from the planning snapshot. `node scripts/generate-history.mjs` regenerates the fixture explicitly; no randomness runs during rendering.
- `lib/calculations.ts` contains pure baseline and event-adjusted calculations, metrics and shared recommendations. Daily integration of weekly demand allows exact event dates and fractional safety/stockout crossings; dates round once for display.
- Headline cover is before shrink. Incoming goods are treated as usable at the start of their ETA day; current inventory receives the shrink adjustment. Unmet shipments are lost, not backlogged. Event-adjusted need considers only receipts arriving within the production lead-time plus safety horizon.
- Citrus next-run headroom is 1,800 units pending co-packer capacity and components; its remaining need stays visible. Other next-run recommendations round to the nearest 100 units.
- Synthetic net wholesale prices are $8.00–$9.50 per demo unit, relative to $4.50 production cost. Units mean finished-goods cases throughout. Exact assumptions appear in the workspace.
- The promotion lasts four weeks. Seasonal demand fades 2.5% per forecast week, floored at half the baseline. Forecast ranges widen with horizon and recent errors; these are planning bands, not statistical confidence intervals.
- 30/60/90-day revenue totals prorate partial weeks. Revenue at risk is unserved demand times the same net price. Scenario capital includes planned production plus the remaining need.

## Branding and contact

A temporary ScaleSight SVG wordmark, icon and generated Open Graph image are included. Replace them with approved brand assets when available. The service CTA deliberately displays “Demo only - contact form not connected” until `settings.contactEmail` is populated in `data/planning.ts`. No form is submitted.

The demo uses `noindex, nofollow` metadata. No analytics identifiers or storage keys are configured.

## Executive report

“Export PDF / Print” retains the browser print mechanism. Print styles create report sections and a persistent synthetic-data footer. Choose **Save as PDF**, disable browser headers/footers, and use the suggested ScaleSight document title as the filename. The browser controls final pagination, filename and PDF author metadata; a dedicated PDF generator is intentionally not added.

## Deployment isolation

This checkout belongs to `git@github.com:Mwahib001/scalesight-beverage-planning-workspace.git`. Do not reuse any previous deployment project. No local Vercel project link is committed. When deploying, link to a new project and verify its clean production domain before publishing. This implementation does not require deployment or a live service to inspect its data and calculation tests.
