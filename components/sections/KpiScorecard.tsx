'use client';
import { useEffect, useState } from 'react';
import { StatCard } from '@/components/ui/StatCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { dataProvider } from '@/lib/data';
import { KpiData } from '@/lib/data/types';
import { DateFilter } from '@/lib/data/types';
import { fmtCurrency, fmtNumber, fmtPercent, fmtRoas, delta } from '@/lib/utils';
import { brand } from '@/config/brand';

interface KpiScorecardProps {
  filter: DateFilter;
}

export function KpiScorecard({ filter }: KpiScorecardProps) {
  const [data, setData] = useState<{ current: KpiData; previous: KpiData } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    dataProvider.getKpis(filter).then((d) => {
      setData(d);
      setLoading(false);
    });
  }, [filter]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
    );
  }

  if (!data) return null;

  const { current: c, previous: p } = data;

  const roasColor = c.roas >= brand.targets.roas ? '#10b981' : '#ef4444';
  const cpaColor = c.cpa <= brand.targets.cpa ? '#10b981' : '#ef4444';

  const kpis = [
    {
      label: 'Total Spend',
      value: fmtCurrency(c.spend, true),
      delta: delta(c.spend, p.spend),
      highlight: 'neutral' as const,
    },
    {
      label: 'Revenue',
      value: fmtCurrency(c.revenue, true),
      delta: delta(c.revenue, p.revenue),
    },
    {
      label: 'ROAS',
      value: fmtRoas(c.roas),
      delta: delta(c.roas, p.roas),
      subtitle: `Target: ${brand.targets.roas}x`,
      sparklineColor: roasColor,
    },
    {
      label: 'Conversions',
      value: fmtNumber(c.conversions, true),
      delta: delta(c.conversions, p.conversions),
    },
    {
      label: 'CPA',
      value: fmtCurrency(c.cpa),
      delta: delta(c.cpa, p.cpa),
      highlight: 'bad' as const,
      subtitle: `Target: ${fmtCurrency(brand.targets.cpa)}`,
      sparklineColor: cpaColor,
    },
    {
      label: 'Conv. Rate',
      value: fmtPercent(c.conversionRate),
      delta: delta(c.conversionRate, p.conversionRate),
    },
    {
      label: 'CTR',
      value: fmtPercent(c.ctr, 2),
      delta: delta(c.ctr, p.ctr),
    },
    {
      label: 'CPC',
      value: fmtCurrency(c.cpc),
      delta: delta(c.cpc, p.cpc),
      highlight: 'bad' as const,
    },
    {
      label: 'CPM',
      value: fmtCurrency(c.cpm),
      delta: delta(c.cpm, p.cpm),
      highlight: 'bad' as const,
    },
    {
      label: 'Impressions',
      value: fmtNumber(c.impressions, true),
      delta: delta(c.impressions, p.impressions),
    },
    {
      label: 'Clicks',
      value: fmtNumber(c.clicks, true),
      delta: delta(c.clicks, p.clicks),
    },
    {
      label: 'AOV',
      value: fmtCurrency(c.aov),
      delta: delta(c.aov, p.aov),
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
      {kpis.map((kpi) => (
        <StatCard
          key={kpi.label}
          label={kpi.label}
          value={kpi.value}
          delta={kpi.delta}
          subtitle={kpi.subtitle}
          highlight={kpi.highlight}
          sparklineColor={kpi.sparklineColor}
        />
      ))}
    </div>
  );
}
