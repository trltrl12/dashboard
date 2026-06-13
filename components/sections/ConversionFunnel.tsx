'use client';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { dataProvider } from '@/lib/data';
import { FunnelStage, DateFilter } from '@/lib/data/types';
import { fmtNumber, fmtPercent } from '@/lib/utils';

interface ConversionFunnelProps {
  filter: DateFilter;
}

const STAGE_COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd'];

export function ConversionFunnel({ filter }: ConversionFunnelProps) {
  const [data, setData] = useState<FunnelStage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    dataProvider.getFunnel(filter).then((d) => {
      setData(d);
      setLoading(false);
    });
  }, [filter]);

  const maxValue = data[0]?.value || 1;

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-base font-semibold text-slate-900">Conversion Funnel</h2>
        <p className="text-xs text-slate-400 mt-0.5">Impression-to-conversion flow</p>
      </div>

      {loading ? (
        <Skeleton className="h-48" />
      ) : (
        <div className="flex flex-col gap-2">
          {data.map((stage, i) => {
            const pct = stage.value / maxValue;
            const color = STAGE_COLORS[i % STAGE_COLORS.length];
            return (
              <div key={stage.stage} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700">{stage.stage}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-900 font-semibold tabular-nums">
                      {fmtNumber(stage.value, true)}
                    </span>
                    {stage.dropoff !== undefined && (
                      <span className="text-red-500 font-medium">
                        -{fmtPercent(stage.dropoff)} dropoff
                      </span>
                    )}
                  </div>
                </div>
                <div className="h-8 bg-slate-100 rounded-lg overflow-hidden">
                  <div
                    className="h-full rounded-lg transition-all duration-500 flex items-center px-3"
                    style={{ width: `${pct * 100}%`, backgroundColor: color }}
                  >
                    {pct > 0.15 && (
                      <span className="text-xs text-white font-medium">
                        {fmtPercent(pct)} of impressions
                      </span>
                    )}
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
