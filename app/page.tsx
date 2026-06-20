'use client';
import { GlobalControls } from '@/components/GlobalControls';
import { KpiScorecard } from '@/components/sections/KpiScorecard';
import { PerformanceTrend } from '@/components/sections/PerformanceTrend';
import { ChannelComparison } from '@/components/sections/ChannelComparison';
import { ConversionFunnel } from '@/components/sections/ConversionFunnel';
import { EfficiencyQuadrant } from '@/components/sections/EfficiencyQuadrant';
import { CampaignTable } from '@/components/sections/CampaignTable';
import { CreativePerformance } from '@/components/sections/CreativePerformance';
import { AudienceBreakdowns } from '@/components/sections/AudienceBreakdowns';
import { GeoPerformance } from '@/components/sections/GeoPerformance';
import { TimeHeatmap } from '@/components/sections/TimeHeatmap';
import { BudgetPacing } from '@/components/sections/BudgetPacing';
import { KeywordPerformance } from '@/components/sections/KeywordPerformance';
import { GoalsTargets } from '@/components/sections/GoalsTargets';
import { CommentsSection } from '@/components/sections/CommentsSection';
import { AiAnalysis } from '@/components/sections/AiAnalysis';
import { useFilter } from '@/lib/hooks/useFilter';

export default function DashboardPage() {
  const { filter, preset, channel, compareTo, customRange, setPreset, setChannel, setCompareTo, setCustomRange } = useFilter();

  return (
    <div className="min-h-screen bg-slate-50">
      <GlobalControls
        preset={preset}
        channel={channel}
        compareTo={compareTo}
        customRange={customRange}
        onPreset={setPreset}
        onChannel={setChannel}
        onCompareTo={setCompareTo}
        onCustomRange={setCustomRange}
      />

      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* KPI Scorecard */}
        <section>
          <KpiScorecard filter={filter} />
        </section>

        {/* Goals & Budget */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GoalsTargets filter={filter} />
          <BudgetPacing filter={filter} />
        </section>

        {/* Performance Trend */}
        <section>
          <PerformanceTrend filter={filter} />
        </section>

        {/* Channel & Funnel */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChannelComparison filter={filter} />
          <ConversionFunnel filter={filter} />
        </section>

        {/* Efficiency Quadrant */}
        <section>
          <EfficiencyQuadrant filter={filter} />
        </section>

        {/* Campaign Table */}
        <section>
          <CampaignTable filter={filter} />
        </section>

        {/* Creative Performance & Audience */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CreativePerformance filter={filter} />
          <AudienceBreakdowns filter={filter} />
        </section>

        {/* Time Heatmap */}
        <section>
          <TimeHeatmap filter={filter} />
        </section>

        {/* Geo & Keywords */}
        <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <GeoPerformance filter={filter} />
          <KeywordPerformance filter={filter} />
        </section>

        {/* AI Analysis */}
        <section>
          <AiAnalysis filter={filter} />
        </section>

        {/* Analyst comments / notes */}
        <section>
          <CommentsSection />
        </section>
      </main>
    </div>
  );
}
