'use client';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { MetricToggle } from '@/components/ui/MetricToggle';
import { dataProvider } from '@/lib/data';
import { AdCreative, DateFilter } from '@/lib/data/types';
import { fmtCurrency, fmtPercent, fmtRoas, fmtNumber, cn } from '@/lib/utils';

interface CreativePerformanceProps {
  filter: DateFilter;
}

type SortMetric = 'roas' | 'ctr' | 'cpa' | 'spend' | 'conversions';

const SORT_OPTIONS = [
  { value: 'roas', label: 'ROAS' },
  { value: 'ctr', label: 'CTR' },
  { value: 'cpa', label: 'CPA' },
  { value: 'spend', label: 'Spend' },
  { value: 'conversions', label: 'Conv.' },
];

function getBarWidth(value: number, max: number) {
  return max > 0 ? (value / max) * 100 : 0;
}

export function CreativePerformance({ filter }: CreativePerformanceProps) {
  const [creatives, setCreatives] = useState<AdCreative[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortMetric>('roas');

  useEffect(() => {
    setLoading(true);
    dataProvider.getCreatives(filter).then((d) => {
      setCreatives(d);
      setLoading(false);
    });
  }, [filter]);

  const sorted = [...creatives].sort((a, b) => {
    if (sortBy === 'cpa') return a.cpa - b.cpa;
    return (b[sortBy] as number) - (a[sortBy] as number);
  });

  const top = sorted.slice(0, 10);
  const maxVal = top.length > 0 ? (top[0][sortBy] as number) : 1;

  function formatValue(ad: AdCreative, metric: SortMetric): string {
    switch (metric) {
      case 'roas': return fmtRoas(ad.roas);
      case 'ctr': return fmtPercent(ad.ctr, 2);
      case 'cpa': return fmtCurrency(ad.cpa);
      case 'spend': return fmtCurrency(ad.spend, true);
      case 'conversions': return fmtNumber(ad.conversions);
    }
  }

  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Creative Performance</h2>
          <p className="text-xs text-slate-400 mt-0.5">Top 10 ads by selected metric</p>
        </div>
        <MetricToggle
          options={SORT_OPTIONS}
          value={sortBy}
          onChange={(v) => setSortBy(v as SortMetric)}
        />
      </div>

      {loading ? (
        <Skeleton className="h-64" />
      ) : (
        <div className="flex flex-col gap-2">
          {top.map((ad, i) => {
            const val = ad[sortBy] as number;
            const barW = getBarWidth(sortBy === 'cpa' ? 1 / val : val, sortBy === 'cpa' ? 1 / (top[top.length - 1]?.cpa || 1) : maxVal);
            return (
              <div key={ad.ad} className="flex items-center gap-3">
                <span className="text-xs font-medium text-slate-400 w-5 text-right">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <p className="text-xs font-medium text-slate-700 truncate">{ad.ad}</p>
                      {ad.fatigued && (
                        <span className="shrink-0 text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full font-medium">
                          Fatigued
                        </span>
                      )}
                    </div>
                    <span className={cn(
                      'text-xs font-bold tabular-nums shrink-0 ml-2',
                      sortBy === 'cpa'
                        ? val <= 35 ? 'text-emerald-600' : 'text-red-600'
                        : sortBy === 'roas'
                        ? val >= 4 ? 'text-emerald-600' : 'text-slate-700'
                        : 'text-slate-900'
                    )}>
                      {formatValue(ad, sortBy)}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                      style={{ width: `${barW}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
