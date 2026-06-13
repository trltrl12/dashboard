import { DataProvider } from './provider';
import { DateFilter, KpiData, TimeseriesPoint, ChannelBreakdown, CampaignRow, AdCreative, FunnelStage, AudienceBreakdown, GeoRow, HeatmapCell, KeywordRow, BudgetPacing } from './types';

/**
 * BigQueryProvider: Replace MockProvider with this once Windsor.ai populates your tables.
 * Windsor writes one row per ad per day into `your_project.windsor_ads.performance`.
 * Set BIGQUERY_PROJECT, BIGQUERY_DATASET env vars, then swap one line in lib/data/index.ts.
 */
export class BigQueryProvider implements DataProvider {
  private project = process.env.BIGQUERY_PROJECT!;
  private dataset = process.env.BIGQUERY_DATASET!;

  private baseQuery(filter: DateFilter): string {
    const channelClause = filter.channel && filter.channel !== 'all'
      ? `AND channel = '${filter.channel}'`
      : '';
    return `
      FROM \`${this.project}.${this.dataset}.performance\`
      WHERE date BETWEEN '${filter.from}' AND '${filter.to}'
      ${channelClause}
    `;
  }

  async getKpis(_filter: DateFilter): Promise<{ current: KpiData; previous: KpiData }> {
    // TODO: query the Windsor-populated BigQuery tables here
    // Example:
    // const [rows] = await bigquery.query({
    //   query: `
    //     SELECT
    //       SUM(spend) as spend,
    //       SUM(revenue) as revenue,
    //       SUM(conversions) as conversions,
    //       SUM(impressions) as impressions,
    //       SUM(clicks) as clicks
    //     ${this.baseQuery(filter)}
    //   `,
    // });
    void this.baseQuery(_filter);
    throw new Error('BigQueryProvider not yet configured');
  }

  async getTimeseries(_filter: DateFilter, _granularity: 'daily' | 'weekly'): Promise<TimeseriesPoint[]> {
    throw new Error('BigQueryProvider not yet configured');
  }

  async getChannelBreakdown(_filter: DateFilter): Promise<ChannelBreakdown[]> {
    throw new Error('BigQueryProvider not yet configured');
  }

  async getCampaigns(_filter: DateFilter): Promise<CampaignRow[]> {
    throw new Error('BigQueryProvider not yet configured');
  }

  async getCreatives(_filter: DateFilter): Promise<AdCreative[]> {
    throw new Error('BigQueryProvider not yet configured');
  }

  async getAudienceBreakdown(_filter: DateFilter): Promise<AudienceBreakdown[]> {
    throw new Error('BigQueryProvider not yet configured');
  }

  async getGeo(_filter: DateFilter): Promise<GeoRow[]> {
    throw new Error('BigQueryProvider not yet configured');
  }

  async getHeatmap(_filter: DateFilter): Promise<HeatmapCell[]> {
    throw new Error('BigQueryProvider not yet configured');
  }

  async getFunnel(_filter: DateFilter): Promise<FunnelStage[]> {
    throw new Error('BigQueryProvider not yet configured');
  }

  async getKeywords(_filter: DateFilter): Promise<KeywordRow[]> {
    throw new Error('BigQueryProvider not yet configured');
  }

  async getBudgetPacing(_filter: DateFilter): Promise<BudgetPacing[]> {
    throw new Error('BigQueryProvider not yet configured');
  }
}
