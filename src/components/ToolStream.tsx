'use client';

import { motion, AnimatePresence } from 'motion/react';
import { ToolCard } from '@/components/ToolCard';
import type { ToolEventPayload } from '@/lib/gateway/types';

interface ToolStreamProps {
  activeTools: Map<string, ToolEventPayload>;
  isLoading: boolean;
  showDetails: boolean;
}

const springTransition = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 30,
};

export function ToolStream({ activeTools, isLoading, showDetails }: ToolStreamProps) {
  const tools = Array.from(activeTools.values());
  const showPlaceholder = isLoading && tools.length === 0;

  if (!showDetails) return null;
  if (!showPlaceholder && tools.length === 0) return null;

  return (
    <motion.div
      className="space-y-2 pl-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <AnimatePresence mode="wait" initial={false}>
        {showPlaceholder ? (
          <motion.div
            key="placeholder"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4, transition: { duration: 0.15 } }}
            transition={springTransition}
          >
            <ToolCard toolName="Tools" status="running" isPlaceholder />
          </motion.div>
        ) : (
          <motion.div
            key="tools"
            className="space-y-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {tools.map((tool, index) => (
              <motion.div
                key={tool.toolCallId}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  ...springTransition,
                  delay: index * 0.05,
                }}
              >
                <ToolCard
                  toolName={tool.toolName}
                  parameters={tool.parameters}
                  result={tool.output}
                  status={tool.phase === 'end' ? (tool.error ? 'failed' : 'completed') : 'running'}
                  error={tool.error}
                  isStreaming={tool.phase !== 'end'}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
