import { DataProvider } from './provider';
import { AdRow, DateFilter, KpiData, TimeseriesPoint, ChannelBreakdown, CampaignRow, AdCreative, FunnelStage, AudienceBreakdown, GeoRow, HeatmapCell, KeywordRow, BudgetPacing, AdsetRow } from './types';

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
  const start = new Date(from);
  const end = new Date(to);
  const cur = new Date(start);
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

function computeKpis(rows: AdRow[]): KpiData {
  const spend = rows.reduce((s, r) => s + r.spend, 0);
  const revenue = rows.reduce((s, r) => s + r.revenue, 0);
  const conversions = rows.reduce((s, r) => s + r.conversions, 0);
  const impressions = rows.reduce((s, r) => s + r.impressions, 0);
  const clicks = rows.reduce((s, r) => s + r.clicks, 0);
  const roas = spend > 0 ? revenue / spend : 0;
  const cpa = conversions > 0 ? spend / conversions : 0;
  const ctr = impressions > 0 ? clicks / impressions : 0;
  const cpc = clicks > 0 ? spend / clicks : 0;
  const cpm = impressions > 0 ? (spend / impressions) * 1000 : 0;
  const conversionRate = clicks > 0 ? conversions / clicks : 0;
  const aov = conversions > 0 ? revenue / conversions : 0;
  return { spend, revenue, roas, conversions, cpa, conversionRate, ctr, cpc, cpm, impressions, clicks, aov };
}

function previousPeriod(from: string, to: string): { from: string; to: string } {
  const f = new Date(from);
  const t = new Date(to);
  const days = Math.floor((t.getTime() - f.getTime()) / 86400000) + 1;
  const pf = new Date(f);
  pf.setDate(pf.getDate() - days);
  const pt = new Date(pf);
  pt.setDate(pt.getDate() + days - 1);
  return {
    from: pf.toISOString().split('T')[0],
    to: pt.toISOString().split('T')[0],
  };
}

function previousYear(from: string, to: string): { from: string; to: string } {
  return {
    from: from.replace(/^\d{4}/, (y) => String(+y - 1)),
    to: to.replace(/^\d{4}/, (y) => String(+y - 1)),
  };
}

export class MockProvider implements DataProvider {
  private getRows(filter: DateFilter): AdRow[] {
    return generateAllRows(filter.from, filter.to, filter.channel);
  }

  async getKpis(filter: DateFilter): Promise<{ current: KpiData; previous: KpiData }> {
    const rows = this.getRows(filter);
    const current = computeKpis(rows);
    const prevRange = filter.compareTo === 'previous_year'
      ? previousYear(filter.from, filter.to)
      : previousPeriod(filter.from, filter.to);
    const prevRows = generateAllRows(prevRange.from, prevRange.to, filter.channel);
    const previous = computeKpis(prevRows);
    return { current, previous };
  }

  async getTimeseries(filter: DateFilter, granularity: 'daily' | 'weekly'): Promise<TimeseriesPoint[]> {
    const rows = this.getRows(filter);
    const byDate: Record<string, TimeseriesPoint> = {};

    for (const row of rows) {
      let key = row.date;
      if (granularity === 'weekly') {
        const d = new Date(row.date);
        d.setDate(d.getDate() - d.getDay());
        key = d.toISOString().split('T')[0];
      }
      if (!byDate[key]) {
        byDate[key] = { date: key, spend: 0, revenue: 0, conversions: 0, roas: 0, ctr: 0, cpc: 0, impressions: 0, clicks: 0 };
      }
      byDate[key].spend += row.spend;
      byDate[key].revenue += row.revenue;
      byDate[key].conversions += row.conversions;
      byDate[key].impressions += row.impressions;
      byDate[key].clicks += row.clicks;
    }

    return Object.values(byDate).map(d => ({
      ...d,
      roas: d.spend > 0 ? d.revenue / d.spend : 0,
      ctr: d.impressions > 0 ? d.clicks / d.impressions : 0,
      cpc: d.clicks > 0 ? d.spend / d.clicks : 0,
    })).sort((a, b) => a.date.localeCompare(b.date));
  }

  async getChannelBreakdown(filter: DateFilter): Promise<ChannelBreakdown[]> {
    const channels: Array<'facebook' | 'google'> = ['facebook', 'google'];
    return channels.map(ch => {
      const rows = generateAllRows(filter.from, filter.to, ch);
      const kpi = computeKpis(rows);
      return { channel: ch, ...kpi };
    });
  }

  async getCampaigns(filter: DateFilter): Promise<CampaignRow[]> {
    const rows = this.getRows(filter);
    const byKey: Record<string, AdRow[]> = {};
    for (const row of rows) {
      const key = `${row.channel}::${row.campaign}`;
      if (!byKey[key]) byKey[key] = [];
      byKey[key].push(row);
    }

    const dates = dateRange(filter.from, filter.to);

    return Object.entries(byKey).map(([key, cRows]) => {
      const [channel, campaign] = key.split('::') as ['facebook' | 'google', string];
      const kpi = computeKpis(cRows);

      // Sparkline: spend per day
      const spendByDate: Record<string, number> = {};
      for (const r of cRows) spendByDate[r.date] = (spendByDate[r.date] || 0) + r.spend;
      const sparkline = dates.slice(-14).map(d => spendByDate[d] || 0);

      // Adsets
      const byAdset: Record<string, AdRow[]> = {};
      for (const r of cRows) {
        if (!byAdset[r.adset]) byAdset[r.adset] = [];
        byAdset[r.adset].push(r);
      }

      const adsets: AdsetRow[] = Object.entries(byAdset).map(([adset, aRows]) => {
        const ak = computeKpis(aRows);
        const byAd: Record<string, AdRow[]> = {};
        for (const r of aRows) {
          if (!byAd[r.ad]) byAd[r.ad] = [];
          byAd[r.ad].push(r);
        }
        const ads: AdCreative[] = Object.entries(byAd).map(([ad, adRows]) => {
          const adKpi = computeKpis(adRows);
          const freq = adRows.reduce((s, r) => s + (r.frequency || 1), 0) / adRows.length;
          return {
            ad, ...adKpi, frequency: freq,
            fatigued: freq > 3.0 && adKpi.ctr < 0.015,
          };
        });
        return { adset, ...ak, ads };
      });

      const status: 'active' | 'paused' = seededRandom(key) > 0.15 ? 'active' : 'paused';

      return { campaign, channel, status, ...kpi, sparkline, adsets };
    });
  }

  async getCreatives(filter: DateFilter): Promise<AdCreative[]> {
    const campaigns = await this.getCampaigns(filter);
    const creatives: AdCreative[] = [];
    for (const c of campaigns) {
      for (const as of c.adsets) {
        for (const ad of as.ads) {
          creatives.push(ad);
        }
      }
    }
    return creatives.sort((a, b) => b.roas - a.roas);
  }

  async getAudienceBreakdown(filter: DateFilter): Promise<AudienceBreakdown[]> {
    const rows = this.getRows(filter);
    const dims = ['device', 'placement', 'ageRange', 'gender'] as const;
    const result: AudienceBreakdown[] = [];

    for (const dim of dims) {
      const byVal: Record<string, AdRow[]> = {};
      for (const r of rows) {
        const val = r[dim] || 'unknown';
        if (!byVal[val]) byVal[val] = [];
        byVal[val].push(r);
      }
      for (const [value, vRows] of Object.entries(byVal)) {
        const kpi = computeKpis(vRows);
        result.push({ dimension: dim, value, ...kpi });
      }
    }
    return result;
  }

  async getGeo(filter: DateFilter): Promise<GeoRow[]> {
    const rows = this.getRows(filter);
    const byRegion: Record<string, AdRow[]> = {};
    for (const r of rows) {
      const region = r.region || 'Unknown';
      if (!byRegion[region]) byRegion[region] = [];
      byRegion[region].push(r);
    }
    return Object.entries(byRegion).map(([region, rRows]) => {
      const kpi = computeKpis(rRows);
      return { region, spend: kpi.spend, impressions: kpi.impressions, clicks: kpi.clicks, conversions: kpi.conversions, cpa: kpi.cpa, revenue: kpi.revenue, roas: kpi.roas };
    }).sort((a, b) => b.spend - a.spend);
  }

  async getHeatmap(filter: DateFilter): Promise<HeatmapCell[]> {
    const rows = this.getRows(filter);
    const grid: Record<string, { conversions: number; spend: number; revenue: number }> = {};

    for (const row of rows) {
      const d = new Date(row.date);
      const day = d.getDay();
      // Distribute hours using seeded random based on date+channel+campaign
      for (let h = 0; h < 24; h++) {
        const hourWeight = seededRandom(`${row.date}-${row.channel}-${row.campaign}-hour`, h);
        const peakHours = [9, 10, 11, 12, 13, 14, 15, 19, 20, 21];
        const isPeak = peakHours.includes(h);
        const w = isPeak ? hourWeight * 3 : hourWeight;
        const key = `${day}-${h}`;
        if (!grid[key]) grid[key] = { conversions: 0, spend: 0, revenue: 0 };
        grid[key].conversions += row.conversions * w / 24;
        grid[key].spend += row.spend * w / 24;
        grid[key].revenue += row.revenue * w / 24;
      }
    }

    return Object.entries(grid).map(([key, val]) => {
      const [day, hour] = key.split('-').map(Number);
      return {
        day, hour,
        conversions: Math.round(val.conversions),
        roas: val.spend > 0 ? val.revenue / val.spend : 0,
        spend: val.spend,
      };
    });
  }

  async getFunnel(filter: DateFilter): Promise<FunnelStage[]> {
    const rows = this.getRows(filter);
    const impressions = rows.reduce((s, r) => s + r.impressions, 0);
    const clicks = rows.reduce((s, r) => s + r.clicks, 0);
    const lpv = rows.reduce((s, r) => s + (r.landingPageViews || Math.round(r.clicks * 0.85)), 0);
    const conversions = rows.reduce((s, r) => s + r.conversions, 0);

    return [
      { stage: 'Impressions', value: impressions },
      { stage: 'Clicks', value: clicks, dropoff: 1 - clicks / impressions },
      { stage: 'Landing Page Views', value: lpv, dropoff: 1 - lpv / clicks },
      { stage: 'Conversions', value: conversions, dropoff: 1 - conversions / lpv },
    ];
  }

  async getKeywords(filter: DateFilter): Promise<KeywordRow[]> {
    const rows = this.getRows({ ...filter, channel: 'google' });
    const byKeyword: Record<string, AdRow[]> = {};
    for (const r of rows) {
      if (!r.keyword) continue;
      if (!byKeyword[r.keyword]) byKeyword[r.keyword] = [];
      byKeyword[r.keyword].push(r);
    }
    return Object.entries(byKeyword).map(([keyword, kRows]) => {
      const kpi = computeKpis(kRows);
      return {
        keyword, ...kpi,
        wasted: kpi.conversions === 0 && kpi.spend > 10,
      };
    }).sort((a, b) => b.spend - a.spend);
  }

  async getBudgetPacing(filter: DateFilter): Promise<BudgetPacing[]> {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysElapsed = now.getDate();

    const monthStart = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const today = now.toISOString().split('T')[0];
    const mtdFilter = { ...filter, from: monthStart, to: today };

    const channels: Array<'facebook' | 'google'> = ['facebook', 'google'];
    const results: BudgetPacing[] = [];

    for (const ch of channels) {
      const rows = generateAllRows(mtdFilter.from, mtdFilter.to, ch);
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
