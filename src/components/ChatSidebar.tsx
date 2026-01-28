'use client';

import { memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, MessageSquare, Trash2, PanelLeftClose, PanelLeft, Pin } from 'lucide-react';
import type { SessionEntry } from '@/lib/gateway/types';

interface ChatSidebarProps {
  sessions: SessionEntry[];
  currentSessionKey: string;
  mainSessionKey: string;
  isOpen: boolean;
  onNewSession: () => void;
  onSelectSession: (sessionKey: string) => void;
  onDeleteSession: (sessionKey: string) => void;
  onToggle: () => void;
}

function getSessionTitle(session: SessionEntry): string {
  if (session.displayName) return session.displayName;
  if (!session.sessionKey) return 'Chat';
  const parts = session.sessionKey.split(':');
  const lastPart = parts[parts.length - 1];
  if (lastPart?.includes('-')) {
    return `Chat ${lastPart.slice(0, 8)}`;
  }
  return 'Main Chat';
}

function formatSessionDate(dateStr?: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}

export const ChatSidebar = memo(function ChatSidebar({
  sessions,
  currentSessionKey,
  mainSessionKey,
  isOpen,
  onNewSession,
  onSelectSession,
  onDeleteSession,
  onToggle,
}: ChatSidebarProps) {
  const { mainSession, otherSessions } = useMemo(() => {
    const main = sessions.find((s) => s.sessionKey === mainSessionKey);
    const others = sessions.filter((s) => s.sessionKey !== mainSessionKey);
    return { mainSession: main, otherSessions: others };
  }, [sessions, mainSessionKey]);

  const renderSession = (session: SessionEntry, isPinned: boolean) => {
    const isActive = session.sessionKey === currentSessionKey;
    return (
      <motion.div
        key={session.sessionKey}
        initial={{ opacity: 0, x: -5 }}
        animate={{ opacity: 1, x: 0 }}
        className="group relative px-2"
      >
        <button
          onClick={() => onSelectSession(session.sessionKey)}
          className={`w-full flex items-start gap-3 px-3 py-3 rounded-lg text-left transition-all duration-200 ${isActive
            ? 'bg-[var(--fc-subtle-gray)]'
            : 'hover:bg-[var(--fc-off-white)]'
            }`}
        >
          <div className={`mt-0.5 flex-shrink-0 transition-colors ${isActive ? 'text-[var(--fc-black)]' : 'text-[var(--fc-light-gray)] group-hover:text-[var(--fc-body-gray)]'}`}>
            {isPinned ? <Pin size={16} /> : <MessageSquare size={16} />}
          </div>

          <div className="flex-1 min-w-0">
            <p
              className={`text-[13px] truncate transition-colors ${isActive ? 'font-semibold text-[var(--fc-black)]' : 'font-medium text-[var(--fc-body-gray)] group-hover:text-[var(--fc-black)]'
                }`}
            >
              {getSessionTitle(session)}
            </p>
            <p className="text-[11px] text-[var(--fc-light-gray)] mt-1 truncate group-hover:text-[var(--fc-body-gray)] transition-colors">
              {formatSessionDate(session.updatedAt)}
            </p>
          </div>

          {isActive && (
            <motion.div
              layoutId="active-indicator"
              className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-[var(--fc-action-red)] rounded-r-sm"
            />
          )}
        </button>
        {!isPinned && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteSession(session.sessionKey);
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 opacity-0 group-hover:opacity-100 hover:bg-gray-200 rounded-md transition-all text-[var(--fc-light-gray)] hover:text-red-600"
            aria-label="Delete session"
          >
            <Trash2 size={14} />
          </button>
        )}
      </motion.div>
    );
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="h-full bg-white border-r border-[var(--fc-border-gray)] flex flex-col overflow-hidden shadow-[var(--shadow-sm)]"
          >
            <div className="p-4 border-b border-[var(--fc-border-gray)] flex items-center justify-between">
              <h2 className="text-base font-semibold text-[var(--fc-black)]">Chats</h2>
              <button
                onClick={onToggle}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close sidebar"
              >
                <PanelLeftClose size={18} className="text-[var(--fc-body-gray)]" />
              </button>
            </div>

            <div className="p-3">
              <button
                onClick={onNewSession}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[var(--fc-black)] text-white rounded-lg hover:bg-[var(--fc-charcoal)] transition-all font-medium text-[14px] shadow-[var(--shadow-sm)] active:scale-[0.98]"
              >
                <Plus size={18} />
                New Chat
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-2 pb-4">
              {sessions.length === 0 ? (
                <p className="text-center text-sm text-[var(--fc-body-gray)] py-8">
                  No conversations yet
                </p>
              ) : (
                <div className="space-y-1">
                  {mainSession && renderSession(mainSession, true)}

                  {otherSessions.length > 0 && mainSession && (
                    <div className="border-t border-[var(--fc-border-gray)] my-2" />
                  )}

                  {otherSessions.map((session) => renderSession(session, false))}
                </div>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {!isOpen && (
        <button
          onClick={onToggle}
          className="fixed left-4 top-20 z-10 p-2 bg-white border border-[var(--fc-border-gray)] rounded-xl shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-md)] transition-shadow"
          aria-label="Open sidebar"
        >
          <PanelLeft size={20} className="text-[var(--fc-body-gray)]" />
        </button>
      )}
    </>
  );
});
