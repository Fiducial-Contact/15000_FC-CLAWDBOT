'use client';

import { memo, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Wrench,
  Palette,
  Film,
  FileText,
  Cloud,
  Search,
  Globe,
  Terminal,
  Database,
  ChevronDown,
  Check,
  X,
  Loader2,
} from 'lucide-react';
import type { ToolExecutionStatus } from '@/lib/gateway/types';

const TOOL_ICONS: Record<string, typeof Wrench> = {
  'nano-banana-pro': Palette,
  'video-frames': Film,
  'summarize': FileText,
  'weather': Cloud,
  'web_search': Search,
  'search': Search,
  'browse': Globe,
  'bash': Terminal,
  'execute': Terminal,
  'database': Database,
  'query': Database,
};

function ToolIcon({ toolName, size, className }: { toolName: string; size: number; className?: string }) {
  const lowerName = toolName.toLowerCase();
  for (const [key, IconComponent] of Object.entries(TOOL_ICONS)) {
    if (lowerName.includes(key)) return <IconComponent size={size} className={className} />;
  }
  return <Wrench size={size} className={className} />;
}

function formatToolName(name: string): string {
  return name
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

interface ToolCardProps {
  toolName: string;
  parameters?: Record<string, unknown>;
  result?: unknown;
  status: ToolExecutionStatus;
  error?: string;
  isStreaming?: boolean;
}

export function ToolCardSkeleton() {
  return (
    <div className="rounded-xl border border-[var(--fc-border-gray)] bg-white overflow-hidden animate-pulse">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--fc-border-gray)]">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-[var(--fc-subtle-gray)]">
            <div className="w-4 h-4 bg-zinc-200 rounded" />
          </div>
          <div className="h-4 w-24 bg-zinc-200 rounded" />
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-[var(--fc-action-red)]/10">
          <Loader2 size={12} className="animate-spin text-[var(--fc-action-red)]" />
          <span className="text-xs font-medium text-[var(--fc-action-red)]">Working...</span>
        </div>
      </div>
      <div className="px-4 py-3">
        <div className="space-y-2">
          <div className="h-3 w-3/4 bg-zinc-100 rounded" />
          <div className="h-3 w-1/2 bg-zinc-100 rounded" />
        </div>
      </div>
    </div>
  );
}

export const ToolCard = memo(function ToolCard({
  toolName,
  parameters,
  result,
  status,
  error,
  isStreaming = false,
}: ToolCardProps) {
  const [showParams, setShowParams] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const displayName = formatToolName(toolName);

  const hasParams = parameters && Object.keys(parameters).length > 0;
  const hasResult = result !== undefined || error;
  const resultText = typeof result === 'string' ? result : result ? JSON.stringify(result, null, 2) : '';
  const previewText = useMemo(() => {
    if (!resultText) return '';
    const maxChars = 420;
    const maxLines = 8;
    const lines = resultText.split('\n');
    const trimmedLines = lines.slice(0, maxLines);
    let preview = trimmedLines.join('\n');
    if (preview.length > maxChars) {
      preview = preview.slice(0, maxChars).trimEnd();
    }
    const hasMore = lines.length > maxLines || resultText.length > preview.length;
    return hasMore ? `${preview}\n…` : preview;
  }, [resultText]);
  const hasMoreResult = resultText.length > previewText.length;

  const statusConfig = {
    running: {
      badge: 'Running',
      bgClass: 'bg-[var(--fc-action-red)]/10',
      textClass: 'text-[var(--fc-action-red)]',
      icon: <Loader2 size={12} className="animate-spin" />,
    },
    completed: {
      badge: 'Done',
      bgClass: 'bg-green-100',
      textClass: 'text-green-700',
      icon: <Check size={12} />,
    },
    failed: {
      badge: 'Failed',
      bgClass: 'bg-red-100',
      textClass: 'text-red-600',
      icon: <X size={12} />,
    },
  };

  const currentStatus = statusConfig[status];

  return (
    <div className="rounded-xl border border-[var(--fc-border-gray)] bg-white overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--fc-border-gray)]">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-[var(--fc-subtle-gray)]">
            <ToolIcon toolName={toolName} size={16} className="text-[var(--fc-body-gray)]" />
          </div>
          <span className="text-sm font-medium text-[var(--fc-black)]">
            {displayName}
          </span>
        </div>
        <div
          className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${currentStatus.bgClass} ${currentStatus.textClass}`}
        >
          {currentStatus.icon}
          {currentStatus.badge}
        </div>
      </div>

      {hasParams && (
        <div className="border-b border-[var(--fc-border-gray)]">
          <button
            onClick={() => setShowParams(!showParams)}
            className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-[var(--fc-subtle-gray)]/50 transition-colors"
          >
            <span className="text-xs font-medium text-[var(--fc-light-gray)]">
              Parameters
            </span>
            <ChevronDown
              size={14}
              className={`text-[var(--fc-light-gray)] transition-transform duration-200 ${
                showParams ? 'rotate-180' : ''
              }`}
            />
          </button>
          <AnimatePresence initial={false}>
            {showParams && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden"
              >
                <pre className="px-4 pb-3 text-xs text-[var(--fc-body-gray)] font-mono overflow-x-auto">
                  {JSON.stringify(parameters, null, 2)}
                </pre>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {hasResult && (
        <div>
          <button
            onClick={() => setShowResult(!showResult)}
            className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-[var(--fc-subtle-gray)]/50 transition-colors"
          >
            <span className="text-xs font-medium text-[var(--fc-light-gray)]">
              {error ? 'Error' : 'Result'}
            </span>
            <ChevronDown
              size={14}
              className={`text-[var(--fc-light-gray)] transition-transform duration-200 ${
                showResult ? 'rotate-180' : ''
              }`}
            />
          </button>
          {!showResult && !error && previewText && (
            <div className="px-4 pb-3">
              <pre className="text-[11px] text-[var(--fc-body-gray)] font-mono bg-[var(--fc-subtle-gray)]/60 rounded-lg px-3 py-2 max-h-20 overflow-hidden">
                {previewText}
              </pre>
              {hasMoreResult && (
                <button
                  type="button"
                  onClick={() => setShowResult(true)}
                  className="mt-2 text-[11px] font-medium text-[var(--fc-action-red)] hover:underline"
                >
                  Show full result
                </button>
              )}
            </div>
          )}
          <AnimatePresence initial={false}>
            {showResult && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden"
              >
                {error ? (
                  <p className="px-4 pb-3 text-xs text-red-600">{error}</p>
                ) : (
                  <pre className="px-4 pb-3 text-xs text-[var(--fc-body-gray)] font-mono overflow-x-auto max-h-56 overflow-y-auto">
                    {resultText}
                    {isStreaming && (
                      <span className="inline-block w-1.5 h-4 bg-[var(--fc-action-red)] animate-pulse ml-0.5" />
                    )}
                  </pre>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
});
