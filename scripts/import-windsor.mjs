#!/usr/bin/env node
/**
 * Windsor.ai -> Supabase importer.
 *
 * Pulls Facebook Ads + Google Ads rows from Windsor.ai (API or a CSV export),
 * maps Windsor's unified fields onto the `ad_performance` table, and loads them.
 *
 * The import is idempotent: it DELETEs the date range it is about to load, then
 * inserts fresh rows. Re-running for the same range just refreshes that range.
 *
 * --------------------------------------------------------------------------
 * Setup (in .env.local or your shell):
 *   NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY=...        # service_role key (writes, bypasses RLS) - keep secret
 *   WINDSOR_API_KEY=...                  # only needed for the API path
 *
 * Usage:
 *   # Pull last 90 days from the Windsor API:
 *   node scripts/import-windsor.mjs --from 2026-03-17 --to 2026-06-15
 *
 *   # Or load a CSV exported from Windsor:
 *   node scripts/import-windsor.mjs --csv ./windsor-export.csv
 * --------------------------------------------------------------------------
 */
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

// --- Windsor fields to request. Add breakdown fields here if you want them, but
// --- note that breakdowns (age/gender/device/region/keyword) return a row PER
// --- combination, which multiplies row counts. Start with the core set.
const WINDSOR_FIELDS = [
  'source', 'date', 'campaign', 'adset_name', 'ad_name',
  'impressions', 'clicks', 'spend', 'revenue',
  // Request all common conversion field names; the mapper picks the first non-null one.
  'conversions', 'total_conversions', 'purchases', 'leads',
  'complete_registration', 'all_conversions', 'goal_completions',
  // optional breakdowns (uncomment to include):
  // 'device', 'publisher_platform', 'ad_network_type', 'region', 'country',
  // 'age', 'gender', 'keyword', 'search_term', 'frequency', 'landing_page_views',
];

// ---------------------------------------------------------------------------

function arg(name, fallback = undefined) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function normalizeChannel(source) {
  const s = String(source || '').toLowerCase();
  if (s.includes('face') || s.includes('meta') || s.includes('instagram')) return 'facebook';
  if (s.includes('goog')) return 'google';
  return null; // unknown source -> skipped
}

/** Map one Windsor row (object keyed by field name) to an ad_performance row. */
function mapRow(r) {
  const channel = normalizeChannel(r.source ?? r.channel ?? r.account_type);
  if (!channel) return null;
  const date = String(r.date || '').slice(0, 10);
  if (!date) return null;

  return {
    date,
    channel,
    campaign: r.campaign || r.campaign_name || '(unknown campaign)',
    adset: r.adset || r.adset_name || r.ad_group_name || r.adgroup || '(unknown)',
    ad: r.ad || r.ad_name || '(unknown)',
    impressions: Math.round(num(r.impressions)),
    clicks: Math.round(num(r.clicks)),
    spend: num(r.spend ?? r.cost ?? r.totalcost),
    conversions: Math.round(num(
      r.conversions ??
      r.total_conversions ??
      r.purchases ??           // Facebook: Purchase event
      r.leads ??               // Facebook / Google: Lead event
      r.complete_registration ?? // Facebook: Registration
      r.all_conversions ??     // Google Ads: all conversion actions
      r.goal_completions       // Google (GA4-linked)
    )),
    revenue: num(r.revenue ?? r.total_revenue ?? r.conversion_value),
    device: r.device ?? null,
    placement: r.publisher_platform ?? r.placement ?? r.ad_network_type ?? null,
    region: r.region ?? r.country ?? null,
    age_range: r.age ?? r.age_range ?? null,
    gender: r.gender ?? null,
    keyword: r.keyword ?? r.search_term ?? null,
    frequency: r.frequency != null ? num(r.frequency) : null,
    landing_page_views: r.landing_page_views != null ? Math.round(num(r.landing_page_views)) : null,
  };
}

/** Minimal CSV parser (handles quoted fields and commas inside quotes). */
function parseCsv(text) {
  const rows = [];
  let field = '', record = [], inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQuotes = false;
      else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') { record.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (field !== '' || record.length) { record.push(field); rows.push(record); record = []; field = ''; }
      if (c === '\r' && text[i + 1] === '\n') i++;
    } else field += c;
  }
  if (field !== '' || record.length) { record.push(field); rows.push(record); }
  const header = rows.shift().map((h) => h.trim());
  return rows.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i]])));
}

async function fetchFromWindsor(from, to) {
  const key = process.env.WINDSOR_API_KEY;
  if (!key) throw new Error('WINDSOR_API_KEY is not set (needed for the API path).');
  const url = new URL('https://connectors.windsor.ai/all');
  url.searchParams.set('api_key', key);
  url.searchParams.set('date_from', from);
  url.searchParams.set('date_to', to);
  url.searchParams.set('fields', WINDSOR_FIELDS.join(','));
  url.searchParams.set('_renderer', 'json');

  console.log(`Fetching Windsor data ${from} -> ${to} ...`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Windsor API ${res.status}: ${await res.text()}`);
  const json = await res.json();
  return json.data ?? json ?? [];
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    throw new Error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  }
  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  const csvPath = arg('csv');
  let raw;
  if (csvPath) {
    console.log(`Reading CSV ${csvPath} ...`);
    raw = parseCsv(readFileSync(csvPath, 'utf8'));
  } else {
    const to = arg('to', new Date().toISOString().slice(0, 10));
    const from = arg('from', new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10));
    raw = await fetchFromWindsor(from, to);
  }

  const mapped = raw.map(mapRow).filter(Boolean);
  if (mapped.length === 0) {
    console.log('No rows to import. Check your fields / date range / API key.');
    return;
  }

  // Idempotent: clear the date range we are about to load, then insert.
  const dates = mapped.map((r) => r.date).sort();
  const minDate = dates[0], maxDate = dates[dates.length - 1];
  console.log(`Mapped ${mapped.length} rows spanning ${minDate} -> ${maxDate}. Replacing that range ...`);

  const { error: delErr } = await supabase
    .from('ad_performance')
    .delete()
    .gte('date', minDate)
    .lte('date', maxDate);
  if (delErr) throw new Error(`Delete failed: ${delErr.message}`);

  const CHUNK = 500;
  for (let i = 0; i < mapped.length; i += CHUNK) {
    const chunk = mapped.slice(i, i + CHUNK);
    const { error } = await supabase.from('ad_performance').insert(chunk);
    if (error) throw new Error(`Insert failed at row ${i}: ${error.message}`);
    console.log(`  inserted ${Math.min(i + CHUNK, mapped.length)} / ${mapped.length}`);
  }

  console.log('Done. Reload the dashboard to see live Windsor data.');
}

main().catch((e) => { console.error('\nImport failed:', e.message); process.exit(1); });
