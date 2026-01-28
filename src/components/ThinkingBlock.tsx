'use client';

import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ChevronDown } from 'lucide-react';

interface ThinkingBlockProps {
  text: string;
  isStreaming?: boolean;
  defaultExpanded?: boolean;
}

export const ThinkingBlock = memo(function ThinkingBlock({
  text,
  isStreaming = false,
  defaultExpanded = false,
}: ThinkingBlockProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded || isStreaming);

  return (
    <div className="rounded-xl border border-[var(--fc-border-gray)] bg-[var(--fc-subtle-gray)] overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-black/[.02] transition-colors"
      >
        <div className="flex items-center gap-2 text-[var(--fc-light-gray)]">
          <Sparkles
            size={16}
            className={isStreaming ? 'animate-pulse text-[var(--fc-action-red)]' : ''}
          />
          <span className="text-sm font-medium">
            {isStreaming ? 'Thinking...' : 'Thought process'}
          </span>
        </div>
        <ChevronDown
          size={16}
          className={`text-[var(--fc-light-gray)] transition-transform duration-200 ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1">
              <p className="text-sm text-[var(--fc-light-gray)] italic opacity-75 whitespace-pre-wrap">
                {text}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
