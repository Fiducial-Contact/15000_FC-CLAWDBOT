'use client';

import { motion } from 'motion/react';
import { Bot } from 'lucide-react';

interface ChatMessageProps {
  content: string;
  role: 'user' | 'assistant';
  timestamp?: string;
}

export function ChatMessage({ content, role, timestamp }: ChatMessageProps) {
  const isUser = role === 'user';

  return (
    <motion.div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className={`max-w-[85%] md:max-w-[75%] ${isUser ? 'order-2' : 'order-1'}`}>
        {!isUser && (
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--fc-red)] to-[var(--fc-action-red)] flex items-center justify-center shadow-sm">
              <Bot size={14} className="text-white" />
            </div>
            <span className="text-xs font-medium text-[var(--fc-body-gray)]">
              AI Assistant
            </span>
          </div>
        )}

        <motion.div
          className={`px-4 py-3 rounded-2xl shadow-md ${
            isUser
              ? 'bg-[#e20613] rounded-br-md'
              : 'bg-white border border-[var(--fc-border-gray)] rounded-bl-md'
          }`}
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.15 }}
        >
          <p
            className="text-sm leading-relaxed whitespace-pre-wrap"
            style={{ color: isUser ? '#ffffff' : 'var(--fc-black)' }}
          >
            {content}
          </p>
        </motion.div>

        {timestamp && (
          <motion.span
            className={`text-[10px] text-[var(--fc-light-gray)] mt-1.5 block ${isUser ? 'text-right' : 'text-left'}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            {timestamp}
          </motion.span>
        )}
      </div>
    </motion.div>
  );
}
