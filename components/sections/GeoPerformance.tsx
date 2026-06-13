'use client';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { DataTable, Column } from '@/components/ui/DataTable';
import { dataProvider } from '@/lib/data';
import { GeoRow, DateFilter } from '@/lib/data/types';
import { fmtCurrency, fmtNumber, fmtRoas } from '@/lib/utils';

interface GeoPerformanceProps {
  filter: DateFilter;
}

export function GeoPerformance({ filter }: GeoPerformanceProps) {
  const [data, setData] = useState<GeoRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    dataProvider.getGeo(filter).then((d) => {
      setData(d);
      setLoading(false);
    });
  }, [filter]);

  const maxSpend = data[0]?.spend || 1;

  const columns: Column<GeoRow>[] = [
    {
      key: 'region',
      header: 'Region',
      sortable: true,
      accessor: (row) => (
        <div className="flex items-center gap-3 min-w-[160px]">
          <div className="flex flex-col gap-0.5 flex-1">
            <span className="text-xs font-semibold text-slate-800">{row.region}</span>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full"
                style={{ width: `${(row.spend / maxSpend) * 100}%` }}
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'spend',
      header: 'Spend',
      sortable: true,
      accessor: (row) => fmtCurrency(row.spend, true),
      sortValue: (row) => row.spend,
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
      accessor: (row) => fmtCurrency(row.cpa),
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
      accessor: (row) => fmtRoas(row.roas),
      sortValue: (row) => row.roas,
    },
  ];

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-base font-semibold text-slate-900">Geographic Performance</h2>
        <p className="text-xs text-slate-400 mt-0.5">Performance breakdown by region</p>
      </div>

      {loading ? (
        <Skeleton className="h-64" />
      ) : (
        <DataTable
          columns={columns}
          data={data}
          pageSize={8}
          rowKey={(row) => row.region}
        />
      )}
    </Card>
  );
}
