'use client';

import { Calendar, TrendingUp, TrendingDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { DailySnapshot } from '@/lib/types/social';
import { format } from 'date-fns';

interface DailyViewProps {
  snapshots: DailySnapshot[];
  loading: boolean;
}

export function DailyView({ snapshots, loading }: DailyViewProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-[var(--fc-border-gray)] shadow-sm p-6 animate-pulse"
          >
            <div className="h-6 bg-[var(--fc-subtle-gray)] rounded w-1/4 mb-4" />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[...Array(6)].map((_, j) => (
                <div key={j}>
                  <div className="h-3 bg-[var(--fc-subtle-gray)] rounded w-1/2 mb-2" />
                  <div className="h-5 bg-[var(--fc-subtle-gray)] rounded w-3/4" />
                </div>
              ))}
            </div>
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

  return (
    <div className="space-y-4">
      <AnimatePresence mode="popLayout">
        {snapshots.map((snapshot, index) => {
          const formattedDate = format(new Date(snapshot.date), 'MMMM d, yyyy');
          const deltaPositive = (snapshot.karma_delta ?? 0) >= 0;

          return (
            <motion.div
              key={snapshot.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-2xl border border-[var(--fc-border-gray)] shadow-sm p-6"
            >
              <h3 className="text-lg font-bold text-[var(--fc-black)] mb-4">
                {formattedDate}
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <div className="text-[11px] uppercase tracking-wider font-bold text-[var(--fc-light-gray)] mb-1">
                    Karma
                  </div>
                  <div className="text-[18px] font-bold text-[var(--fc-black)]">
                    {snapshot.karma?.toLocaleString() ?? '—'}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] uppercase tracking-wider font-bold text-[var(--fc-light-gray)] mb-1">
                    Rank
                  </div>
                  <div className="text-[18px] font-bold text-[var(--fc-black)]">
                    {snapshot.rank?.toLocaleString() ?? '—'}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] uppercase tracking-wider font-bold text-[var(--fc-light-gray)] mb-1">
                    Delta
                  </div>
                  <div
                    className={`text-[18px] font-bold flex items-center gap-1 ${
                      deltaPositive ? 'text-emerald-600' : 'text-[var(--fc-action-red)]'
                    }`}
                  >
                    {deltaPositive ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    {snapshot.karma_delta !== null
                      ? snapshot.karma_delta > 0
                        ? `+${snapshot.karma_delta}`
                        : snapshot.karma_delta
                      : '—'}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] uppercase tracking-wider font-bold text-[var(--fc-light-gray)] mb-1">
                    Followers
                  </div>
                  <div className="text-[18px] font-bold text-[var(--fc-black)]">
                    {snapshot.followers?.toLocaleString() ?? '—'}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] uppercase tracking-wider font-bold text-[var(--fc-light-gray)] mb-1">
                    Posts
                  </div>
                  <div className="text-[18px] font-bold text-[var(--fc-black)]">
                    {snapshot.posts_today?.toLocaleString() ?? '—'}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] uppercase tracking-wider font-bold text-[var(--fc-light-gray)] mb-1">
                    Comments
                  </div>
                  <div className="text-[18px] font-bold text-[var(--fc-black)]">
                    {snapshot.comments_today?.toLocaleString() ?? '—'}
                  </div>
                </div>
              </div>

              {snapshot.top_post_url && (
                <div className="pt-4 border-t border-[var(--fc-border-gray)]">
                  <div className="text-[11px] uppercase tracking-wider font-bold text-[var(--fc-light-gray)] mb-2">
                    Top Post
                  </div>
                  <a
                    href={snapshot.top_post_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    View on Moltbook →
                  </a>
                </div>
              )}

              {snapshot.notes && (
                <div className="pt-4 border-t border-[var(--fc-border-gray)] mt-4">
                  <div className="text-[11px] uppercase tracking-wider font-bold text-[var(--fc-light-gray)] mb-2">
                    Notes
                  </div>
                  <p className="text-sm text-[var(--fc-body-gray)]">{snapshot.notes}</p>
                </div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
