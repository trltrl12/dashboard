'use client';
import { useState, useCallback } from 'react';
import { DateFilter } from '@/lib/data/types';

function getDateRange(preset: string): { from: string; to: string } {
  // Optional override: anchor presets to a fixed date (useful when viewing historical
  // data). Unset in production -> presets are relative to the real "today".
  const anchor = process.env.NEXT_PUBLIC_DATA_ANCHOR_DATE;
  const today = anchor ? new Date(anchor) : new Date();
  const to = today.toISOString().split('T')[0];

  const daysAgo = (n: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() - n);
    return d.toISOString().split('T')[0];
  };

  switch (preset) {
    case '7d': return { from: daysAgo(6), to };
    case '30d': return { from: daysAgo(29), to };
    case '90d': return { from: daysAgo(89), to };
    case 'mtd': {
      const f = new Date(today.getFullYear(), today.getMonth(), 1);
      return { from: f.toISOString().split('T')[0], to };
    }
    case 'qtd': {
      const q = Math.floor(today.getMonth() / 3);
      const f = new Date(today.getFullYear(), q * 3, 1);
      return { from: f.toISOString().split('T')[0], to };
    }
    default: return { from: daysAgo(29), to };
  }
}

export function useFilter() {
  const [preset, setPreset] = useState('30d');
  const [channel, setChannel] = useState<'all' | 'facebook' | 'google'>('all');
  const [compareTo, setCompareTo] = useState<'previous_period' | 'previous_year'>('previous_period');
  const [customRange, setCustomRange] = useState<{ from: string; to: string } | null>(null);

  const dateRange = customRange || getDateRange(preset);

  const filter: DateFilter = {
    from: dateRange.from,
    to: dateRange.to,
    channel,
    compareTo,
  };

  const setPresetAndClear = useCallback((p: string) => {
    setPreset(p);
    setCustomRange(null);
  }, []);

  return { filter, preset, channel, compareTo, customRange, setPreset: setPresetAndClear, setChannel, setCompareTo, setCustomRange };
}
