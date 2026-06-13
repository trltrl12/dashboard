'use client';
import { useEffect, useState } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { makeTooltipContent } from '@/components/ui/ChartTooltip';
import { dataProvider } from '@/lib/data';
import { ChannelBreakdown, DateFilter } from '@/lib/data/types';
import { fmtCurrency, fmtNumber, fmtPercent, fmtRoas } from '@/lib/utils';

interface ChannelComparisonProps {
  filter: DateFilter;
}

const CHANNEL_COLORS = {
  facebook: '#1877F2',
  google: '#EA4335',
};

const METRICS = [
  { key: 'spend', label: 'Spend', fmt: (v: number) => fmtCurrency(v, true) },
  { key: 'revenue', label: 'Revenue', fmt: (v: number) => fmtCurrency(v, true) },
  { key: 'roas', label: 'ROAS', fmt: fmtRoas },
  { key: 'conversions', label: 'Conv.', fmt: (v: number) => fmtNumber(v, true) },
  { key: 'cpa', label: 'CPA', fmt: fmtCurrency },
  { key: 'ctr', label: 'CTR', fmt: (v: number) => fmtPercent(v, 2) },
  { key: 'cpc', label: 'CPC', fmt: fmtCurrency },
  { key: 'cpm', label: 'CPM', fmt: fmtCurrency },
];

export function ChannelComparison({ filter }: ChannelComparisonProps) {
  const [data, setData] = useState<ChannelBreakdown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    dataProvider.getChannelBreakdown(filter).then((d) => {
      setData(d);
      setLoading(false);
    });
  }, [filter]);

  const totalSpend = data.reduce((s, d) => s + d.spend, 0);
  const totalRevenue = data.reduce((s, d) => s + d.revenue, 0);

  const spendPie = data.map((d) => ({ name: d.channel, value: d.spend }));
  const revenuePie = data.map((d) => ({ name: d.channel, value: d.revenue }));

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-base font-semibold text-slate-900">Channel Comparison</h2>
        <p className="text-xs text-slate-400 mt-0.5">Facebook Ads vs Google Ads breakdown</p>
      </div>

      {loading ? (
        <Skeleton className="h-64" />
      ) : (
        <div className="space-y-6">
          {/* Donut charts */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { title: 'Spend Share', data: spendPie, total: fmtCurrency(totalSpend, true) },
              { title: 'Revenue Share', data: revenuePie, total: fmtCurrency(totalRevenue, true) },
            ].map(({ title, data: pieData, total }) => (
              <div key={title} className="flex flex-col items-center gap-3">
                <p className="text-xs font-medium text-slate-500">{title}</p>
                <div className="relative">
                  <ResponsiveContainer width={160} height={160}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={72}
                        paddingAngle={2}
                        dataKey="value"
                        isAnimationActive={false}
                      >
                        {pieData.map((entry) => (
                          <Cell
                            key={entry.name}
                            fill={CHANNEL_COLORS[entry.name as keyof typeof CHANNEL_COLORS]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        content={makeTooltipContent((v) => fmtCurrency(v, true))}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-base font-bold text-slate-900">{total}</p>
                    <p className="text-xs text-slate-400">Total</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  {pieData.map((entry) => (
                    <div key={entry.name} className="flex items-center gap-1.5">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: CHANNEL_COLORS[entry.name as keyof typeof CHANNEL_COLORS] }}
                      />
                      <span className="text-xs text-slate-600 capitalize">{entry.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Metrics table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="pb-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Metric</th>
                  {data.map((ch) => (
                    <th
                      key={ch.channel}
                      className="pb-2 text-right text-xs font-semibold uppercase tracking-wider"
                      style={{ color: CHANNEL_COLORS[ch.channel] }}
                    >
                      {ch.channel === 'facebook' ? 'Facebook' : 'Google'}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {METRICS.map((m) => (
                  <tr key={m.key} className="border-b border-slate-50 last:border-0">
                    <td className="py-2 text-xs text-slate-500">{m.label}</td>
                    {data.map((ch) => (
                      <td key={ch.channel} className="py-2 text-right text-xs font-medium text-slate-700 tabular-nums">
                        {m.fmt(ch[m.key as keyof ChannelBreakdown] as number)}
                      </td>
                    ))}
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
