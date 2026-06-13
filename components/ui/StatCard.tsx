'use client';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card } from './Card';
import { Sparkline } from './Sparkline';
import { cn, fmtPercent } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string;
  delta?: number;
  sparkline?: number[];
  sparklineColor?: string;
  subtitle?: string;
  highlight?: 'good' | 'bad' | 'neutral';
}

export function StatCard({ label, value, delta, sparkline, sparklineColor, subtitle, highlight }: StatCardProps) {
  const isPositive = delta !== undefined && delta > 0;
  const isNegative = delta !== undefined && delta < 0;
  const isNeutral = delta !== undefined && delta === 0;

  const deltaColor = highlight === 'bad'
    ? (isPositive ? 'text-red-600' : isNegative ? 'text-emerald-600' : 'text-slate-400')
    : (isPositive ? 'text-emerald-600' : isNegative ? 'text-red-600' : 'text-slate-400');

  return (
    <Card className="p-4 flex flex-col gap-2">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">{value}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        {sparkline && sparkline.length > 0 && (
          <div className="w-20 shrink-0">
            <Sparkline data={sparkline} color={sparklineColor} />
          </div>
        )}
      </div>
      {delta !== undefined && (
        <div className={cn('flex items-center gap-1 text-xs font-medium', deltaColor)}>
          {isPositive && <TrendingUp className="w-3.5 h-3.5" />}
          {isNegative && <TrendingDown className="w-3.5 h-3.5" />}
          {isNeutral && <Minus className="w-3.5 h-3.5" />}
          <span>{isPositive ? '+' : ''}{fmtPercent(delta)} vs prev period</span>
        </div>
      )}
    </Card>
  );
}
