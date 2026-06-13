/**
 * Shared aggregation logic. Operates purely on raw AdRow[] (one row per ad per day).
 * BOTH MockProvider and SupabaseProvider feed their rows through these functions, so
 * the dashboard behaves identically regardless of where the rows came from.
 */
import {
  AdRow, KpiData, TimeseriesPoint, ChannelBreakdown, CampaignRow, AdCreative,
  FunnelStage, AudienceBreakdown, GeoRow, HeatmapCell, KeywordRow, AdsetRow,
} from './types';

export function dateRange(from: string, to: string): string[] {
  const dates: string[] = [];
  const cur = new Date(from);
  const end = new Date(to);
  while (cur <= end) {
    dates.push(cur.toISOString().split('T')[0]);
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

export function previousPeriod(from: string, to: string): { from: string; to: string } {
  const f = new Date(from);
  const t = new Date(to);
  const days = Math.floor((t.getTime() - f.getTime()) / 86400000) + 1;
  const pf = new Date(f);
  pf.setDate(pf.getDate() - days);
  const pt = new Date(pf);
  pt.setDate(pt.getDate() + days - 1);
  return { from: pf.toISOString().split('T')[0], to: pt.toISOString().split('T')[0] };
}

export function previousYear(from: string, to: string): { from: string; to: string } {
  return {
    from: from.replace(/^\d{4}/, (y) => String(+y - 1)),
    to: to.replace(/^\d{4}/, (y) => String(+y - 1)),
  };
}

export function computeKpis(rows: AdRow[]): KpiData {
  const spend = rows.reduce((s, r) => s + r.spend, 0);
  const revenue = rows.reduce((s, r) => s + r.revenue, 0);
  const conversions = rows.reduce((s, r) => s + r.conversions, 0);
  const impressions = rows.reduce((s, r) => s + r.impressions, 0);
  const clicks = rows.reduce((s, r) => s + r.clicks, 0);
  return {
    spend, revenue, conversions, impressions, clicks,
    roas: spend > 0 ? revenue / spend : 0,
    cpa: conversions > 0 ? spend / conversions : 0,
    ctr: impressions > 0 ? clicks / impressions : 0,
    cpc: clicks > 0 ? spend / clicks : 0,
    cpm: impressions > 0 ? (spend / impressions) * 1000 : 0,
    conversionRate: clicks > 0 ? conversions / clicks : 0,
    aov: conversions > 0 ? revenue / conversions : 0,
  };
}

export function aggregateTimeseries(rows: AdRow[], granularity: 'daily' | 'weekly'): TimeseriesPoint[] {
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

/** Always groups by channel so the channel-comparison view shows both sides. */
export function aggregateChannelBreakdown(rows: AdRow[]): ChannelBreakdown[] {
  const channels: Array<'facebook' | 'google'> = ['facebook', 'google'];
  return channels.map(ch => {
    const kpi = computeKpis(rows.filter(r => r.channel === ch));
    return { channel: ch, ...kpi };
  });
}

export function aggregateCampaigns(
  rows: AdRow[],
  from: string,
  to: string,
  statusFn: (key: string) => 'active' | 'paused' = () => 'active',
): CampaignRow[] {
  const dates = dateRange(from, to);
  const byKey: Record<string, AdRow[]> = {};
  for (const row of rows) {
    const key = `${row.channel}::${row.campaign}`;
    (byKey[key] ||= []).push(row);
  }

  return Object.entries(byKey).map(([key, cRows]) => {
    const [channel, campaign] = key.split('::') as ['facebook' | 'google', string];
    const kpi = computeKpis(cRows);

    const spendByDate: Record<string, number> = {};
    for (const r of cRows) spendByDate[r.date] = (spendByDate[r.date] || 0) + r.spend;
    const sparkline = dates.slice(-14).map(d => spendByDate[d] || 0);

    const byAdset: Record<string, AdRow[]> = {};
    for (const r of cRows) (byAdset[r.adset] ||= []).push(r);

    const adsets: AdsetRow[] = Object.entries(byAdset).map(([adset, aRows]) => {
      const ak = computeKpis(aRows);
      const byAd: Record<string, AdRow[]> = {};
      for (const r of aRows) (byAd[r.ad] ||= []).push(r);
      const ads: AdCreative[] = Object.entries(byAd).map(([ad, adRows]) => {
        const adKpi = computeKpis(adRows);
        const freq = adRows.reduce((s, r) => s + (r.frequency || 1), 0) / adRows.length;
        return { ad, ...adKpi, frequency: freq, fatigued: freq > 3.0 && adKpi.ctr < 0.015 };
      });
      return { adset, ...ak, ads };
    });

    return { campaign, channel, status: statusFn(key), ...kpi, sparkline, adsets };
  });
}

export function creativesFromCampaigns(campaigns: CampaignRow[]): AdCreative[] {
  const creatives: AdCreative[] = [];
  for (const c of campaigns) for (const as of c.adsets) for (const ad of as.ads) creatives.push(ad);
  return creatives.sort((a, b) => b.roas - a.roas);
}

export function aggregateAudience(rows: AdRow[]): AudienceBreakdown[] {
  const dims = ['device', 'placement', 'ageRange', 'gender'] as const;
  const result: AudienceBreakdown[] = [];
  for (const dim of dims) {
    const byVal: Record<string, AdRow[]> = {};
    for (const r of rows) {
      const val = (r[dim] as string) || 'unknown';
      (byVal[val] ||= []).push(r);
    }
    for (const [value, vRows] of Object.entries(byVal)) {
      result.push({ dimension: dim, value, ...computeKpis(vRows) });
    }
  }
  return result;
}

export function aggregateGeo(rows: AdRow[]): GeoRow[] {
  const byRegion: Record<string, AdRow[]> = {};
  for (const r of rows) (byRegion[r.region || 'Unknown'] ||= []).push(r);
  return Object.entries(byRegion).map(([region, rRows]) => {
    const k = computeKpis(rRows);
    return { region, spend: k.spend, impressions: k.impressions, clicks: k.clicks, conversions: k.conversions, cpa: k.cpa, revenue: k.revenue, roas: k.roas };
  }).sort((a, b) => b.spend - a.spend);
}

/**
 * Day-of-week x hour grid. If rows carry an `hour` field (real hourly data) it is used
 * directly; otherwise conversions are distributed across typical peak hours so the grid
 * still reads sensibly from daily data.
 */
export function aggregateHeatmap(rows: AdRow[], hourSeed: (row: AdRow, hour: number) => number): HeatmapCell[] {
  const grid: Record<string, { conversions: number; spend: number; revenue: number }> = {};
  const peakHours = [9, 10, 11, 12, 13, 14, 15, 19, 20, 21];
  for (const row of rows) {
    const day = new Date(row.date).getDay();
    const hourField = (row as AdRow & { hour?: number }).hour;
    if (typeof hourField === 'number') {
      const key = `${day}-${hourField}`;
      (grid[key] ||= { conversions: 0, spend: 0, revenue: 0 });
      grid[key].conversions += row.conversions;
      grid[key].spend += row.spend;
      grid[key].revenue += row.revenue;
      continue;
    }
    for (let h = 0; h < 24; h++) {
      const w = (peakHours.includes(h) ? 3 : 1) * hourSeed(row, h);
      const key = `${day}-${h}`;
      (grid[key] ||= { conversions: 0, spend: 0, revenue: 0 });
      grid[key].conversions += (row.conversions * w) / 24;
      grid[key].spend += (row.spend * w) / 24;
      grid[key].revenue += (row.revenue * w) / 24;
    }
  }
  return Object.entries(grid).map(([key, val]) => {
    const [day, hour] = key.split('-').map(Number);
    return { day, hour, conversions: Math.round(val.conversions), roas: val.spend > 0 ? val.revenue / val.spend : 0, spend: val.spend };
  });
}

export function aggregateFunnel(rows: AdRow[]): FunnelStage[] {
  const impressions = rows.reduce((s, r) => s + r.impressions, 0);
  const clicks = rows.reduce((s, r) => s + r.clicks, 0);
  const lpv = rows.reduce((s, r) => s + (r.landingPageViews || Math.round(r.clicks * 0.85)), 0);
  const conversions = rows.reduce((s, r) => s + r.conversions, 0);
  return [
    { stage: 'Impressions', value: impressions },
    { stage: 'Clicks', value: clicks, dropoff: impressions ? 1 - clicks / impressions : 0 },
    { stage: 'Landing Page Views', value: lpv, dropoff: clicks ? 1 - lpv / clicks : 0 },
    { stage: 'Conversions', value: conversions, dropoff: lpv ? 1 - conversions / lpv : 0 },
  ];
}

export function aggregateKeywords(rows: AdRow[]): KeywordRow[] {
  const byKeyword: Record<string, AdRow[]> = {};
  for (const r of rows) {
    if (!r.keyword) continue;
    (byKeyword[r.keyword] ||= []).push(r);
  }
  return Object.entries(byKeyword).map(([keyword, kRows]) => {
    const kpi = computeKpis(kRows);
    return { keyword, ...kpi, wasted: kpi.conversions === 0 && kpi.spend > 10 };
  }).sort((a, b) => b.spend - a.spend);
}
