'use client';

import { Trophy, Flame, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { ActivityEntry } from '@/lib/types/social';
import { formatDistanceToNow } from 'date-fns';

const getMoltbookUrl = (entry: ActivityEntry): string | null => {
  if (entry.url) return entry.url;
  if (entry.moltbook_post_id) return `https://moltbook.com/post/${entry.moltbook_post_id}`;
  return null;
};

interface WinsViewProps {
  entries: ActivityEntry[];
  loading: boolean;
}

export function WinsView({ entries, loading }: WinsViewProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-[var(--fc-border-gray)] shadow-sm p-6 animate-pulse"
          >
            <div className="h-8 bg-[var(--fc-subtle-gray)] rounded w-1/3 mb-4" />
            <div className="h-6 bg-[var(--fc-subtle-gray)] rounded w-full mb-3" />
            <div className="h-4 bg-[var(--fc-subtle-gray)] rounded w-3/4 mb-2" />
            <div className="h-4 bg-[var(--fc-subtle-gray)] rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[var(--fc-border-gray)] shadow-sm p-12">
        <div className="text-center space-y-3">
          <Flame className="w-12 h-12 text-[var(--fc-light-gray)] mx-auto" />
          <h3 className="text-lg font-bold text-[var(--fc-black)]">No wins yet</h3>
          <p className="text-sm text-[var(--fc-body-gray)]">
            Viral posts will appear here when they reach high engagement
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <AnimatePresence mode="popLayout">
        {entries.map((entry, index) => {
          const relativeTime = formatDistanceToNow(new Date(entry.created_at), {
            addSuffix: true,
          });

          return (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-2xl border border-[var(--fc-border-gray)] shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  <span className="text-[24px] font-bold text-[var(--fc-black)]">
                    {entry.karma}
                  </span>
                </div>
                <span className="ml-auto text-xs text-[var(--fc-body-gray)]">
                  {relativeTime}
                </span>
              </div>

              {entry.title && (
                <h3 className="text-base font-medium text-[var(--fc-black)] mb-2">
                  {entry.title}
                </h3>
              )}

              {entry.content && (
                <p className="text-sm text-[var(--fc-body-gray)] mb-3 line-clamp-3">
                  {entry.content}
                </p>
              )}

              {entry.submolt && (
                <div className="mb-3">
                  <span className="inline-block px-2 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-purple-100 text-purple-700">
                    {entry.submolt}
                  </span>
                </div>
              )}

              {getMoltbookUrl(entry) && (
                <a
                  href={getMoltbookUrl(entry)!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline font-medium"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  View on Moltbook
                </a>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
