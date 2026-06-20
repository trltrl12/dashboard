import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

export const runtime = 'nodejs';

function supabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

function n(v: unknown): number { return Number(v ?? 0) || 0; }
function count<T>(arr: T[], fn: (r: T) => boolean) { return arr.filter(fn).length; }
function sumBy<T>(arr: T[], fn: (r: T) => number) { return arr.reduce((s, r) => s + fn(r), 0); }
function groupCount<T>(arr: T[], fn: (r: T) => string) {
  const m: Record<string, number> = {};
  for (const r of arr) { const k = fn(r) || '(none)'; m[k] = (m[k] || 0) + 1; }
  return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 10);
}

type AdRow = Record<string, unknown>;
type LeadRow = Record<string, unknown>;
type InvRow = Record<string, unknown>;

async function buildContext(from: string, to: string, channel: string): Promise<string> {
  const db = supabase();

  // Ad performance
  let adQuery = db.from('ad_performance').select('*').gte('date', from).lte('date', to);
  if (channel && channel !== 'all') adQuery = adQuery.eq('channel', channel);
  const { data: ads } = await adQuery.limit(5000);
  const adRows: AdRow[] = (ads ?? []) as AdRow[];

  // Leads (use full table — not date-filtered, since leads may be historical)
  const { data: leads } = await db.from('leads').select('*').limit(2000);
  const leadRows: LeadRow[] = (leads ?? []) as LeadRow[];

  // Inventory
  const { data: inv } = await db.from('inventory').select('*').limit(1000);
  const invRows: InvRow[] = (inv ?? []) as InvRow[];

  // --- Ad aggregates ---
  const totalSpend = sumBy(adRows, r => n(r.spend));
  const totalImpr  = sumBy(adRows, r => n(r.impressions));
  const totalClicks = sumBy(adRows, r => n(r.clicks));
  const totalConv  = sumBy(adRows, r => n(r.conversions));

  const byChannel: Record<string, { spend: number; clicks: number; conversions: number }> = {};
  for (const r of adRows) {
    const ch = String(r.channel ?? 'unknown');
    if (!byChannel[ch]) byChannel[ch] = { spend: 0, clicks: 0, conversions: 0 };
    byChannel[ch].spend       += n(r.spend);
    byChannel[ch].clicks      += n(r.clicks);
    byChannel[ch].conversions += n(r.conversions);
  }
  const byCampaignSpend: Record<string, number> = {};
  for (const r of adRows) {
    const c = String(r.campaign ?? '(none)');
    byCampaignSpend[c] = (byCampaignSpend[c] || 0) + n(r.spend);
  }
  const topCampaignsBySpend = Object.entries(byCampaignSpend)
    .sort((a, b) => b[1] - a[1]).slice(0, 8)
    .map(([c, s]) => `  ${c}: $${s.toFixed(0)}`).join('\n');

  // --- Lead aggregates ---
  const totalLeads = leadRows.length;
  const byStatus = groupCount(leadRows, r => String(r.lead_status ?? ''));
  const bySource = groupCount(leadRows, r => String(r.lead_source ?? ''));
  const byCampaign = groupCount(leadRows, r => String(r.campaign_name ?? ''));

  const closedLeads = leadRows.filter(r =>
    /closed|contract|assign/i.test(String(r.lead_status ?? ''))
  );
  const avgOffer = closedLeads.length
    ? sumBy(closedLeads, r => n(r.offer_price)) / closedLeads.length : 0;
  const avgProfit = closedLeads.length
    ? sumBy(closedLeads, r => n(r.expected_profit)) / closedLeads.length : 0;
  const totalProfit = sumBy(leadRows, r => n(r.expected_profit));

  // top campaigns by expected_profit
  const profitByCampaign: Record<string, number> = {};
  for (const r of leadRows) {
    const c = String(r.campaign_name ?? '(none)');
    profitByCampaign[c] = (profitByCampaign[c] || 0) + n(r.expected_profit);
  }
  const topByProfit = Object.entries(profitByCampaign)
    .sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([c, p]) => `  ${c}: $${p.toFixed(0)}`).join('\n');

  // dead lead reasons
  const deadReasons = groupCount(
    leadRows.filter(r => /dead/i.test(String(r.lead_status ?? ''))),
    r => String(r.dead_lead_reason ?? 'No reason given')
  ).map(([r, c]) => `  ${r}: ${c}`).join('\n');

  // --- Inventory aggregates ---
  const invSummary = invRows.length === 0
    ? '  (no inventory rows loaded yet)'
    : `Total inventory records: ${invRows.length}\n` +
      groupCount(invRows, r => String((r as Record<string,unknown>).status ?? 'Unknown'))
        .map(([s, c]) => `  ${s}: ${c}`).join('\n');

  // --- Data quality ---
  const leadsNoCampaign  = count(leadRows, r => !r.campaign_name);
  const adCampaigns      = new Set(adRows.map(r => String(r.campaign)));
  const leadCampaigns    = new Set(leadRows.map(r => String(r.campaign_name)).filter(Boolean));
  const orphanCampaigns  = [...leadCampaigns].filter(c => !adCampaigns.has(c));
  const noLeadCampaigns  = [...adCampaigns].filter(c => !leadCampaigns.has(c));

  return `
=== AD PERFORMANCE (${from} to ${to}) ===
Total spend: $${totalSpend.toFixed(2)}
Impressions: ${totalImpr.toLocaleString()}
Clicks:      ${totalClicks.toLocaleString()}
CTR:         ${totalImpr ? ((totalClicks / totalImpr) * 100).toFixed(2) : 0}%
CPC:         $${totalClicks ? (totalSpend / totalClicks).toFixed(2) : 0}
Conversions (ad-tracked): ${totalConv}

By channel:
${Object.entries(byChannel).map(([ch, v]) =>
  `  ${ch}: $${v.spend.toFixed(0)} spend | ${v.clicks} clicks | ${v.conversions} ad-conversions`
).join('\n')}

Top campaigns by spend:
${topCampaignsBySpend || '  (none)'}

=== LEADS (all-time, ${totalLeads} total) ===
By status:
${byStatus.map(([s, c]) => `  ${s}: ${c}`).join('\n') || '  (none)'}

By lead source:
${bySource.map(([s, c]) => `  ${s}: ${c}`).join('\n') || '  (none)'}

By campaign:
${byCampaign.map(([c, cnt]) => `  ${c}: ${cnt}`).join('\n') || '  (none)'}

Top campaigns by expected profit:
${topByProfit || '  (none)'}

Closed / under-contract leads: ${closedLeads.length}
  Avg offer price:    $${avgOffer.toFixed(0)}
  Avg expected profit: $${avgProfit.toFixed(0)}
  Total expected profit: $${totalProfit.toFixed(0)}

Dead lead reasons:
${deadReasons || '  (none)'}

=== INVENTORY ===
${invSummary}

=== DATA QUALITY FLAGS ===
- Leads with no campaign_name: ${leadsNoCampaign}
- Lead campaigns not in ad_performance: ${orphanCampaigns.slice(0, 5).join(', ') || 'none'}
- Ad campaigns with no matching leads: ${noLeadCampaigns.slice(0, 5).join(', ') || 'none'}
`.trim();
}

export async function POST(req: Request) {
  try {
    const { question, filter } = await req.json() as {
      question: string;
      filter: { from: string; to: string; channel: string };
    };

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response('ANTHROPIC_API_KEY is not set. Add it to your environment variables.', { status: 500 });
    }

    const context = await buildContext(filter.from, filter.to, filter.channel);

    const client = new Anthropic({ apiKey });

    const stream = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 1024,
      stream: true,
      system: `You are an expert real estate marketing analyst for a "we buy houses" company.
You have access to both their ad spend data (Facebook + Google) and their full CRM lead data.
Give specific, data-driven answers. Reference actual numbers from the data.
When you spot data quality issues (e.g. orphaned campaigns, missing values), flag them concisely.
Format responses clearly: use short paragraphs, bullet points where helpful.
Never make up numbers — only reference what's in the data provided.`,
      messages: [
        {
          role: 'user',
          content: `Here is the data:\n\n${context}\n\nQuestion: ${question}`,
        },
      ],
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        for await (const event of stream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        controller.close();
      },
    });

    return new Response(readable, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(`Analysis failed: ${msg}`, { status: 500 });
  }
}
