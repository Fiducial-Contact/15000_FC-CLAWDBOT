'use client';

import { Trophy, Medal, TrendingUp, TrendingDown, MessageSquare, Target } from 'lucide-react';
import type { AgentMetrics } from '@/lib/types/social';

interface MetricsBarProps {
  metrics: AgentMetrics;
}

export function MetricsBar({ metrics }: MetricsBarProps) {
  const hasData = metrics.karma > 0 || metrics.rank > 0 || metrics.postsTotal > 0;

  const formatNumber = (num: number) => {
    if (!hasData) return '—';
    return num.toLocaleString();
  };

  const formatDelta = (num: number) => {
    if (!hasData) return '—';
    if (num === 0) return '0';
    return num > 0 ? `+${num}` : `${num}`;
  };

  const formatWinRate = (num: number) => {
    if (!hasData) return '—';
    return `${num}%`;
  };

  const getDeltaColor = (num: number) => {
    if (num > 0) return 'text-emerald-600';
    if (num < 0) return 'text-[var(--fc-action-red)]';
    return 'text-[var(--fc-body-gray)]';
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      <div className="bg-white rounded-2xl border border-[var(--fc-border-gray)] shadow-sm p-4">
        <div className="flex items-start justify-between mb-2">
          <span className="text-[11px] uppercase tracking-wider font-bold text-[var(--fc-light-gray)]">
            Karma
          </span>
          <Trophy className="w-4 h-4 text-amber-500" />
        </div>
        <div className="text-[20px] font-bold text-[var(--fc-black)]">
          {formatNumber(metrics.karma)}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[var(--fc-border-gray)] shadow-sm p-4">
        <div className="flex items-start justify-between mb-2">
          <span className="text-[11px] uppercase tracking-wider font-bold text-[var(--fc-light-gray)]">
            Rank
          </span>
          <Medal className="w-4 h-4 text-purple-500" />
        </div>
        <div className="text-[20px] font-bold text-[var(--fc-black)]">
          {formatNumber(metrics.rank)}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[var(--fc-border-gray)] shadow-sm p-4">
        <div className="flex items-start justify-between mb-2">
          <span className="text-[11px] uppercase tracking-wider font-bold text-[var(--fc-light-gray)]">
            Delta
          </span>
          {metrics.karmaDelta >= 0 ? (
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          ) : (
            <TrendingDown className="w-4 h-4 text-[var(--fc-action-red)]" />
          )}
        </div>
        <div className={`text-[20px] font-bold ${getDeltaColor(metrics.karmaDelta)}`}>
          {formatDelta(metrics.karmaDelta)}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[var(--fc-border-gray)] shadow-sm p-4">
        <div className="flex items-start justify-between mb-2">
          <span className="text-[11px] uppercase tracking-wider font-bold text-[var(--fc-light-gray)]">
            Posts
          </span>
          <MessageSquare className="w-4 h-4 text-blue-500" />
        </div>
        <div className="text-[20px] font-bold text-[var(--fc-black)]">
          {formatNumber(metrics.postsTotal)}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[var(--fc-border-gray)] shadow-sm p-4">
        <div className="flex items-start justify-between mb-2">
          <span className="text-[11px] uppercase tracking-wider font-bold text-[var(--fc-light-gray)]">
            Win Rate
          </span>
          <Target className="w-4 h-4 text-[var(--fc-red)]" />
        </div>
        <div className="text-[20px] font-bold text-[var(--fc-black)]">
          {formatWinRate(metrics.winRate)}
        </div>
      </div>
    </div>
  );
}
