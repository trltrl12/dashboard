import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DataProvider } from './provider';
import { AdRow, DateFilter, KpiData, TimeseriesPoint, ChannelBreakdown, CampaignRow, AdCreative, FunnelStage, AudienceBreakdown, GeoRow, HeatmapCell, KeywordRow, BudgetPacing } from './types';
import {
  computeKpis, aggregateTimeseries, aggregateChannelBreakdown, aggregateCampaigns,
  creativesFromCampaigns, aggregateAudience, aggregateGeo, aggregateHeatmap,
  aggregateFunnel, aggregateKeywords, previousPeriod, previousYear,
} from './aggregate';
import { brand } from '@/config/brand';

/**
 * SupabaseProvider — reads raw daily rows from a single Supabase (Postgres) table
 * and runs them through the shared aggregation logic, so the dashboard behaves
 * identically to the mock.
 *
 * Expected table: `ad_performance`, one row per ad per day. See README / supabase/schema.sql
 * for the exact `CREATE TABLE` statement. Column names match the AdRow type below.
 *
 * Env vars required (set locally in .env.local and in Netlify site settings):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 */
const TABLE = 'ad_performance';

/**
 * Explicit column selection with aliases so snake_case Postgres columns map to the
 * camelCase fields the dashboard's AdRow type expects (e.g. age_range -> ageRange).
 */
const SELECT_COLS =
  'date, channel, campaign, adset, ad, impressions, clicks, spend, conversions, revenue, ' +
  'device, placement, region, keyword, frequency, ' +
  'ageRange:age_range, landingPageViews:landing_page_views';

function getClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      'Supabase env vars missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.',
    );
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

export class SupabaseProvider implements DataProvider {
  private client = getClient();

  /** Fetch raw rows for a date range / channel. Paginates past Supabase's 1000-row cap. */
  private async fetchRows(from: string, to: string, channel?: 'facebook' | 'google' | 'all'): Promise<AdRow[]> {
    const all: AdRow[] = [];
    const pageSize = 1000;
    let page = 0;

    for (;;) {
      let query = this.client
        .from(TABLE)
        .select(SELECT_COLS)
        .gte('date', from)
        .lte('date', to)
        .order('date', { ascending: true })
        .range(page * pageSize, page * pageSize + pageSize - 1);

      if (channel && channel !== 'all') query = query.eq('channel', channel);

      const { data, error } = await query;
      if (error) throw new Error(`Supabase query failed: ${error.message}`);
      if (!data || data.length === 0) break;

      all.push(...(data as unknown as AdRow[]));
      if (data.length < pageSize) break;
      page += 1;
    }
    return all;
  }

  private getRows(filter: DateFilter): Promise<AdRow[]> {
    return this.fetchRows(filter.from, filter.to, filter.channel);
  }

  async getKpis(filter: DateFilter): Promise<{ current: KpiData; previous: KpiData }> {
    const current = computeKpis(await this.getRows(filter));
    const prevRange = filter.compareTo === 'previous_year'
      ? previousYear(filter.from, filter.to)
      : previousPeriod(filter.from, filter.to);
    const previous = computeKpis(await this.fetchRows(prevRange.from, prevRange.to, filter.channel));
    return { current, previous };
  }

  async getTimeseries(filter: DateFilter, granularity: 'daily' | 'weekly'): Promise<TimeseriesPoint[]> {
    return aggregateTimeseries(await this.getRows(filter), granularity);
  }

  async getChannelBreakdown(filter: DateFilter): Promise<ChannelBreakdown[]> {
    // Always show both channels regardless of the channel filter.
    return aggregateChannelBreakdown(await this.fetchRows(filter.from, filter.to, 'all'));
  }

  async getCampaigns(filter: DateFilter): Promise<CampaignRow[]> {
    return aggregateCampaigns(await this.getRows(filter), filter.from, filter.to);
  }

  async getCreatives(filter: DateFilter): Promise<AdCreative[]> {
    return creativesFromCampaigns(await this.getCampaigns(filter));
  }

  async getAudienceBreakdown(filter: DateFilter): Promise<AudienceBreakdown[]> {
    return aggregateAudience(await this.getRows(filter));
  }

  async getGeo(filter: DateFilter): Promise<GeoRow[]> {
    return aggregateGeo(await this.getRows(filter));
  }

  async getHeatmap(filter: DateFilter): Promise<HeatmapCell[]> {
    // Deterministic per-row hour distribution when rows lack an `hour` column.
    const seed = (row: AdRow, hour: number) => {
      const s = `${row.date}-${row.channel}-${row.campaign}-${hour}`;
      let h = 0;
      for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
      return ((h >>> 0) % 1000) / 1000;
    };
    return aggregateHeatmap(await this.getRows(filter), seed);
  }

  async getFunnel(filter: DateFilter): Promise<FunnelStage[]> {
    return aggregateFunnel(await this.getRows(filter));
  }

  async getKeywords(filter: DateFilter): Promise<KeywordRow[]> {
    return aggregateKeywords(await this.fetchRows(filter.from, filter.to, 'google'));
  }

  async getBudgetPacing(filter: DateFilter): Promise<BudgetPacing[]> {
    void filter;
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysElapsed = now.getDate();
    const monthStart = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const today = now.toISOString().split('T')[0];

    const perChannelBudget = brand.targets.monthlyBudget / 2;
    const channels: Array<'facebook' | 'google'> = ['facebook', 'google'];
    const results: BudgetPacing[] = [];

    for (const ch of channels) {
      const rows = await this.fetchRows(monthStart, today, ch);
      const mtdSpend = rows.reduce((s, r) => s + r.spend, 0);
      const dailyRate = daysElapsed > 0 ? mtdSpend / daysElapsed : 0;
      const projectedSpend = dailyRate * daysInMonth;
      const pace = mtdSpend / (perChannelBudget * daysElapsed / daysInMonth);
      const paceStatus: 'under' | 'on' | 'over' = pace < 0.9 ? 'under' : pace > 1.1 ? 'over' : 'on';
      results.push({ channel: ch, budget: perChannelBudget, mtdSpend, projectedSpend, paceStatus, daysElapsed, daysInMonth });
    }

    const total = results.reduce((acc, r) => ({
      channel: 'total' as const,
      budget: acc.budget + r.budget,
      mtdSpend: acc.mtdSpend + r.mtdSpend,
      projectedSpend: acc.projectedSpend + r.projectedSpend,
      paceStatus: 'on' as const,
      daysElapsed,
      daysInMonth,
    }), { channel: 'total' as const, budget: 0, mtdSpend: 0, projectedSpend: 0, paceStatus: 'on' as const, daysElapsed, daysInMonth });

    const totalPace = total.mtdSpend / (total.budget * daysElapsed / daysInMonth);
    total.paceStatus = totalPace < 0.9 ? 'under' : totalPace > 1.1 ? 'over' : 'on';

    return [...results, total];
  }
}
