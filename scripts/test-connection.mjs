#!/usr/bin/env node
/**
 * Supabase connection test / diagnostic.
 *
 * Connects to your Supabase `ad_performance` table and reports:
 *   - whether the connection + credentials work
 *   - how many rows, what date range, which channels
 *   - which expected columns are present vs missing
 *   - a sample KPI roll-up from whatever data exists
 *
 * Works fine on a partially-populated table — missing columns are just reported.
 *
 * Run:  node scripts/test-connection.mjs
 * Reads NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY from .env.local
 * (or the environment).
 */
import { readFileSync, existsSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

// --- tiny .env.local loader (so you don't need extra deps) ---
function loadEnv(file = '.env.local') {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const key = m[1];
    let val = m[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}
loadEnv();

const TABLE = 'ad_performance';
const EXPECTED_COLUMNS = [
  'date', 'channel', 'campaign', 'adset', 'ad',
  'impressions', 'clicks', 'spend', 'conversions', 'revenue',
  'device', 'placement', 'region', 'age_range', 'gender',
  'keyword', 'frequency', 'landing_page_views',
];

function fmt(n) {
  return Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  console.log('--- Supabase connection test ---\n');
  if (!url || !key) {
    console.error('Missing credentials. Add to .env.local:');
    console.error('  NEXT_PUBLIC_SUPABASE_URL=...');
    console.error('  NEXT_PUBLIC_SUPABASE_ANON_KEY=...');
    process.exit(1);
  }
  console.log(`URL:   ${url}`);
  console.log(`Table: ${TABLE}\n`);

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  // 1. Can we read the table at all?
  const { data: sample, error } = await supabase.from(TABLE).select('*').limit(1000);
  if (error) {
    console.error(`Connection / query FAILED: ${error.message}`);
    console.error('\nCommon causes:');
    console.error('  - table name is not "ad_performance"');
    console.error('  - Row Level Security has no public SELECT policy (see supabase/schema.sql)');
    console.error('  - wrong project URL or anon key');
    process.exit(1);
  }

  console.log(`Connection OK. Read ${sample.length} row(s) (showing up to 1000).\n`);

  if (sample.length === 0) {
    console.log('Table is empty. Insert some rows, then re-run this test.');
    console.log('You can paste a few sample rows or run the Windsor importer.');
    return;
  }

  // 2. Column coverage
  const presentCols = new Set(Object.keys(sample[0]));
  const missing = EXPECTED_COLUMNS.filter((c) => !presentCols.has(c));
  console.log('Columns present:', [...presentCols].join(', '));
  if (missing.length) {
    console.log('\nMissing columns the dashboard can use (optional ones are fine to skip):');
    console.log('  ' + missing.join(', '));
  } else {
    console.log('\nAll expected columns present.');
  }

  // 3. Shape: dates + channels
  const dates = sample.map((r) => r.date).filter(Boolean).sort();
  const channels = [...new Set(sample.map((r) => r.channel))];
  console.log(`\nDate range: ${dates[0]} -> ${dates[dates.length - 1]}`);
  console.log(`Channels:   ${channels.join(', ') || '(none)'}`);

  // 4. Sample KPI roll-up
  const sum = (f) => sample.reduce((s, r) => s + Number(r[f] || 0), 0);
  const spend = sum('spend'), revenue = sum('revenue'), conv = sum('conversions');
  const impressions = sum('impressions'), clicks = sum('clicks');
  console.log('\n--- KPI roll-up (from the sampled rows) ---');
  console.log(`Spend:       $${fmt(spend)}`);
  console.log(`Revenue:     $${fmt(revenue)}`);
  console.log(`ROAS:        ${spend ? (revenue / spend).toFixed(2) : '-'}`);
  console.log(`Conversions: ${fmt(conv)}`);
  console.log(`CPA:         ${conv ? '$' + (spend / conv).toFixed(2) : '-'}`);
  console.log(`Impressions: ${fmt(impressions)}`);
  console.log(`Clicks:      ${fmt(clicks)}`);
  console.log(`CTR:         ${impressions ? ((clicks / impressions) * 100).toFixed(2) + '%' : '-'}`);

  console.log('\nLooks good. Run `npm run dev` and the dashboard will read this data live.');
}

main().catch((e) => { console.error('\nTest failed:', e.message); process.exit(1); });
