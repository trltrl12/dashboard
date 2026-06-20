'use client';
import { useEffect, useRef, useState } from 'react';
import { MessageSquare, CheckCircle2, ThumbsUp, Wrench, Check } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { brand } from '@/config/brand';

const STORAGE_KEY = 'dashboard.analyst-comments.v1';

interface CommentField {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
  placeholder: string;
  seed: string;
}

const FIELDS: CommentField[] = [
  {
    key: 'working',
    label: "What's working",
    icon: CheckCircle2,
    color: '#16a34a',
    placeholder: 'Note the metrics, channels, or campaigns that are performing…',
    seed: 'Both channels are flowing. Facebook lead tracking works (118 leads). Core spend/CTR/CPC/CPA metrics are real and usable.',
  },
  {
    key: 'good',
    label: 'Consistent & good',
    icon: ThumbsUp,
    color: brand.accentColor,
    placeholder: 'Note what is stable, clean, or reliable…',
    seed: 'Clean daily grain, believable spend figures, descriptive campaign names. GA4 noise is filtered out of ad metrics.',
  },
  {
    key: 'improve',
    label: 'What to improve',
    icon: Wrench,
    color: '#ea580c',
    placeholder: 'Note gaps, data issues, or next steps…',
    seed: 'Google conversions show 0 (missing from Windsor export). No revenue column yet (lead-gen). Add device/region/keyword fields to light up Audience, Geo, and Keyword sections.',
  },
];

type Comments = Record<string, string>;

function loadComments(): Comments {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  // First run: seed with the data-review findings.
  return Object.fromEntries(FIELDS.map((f) => [f.key, f.seed]));
}

export function CommentsSection() {
  const [comments, setComments] = useState<Comments>({});
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load once on mount (client only).
  useEffect(() => {
    setComments(loadComments());
  }, []);

  const update = (key: string, value: string) => {
    setComments((prev) => {
      const next = { ...prev, [key]: value };
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          setSavedAt(Date.now());
          setJustSaved(true);
          setTimeout(() => setJustSaved(false), 1500);
        } catch {
          /* ignore */
        }
      }, 500);
      return next;
    });
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-900">Analyst Comments &amp; Notes</h2>
        </div>
        {justSaved ? (
          <span className="flex items-center gap-1 text-xs text-green-600">
            <Check className="w-3.5 h-3.5" /> Saved
          </span>
        ) : savedAt ? (
          <span className="text-xs text-slate-400">Saved locally</span>
        ) : null}
      </div>
      <p className="text-xs text-slate-400 mb-5">
        Editable notes, saved in your browser. Use these to track observations and decisions.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {FIELDS.map((f) => {
          const Icon = f.icon;
          return (
            <div key={f.key} className="flex flex-col">
              <div className="flex items-center gap-1.5 mb-2">
                <Icon className="w-3.5 h-3.5" style={{ color: f.color }} />
                <span className="text-xs font-semibold text-slate-700">{f.label}</span>
              </div>
              <textarea
                value={comments[f.key] ?? ''}
                onChange={(e) => update(f.key, e.target.value)}
                placeholder={f.placeholder}
                rows={6}
                className="flex-1 w-full resize-y rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm text-slate-700 leading-relaxed placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:bg-white"
                style={{ ['--tw-ring-color' as string]: brand.accentColor }}
              />
            </div>
          );
        })}
      </div>
    </Card>
  );
}
