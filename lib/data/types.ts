export interface AdRow {
  date: string; // YYYY-MM-DD
  channel: 'facebook' | 'google';
  campaign: string;
  adset: string;
  ad: string;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  revenue: number;
  // optional breakdown dims
  device?: string;
  placement?: string;
  region?: string;
  ageRange?: string;
  gender?: string;
  keyword?: string;
  frequency?: number;
  landingPageViews?: number;
}

export interface DateFilter {
  from: string; // YYYY-MM-DD
  to: string;   // YYYY-MM-DD
  channel?: 'facebook' | 'google' | 'all';
  compareTo?: 'previous_period' | 'previous_year';
}

export interface KpiData {
  spend: number;
  revenue: number;
  roas: number;
  conversions: number;
  cpa: number;
  conversionRate: number;
  ctr: number;
  cpc: number;
  cpm: number;
  impressions: number;
  clicks: number;
  aov: number;
}

export interface TimeseriesPoint {
  date: string;
  spend: number;
  revenue: number;
  conversions: number;
  roas: number;
  ctr: number;
  cpc: number;
  impressions: number;
  clicks: number;
  channel?: string;
}

export interface ChannelBreakdown {
  channel: 'facebook' | 'google';
  spend: number;
  revenue: number;
  roas: number;
  conversions: number;
  cpa: number;
  ctr: number;
  cpc: number;
  cpm: number;
  impressions: number;
  clicks: number;
  conversionRate: number;
  aov: number;
}

export interface CampaignRow {
  campaign: string;
  channel: 'facebook' | 'google';
  status: 'active' | 'paused';
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  conversions: number;
  cpa: number;
  revenue: number;
  roas: number;
  sparkline: number[];
  adsets: AdsetRow[];
}

export interface AdsetRow {
  adset: string;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  conversions: number;
  cpa: number;
  revenue: number;
  roas: number;
  ads: AdCreative[];
}

export interface AdCreative {
  ad: string;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  conversions: number;
  cpa: number;
  revenue: number;
  roas: number;
  frequency?: number;
  fatigued?: boolean;
}

export interface FunnelStage {
  stage: string;
  value: number;
  dropoff?: number;
  channel?: string;
}

export interface AudienceBreakdown {
  dimension: string;
  value: string;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  cpa: number;
  revenue: number;
  roas: number;
}

export interface GeoRow {
  region: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  cpa: number;
  revenue: number;
  roas: number;
}

export interface HeatmapCell {
  day: number; // 0=Sun
  hour: number;
  conversions: number;
  roas: number;
  spend: number;
}

export interface KeywordRow {
  keyword: string;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  conversions: number;
  cpa: number;
  spend: number;
  revenue: number;
  roas: number;
  wasted: boolean;
}

export interface BudgetPacing {
  channel: 'facebook' | 'google' | 'total';
  budget: number;
  mtdSpend: number;
  projectedSpend: number;
  paceStatus: 'under' | 'on' | 'over';
  daysElapsed: number;
  daysInMonth: number;
}
