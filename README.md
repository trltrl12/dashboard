# Marketing Performance Dashboard

An internal analytics dashboard for a single company, tracking **Facebook Ads** and
**Google Ads** performance in depth — KPIs, trends, channel comparison, funnel,
campaign/creative tables, audience & geo breakdowns, a time heatmap, budget pacing,
keywords, and goal tracking.

Built with **Next.js (App Router) + TypeScript**, **Tailwind CSS**, **Recharts**, and
**lucide-react**.

---

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Out of the box the app renders with **built-in mock data** (deterministic, realistic,
90 days), so it works with zero configuration. To connect your own data, see
[Connecting your data](#connecting-your-data) below.

---

## Brand configuration

All company-specific settings live in **one file**: [`config/brand.ts`](config/brand.ts).

```ts
export const brand = {
  companyName: '[Acme Co.]',
  accentColor: '#6366f1',      // single brand accent used across charts & highlights
  currency: 'USD',
  targets: {
    roas: 4.0,                 // ROAS target
    cpa: 35,                   // CPA target ($)
    monthlyBudget: 60000,      // total monthly spend budget ($)
  },
} as const;
```

Change the name, accent color, currency, or targets here and the whole dashboard updates.

---

## Architecture: the data layer

Every section pulls data through **one object** — `dataProvider` in
[`lib/data/index.ts`](lib/data/index.ts). The UI never knows or cares where the data
comes from. Swapping the backend is a one-spot change.

- [`lib/data/types.ts`](lib/data/types.ts) — the canonical `AdRow` type (one row per ad
  per day) and all derived shapes.
- [`lib/data/provider.ts`](lib/data/provider.ts) — the `DataProvider` interface
  (`getKpis`, `getTimeseries`, `getCampaigns`, …).
- [`lib/data/aggregate.ts`](lib/data/aggregate.ts) — shared, pure aggregation logic that
  turns raw `AdRow[]` into every view. **All providers reuse this**, so they behave
  identically.
- [`lib/data/mock.ts`](lib/data/mock.ts) — `MockProvider`: deterministic 90-day data.
- [`lib/data/supabase.ts`](lib/data/supabase.ts) — `SupabaseProvider`: reads real rows
  from Supabase.
- [`lib/data/bigquery.ts`](lib/data/bigquery.ts) — `BigQueryProvider`: stub for the
  Windsor.ai → BigQuery path.

`index.ts` auto-selects: **if Supabase env vars are present it uses Supabase, otherwise
it falls back to mock.**

---

## Connecting your data

### Option A — Supabase (recommended)

1. **Create the table.** In the Supabase dashboard → **SQL Editor**, run
   [`supabase/schema.sql`](supabase/schema.sql). This creates the `ad_performance` table
   (one row per ad per day) plus an index and a public read policy.

2. **Load your data.** Insert rows into `ad_performance`. Minimum columns per row:
   `date, channel ('facebook'|'google'), campaign, adset, ad, impressions, clicks,
   spend, conversions, revenue`. Optional breakdown columns: `device, placement, region,
   age_range, gender, keyword, frequency, landing_page_views`.

3. **Set environment variables.** Copy [`.env.example`](.env.example) to `.env.local`:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
   ```

   Find these in Supabase → **Project Settings → API**. Restart `npm run dev`.

That's it — the app now reads live data from Supabase. No UI changes needed. To force
mock data again, unset the env vars (or edit `selectProvider()` in `lib/data/index.ts`).

#### Loading data from Windsor.ai

Windsor.ai exposes a unified field schema. Pull the **core fields** at daily grain:
`source, date, campaign, adset_name, ad_name, impressions, clicks, spend, conversions, revenue`
(optionally add breakdowns: `device, publisher_platform, ad_network_type, region, country,
age, gender, keyword, search_term, frequency, landing_page_views` — note breakdowns return
one row per combination).

Use the included importer to load Windsor data straight into the `ad_performance` table:

```bash
# Set SUPABASE_SERVICE_ROLE_KEY and WINDSOR_API_KEY in .env.local first (see .env.example)

# Pull a date range from the Windsor API:
npm run import:windsor -- --from 2026-03-17 --to 2026-06-15

# Or load a CSV exported from Windsor:
npm run import:windsor -- --csv ./windsor-export.csv
```

The import is idempotent — it replaces the date range it loads, so re-running refreshes
data without creating duplicates. Schedule it (cron / GitHub Action) to keep data fresh.
See [`scripts/import-windsor.mjs`](scripts/import-windsor.mjs) for the field mapping.

### Option B — Windsor.ai → BigQuery

Windsor.ai writes Facebook/Google Ads data into BigQuery tables. Fill in the queries in
[`lib/data/bigquery.ts`](lib/data/bigquery.ts), set `BIGQUERY_PROJECT` / `BIGQUERY_DATASET`,
then swap the provider in `lib/data/index.ts`:

```ts
export const dataProvider = new BigQueryProvider();
```

---

## Deploying to Netlify

The repo includes [`netlify.toml`](netlify.toml) with the official
`@netlify/plugin-nextjs` plugin, so deploys work with zero extra config.

### One-click deploy

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/trltrl12/dashboard)

Clicking this clones the repo into your Netlify account and **prompts you for the two
Supabase env vars** (defined in `netlify.toml`). Sign in to Netlify once when asked.

### Or connect the Git repo manually

1. In [Netlify](https://app.netlify.com): **Add new site → Import an existing project**.
2. Connect GitHub and select this repository (pick the branch you want to deploy).
3. Netlify auto-detects `netlify.toml` — click **Deploy**.
4. **Add your env vars** in **Site settings → Environment variables** so production reads
   from Supabase (without them, the site falls back to mock data):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - *(optional)* `NEXT_PUBLIC_DATA_ANCHOR_DATE` — set to e.g. `2025-09-16` to anchor the
     date presets onto historical data. Omit once you have current data.

Every push to the connected branch then auto-deploys.

> Only `NEXT_PUBLIC_*` vars belong in Netlify. Never put the Supabase **secret /
> service_role** key here — it's only used locally by the import script.

---

## Scripts

| Command          | Description                          |
| ---------------- | ------------------------------------ |
| `npm run dev`    | Start the dev server                 |
| `npm run build`  | Production build (what Netlify runs) |
| `npm run start`  | Serve the production build           |
| `npm run lint`   | Lint                                 |
