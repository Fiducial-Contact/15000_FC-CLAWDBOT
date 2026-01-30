'use client';

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
      return 'bg-[var(--fc-action-red)] text-white';
    case 'engaged':
      return 'bg-amber-500 text-white';
    case 'moderate':
      return 'bg-slate-500 text-white';
    case 'flat':
      return 'bg-gray-400 text-white';
    default:
      return null;
  }
};

export function FeedView({ entries, loading }: FeedViewProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-[var(--fc-border-gray)] shadow-sm p-6 animate-pulse"
          >
            <div className="h-4 bg-[var(--fc-subtle-gray)] rounded w-1/4 mb-4" />
            <div className="h-6 bg-[var(--fc-subtle-gray)] rounded w-3/4 mb-3" />
            <div className="h-4 bg-[var(--fc-subtle-gray)] rounded w-full mb-2" />
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
              className="bg-white rounded-2xl border border-[var(--fc-border-gray)] shadow-sm p-6"
            >
              <div className="flex items-start gap-3 mb-3">
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
                <h3 className="text-base font-medium text-[var(--fc-black)] mb-2">
                  {entry.title}
                </h3>
              )}

              {entry.content && (
                <p className="text-sm text-[var(--fc-body-gray)] mb-4 line-clamp-2">
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
  );
}
