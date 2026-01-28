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
import type { LucideIcon } from 'lucide-react';
import type { ToolExecutionStatus } from '@/lib/gateway/types';

const TOOL_ICONS: Record<string, LucideIcon> = {
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

function getToolIcon(toolName: string): LucideIcon {
  const lowerName = toolName.toLowerCase();
  for (const [key, icon] of Object.entries(TOOL_ICONS)) {
    if (lowerName.includes(key)) return icon;
  }
  return Wrench;
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

export const ToolCard = memo(function ToolCard({
  toolName,
  parameters,
  result,
  status,
  error,
  isStreaming = false,
}: ToolCardProps) {
  const [showParams, setShowParams] = useState(false);
  const [showResult, setShowResult] = useState(status === 'completed' || status === 'failed');

  const Icon = useMemo(() => getToolIcon(toolName), [toolName]);
  const displayName = useMemo(() => formatToolName(toolName), [toolName]);

  const hasParams = parameters && Object.keys(parameters).length > 0;
  const hasResult = result !== undefined || error;

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
            <Icon size={16} className="text-[var(--fc-body-gray)]" />
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
                  <pre className="px-4 pb-3 text-xs text-[var(--fc-body-gray)] font-mono overflow-x-auto max-h-48 overflow-y-auto">
                    {typeof result === 'string'
                      ? result
                      : JSON.stringify(result, null, 2)}
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
