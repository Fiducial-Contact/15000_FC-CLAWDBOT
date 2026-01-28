'use client';

import { motion, AnimatePresence } from 'motion/react';
import { Plus, MessageSquare, Trash2, PanelLeftClose, PanelLeft } from 'lucide-react';
import type { SessionEntry } from '@/lib/gateway/types';

interface ChatSidebarProps {
  sessions: SessionEntry[];
  currentSessionKey: string;
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

export function ChatSidebar({
  sessions,
  currentSessionKey,
  isOpen,
  onNewSession,
  onSelectSession,
  onDeleteSession,
  onToggle,
}: ChatSidebarProps) {
  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="h-full bg-white border-r border-[var(--fc-border-gray)] flex flex-col overflow-hidden"
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
                className="w-full flex items-center gap-2 px-4 py-2.5 bg-[var(--fc-action-red)] text-white rounded-lg hover:bg-[var(--fc-dark-red)] transition-colors font-medium"
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
                  {sessions.map((session) => {
                    const isActive = session.sessionKey === currentSessionKey;
                    return (
                      <motion.div
                        key={session.sessionKey}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="group relative"
                      >
                        <button
                          onClick={() => onSelectSession(session.sessionKey)}
                          className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                            isActive
                              ? 'bg-red-50 border border-[var(--fc-action-red)]'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <MessageSquare
                            size={18}
                            className={`mt-0.5 flex-shrink-0 ${
                              isActive ? 'text-[var(--fc-action-red)]' : 'text-[var(--fc-body-gray)]'
                            }`}
                          />
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm font-medium truncate ${
                                isActive ? 'text-[var(--fc-action-red)]' : 'text-[var(--fc-black)]'
                              }`}
                            >
                              {getSessionTitle(session)}
                            </p>
                            <p className="text-xs text-[var(--fc-body-gray)] mt-0.5">
                              {formatSessionDate(session.updatedAt)}
                            </p>
                          </div>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteSession(session.sessionKey);
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-100 rounded transition-all"
                          aria-label="Delete session"
                        >
                          <Trash2 size={14} className="text-red-500" />
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {!isOpen && (
        <button
          onClick={onToggle}
          className="fixed left-4 top-20 z-10 p-2 bg-white border border-[var(--fc-border-gray)] rounded-lg shadow-sm hover:shadow-md transition-shadow"
          aria-label="Open sidebar"
        >
          <PanelLeft size={20} className="text-[var(--fc-body-gray)]" />
        </button>
      )}
    </>
  );
}
