import { DateFilter, KpiData, TimeseriesPoint, ChannelBreakdown, CampaignRow, AdCreative, FunnelStage, AudienceBreakdown, GeoRow, HeatmapCell, KeywordRow, BudgetPacing } from './types';

export interface DataProvider {
  getKpis(filter: DateFilter): Promise<{ current: KpiData; previous: KpiData }>;
  getTimeseries(filter: DateFilter, granularity: 'daily' | 'weekly'): Promise<TimeseriesPoint[]>;
  getChannelBreakdown(filter: DateFilter): Promise<ChannelBreakdown[]>;
  getCampaigns(filter: DateFilter): Promise<CampaignRow[]>;
  getCreatives(filter: DateFilter): Promise<AdCreative[]>;
  getAudienceBreakdown(filter: DateFilter): Promise<AudienceBreakdown[]>;
  getGeo(filter: DateFilter): Promise<GeoRow[]>;
  getHeatmap(filter: DateFilter): Promise<HeatmapCell[]>;
  getFunnel(filter: DateFilter): Promise<FunnelStage[]>;
  getKeywords(filter: DateFilter): Promise<KeywordRow[]>;
  getBudgetPacing(filter: DateFilter): Promise<BudgetPacing[]>;
}
