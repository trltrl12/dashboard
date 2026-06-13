'use client';

export interface ChartTooltipItem {
  name: string;
  value: number;
  color: string;
}

export interface ChartTooltipProps {
  active?: boolean;
  items: ChartTooltipItem[];
  label?: string;
  formatter?: (value: number, name: string) => string;
}

export function ChartTooltip({ active, items, label, formatter }: ChartTooltipProps) {
  if (!active || !items.length) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 min-w-[140px]">
      {label != null && (
        <p className="text-xs font-medium text-slate-500 mb-2">{label}</p>
      )}
      <div className="flex flex-col gap-1">
        {items.map((entry, i) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              {entry.color && (
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: entry.color }}
                />
              )}
              <span className="text-xs text-slate-600">{entry.name}</span>
            </div>
            <span className="text-xs font-semibold text-slate-900 tabular-nums">
              {formatter ? formatter(entry.value, entry.name) : entry.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Helper to build ChartTooltip from recharts tooltip props */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function makeTooltipContent(formatter?: (value: number, name: string) => string, labelFormatter?: (label: string) => string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function TooltipContent(props: any) {
    const { active, payload, label } = props;
    if (!active || !payload?.length) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items: ChartTooltipItem[] = payload.map((p: any) => ({
      name: String(p.name ?? ''),
      value: typeof p.value === 'number' ? p.value : parseFloat(String(p.value ?? 0)),
      color: p.color ?? p.fill ?? '#6366f1',
    }));
    const displayLabel = labelFormatter ? labelFormatter(String(label ?? '')) : String(label ?? '');
    return <ChartTooltip active items={items} label={displayLabel} formatter={formatter} />;
  };
}
