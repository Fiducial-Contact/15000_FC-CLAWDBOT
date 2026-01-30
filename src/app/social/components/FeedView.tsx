'use client';

import { ArrowUp, MessageCircle, MessageSquare, ExternalLink, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { ActivityEntry, ResultType } from '@/lib/types/social';
import { formatDistanceToNow } from 'date-fns';

const getMoltbookUrl = (entry: ActivityEntry): string | null => {
  if (entry.url) return entry.url;
  if (entry.moltbook_post_id) return `https://moltbook.com/post/${entry.moltbook_post_id}`;
  return null;
};

type FilterType = 'all' | 'post' | 'comment' | 'reply' | 'viral';

interface FilterCounts {
  all: number;
  post: number;
  comment: number;
  reply: number;
  viral: number;
}

interface FeedViewProps {
  entries: ActivityEntry[];
  loading: boolean;
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  onLoadMore: () => void;
  loadingMore: boolean;
  filterCounts?: FilterCounts;
}

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

export function FeedView({ entries, loading, activeFilter, onFilterChange, onLoadMore, loadingMore, filterCounts }: FeedViewProps) {

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
      <div className="flex gap-6 border-b border-[var(--fc-border-gray)] mb-4">
        {FILTERS.map((filter) => {
          const isActive = activeFilter === filter.key;
          const count = filterCounts?.[filter.key];
          return (
            <button
              key={filter.key}
              onClick={() => onFilterChange(filter.key)}
              className={`relative pb-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'text-[var(--fc-black)]'
                  : 'text-[var(--fc-body-gray)] hover:text-[var(--fc-dark-gray)]'
              }`}
            >
              {filter.label}
              {count !== undefined && (
                <span className={`ml-1.5 text-xs tabular-nums ${isActive ? 'text-[var(--fc-body-gray)]' : 'text-[var(--fc-light-gray)]'}`}>
                  {count}
                </span>
              )}
              {isActive && (
                <motion.div
                  layoutId="feed-filter-underline"
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--fc-black)]"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Feed Entries */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {entries.map((entry, index) => {
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
      {entries.length > 0 && (
        <button
          onClick={onLoadMore}
          disabled={loadingMore}
          className="w-full py-3 text-center text-[var(--fc-body-gray)] bg-white rounded-xl border border-[var(--fc-border-gray)] hover:bg-[var(--fc-subtle-gray)] transition-colors disabled:opacity-50"
        >
          {loadingMore ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading...
            </span>
          ) : (
            'Load more...'
          )}
        </button>
      )}
    </div>
  );
}
