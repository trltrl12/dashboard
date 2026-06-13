'use client';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Sparkline } from '@/components/ui/Sparkline';
import { dataProvider } from '@/lib/data';
import { CampaignRow, AdsetRow, DateFilter } from '@/lib/data/types';
import { fmtCurrency, fmtNumber, fmtPercent, fmtRoas, cn } from '@/lib/utils';

interface CampaignTableProps {
  filter: DateFilter;
}

const CHANNEL_COLORS: Record<string, string> = {
  facebook: 'bg-blue-100 text-blue-700',
  google: 'bg-red-100 text-red-700',
};

export function CampaignTable({ filter }: CampaignTableProps) {
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    dataProvider.getCampaigns(filter).then((d) => {
      setCampaigns(d);
      setLoading(false);
    });
  }, [filter]);

  const columns: Column<CampaignRow>[] = [
    {
      key: 'campaign',
      header: 'Campaign',
      sortable: true,
      accessor: (row) => (
        <div className="flex flex-col gap-0.5 min-w-[180px]">
          <span className="font-medium text-slate-800 text-xs leading-tight">{row.campaign}</span>
          <div className="flex items-center gap-1.5">
            <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full', CHANNEL_COLORS[row.channel])}>
              {row.channel}
            </span>
            <span className={cn(
              'text-[10px] font-medium px-1.5 py-0.5 rounded-full',
              row.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
            )}>
              {row.status}
            </span>
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
        <span className={cn('font-semibold', row.roas >= 4 ? 'text-emerald-600' : row.roas < 2 ? 'text-red-600' : 'text-slate-700')}>
          {fmtRoas(row.roas)}
        </span>
      ),
      sortValue: (row) => row.roas,
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
        <span className={cn('font-medium', row.cpa <= 35 ? 'text-emerald-600' : 'text-red-600')}>
          {fmtCurrency(row.cpa)}
        </span>
      ),
      sortValue: (row) => row.cpa,
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
      key: 'impressions',
      header: 'Impr.',
      sortable: true,
      accessor: (row) => fmtNumber(row.impressions, true),
      sortValue: (row) => row.impressions,
    },
    {
      key: 'sparkline',
      header: '14-day',
      accessor: (row) => (
        <div className="w-20">
          <Sparkline data={row.sparkline} height={28} color="#6366f1" />
        </div>
      ),
    },
  ];

  function renderAdsetExpansion(campaign: CampaignRow) {
    return (
      <div className="space-y-3 py-2">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Adsets</p>
        {campaign.adsets.map((adset: AdsetRow) => (
          <div key={adset.adset} className="bg-white rounded-xl border border-slate-100 p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-slate-700">{adset.adset}</p>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span>Spend: <strong>{fmtCurrency(adset.spend, true)}</strong></span>
                <span>ROAS: <strong>{fmtRoas(adset.roas)}</strong></span>
                <span>CPA: <strong>{fmtCurrency(adset.cpa)}</strong></span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {adset.ads.map((ad) => (
                <div
                  key={ad.ad}
                  className={cn(
                    'text-xs p-2 rounded-lg border',
                    ad.fatigued ? 'border-orange-200 bg-orange-50' : 'border-slate-100 bg-slate-50'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-slate-700 truncate max-w-[180px]">{ad.ad}</p>
                    {ad.fatigued && (
                      <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full font-medium">
                        Fatigued
                      </span>
                    )}
                  </div>
                  <div className="flex gap-3 mt-1 text-slate-500">
                    <span>ROAS: {fmtRoas(ad.roas)}</span>
                    <span>CTR: {fmtPercent(ad.ctr, 2)}</span>
                    {ad.frequency && <span>Freq: {ad.frequency.toFixed(1)}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-base font-semibold text-slate-900">Campaign Performance</h2>
        <p className="text-xs text-slate-400 mt-0.5">All campaigns — click to expand adsets & ads</p>
      </div>

      {loading ? (
        <Skeleton className="h-64" />
      ) : (
        <DataTable
          columns={columns}
          data={campaigns}
          searchable
          searchKeys={['campaign', 'channel']}
          pageSize={8}
          rowKey={(row) => `${row.channel}::${row.campaign}`}
          expandable={(row) => renderAdsetExpansion(row)}
        />
      )}
    </Card>
  );
}
