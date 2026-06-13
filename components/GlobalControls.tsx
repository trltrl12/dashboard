'use client';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { brand } from '@/config/brand';

interface GlobalControlsProps {
  preset: string;
  channel: 'all' | 'facebook' | 'google';
  compareTo: 'previous_period' | 'previous_year';
  onPreset: (p: string) => void;
  onChannel: (c: 'all' | 'facebook' | 'google') => void;
  onCompareTo: (c: 'previous_period' | 'previous_year') => void;
}

const DATE_PRESETS = [
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
  { value: '90d', label: '90D' },
  { value: 'mtd', label: 'MTD' },
  { value: 'qtd', label: 'QTD' },
];

const CHANNELS = [
  { value: 'all', label: 'All' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'google', label: 'Google' },
] as const;

export function GlobalControls({
  preset,
  channel,
  compareTo,
  onPreset,
  onChannel,
  onCompareTo,
}: GlobalControlsProps) {
  return (
    <div className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-slate-200 px-6 py-3">
      <div className="max-w-screen-2xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
            style={{ backgroundColor: brand.accentColor }}
          >
            {brand.companyName[0]}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">{brand.companyName}</p>
            <p className="text-xs text-slate-400">Marketing Dashboard</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Date presets */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {DATE_PRESETS.map((p) => (
              <button
                key={p.value}
                onClick={() => onPreset(p.value)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-md transition-all',
                  preset === p.value
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Channel filter */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {CHANNELS.map((c) => (
              <button
                key={c.value}
                onClick={() => onChannel(c.value)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-md transition-all',
                  channel === c.value
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                )}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Compare toggle */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => onCompareTo('previous_period')}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-md transition-all',
                compareTo === 'previous_period'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              )}
            >
              vs Prev Period
            </button>
            <button
              onClick={() => onCompareTo('previous_year')}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-md transition-all',
                compareTo === 'previous_year'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              )}
            >
              vs Prev Year
            </button>
          </div>

          {/* Sync indicator */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Mock data</span>
          </div>
        </div>
      </div>
    </div>
  );
}
