'use client';
import { useEffect, useState } from 'react';
import {
  ResponsiveContainer, ComposedChart, Line, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { MetricToggle } from '@/components/ui/MetricToggle';
import { makeTooltipContent } from '@/components/ui/ChartTooltip';
import { dataProvider } from '@/lib/data';
import { TimeseriesPoint, DateFilter } from '@/lib/data/types';
import { fmtCurrency, fmtNumber, fmtPercent, fmtRoas } from '@/lib/utils';

interface PerformanceTrendProps {
  filter: DateFilter;
}

type Metric = 'spend' | 'revenue' | 'roas' | 'conversions' | 'ctr' | 'cpc';
type Granularity = 'daily' | 'weekly';

const METRICS: { value: Metric; label: string }[] = [
  { value: 'spend', label: 'Spend' },
  { value: 'revenue', label: 'Revenue' },
  { value: 'roas', label: 'ROAS' },
  { value: 'conversions', label: 'Conv.' },
  { value: 'ctr', label: 'CTR' },
  { value: 'cpc', label: 'CPC' },
];

function formatMetric(value: number, metric: Metric): string {
  switch (metric) {
    case 'spend':
    case 'revenue':
    case 'cpc': return fmtCurrency(value, true);
    case 'roas': return fmtRoas(value);
    case 'conversions': return fmtNumber(value, true);
    case 'ctr': return fmtPercent(value, 2);
  }
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function PerformanceTrend({ filter }: PerformanceTrendProps) {
  const [data, setData] = useState<TimeseriesPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [metric, setMetric] = useState<Metric>('spend');
  const [granularity, setGranularity] = useState<Granularity>('daily');

  useEffect(() => {
    setLoading(true);
    dataProvider.getTimeseries(filter, granularity).then((d) => {
      setData(d);
      setLoading(false);
    });
  }, [filter, granularity]);

  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Performance Trend</h2>
          <p className="text-xs text-slate-400 mt-0.5">Daily spend & revenue over time</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <MetricToggle
            options={METRICS}
            value={metric}
            onChange={(v) => setMetric(v as Metric)}
          />
          <MetricToggle
            options={[
              { value: 'daily', label: 'Daily' },
              { value: 'weekly', label: 'Weekly' },
            ]}
            value={granularity}
            onChange={(v) => setGranularity(v as Granularity)}
          />
        </div>
      </div>

      {loading ? (
        <Skeleton className="h-64" />
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tickFormatter={(v) => formatMetric(v, metric)}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
              width={60}
            />
            <Tooltip
              content={makeTooltipContent(
                (v) => formatMetric(v, metric),
                (label) => label ? formatDate(label) : ''
              )}
            />
            <Legend
              wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }}
            />
            {(metric === 'spend' || metric === 'revenue') ? (
              <>
                <Bar dataKey="spend" name="Spend" fill="#6366f1" opacity={0.85} radius={[2, 2, 0, 0]} hide={metric !== 'spend'} />
                <Bar dataKey="revenue" name="Revenue" fill="#10b981" opacity={0.85} radius={[2, 2, 0, 0]} hide={metric !== 'revenue'} />
                <Line dataKey="spend" name="Spend" stroke="#6366f1" strokeWidth={2} dot={false} hide={metric !== 'spend'} />
                <Line dataKey="revenue" name="Revenue" stroke="#10b981" strokeWidth={2} dot={false} hide={metric !== 'revenue'} />
              </>
            ) : (
              <Line
                dataKey={metric}
                name={METRICS.find((m) => m.value === metric)?.label ?? metric}
                stroke="#6366f1"
                strokeWidth={2}
                dot={false}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}
