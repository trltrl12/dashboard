'use client';
import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { DataTable, Column } from '@/components/ui/DataTable';
import { dataProvider } from '@/lib/data';
import { KeywordRow, DateFilter } from '@/lib/data/types';
import { fmtCurrency, fmtPercent, fmtRoas, fmtNumber, cn } from '@/lib/utils';

interface KeywordPerformanceProps {
  filter: DateFilter;
}

export function KeywordPerformance({ filter }: KeywordPerformanceProps) {
  const [data, setData] = useState<KeywordRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    dataProvider.getKeywords(filter).then((d) => {
      setData(d);
      setLoading(false);
    });
  }, [filter]);

  const wastedCount = data.filter((k) => k.wasted).length;

  const columns: Column<KeywordRow>[] = [
    {
      key: 'keyword',
      header: 'Keyword',
      sortable: true,
      accessor: (row) => (
        <div className="flex items-center gap-2 min-w-[200px]">
          {row.wasted && (
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          )}
          <span className={cn('text-xs font-medium', row.wasted ? 'text-amber-700' : 'text-slate-700')}>
            {row.keyword}
          </span>
          {row.wasted && (
            <span className="text-[10px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full font-medium">
              Wasted
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'impressions',
      header: 'Impr.',
      sortable: true,
      accessor: (row) => fmtNumber(row.impressions, true),
      sortValue: (row) => row.impressions,
    },
    {
      key: 'clicks',
      header: 'Clicks',
      sortable: true,
      accessor: (row) => fmtNumber(row.clicks, true),
      sortValue: (row) => row.clicks,
    },
    {
      key: 'ctr',
      header: 'CTR',
      sortable: true,
      accessor: (row) => fmtPercent(row.ctr, 2),
      sortValue: (row) => row.ctr,
    },
    {
      key: 'cpc',
      header: 'CPC',
      sortable: true,
      accessor: (row) => fmtCurrency(row.cpc),
      sortValue: (row) => row.cpc,
    },
    {
      key: 'spend',
      header: 'Spend',
      sortable: true,
      accessor: (row) => fmtCurrency(row.spend, true),
      sortValue: (row) => row.spend,
    },
    {
      key: 'conversions',
      header: 'Conv.',
      sortable: true,
      accessor: (row) => fmtNumber(row.conversions),
      sortValue: (row) => row.conversions,
    },
    {
      key: 'cpa',
      header: 'CPA',
      sortable: true,
      accessor: (row) => (
        <span className={cn(row.cpa <= 35 ? 'text-emerald-600' : 'text-red-600', 'font-medium')}>
          {row.conversions > 0 ? fmtCurrency(row.cpa) : '—'}
        </span>
      ),
      sortValue: (row) => row.cpa,
    },
    {
      key: 'revenue',
      header: 'Revenue',
      sortable: true,
      accessor: (row) => fmtCurrency(row.revenue, true),
      sortValue: (row) => row.revenue,
    },
    {
      key: 'roas',
      header: 'ROAS',
      sortable: true,
      accessor: (row) => (
        <span className={cn('font-semibold', row.roas >= 4 ? 'text-emerald-600' : row.roas === 0 ? 'text-slate-400' : 'text-slate-700')}>
          {row.roas > 0 ? fmtRoas(row.roas) : '—'}
        </span>
      ),
      sortValue: (row) => row.roas,
    },
  ];

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Keyword Performance</h2>
          <p className="text-xs text-slate-400 mt-0.5">Google Ads keywords only</p>
        </div>
        {wastedCount > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{wastedCount} wasted keyword{wastedCount !== 1 ? 's' : ''} (spend with 0 conv.)</span>
          </div>
        )}
      </div>

      {loading ? (
        <Skeleton className="h-64" />
      ) : (
        <DataTable
          columns={columns}
          data={data}
          searchable
          searchKeys={['keyword']}
          pageSize={10}
          rowKey={(row) => row.keyword}
        />
      )}
    </Card>
  );
}
