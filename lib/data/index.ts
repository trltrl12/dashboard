import { DataProvider } from './provider';
import { MockProvider } from './mock';
import { SupabaseProvider } from './supabase';
// import { BigQueryProvider } from './bigquery'; // Windsor.ai -> BigQuery path (stub)

/**
 * The ONE place that decides the data source. Every dashboard section pulls data
 * through this single `dataProvider` object, so swapping the backend is a one-spot change.
 *
 * Behaviour:
 *   - If Supabase env vars are set, use real data from Supabase.
 *   - Otherwise fall back to the deterministic mock so the app always renders.
 *
 * To force a specific provider, replace the logic below with a direct `new XProvider()`.
 */
function selectProvider(): DataProvider {
  const hasSupabase =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (hasSupabase) {
    return new SupabaseProvider();
  }
  return new MockProvider();
}

export const dataProvider: DataProvider = selectProvider();
