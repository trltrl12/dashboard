'use client';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { MetricToggle } from '@/components/ui/MetricToggle';
import { dataProvider } from '@/lib/data';
import { HeatmapCell, DateFilter } from '@/lib/data/types';
import { fmtNumber, fmtRoas } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface TimeHeatmapProps {
  filter: DateFilter;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) => {
  if (i === 0) return '12a';
  if (i < 12) return `${i}a`;
  if (i === 12) return '12p';
  return `${i - 12}p`;
});

type HeatMetric = 'conversions' | 'roas' | 'spend';

const HEAT_METRICS = [
  { value: 'conversions', label: 'Conv.' },
  { value: 'roas', label: 'ROAS' },
  { value: 'spend', label: 'Spend' },
];

function interpolateColor(value: number, min: number, max: number): string {
  const t = max > min ? (value - min) / (max - min) : 0;
  // From slate-100 (#f1f5f9) to indigo-600 (#4f46e5)
  const r = Math.round(241 + (79 - 241) * t);
  const g = Math.round(245 + (70 - 245) * t);
  const b = Math.round(249 + (229 - 249) * t);
  return `rgb(${r},${g},${b})`;
}

function textColorForBg(value: number, min: number, max: number): string {
  const t = max > min ? (value - min) / (max - min) : 0;
  return t > 0.55 ? '#ffffff' : '#1e293b';
}

export function TimeHeatmap({ filter }: TimeHeatmapProps) {
  const [data, setData] = useState<HeatmapCell[]>([]);
  const [loading, setLoading] = useState(true);
  const [metric, setMetric] = useState<HeatMetric>('conversions');
  const [tooltip, setTooltip] = useState<{ cell: HeatmapCell; x: number; y: number } | null>(null);

  useEffect(() => {
    setLoading(true);
    dataProvider.getHeatmap(filter).then((d) => {
      setData(d);
      setLoading(false);
    });
  }, [filter]);

  // Build a lookup: day -> hour -> cell
  const grid: Record<number, Record<number, HeatmapCell>> = {};
  for (const cell of data) {
    if (!grid[cell.day]) grid[cell.day] = {};
    grid[cell.day][cell.hour] = cell;
  }

  const allValues = data.map((c) => c[metric] as number);
  const minVal = Math.min(...allValues, 0);
  const maxVal = Math.max(...allValues, 1);

  function getCellValue(day: number, hour: number): number {
    return (grid[day]?.[hour]?.[metric] as number) || 0;
  }

  function formatValue(v: number): string {
    if (metric === 'roas') return fmtRoas(v);
    return fmtNumber(v, true);
  }

  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Time-of-Day Heatmap</h2>
          <p className="text-xs text-slate-400 mt-0.5">Performance patterns by day and hour</p>
        </div>
        <MetricToggle
          options={HEAT_METRICS}
          value={metric}
          onChange={(v) => setMetric(v as HeatMetric)}
        />
      </div>

      {loading ? (
        <Skeleton className="h-48" />
      ) : (
        <div className="overflow-x-auto relative">
          {tooltip && (
            <div
              className="fixed z-50 bg-white border border-slate-200 rounded-xl shadow-lg p-2.5 text-xs pointer-events-none"
              style={{ left: tooltip.x + 12, top: tooltip.y - 40 }}
            >
              <p className="font-semibold text-slate-700">{DAYS[tooltip.cell.day]} {HOURS[tooltip.cell.hour]}</p>
              <p className="text-slate-500">{HEAT_METRICS.find((m) => m.value === metric)?.label}: <strong>{formatValue(tooltip.cell[metric] as number)}</strong></p>
            </div>
          )}
          <table className="text-[10px]" style={{ borderSpacing: '2px', borderCollapse: 'separate' }}>
            <thead>
              <tr>
                <th className="w-8 text-right pr-2 text-slate-400 font-normal" />
                {HOURS.map((h, hi) => (
                  <th
                    key={hi}
                    className={cn(
                      'w-7 text-center font-normal text-slate-400 pb-1',
                      hi % 3 !== 0 && 'text-transparent'
                    )}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DAYS.map((day, di) => (
                <tr key={di}>
                  <td className="text-right pr-2 text-slate-500 font-medium whitespace-nowrap py-0.5">{day}</td>
                  {HOURS.map((_, hi) => {
                    const val = getCellValue(di, hi);
                    const cell = grid[di]?.[hi];
                    const bg = interpolateColor(val, minVal, maxVal);
                    const textColor = textColorForBg(val, minVal, maxVal);
                    return (
                      <td
                        key={hi}
                        className="rounded cursor-default transition-transform hover:scale-110 hover:z-10 relative"
                        style={{ backgroundColor: bg, width: 26, height: 22 }}
                        onMouseEnter={(e) => cell && setTooltip({ cell, x: e.clientX, y: e.clientY })}
                        onMouseMove={(e) => cell && setTooltip((t) => t ? { ...t, x: e.clientX, y: e.clientY } : null)}
                        onMouseLeave={() => setTooltip(null)}
                      >
                        <span
                          className="absolute inset-0 flex items-center justify-center text-[9px] font-medium leading-none"
                          style={{ color: textColor }}
                        >
                          {val > 0 ? formatValue(val) : ''}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          {/* Legend */}
          <div className="flex items-center gap-2 mt-3">
            <span className="text-xs text-slate-400">Low</span>
            <div
              className="h-3 flex-1 max-w-32 rounded"
              style={{
                background: `linear-gradient(to right, ${interpolateColor(minVal, minVal, maxVal)}, ${interpolateColor(maxVal, minVal, maxVal)})`,
              }}
            />
            <span className="text-xs text-slate-400">High</span>
          </div>
        </div>
      )}
    </Card>
  );
}
