# Data Review — `facebook_ads` (Supabase)

Assessment of the live Supabase data as connected to the dashboard, based on the
actual rows in the `facebook_ads` table (Windsor.ai feed). Date range of ad data:
**2024-12-06 → 2025-09-16**.

---

## ✅ What's working

- **Connection is solid.** Publishable key + project URL authenticate and read fine.
  Row Level Security allows the read the dashboard needs.
- **Both ad channels are present** and flow through the `ad_performance` adapter view:
  - Facebook: 462 rows, **$17,701.91** spend, 544,015 impressions, 4,241 clicks, **118 leads**
  - Google Ads: 398 rows, **$32,984.27** spend, 6,419 impressions, 417 clicks
- **Core funnel metrics are real and usable:** spend, impressions, clicks, CTR, CPC,
  CPM, and CPA (cost-per-lead) all compute correctly from the data.
- **Lead tracking works on Facebook** via `actions_lead` + `actions_offsite_conversion_fb_pixel_lead`.
- **Landing-page views exist** for Facebook (`actions_landing_page_view`), so the
  conversion funnel has a real Impressions → Clicks → LPV → Leads shape on that channel.

## 👍 Consistent & good

- **Daily grain is clean** — one row per ad/campaign per day, which is exactly what the
  aggregation layer expects. No obvious duplicate-day issues.
- **Spend figures look believable** and are internally consistent with impressions/clicks
  on Facebook (CPM and CTR land in normal ranges).
- **Campaign names are intact** and descriptive, so the campaign table and efficiency
  quadrant will be meaningful.
- **Mixed-source hygiene is handled:** GA4 web-analytics rows (no spend) are filtered out
  by the adapter view, so they can't pollute ad metrics.

## 🛠️ What to improve

1. **No revenue column → ROAS/Revenue/AOV are blank.** This is lead-gen data. To light up
   those metrics, either assign an estimated value per lead, or join real deal/closing
   revenue later. (Currently set to $0 by choice.)

2. **Google Ads shows 0 leads.** Google conversions aren't in the export — likely the
   conversion action wasn't included in the Windsor field selection. Add Google's
   conversion field (e.g. `conversions` / `all_conversions`) to the Windsor pull so Google
   isn't unfairly shown as converting nothing.

3. **Google Ads impressions look low** (6,419 impressions for ~$33k spend is an unusually
   high CPM). Worth confirming the Google `impressions` field is fully populated in Windsor
   — it may be partially null.

4. **Missing breakdown dimensions.** No `device`, `placement`, `region`, `age`, `gender`,
   or `keyword` columns, so the Audience, Geographic, and Keyword sections render empty
   states. Add these fields to the Windsor pull to activate those sections (note: breakdowns
   multiply row counts — pull them deliberately).

5. **`adset_name` is often null on Google Ads**, so the campaign → adset → ad drill-down is
   shallow on that channel. Including ad group as the adset for Google would deepen it.

6. **Facebook history starts Apr 2025** while Google starts Dec 2024. Channel comparisons
   across Dec 2024–Mar 2025 will show Facebook as empty for that window — expected, but
   worth knowing when reading early-period charts.

7. **Date range is historical (ends Sep 2025).** The dashboard's "Last 90 days" preset
   (relative to today) will look empty. Use the custom date picker for the 2025 window when
   testing; in production with fresh data this resolves itself.

---

## Bottom line

The pipeline **works end-to-end** — real spend, clicks, impressions, and Facebook leads
flow into every spend/efficiency section. The gaps are all **source-data completeness**
(revenue, Google conversions, breakdown dimensions), not dashboard bugs. Filling in the
Windsor field selection is the highest-leverage next step.
