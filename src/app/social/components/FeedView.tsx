'use client';

import { useState } from 'react';
import { ArrowUp, MessageCircle, MessageSquare, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { ActivityEntry, ResultType } from '@/lib/types/social';
import { formatDistanceToNow } from 'date-fns';

const getMoltbookUrl = (entry: ActivityEntry): string | null => {
  if (entry.url) return entry.url;
  if (entry.moltbook_post_id) return `https://moltbook.com/post/${entry.moltbook_post_id}`;
  return null;
};

interface FeedViewProps {
  entries: ActivityEntry[];
  loading: boolean;
}

type FilterType = 'all' | 'post' | 'comment' | 'reply' | 'viral';

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'post', label: 'Posts' },
  { key: 'comment', label: 'Comments' },
  { key: 'reply', label: 'Replies' },
  { key: 'viral', label: 'Viral Only' },
];

const getTypeBadgeStyles = (type: string) => {
  switch (type) {
    case 'post':
      return 'bg-blue-100 text-blue-700';
    case 'comment':
      return 'bg-purple-100 text-purple-700';
    case 'reply':
      return 'bg-emerald-100 text-emerald-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

const getResultBadgeStyles = (result: ResultType | null) => {
  if (!result) return null;
  switch (result) {
    case 'viral':
      return 'bg-emerald-100 text-emerald-700';
    case 'engaged':
      return 'bg-blue-100 text-blue-700';
    case 'moderate':
      return 'bg-amber-100 text-amber-700';
    case 'flat':
      return 'bg-gray-100 text-gray-600';
    default:
      return null;
  }
};

export function FeedView({ entries, loading }: FeedViewProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const filteredEntries = entries.filter((entry) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'viral') return entry.result === 'viral';
    return entry.type === activeFilter;
  });

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-[var(--fc-border-gray)] shadow-sm p-4 animate-pulse"
          >
            <div className="h-4 bg-[var(--fc-subtle-gray)] rounded w-1/4 mb-3" />
            <div className="h-5 bg-[var(--fc-subtle-gray)] rounded w-3/4 mb-2" />
            <div className="h-4 bg-[var(--fc-subtle-gray)] rounded w-full mb-2" />
            <div className="h-4 bg-[var(--fc-subtle-gray)] rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[var(--fc-border-gray)] shadow-sm p-12">
        <div className="text-center space-y-3">
          <MessageSquare className="w-12 h-12 text-[var(--fc-light-gray)] mx-auto" />
          <h3 className="text-lg font-bold text-[var(--fc-black)]">No activity yet</h3>
          <p className="text-sm text-[var(--fc-body-gray)]">
            Activity will appear here when the agent starts posting
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {FILTERS.map((filter) => (
          <button
            key={filter.key}
            onClick={() => setActiveFilter(filter.key)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              activeFilter === filter.key
                ? 'bg-[var(--fc-black)] text-white'
                : 'bg-[var(--fc-subtle-gray)] text-[var(--fc-body-gray)] hover:bg-[var(--fc-border-gray)]'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Feed Entries */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredEntries.map((entry, index) => {
            const relativeTime = formatDistanceToNow(new Date(entry.created_at), {
              addSuffix: true,
            });

            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl border border-[var(--fc-border-gray)] shadow-sm p-4"
              >
                <div className="flex items-start gap-3 mb-2">
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${getTypeBadgeStyles(
                      entry.type
                    )}`}
                  >
                    {entry.type}
                  </span>
                  {entry.result && (
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${getResultBadgeStyles(
                        entry.result
                      )}`}
                    >
                      {entry.result}
                    </span>
                  )}
                </div>

                {entry.title && (
                  <h3 className="text-base font-medium text-[var(--fc-black)] mb-1">
                    {entry.title}
                  </h3>
                )}

                {entry.content && (
                  <p className="text-sm text-[var(--fc-body-gray)] mb-3 line-clamp-2">
                    {entry.content}
                  </p>
                )}

                <div className="flex items-center gap-6 text-sm text-[var(--fc-body-gray)]">
                  <div className="flex items-center gap-1.5">
                    <ArrowUp className="w-4 h-4" />
                    <span className="font-medium">{entry.karma}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MessageCircle className="w-4 h-4" />
                    <span className="font-medium">{entry.comment_count}</span>
                  </div>
                  <span className="ml-auto flex items-center gap-3">
                    <span>{relativeTime}</span>
                    {getMoltbookUrl(entry) && (
                      <a
                        href={getMoltbookUrl(entry)!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-600 hover:underline font-medium"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        View
                      </a>
                    )}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Load More Button */}
      {filteredEntries.length > 0 && (
        <button
          onClick={() => console.log('Load more clicked')}
          className="w-full py-3 text-center text-[var(--fc-body-gray)] bg-white rounded-xl border border-[var(--fc-border-gray)] hover:bg-[var(--fc-subtle-gray)] transition-colors"
        >
          Load more...
        </button>
      )}
    </div>
  );
}
