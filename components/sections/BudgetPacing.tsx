'use client';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { dataProvider } from '@/lib/data';
import { BudgetPacing as BudgetPacingType, DateFilter } from '@/lib/data/types';
import { fmtCurrency, fmtPercent, cn } from '@/lib/utils';

interface BudgetPacingProps {
  filter: DateFilter;
}

const CHANNEL_COLORS: Record<string, string> = {
  facebook: '#1877F2',
  google: '#EA4335',
  total: '#6366f1',
};

const STATUS_STYLES: Record<string, string> = {
  under: 'text-amber-600 bg-amber-50 border-amber-200',
  on: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  over: 'text-red-600 bg-red-50 border-red-200',
};

const STATUS_LABELS: Record<string, string> = {
  under: 'Under-pacing',
  on: 'On pace',
  over: 'Over-pacing',
};

export function BudgetPacing({ filter }: BudgetPacingProps) {
  const [data, setData] = useState<BudgetPacingType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    dataProvider.getBudgetPacing(filter).then((d) => {
      setData(d);
      setLoading(false);
    });
  }, [filter]);

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-base font-semibold text-slate-900">Budget Pacing</h2>
        <p className="text-xs text-slate-400 mt-0.5">Month-to-date spend vs budget</p>
      </div>

      {loading ? (
        <Skeleton className="h-48" />
      ) : (
        <div className="flex flex-col gap-6">
          {data.map((row) => {
            const pct = row.budget > 0 ? row.mtdSpend / row.budget : 0;
            const ideal = row.daysInMonth > 0 ? row.daysElapsed / row.daysInMonth : 0;
            const color = CHANNEL_COLORS[row.channel] || '#6366f1';

            return (
              <div key={row.channel} className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                    <span className="text-sm font-semibold text-slate-700 capitalize">
                      {row.channel === 'total' ? 'Total (All Channels)' : row.channel}
                    </span>
                    <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full border', STATUS_STYLES[row.paceStatus])}>
                      {STATUS_LABELS[row.paceStatus]}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>
                      <span className="font-semibold text-slate-800">{fmtCurrency(row.mtdSpend, true)}</span>
                      {' / '}
                      {fmtCurrency(row.budget, true)}
                    </span>
                    <span className="text-slate-400">|</span>
                    <span>
                      Day {row.daysElapsed}/{row.daysInMonth}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="relative h-5 bg-slate-100 rounded-full overflow-hidden">
                  {/* Ideal pace marker */}
                  <div
                    className="absolute top-0 h-full w-0.5 bg-slate-400 z-10"
                    style={{ left: `${ideal * 100}%` }}
                  />
                  {/* Actual spend */}
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.min(pct * 100, 100)}%`,
                      backgroundColor: color,
                      opacity: 0.85,
                    }}
                  />
                  <div className="absolute inset-0 flex items-center px-2 justify-between pointer-events-none">
                    <span className="text-xs font-semibold" style={{ color: pct > 0.3 ? 'white' : color }}>
                      {fmtPercent(pct)} spent
                    </span>
                  </div>
                </div>

                {/* Details row */}
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-0.5 bg-slate-400" />
                    <span>Ideal: {fmtPercent(ideal)}</span>
                  </div>
                  <span>Projected: <strong className="text-slate-600">{fmtCurrency(row.projectedSpend, true)}</strong></span>
                  <span>
                    {row.projectedSpend > row.budget
                      ? <span className="text-red-500">+{fmtCurrency(row.projectedSpend - row.budget, true)} over budget</span>
                      : <span className="text-emerald-600">{fmtCurrency(row.budget - row.projectedSpend, true)} remaining</span>
                    }
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
