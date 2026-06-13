'use client';
import { cn } from '@/lib/utils';

interface Option {
  value: string;
  label: string;
}

interface MetricToggleProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function MetricToggle({ options, value, onChange, className }: MetricToggleProps) {
  return (
    <div className={cn('flex gap-1 p-1 bg-slate-100 rounded-lg', className)}>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            'px-3 py-1.5 text-xs font-medium rounded-md transition-all',
            value === opt.value
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
