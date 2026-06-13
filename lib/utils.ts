export function fmtCurrency(value: number, compact = false): string {
  if (compact && value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (compact && value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

export function fmtNumber(value: number, compact = false): string {
  if (compact && value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (compact && value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return new Intl.NumberFormat('en-US').format(Math.round(value));
}

export function fmtPercent(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

export function fmtRoas(value: number): string {
  return `${value.toFixed(2)}x`;
}

export function delta(current: number, previous: number): number {
  if (previous === 0) return 0;
  return (current - previous) / previous;
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
