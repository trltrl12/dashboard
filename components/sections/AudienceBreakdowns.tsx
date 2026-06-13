'use client';
import { useEffect, useState } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { MetricToggle } from '@/components/ui/MetricToggle';
import { makeTooltipContent } from '@/components/ui/ChartTooltip';
import { dataProvider } from '@/lib/data';
import { AudienceBreakdown, DateFilter } from '@/lib/data/types';
import { fmtCurrency, fmtPercent, fmtRoas, fmtNumber } from '@/lib/utils';

interface AudienceBreakdownsProps {
  filter: DateFilter;
}

const DIMS = [
  { value: 'device', label: 'Device' },
  { value: 'placement', label: 'Placement' },
  { value: 'ageRange', label: 'Age' },
  { value: 'gender', label: 'Gender' },
];

const METRICS = [
  { value: 'spend', label: 'Spend', fmt: (v: number) => fmtCurrency(v, true) },
  { value: 'roas', label: 'ROAS', fmt: fmtRoas },
  { value: 'conversions', label: 'Conv.', fmt: (v: number) => fmtNumber(v, true) },
  { value: 'cpa', label: 'CPA', fmt: fmtCurrency },
  { value: 'ctr', label: 'CTR', fmt: (v: number) => fmtPercent(v, 2) },
];

const DIM_COLORS = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];

export function AudienceBreakdowns({ filter }: AudienceBreakdownsProps) {
  const [data, setData] = useState<AudienceBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [dim, setDim] = useState('device');
  const [metric, setMetric] = useState('spend');

  useEffect(() => {
    setLoading(true);
    dataProvider.getAudienceBreakdown(filter).then((d) => {
      setData(d);
      setLoading(false);
    });
  }, [filter]);

  const dimData = data
    .filter((d) => d.dimension === dim)
    .sort((a, b) => (b[metric as keyof AudienceBreakdown] as number) - (a[metric as keyof AudienceBreakdown] as number));

  const metricFmt = METRICS.find((m) => m.value === metric)?.fmt ?? ((v: number) => String(v));

  const chartData = dimData.map((d, i) => ({
    name: d.value,
    value: d[metric as keyof AudienceBreakdown] as number,
    fill: DIM_COLORS[i % DIM_COLORS.length],
  }));

  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Audience Breakdowns</h2>
          <p className="text-xs text-slate-400 mt-0.5">Performance by dimension</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <MetricToggle options={DIMS} value={dim} onChange={setDim} />
          <MetricToggle options={METRICS} value={metric} onChange={setMetric} />
        </div>
      </div>

      {loading ? (
        <Skeleton className="h-64" />
      ) : (
        <div className="flex flex-col gap-6">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v) => metricFmt(v)}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                width={55}
              />
              <Tooltip
                content={makeTooltipContent((v) => metricFmt(v))}
              />
              <Bar dataKey="value" name={METRICS.find((m) => m.value === metric)?.label ?? metric} radius={[4, 4, 0, 0]} isAnimationActive={false}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Data table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="pb-2 text-left font-semibold text-slate-400 uppercase tracking-wider">
                    {DIMS.find((d) => d.value === dim)?.label}
                  </th>
                  <th className="pb-2 text-right font-semibold text-slate-400 uppercase tracking-wider">Spend</th>
                  <th className="pb-2 text-right font-semibold text-slate-400 uppercase tracking-wider">Revenue</th>
                  <th className="pb-2 text-right font-semibold text-slate-400 uppercase tracking-wider">ROAS</th>
                  <th className="pb-2 text-right font-semibold text-slate-400 uppercase tracking-wider">Conv.</th>
                  <th className="pb-2 text-right font-semibold text-slate-400 uppercase tracking-wider">CPA</th>
                </tr>
              </thead>
              <tbody>
                {dimData.map((d, i) => (
                  <tr key={d.value} className="border-b border-slate-50 last:border-0">
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: DIM_COLORS[i % DIM_COLORS.length] }} />
                        <span className="font-medium text-slate-700 capitalize">{d.value}</span>
                      </div>
                    </td>
                    <td className="py-2 text-right tabular-nums text-slate-600">{fmtCurrency(d.spend, true)}</td>
                    <td className="py-2 text-right tabular-nums text-slate-600">{fmtCurrency(d.revenue, true)}</td>
                    <td className="py-2 text-right tabular-nums text-slate-600">{fmtRoas(d.roas)}</td>
                    <td className="py-2 text-right tabular-nums text-slate-600">{fmtNumber(d.conversions)}</td>
                    <td className="py-2 text-right tabular-nums text-slate-600">{fmtCurrency(d.cpa)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Card>
  );
}
