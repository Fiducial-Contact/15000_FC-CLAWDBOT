'use client';

import { useState } from 'react';
import { ArrowUp, MessageCircle, MessageSquare, ExternalLink, Loader2, ChevronDown } from 'lucide-react';
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

type FeedGroup =
  | { kind: 'post'; entry: ActivityEntry }
  | { kind: 'compact'; entries: ActivityEntry[] };

function groupEntries(entries: ActivityEntry[], filter: FilterType): FeedGroup[] {
  if (filter !== 'all') {
    return entries.map((e) => e.type === 'post' ? { kind: 'post', entry: e } : { kind: 'compact', entries: [e] });
  }

  const groups: FeedGroup[] = [];
  let compactBuf: ActivityEntry[] = [];

  const flushCompact = () => {
    if (compactBuf.length > 0) {
      groups.push({ kind: 'compact', entries: [...compactBuf] });
      compactBuf = [];
    }
  };

  for (const entry of entries) {
    if (entry.type === 'post') {
      flushCompact();
      groups.push({ kind: 'post', entry });
    } else {
      compactBuf.push(entry);
    }
  }
  flushCompact();
  return groups;
}

function PostCard({ entry, index }: { entry: ActivityEntry; index: number }) {
  const relativeTime = formatDistanceToNow(new Date(entry.created_at), { addSuffix: true });
  const url = getMoltbookUrl(entry);

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
        <span className={`inline-block px-2 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${getTypeBadgeStyles(entry.type)}`}>
          {entry.type}
        </span>
        {entry.result && (
          <span className={`inline-block px-2 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${getResultBadgeStyles(entry.result)}`}>
            {entry.result}
          </span>
        )}
      </div>
      {entry.title && (
        <h3 className="text-base font-medium text-[var(--fc-black)] mb-1">{entry.title}</h3>
      )}
      {entry.content && (
        <p className="text-sm text-[var(--fc-body-gray)] mb-3 line-clamp-2">{entry.content}</p>
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
          {url && (
            <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline font-medium">
              <ExternalLink className="w-3.5 h-3.5" />
              View
            </a>
          )}
        </span>
      </div>
    </motion.div>
  );
}

function CompactRow({ entry }: { entry: ActivityEntry }) {
  const relativeTime = formatDistanceToNow(new Date(entry.created_at), { addSuffix: true });
  const url = getMoltbookUrl(entry);
  const displayText = entry.title || entry.content || '';

  return (
    <div className="flex items-center gap-3 px-3 py-2 hover:bg-[var(--fc-subtle-gray)] transition-colors rounded-lg group">
      <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getTypeBadgeStyles(entry.type)}`}>
        {entry.type === 'comment' ? 'cmt' : 'rpl'}
      </span>
      {entry.result && (
        <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getResultBadgeStyles(entry.result)}`}>
          {entry.result}
        </span>
      )}
      <span className="text-sm text-[var(--fc-black)] truncate flex-1 min-w-0">
        {displayText}
      </span>
      <div className="shrink-0 flex items-center gap-3 text-xs text-[var(--fc-body-gray)]">
        <span className="flex items-center gap-1 tabular-nums">
          <ArrowUp className="w-3 h-3" />
          {entry.karma}
        </span>
        <span className="text-[var(--fc-light-gray)]">{relativeTime}</span>
        {url && (
          <a href={url} target="_blank" rel="noopener noreferrer" className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-600">
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
}

function CompactGroup({ entries, index }: { entries: ActivityEntry[]; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const COLLAPSE_THRESHOLD = 6;
  const VISIBLE_WHEN_COLLAPSED = 4;

  const shouldCollapse = entries.length >= COLLAPSE_THRESHOLD;
  const visibleEntries = shouldCollapse && !expanded ? entries.slice(0, VISIBLE_WHEN_COLLAPSED) : entries;
  const hiddenCount = entries.length - VISIBLE_WHEN_COLLAPSED;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white rounded-xl border border-[var(--fc-border-gray)] shadow-sm py-1 divide-y divide-[var(--fc-subtle-gray)]"
    >
      {visibleEntries.map((entry) => (
        <CompactRow key={entry.id} entry={entry} />
      ))}
      {shouldCollapse && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-[var(--fc-body-gray)] hover:text-[var(--fc-black)] transition-colors"
        >
          <ChevronDown className="w-3.5 h-3.5" />
          {hiddenCount} more {hiddenCount === 1 ? 'reply' : 'replies'}
        </button>
      )}
    </motion.div>
  );
}

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

  const groups = groupEntries(entries, activeFilter);

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
          {groups.map((group, index) => {
            if (group.kind === 'post') {
              return <PostCard key={group.entry.id} entry={group.entry} index={index} />;
            }
            const groupKey = group.entries.map((e) => e.id).join('-');
            return <CompactGroup key={groupKey} entries={group.entries} index={index} />;
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
