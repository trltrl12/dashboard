'use client';
import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Target } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { dataProvider } from '@/lib/data';
import { KpiData, DateFilter } from '@/lib/data/types';
import { fmtCurrency, fmtRoas, cn } from '@/lib/utils';
import { brand } from '@/config/brand';

interface GoalsTargetsProps {
  filter: DateFilter;
}

export function GoalsTargets({ filter }: GoalsTargetsProps) {
  const [kpis, setKpis] = useState<KpiData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    dataProvider.getKpis(filter).then((d) => {
      setKpis(d.current);
      setLoading(false);
    });
  }, [filter]);

  if (loading) return (
    <Card className="p-6">
      <Skeleton className="h-48" />
    </Card>
  );

  if (!kpis) return null;

  const goals = [
    {
      label: 'ROAS Target',
      target: brand.targets.roas,
      current: kpis.roas,
      fmt: fmtRoas,
      higherIsBetter: true,
      description: `Target: ${fmtRoas(brand.targets.roas)}`,
    },
    {
      label: 'CPA Target',
      target: brand.targets.cpa,
      current: kpis.cpa,
      fmt: fmtCurrency,
      higherIsBetter: false,
      description: `Target: ${fmtCurrency(brand.targets.cpa)}`,
    },
    {
      label: 'Monthly Budget',
      target: brand.targets.monthlyBudget,
      current: kpis.spend,
      fmt: (v: number) => fmtCurrency(v, true),
      higherIsBetter: false,
      description: `Budget: ${fmtCurrency(brand.targets.monthlyBudget, true)}`,
    },
  ];

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Target className="w-5 h-5 text-indigo-500" />
        <div>
          <h2 className="text-base font-semibold text-slate-900">Goals & Targets</h2>
          <p className="text-xs text-slate-400 mt-0.5">Progress against brand targets</p>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {goals.map((goal) => {
          const pct = goal.target > 0 ? goal.current / goal.target : 0;
          const isHit = goal.higherIsBetter ? goal.current >= goal.target : goal.current <= goal.target;
          const barPct = goal.higherIsBetter
            ? Math.min(pct, 1.5)
            : Math.min(1 / pct, 1.5);
          const displayPct = Math.min(barPct, 1);

          return (
            <div key={goal.label} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isHit ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400" />
                  )}
                  <span className="text-sm font-medium text-slate-700">{goal.label}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className={cn('font-bold', isHit ? 'text-emerald-600' : 'text-red-600')}>
                    {goal.fmt(goal.current)}
                  </span>
                  <span className="text-slate-400">/ {goal.fmt(goal.target)}</span>
                </div>
              </div>

              <div className="h-3 bg-slate-100 rounded-full overflow-hidden relative">
                {/* Target line at 100% */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-slate-400 z-10"
                  style={{ left: `${(1 / 1.5) * 100}%` }}
                />
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-700',
                    isHit ? 'bg-emerald-500' : 'bg-red-400'
                  )}
                  style={{ width: `${displayPct * (100 / 1.5)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>{goal.description}</span>
                <span>
                  {isHit ? (
                    <span className="text-emerald-600 font-medium">
                      {goal.higherIsBetter
                        ? `+${((pct - 1) * 100).toFixed(0)}% above target`
                        : `${((1 - pct) * 100).toFixed(0)}% below target`}
                    </span>
                  ) : (
                    <span className="text-red-500 font-medium">
                      {goal.higherIsBetter
                        ? `${((1 - pct) * 100).toFixed(0)}% below target`
                        : `${((pct - 1) * 100).toFixed(0)}% above target`}
                    </span>
                  )}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
