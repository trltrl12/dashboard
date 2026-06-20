'use client';
import { useRef, useState } from 'react';
import { Sparkles, Send, Loader } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { brand } from '@/config/brand';
import { DateFilter } from '@/lib/data/types';

interface AiAnalysisProps {
  filter: DateFilter;
}

const QUICK_PROMPTS = [
  'Audit my data quality across all tables',
  'Which campaigns drive the most leads and best profit?',
  'What is my cost per lead by channel and campaign?',
  'Show close rate by lead source and flag dead lead patterns',
];

function renderText(text: string) {
  return text.split('\n').map((line, i) => {
    const bold = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    const isBullet = /^[-•*]\s/.test(line.trim());
    return (
      <p
        key={i}
        className={isBullet ? 'pl-4 before:content-["•"] before:-ml-4 before:mr-2 before:text-slate-400' : ''}
        dangerouslySetInnerHTML={{ __html: isBullet ? bold.replace(/^[-•*]\s/, '') : bold }}
      />
    );
  });
}

export function AiAnalysis({ filter }: AiAnalysisProps) {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  async function submit(q: string) {
    if (!q.trim() || loading) return;
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    setError('');
    setResponse('');

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortRef.current.signal,
        body: JSON.stringify({
          question: q,
          filter: { from: filter.from, to: filter.to, channel: filter.channel ?? 'all' },
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error('No response stream');

      let out = '';
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        out += decoder.decode(value, { stream: true });
        setResponse(out);
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="w-4 h-4" style={{ color: brand.accentColor }} />
        <h2 className="text-sm font-semibold text-slate-900">AI Analysis</h2>
        <span className="text-xs text-slate-400 ml-1">— powered by Claude</span>
      </div>
      <p className="text-xs text-slate-400 mb-5">
        Ask anything about your ad performance, leads, and inventory. Claude reads all three tables.
      </p>

      {/* Quick prompts */}
      <div className="flex flex-wrap gap-2 mb-4">
        {QUICK_PROMPTS.map((p) => (
          <button
            key={p}
            onClick={() => { setQuestion(p); submit(p); }}
            disabled={loading}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-all disabled:opacity-40"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(question); } }}
          placeholder="Ask a question about your data… (Enter to send)"
          rows={2}
          className="flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:bg-white"
          style={{ ['--tw-ring-color' as string]: brand.accentColor }}
        />
        <button
          onClick={() => submit(question)}
          disabled={loading || !question.trim()}
          className="self-end px-4 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-40 transition-opacity"
          style={{ backgroundColor: brand.accentColor }}
        >
          {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>

      {/* Response */}
      {(response || loading || error) && (
        <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-4">
          {loading && !response && (
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="animate-pulse">●</span>
              <span className="animate-pulse delay-75">●</span>
              <span className="animate-pulse delay-150">●</span>
              <span className="ml-1">Analyzing your data…</span>
            </div>
          )}
          {error && (
            <p className="text-xs text-red-500">
              {error.includes('ANTHROPIC_API_KEY')
                ? 'Add ANTHROPIC_API_KEY to your Netlify environment variables, then redeploy.'
                : error}
            </p>
          )}
          {response && (
            <div className="text-sm text-slate-700 leading-relaxed space-y-1.5">
              {renderText(response)}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
