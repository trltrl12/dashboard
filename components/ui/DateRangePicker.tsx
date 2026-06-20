'use client';
import { useState, useRef, useEffect } from 'react';
import { Calendar, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { brand } from '@/config/brand';

interface DateRangePickerProps {
  /** Active custom range, or null when a preset is in use. */
  customRange: { from: string; to: string } | null;
  onApply: (range: { from: string; to: string }) => void;
  onClear: () => void;
}

function fmt(d: string): string {
  // 2025-09-16 -> Sep 16, 2025
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function DateRangePicker({ customRange, onApply, onClear }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState(customRange?.from ?? '');
  const [to, setTo] = useState(customRange?.to ?? '');
  const ref = useRef<HTMLDivElement>(null);

  // Keep local drafts in sync when the active range changes externally.
  useEffect(() => {
    setFrom(customRange?.from ?? '');
    setTo(customRange?.to ?? '');
  }, [customRange]);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const active = !!customRange;
  const valid = from && to && from <= to;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all',
          active
            ? 'border-transparent text-white'
            : 'border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:border-slate-300'
        )}
        style={active ? { backgroundColor: brand.accentColor } : undefined}
      >
        <Calendar className="w-3.5 h-3.5" />
        {active ? (
          <span className="tabular-nums">
            {fmt(customRange!.from)} – {fmt(customRange!.to)}
          </span>
        ) : (
          <span>Custom</span>
        )}
        {active && (
          <span
            role="button"
            tabIndex={0}
            aria-label="Clear custom range"
            onClick={(e) => {
              e.stopPropagation();
              onClear();
              setOpen(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.stopPropagation();
                onClear();
                setOpen(false);
              }
            }}
            className="ml-0.5 -mr-1 p-0.5 rounded hover:bg-white/20"
          >
            <X className="w-3 h-3" />
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 p-4 bg-white rounded-xl border border-slate-200 shadow-lg z-30">
          <p className="text-xs font-semibold text-slate-900 mb-3">Custom date range</p>
          <div className="space-y-3">
            <label className="block">
              <span className="text-xs text-slate-500">From</span>
              <input
                type="date"
                value={from}
                max={to || undefined}
                onChange={(e) => setFrom(e.target.value)}
                className="mt-1 w-full px-2.5 py-1.5 text-sm rounded-lg border border-slate-200 text-slate-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-offset-1"
                style={{ ['--tw-ring-color' as string]: brand.accentColor }}
              />
            </label>
            <label className="block">
              <span className="text-xs text-slate-500">To</span>
              <input
                type="date"
                value={to}
                min={from || undefined}
                onChange={(e) => setTo(e.target.value)}
                className="mt-1 w-full px-2.5 py-1.5 text-sm rounded-lg border border-slate-200 text-slate-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-offset-1"
                style={{ ['--tw-ring-color' as string]: brand.accentColor }}
              />
            </label>
          </div>
          {from && to && !valid && (
            <p className="mt-2 text-xs text-red-500">“From” must be on or before “To”.</p>
          )}
          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              onClick={() => setOpen(false)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg text-slate-500 hover:text-slate-700"
            >
              Cancel
            </button>
            <button
              disabled={!valid}
              onClick={() => {
                if (!valid) return;
                onApply({ from, to });
                setOpen(false);
              }}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg text-white disabled:opacity-40"
              style={{ backgroundColor: brand.accentColor }}
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
