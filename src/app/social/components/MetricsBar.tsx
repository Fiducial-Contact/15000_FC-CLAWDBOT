'use client';

import { Trophy, Medal, TrendingUp, TrendingDown, MessageSquare, Target } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
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

  const getDeltaColor = (num: number) => {
    if (num > 0) return 'text-emerald-600';
    if (num < 0) return 'text-[var(--fc-action-red)]';
    return 'text-[var(--fc-body-gray)]';
  };

  const karmaDiff = metrics.karma - metrics.karmaYesterday;
  const sparklineData = metrics.karmaTrend.map((value, index) => ({ value, index }));

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
      {/* Karma Card with Sparkline */}
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
        {hasData && metrics.karmaTrend.length > 0 && (
          <div className="mt-2">
            <div className="h-8">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sparklineData}>
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={karmaDiff >= 0 ? '#059669' : 'var(--fc-action-red)'}
                    strokeWidth={1.5}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className={`text-[11px] mt-1 ${getDeltaColor(karmaDiff)}`}>
              vs yesterday: {karmaDiff >= 0 ? '+' : ''}{karmaDiff.toLocaleString()}
            </div>
          </div>
        )}
      </div>

      {/* Rank Card */}
      <div className="bg-white rounded-2xl border border-[var(--fc-border-gray)] shadow-sm p-4">
        <div className="flex items-start justify-between mb-2">
          <span className="text-[11px] uppercase tracking-wider font-bold text-[var(--fc-light-gray)]">
            Rank
          </span>
          <Medal className="w-4 h-4 text-purple-500" />
        </div>
        <div className="text-[20px] font-bold text-[var(--fc-black)]">
          {hasData && metrics.rank > 0 ? `#${metrics.rank}` : '—'}
        </div>
      </div>

      {/* 24h Change Card */}
      <div className="bg-white rounded-2xl border border-[var(--fc-border-gray)] shadow-sm p-4">
        <div className="flex items-start justify-between mb-2">
          <span className="text-[11px] uppercase tracking-wider font-bold text-[var(--fc-light-gray)]">
            24h Change
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

      {/* Posts Card */}
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

      {/* Win Rate Card with Fraction */}
      <div className="bg-white rounded-2xl border border-[var(--fc-border-gray)] shadow-sm p-4">
        <div className="flex items-start justify-between mb-2">
          <span className="text-[11px] uppercase tracking-wider font-bold text-[var(--fc-light-gray)]">
            Win Rate
          </span>
          <Target className="w-4 h-4 text-[var(--fc-red)]" />
        </div>
        <div className="text-[20px] font-bold text-[var(--fc-black)]">
          {hasData ? `${metrics.winRate}%` : '—'}
        </div>
        {hasData && (
          <div className="text-[11px] text-[var(--fc-body-gray)] mt-1">
            ({metrics.viralTotal}/{metrics.evaluatedTotal} viral)
          </div>
        )}
      </div>
    </div>
  );
}
