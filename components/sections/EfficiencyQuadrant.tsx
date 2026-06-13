'use client';
import { useEffect, useState } from 'react';
import {
  ResponsiveContainer, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, Label,
} from 'recharts';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { dataProvider } from '@/lib/data';
import { CampaignRow, DateFilter } from '@/lib/data/types';
import { fmtCurrency, fmtRoas } from '@/lib/utils';
import { brand } from '@/config/brand';

interface EfficiencyQuadrantProps {
  filter: DateFilter;
}

const CHANNEL_COLORS = {
  facebook: '#1877F2',
  google: '#EA4335',
};

interface ScatterPoint {
  name: string;
  channel: 'facebook' | 'google';
  x: number; // CPA
  y: number; // ROAS
  z: number; // spend (bubble size)
}

interface CustomDotProps {
  cx?: number;
  cy?: number;
  payload?: ScatterPoint;
}

function CustomDot({ cx = 0, cy = 0, payload }: CustomDotProps) {
  if (!payload) return null;
  const r = Math.max(6, Math.min(20, Math.sqrt(payload.z / 500)));
  return (
    <g>
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill={CHANNEL_COLORS[payload.channel]}
        fillOpacity={0.7}
        stroke={CHANNEL_COLORS[payload.channel]}
        strokeWidth={1.5}
      />
      <text x={cx} y={cy - r - 4} textAnchor="middle" fontSize={10} fill="#64748b">
        {payload.name.split(' - ')[0].slice(0, 14)}
      </text>
    </g>
  );
}

export function EfficiencyQuadrant({ filter }: EfficiencyQuadrantProps) {
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    dataProvider.getCampaigns(filter).then((d) => {
      setCampaigns(d);
      setLoading(false);
    });
  }, [filter]);

  const points: ScatterPoint[] = campaigns.map((c) => ({
    name: c.campaign,
    channel: c.channel,
    x: c.cpa,
    y: c.roas,
    z: c.spend,
  }));

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-base font-semibold text-slate-900">Efficiency Quadrant</h2>
        <p className="text-xs text-slate-400 mt-0.5">CPA vs ROAS by campaign — bubble size = spend</p>
      </div>

      {loading ? (
        <Skeleton className="h-64" />
      ) : (
        <>
          <ResponsiveContainer width="100%" height={320}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="x"
                type="number"
                name="CPA"
                tickFormatter={(v) => fmtCurrency(v)}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              >
                <Label value="CPA ($)" offset={-10} position="insideBottom" style={{ fontSize: 11, fill: '#94a3b8' }} />
              </XAxis>
              <YAxis
                dataKey="y"
                type="number"
                name="ROAS"
                tickFormatter={(v) => `${v.toFixed(1)}x`}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              >
                <Label value="ROAS" angle={-90} position="insideLeft" style={{ fontSize: 11, fill: '#94a3b8' }} />
              </YAxis>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload as ScatterPoint;
                  return (
                    <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-xs">
                      <p className="font-semibold text-slate-900 mb-1">{d.name}</p>
                      <p className="text-slate-500 capitalize mb-1">{d.channel}</p>
                      <p>CPA: <span className="font-medium">{fmtCurrency(d.x)}</span></p>
                      <p>ROAS: <span className="font-medium">{fmtRoas(d.y)}</span></p>
                      <p>Spend: <span className="font-medium">{fmtCurrency(d.z, true)}</span></p>
                    </div>
                  );
                }}
              />
              <ReferenceLine y={brand.targets.roas} stroke="#6366f1" strokeDasharray="4 4" strokeWidth={1.5} />
              <ReferenceLine x={brand.targets.cpa} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={1.5} />
              <Scatter
                data={points}
                shape={(props: unknown) => <CustomDot {...(props as CustomDotProps)} />}
              />
            </ScatterChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-px bg-indigo-500 border-t border-dashed" />
              <span>ROAS target ({brand.targets.roas}x)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-px bg-red-400 border-t border-dashed" />
              <span>CPA target (${brand.targets.cpa})</span>
            </div>
            {Object.entries(CHANNEL_COLORS).map(([ch, color]) => (
              <div key={ch} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                <span className="capitalize">{ch}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}
