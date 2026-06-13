import { DataProvider } from './provider';
import { AdRow, DateFilter, KpiData, TimeseriesPoint, ChannelBreakdown, CampaignRow, AdCreative, FunnelStage, AudienceBreakdown, GeoRow, HeatmapCell, KeywordRow, BudgetPacing } from './types';
import {
  computeKpis, aggregateTimeseries, aggregateChannelBreakdown, aggregateCampaigns,
  creativesFromCampaigns, aggregateAudience, aggregateGeo, aggregateHeatmap,
  aggregateFunnel, aggregateKeywords, previousPeriod, previousYear,
} from './aggregate';

function seededRandom(seed: string, index: number = 0): number {
  let h = 0;
  const str = seed + index;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
  h = h ^ (h >>> 16);
  return (h >>> 0) / 0xffffffff;
}

function dateRange(from: string, to: string): string[] {
  const dates: string[] = [];
  const cur = new Date(from);
  const end = new Date(to);
  while (cur <= end) {
    dates.push(cur.toISOString().split('T')[0]);
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

function daysSince(dateStr: string, baseStr: string): number {
  return Math.floor((new Date(dateStr).getTime() - new Date(baseStr).getTime()) / 86400000);
}

const BASE_DATE = '2024-10-01';

const FB_CAMPAIGNS = [
  'Brand Awareness Q1',
  'Retargeting - Website Visitors',
  'Prospecting - Lookalike',
  'Product Catalog - DPA',
];
const GG_CAMPAIGNS = [
  'Brand Search',
  'Competitor Keywords',
  'Generic Search - Products',
  'Performance Max',
];

const FB_WEIGHTS = [0.2, 0.3, 0.25, 0.25];
const GG_WEIGHTS = [0.25, 0.2, 0.3, 0.25];

const ADSETS: Record<string, string[]> = {
  'Brand Awareness Q1': ['18-34 US', '35-54 US'],
  'Retargeting - Website Visitors': ['7-day visitors', '30-day visitors', 'Cart abandoners'],
  'Prospecting - Lookalike': ['1% LAL', '3% LAL'],
  'Product Catalog - DPA': ['All products', 'Best sellers'],
  'Brand Search': ['Exact match', 'Phrase match'],
  'Competitor Keywords': ['Competitor A', 'Competitor B'],
  'Generic Search - Products': ['Category A', 'Category B', 'Category C'],
  'Performance Max': ['Smart shopping', 'All channels'],
};

function generateDayData(date: string, channel: 'facebook' | 'google', campaignIdx: number, adsetIdx: number, adIdx: number): AdRow {
  const r = (i: number) => seededRandom(`${date}-${channel}-${campaignIdx}-${adsetIdx}-${adIdx}`, i);

  const dayOfWeek = new Date(date).getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const weekdayMult = isWeekend ? 0.75 : 1.0;

  const dayNum = daysSince(date, BASE_DATE);
  const growthMult = 1 + (dayNum / 90) * 0.15;

  const campaigns = channel === 'facebook' ? FB_CAMPAIGNS : GG_CAMPAIGNS;
  const weights = channel === 'facebook' ? FB_WEIGHTS : GG_WEIGHTS;
  const campaign = campaigns[campaignIdx];

  const adsetKeys = ADSETS[campaign];
  const adset = adsetKeys[adsetIdx % adsetKeys.length];
  const ad = `Ad ${adIdx + 1} - ${adset}`;

  const baseCPM = channel === 'facebook' ? 12 : 8;
  const baseCTR = channel === 'facebook' ? 0.018 : 0.052;
  const baseConvRate = channel === 'facebook' ? 0.032 : 0.045;
  const baseAOV = 95 + r(99) * 20;

  const weight = weights[campaignIdx];
  const dailySpendPerSlot = (channel === 'facebook' ? 800 : 700) * weight * weekdayMult * growthMult;

  const spend = dailySpendPerSlot * (0.8 + r(0) * 0.4);
  const impressions = Math.round((spend / baseCPM) * 1000 * (0.9 + r(1) * 0.2));
  const ctr = baseCTR * (0.8 + r(2) * 0.4);
  const clicks = Math.round(impressions * ctr);
  const convRate = baseConvRate * (0.7 + r(3) * 0.6);
  const conversions = Math.round(clicks * convRate);
  const revenue = conversions * baseAOV * (0.9 + r(4) * 0.2);
  const lpv = Math.round(clicks * (0.7 + r(5) * 0.25));
  const frequency = 1.2 + r(6) * 2.5;
  const region = ['US-CA', 'US-TX', 'US-NY', 'US-FL', 'US-IL', 'US-WA'][Math.floor(r(7) * 6)];
  const device = ['mobile', 'desktop', 'tablet'][Math.floor(r(8) * 3)];
  const placement = channel === 'facebook'
    ? ['feed', 'stories', 'reels', 'marketplace'][Math.floor(r(9) * 4)]
    : ['search', 'display', 'shopping'][Math.floor(r(9) * 3)];
  const ageRange = ['18-24', '25-34', '35-44', '45-54', '55+'][Math.floor(r(10) * 5)];
  const gender = ['male', 'female', 'unknown'][Math.floor(r(11) * 3)];
  const keyword = channel === 'google'
    ? ['buy running shoes', 'best sneakers 2024', 'nike shoes sale', 'cheap athletic shoes', 'running gear online'][Math.floor(r(12) * 5)]
    : undefined;

  return {
    date, channel, campaign, adset, ad,
    impressions, clicks, spend, conversions, revenue,
    device, placement, region, ageRange, gender, keyword,
    frequency, landingPageViews: lpv,
  };
}

function generateAllRows(from: string, to: string, channel?: 'facebook' | 'google' | 'all'): AdRow[] {
  const rows: AdRow[] = [];
  const dates = dateRange(from, to);
  const channels: Array<'facebook' | 'google'> = (!channel || channel === 'all') ? ['facebook', 'google'] : [channel];

  for (const date of dates) {
    for (const ch of channels) {
      const campaigns = ch === 'facebook' ? FB_CAMPAIGNS : GG_CAMPAIGNS;
      for (let ci = 0; ci < campaigns.length; ci++) {
        const adsetKeys = ADSETS[campaigns[ci]];
        for (let ai = 0; ai < adsetKeys.length; ai++) {
          for (let ad = 0; ad < 2; ad++) {
            rows.push(generateDayData(date, ch, ci, ai, ad));
          }
        }
      }
    }
  }
  return rows;
}

export class MockProvider implements DataProvider {
  private getRows(filter: DateFilter): AdRow[] {
    return generateAllRows(filter.from, filter.to, filter.channel);
  }

  async getKpis(filter: DateFilter): Promise<{ current: KpiData; previous: KpiData }> {
    const current = computeKpis(this.getRows(filter));
    const prevRange = filter.compareTo === 'previous_year'
      ? previousYear(filter.from, filter.to)
      : previousPeriod(filter.from, filter.to);
    const previous = computeKpis(generateAllRows(prevRange.from, prevRange.to, filter.channel));
    return { current, previous };
  }

  async getTimeseries(filter: DateFilter, granularity: 'daily' | 'weekly'): Promise<TimeseriesPoint[]> {
    return aggregateTimeseries(this.getRows(filter), granularity);
  }

  async getChannelBreakdown(filter: DateFilter): Promise<ChannelBreakdown[]> {
    // Always show both channels regardless of the channel filter.
    return aggregateChannelBreakdown(generateAllRows(filter.from, filter.to, 'all'));
  }

  async getCampaigns(filter: DateFilter): Promise<CampaignRow[]> {
    return aggregateCampaigns(
      this.getRows(filter),
      filter.from,
      filter.to,
      (key) => (seededRandom(key) > 0.15 ? 'active' : 'paused'),
    );
  }

  async getCreatives(filter: DateFilter): Promise<AdCreative[]> {
    return creativesFromCampaigns(await this.getCampaigns(filter));
  }

  async getAudienceBreakdown(filter: DateFilter): Promise<AudienceBreakdown[]> {
    return aggregateAudience(this.getRows(filter));
  }

  async getGeo(filter: DateFilter): Promise<GeoRow[]> {
    return aggregateGeo(this.getRows(filter));
  }

  async getHeatmap(filter: DateFilter): Promise<HeatmapCell[]> {
    return aggregateHeatmap(
      this.getRows(filter),
      (row, hour) => seededRandom(`${row.date}-${row.channel}-${row.campaign}-hour`, hour),
    );
  }

  async getFunnel(filter: DateFilter): Promise<FunnelStage[]> {
    return aggregateFunnel(this.getRows(filter));
  }

  async getKeywords(filter: DateFilter): Promise<KeywordRow[]> {
    return aggregateKeywords(this.getRows({ ...filter, channel: 'google' }));
  }

  async getBudgetPacing(filter: DateFilter): Promise<BudgetPacing[]> {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysElapsed = now.getDate();

    const monthStart = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const today = now.toISOString().split('T')[0];

    const channels: Array<'facebook' | 'google'> = ['facebook', 'google'];
    const results: BudgetPacing[] = [];

    for (const ch of channels) {
      const rows = generateAllRows(monthStart, today, ch);
      const mtdSpend = rows.reduce((s, r) => s + r.spend, 0);
      const dailyRate = daysElapsed > 0 ? mtdSpend / daysElapsed : 0;
      const projectedSpend = dailyRate * daysInMonth;
      const budget = 30000; // per channel
      const pace = mtdSpend / (budget * daysElapsed / daysInMonth);
      const paceStatus: 'under' | 'on' | 'over' = pace < 0.9 ? 'under' : pace > 1.1 ? 'over' : 'on';
      results.push({ channel: ch, budget, mtdSpend, projectedSpend, paceStatus, daysElapsed, daysInMonth });
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
