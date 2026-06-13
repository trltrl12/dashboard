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

1. Push this repo to GitHub.
2. In [Netlify](https://app.netlify.com): **Add new site → Import an existing project**.
3. Connect GitHub and select this repository.
4. Netlify auto-detects `netlify.toml` — click **Deploy**.
5. **Add your env vars** in **Site settings → Environment variables**
   (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) so production reads from
   Supabase. Without them, the deployed site shows mock data.

Every push to the connected branch then auto-deploys.

---

## Scripts

| Command          | Description                          |
| ---------------- | ------------------------------------ |
| `npm run dev`    | Start the dev server                 |
| `npm run build`  | Production build (what Netlify runs) |
| `npm run start`  | Serve the production build           |
| `npm run lint`   | Lint                                 |
