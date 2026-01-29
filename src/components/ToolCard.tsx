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
  isPlaceholder?: boolean;
}

export const ToolCard = memo(function ToolCard({
  toolName,
  parameters,
  result,
  status,
  error,
  isStreaming = false,
  isPlaceholder = false,
}: ToolCardProps) {
  const [showParams, setShowParams] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const displayName = isPlaceholder ? 'Working...' : formatToolName(toolName);
  const isRunning = status === 'running';

  const hasParams = !isPlaceholder && parameters && Object.keys(parameters).length > 0;
  const hasResult = !isPlaceholder && (result !== undefined || error);
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
      badgeClass: 'bg-[var(--fc-action-red)]/10 text-[var(--fc-action-red)]',
      icon: <Loader2 size={11} className="animate-spin" />,
    },
    completed: {
      badge: 'Done',
      badgeClass: 'bg-emerald-50 text-emerald-600',
      icon: <Check size={11} />,
    },
    failed: {
      badge: 'Failed',
      badgeClass: 'bg-red-50 text-red-500',
      icon: <X size={11} />,
    },
  };

  const currentStatus = statusConfig[status];

  return (
    <div
      className={`rounded-lg border bg-white overflow-hidden transition-all duration-300 ${
        isRunning
          ? 'border-[var(--fc-action-red)]/30 shadow-[0_0_0_1px_rgba(190,30,44,0.1)]'
          : 'border-[var(--fc-border-gray)]'
      }`}
    >
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2">
          {!isPlaceholder && (
            <div className="p-1 rounded-md bg-[var(--fc-subtle-gray)]">
              <ToolIcon toolName={toolName} size={14} className="text-[var(--fc-body-gray)]" />
            </div>
          )}
          {isPlaceholder ? (
            <div className="flex items-center gap-2">
              <motion.div
                className="w-3 h-3 rounded-full bg-[var(--fc-action-red)]/20"
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              />
              <span className="text-sm text-[var(--fc-light-gray)]">{displayName}</span>
            </div>
          ) : (
            <span className="text-sm font-medium text-[var(--fc-black)]">{displayName}</span>
          )}
        </div>
        {!isPlaceholder && (
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${currentStatus.badgeClass}`}>
            {currentStatus.icon}
            <span>{currentStatus.badge}</span>
          </div>
        )}
      </div>

      {isPlaceholder && (
        <div className="px-3 pb-3">
          <div className="space-y-2">
            {[0.6, 0.45].map((width, i) => (
              <motion.div
                key={i}
                className="h-2 rounded bg-[var(--fc-subtle-gray)]"
                animate={{ opacity: [0.4, 0.7, 0.4] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
                style={{ width: `${width * 100}%` }}
              />
            ))}
          </div>
        </div>
      )}

      {hasParams && (
        <div className="border-t border-[var(--fc-border-gray)]">
          <button
            onClick={() => setShowParams(!showParams)}
            className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-[var(--fc-subtle-gray)]/50 transition-colors"
          >
            <span className="text-[11px] font-medium text-[var(--fc-light-gray)]">Parameters</span>
            <ChevronDown
              size={12}
              className={`text-[var(--fc-light-gray)] transition-transform duration-200 ${showParams ? 'rotate-180' : ''}`}
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
                <pre className="px-3 pb-2.5 text-[11px] text-[var(--fc-body-gray)] font-mono overflow-x-auto">
                  {JSON.stringify(parameters, null, 2)}
                </pre>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {hasResult && (
        <div className="border-t border-[var(--fc-border-gray)]">
          <button
            onClick={() => setShowResult(!showResult)}
            className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-[var(--fc-subtle-gray)]/50 transition-colors"
          >
            <span className="text-[11px] font-medium text-[var(--fc-light-gray)]">{error ? 'Error' : 'Result'}</span>
            <ChevronDown
              size={12}
              className={`text-[var(--fc-light-gray)] transition-transform duration-200 ${showResult ? 'rotate-180' : ''}`}
            />
          </button>
          {!showResult && !error && previewText && (
            <div className="px-3 pb-2.5">
              <pre className="text-[10px] text-[var(--fc-body-gray)] font-mono bg-[var(--fc-subtle-gray)]/50 rounded-md px-2.5 py-1.5 max-h-16 overflow-hidden">
                {previewText}
              </pre>
              {hasMoreResult && (
                <button
                  type="button"
                  onClick={() => setShowResult(true)}
                  className="mt-1.5 text-[10px] font-medium text-[var(--fc-action-red)] hover:underline"
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
                  <p className="px-3 pb-2.5 text-[11px] text-red-600">{error}</p>
                ) : (
                  <pre className="px-3 pb-2.5 text-[11px] text-[var(--fc-body-gray)] font-mono overflow-x-auto max-h-48 overflow-y-auto">
                    {resultText}
                    {isStreaming && (
                      <span className="inline-block w-1 h-3 bg-[var(--fc-action-red)] animate-pulse ml-0.5" />
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
