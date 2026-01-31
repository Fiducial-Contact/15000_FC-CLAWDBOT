'use client';

import { Calendar, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  Cell,
  Legend,
} from 'recharts';
import type { DailySnapshot } from '@/lib/types/social';

interface DailyViewProps {
  snapshots: DailySnapshot[];
  loading: boolean;
}

function formatChartDate(dateStr: string): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
}

function formatCardDate(dateStr: string): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(date);
}

const CHART_TOOLTIP_STYLE = {
  backgroundColor: 'white',
  border: '1px solid var(--fc-border-gray)',
  borderRadius: '8px',
  fontSize: '12px',
};

export function DailyView({ snapshots, loading }: DailyViewProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-2xl border border-[var(--fc-border-gray)] shadow-sm p-4 animate-pulse">
          <div className="h-[200px] bg-[var(--fc-subtle-gray)] rounded" />
        </div>
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-[var(--fc-border-gray)] shadow-sm p-4 animate-pulse"
          >
            <div className="h-5 bg-[var(--fc-subtle-gray)] rounded w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (snapshots.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[var(--fc-border-gray)] shadow-sm p-12">
        <div className="text-center space-y-3">
          <Calendar className="w-12 h-12 text-[var(--fc-light-gray)] mx-auto" />
          <h3 className="text-lg font-bold text-[var(--fc-black)]">No daily data yet</h3>
          <p className="text-sm text-[var(--fc-body-gray)]">
            Daily snapshots will appear here as they are recorded
          </p>
        </div>
      </div>
    );
  }

  const chartSlice = [...snapshots].slice(0, 14).reverse();

  const karmaRankData = chartSlice
    .filter((s) => s.karma !== null)
    .map((s) => ({
      date: formatChartDate(s.date),
      karma: s.karma,
      rank: s.rank,
    }));

  const hasRankData = karmaRankData.some((d) => d.rank !== null && d.rank > 0);

  const deltaData = chartSlice
    .filter((s) => s.karma_delta !== null)
    .map((s) => ({
      date: formatChartDate(s.date),
      delta: s.karma_delta!,
    }));

  const followersData = chartSlice
    .filter((s) => s.followers !== null)
    .map((s) => ({
      date: formatChartDate(s.date),
      followers: s.followers,
    }));

  const hasKarmaData = karmaRankData.length > 1;
  const hasDeltaData = deltaData.length > 1;
  const hasFollowersData = followersData.length > 1;

  return (
    <div className="space-y-4">
      {hasKarmaData && (
        <div className="bg-white rounded-2xl border border-[var(--fc-border-gray)] shadow-sm p-4">
          <h3 className="text-sm font-bold text-[var(--fc-black)] mb-3">
            {hasRankData ? 'Karma & Rank (14d)' : 'Karma Trend (14d)'}
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={karmaRankData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--fc-border-gray)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: 'var(--fc-body-gray)' }}
                tickLine={false}
                axisLine={{ stroke: 'var(--fc-border-gray)' }}
              />
              <YAxis
                yAxisId="karma"
                tick={{ fontSize: 11, fill: 'var(--fc-body-gray)' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => v.toLocaleString()}
              />
              {hasRankData && (
                <YAxis
                  yAxisId="rank"
                  orientation="right"
                  reversed
                  tick={{ fontSize: 11, fill: 'var(--fc-body-gray)' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `#${v}`}
                />
              )}
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
              {hasRankData && (
                <Legend
                  verticalAlign="top"
                  height={28}
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '12px' }}
                />
              )}
              <Line
                yAxisId="karma"
                type="monotone"
                dataKey="karma"
                name="Karma"
                stroke="#cc1f2d"
                strokeWidth={2}
                dot={{ fill: '#cc1f2d', strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5 }}
              />
              {hasRankData && (
                <Line
                  yAxisId="rank"
                  type="monotone"
                  dataKey="rank"
                  name="Rank"
                  stroke="#7c3aed"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ fill: '#7c3aed', strokeWidth: 0, r: 3 }}
                  activeDot={{ r: 5 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {hasDeltaData && (
        <div className="bg-white rounded-2xl border border-[var(--fc-border-gray)] shadow-sm p-4">
          <h3 className="text-sm font-bold text-[var(--fc-black)] mb-3">Karma Change</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={deltaData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--fc-border-gray)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: 'var(--fc-body-gray)' }}
                tickLine={false}
                axisLine={{ stroke: 'var(--fc-border-gray)' }}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--fc-body-gray)' }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={CHART_TOOLTIP_STYLE}
                formatter={(value) => [typeof value === 'number' && value > 0 ? `+${value}` : String(value ?? ''), 'Change']}
              />
              <Bar dataKey="delta" name="Karma Δ" radius={[3, 3, 0, 0]}>
                {deltaData.map((d, i) => (
                  <Cell key={i} fill={d.delta >= 0 ? '#059669' : '#cc1f2d'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {hasFollowersData && (
        <div className="bg-white rounded-2xl border border-[var(--fc-border-gray)] shadow-sm p-4">
          <h3 className="text-sm font-bold text-[var(--fc-black)] mb-3">Followers (14d)</h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={followersData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="followersFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--fc-border-gray)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: 'var(--fc-body-gray)' }}
                tickLine={false}
                axisLine={{ stroke: 'var(--fc-border-gray)' }}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--fc-body-gray)' }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
              <Area
                type="monotone"
                dataKey="followers"
                name="Followers"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#followersFill)"
                dot={{ fill: '#3b82f6', strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <AnimatePresence mode="popLayout">
        {snapshots.map((snapshot, index) => {
          const deltaPositive = (snapshot.karma_delta ?? 0) >= 0;
          const deltaDisplay =
            snapshot.karma_delta !== null
              ? snapshot.karma_delta > 0
                ? `+${snapshot.karma_delta.toLocaleString()}`
                : snapshot.karma_delta.toLocaleString()
              : null;

          return (
            <motion.div
              key={snapshot.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.03 }}
              className="bg-white rounded-2xl border border-[var(--fc-border-gray)] shadow-sm p-4"
            >
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                <span className="font-bold text-[var(--fc-black)]">
                  {formatCardDate(snapshot.date)}
                </span>
                <span className="text-[var(--fc-border-gray)]">|</span>
                <span className="text-[var(--fc-body-gray)]">
                  Karma:{' '}
                  <span className="font-semibold text-[var(--fc-black)]">
                    {snapshot.karma?.toLocaleString() ?? '—'}
                  </span>
                  {deltaDisplay && (
                    <span
                      className={`ml-1 ${deltaPositive ? 'text-emerald-600' : 'text-[var(--fc-action-red)]'}`}
                    >
                      ({deltaDisplay})
                    </span>
                  )}
                </span>
                <span className="text-[var(--fc-border-gray)]">|</span>
                <span className="text-[var(--fc-body-gray)]">
                  Posts:{' '}
                  <span className="font-semibold text-[var(--fc-black)]">
                    {snapshot.posts_today ?? '—'}
                  </span>
                </span>
                <span className="text-[var(--fc-border-gray)]">|</span>
                <span className="text-[var(--fc-body-gray)]">
                  Comments:{' '}
                  <span className="font-semibold text-[var(--fc-black)]">
                    {snapshot.comments_today ?? '—'}
                  </span>
                </span>
                {snapshot.top_post_url && (
                  <>
                    <span className="text-[var(--fc-border-gray)]">|</span>
                    <a
                      href={snapshot.top_post_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
