'use client';

import { memo, useMemo, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  MessageSquare,
  Trash2,
  PanelLeftClose,
  PanelLeft,
  Pin,
  PinOff,
  History,
} from 'lucide-react';

import type { SessionEntry, ToolEventPayload } from '@/lib/gateway/types';

type SessionListEntry = SessionEntry & {
  resetAt?: string;
};

const DEFAULT_MAIN_TITLE = 'Main Chat';
const DEFAULT_NEW_TITLE = 'New Chat';
const RESET_TITLE_WINDOW_MS = 60 * 60 * 1000;
const GENERATED_SESSION_ID_REGEX = /^\\d{10,}-[a-z0-9]{3,}$/i;

export interface AgentStatusProps {
  isConnected: boolean;
  isLoading: boolean;
  activeTools: Map<string, ToolEventPayload>;
  currentSession: SessionEntry | undefined;
  lastThinking: string | null;
}

interface ChatSidebarProps {
  sessions: SessionListEntry[];
  currentSessionKey: string;
  mainSessionKey: string;
  pinnedSessionKeys: string[];
  isOpen: boolean;
  onNewSession: () => void;
  onSelectSession: (sessionKey: string) => void;
  onDeleteSession: (sessionKey: string) => void;
  onTogglePin: (sessionKey: string) => void;
  onToggle: () => void;
  agentStatus?: AgentStatusProps;
}

interface TooltipProps {
  children: React.ReactNode;
  content: string;
  position?: 'top' | 'right' | 'bottom' | 'left';
  delay?: number;
}

// Tooltip Component for enhanced UX
const Tooltip = memo(function Tooltip({
  children,
  content,
  position = 'right',
  delay = 300,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showTimeout, setShowTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleMouseEnter = useCallback(() => {
    const timeout = setTimeout(() => setIsVisible(true), delay);
    setShowTimeout(timeout);
  }, [delay]);

  const handleMouseLeave = useCallback(() => {
    if (showTimeout) clearTimeout(showTimeout);
    setIsVisible(false);
  }, [showTimeout]);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  };

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
            className={`absolute z-50 px-2.5 py-1.5 bg-[var(--fc-black)] text-white text-xs rounded-lg whitespace-nowrap pointer-events-none ${positionClasses[position]}`}
          >
            {content}
            <div
              className={`absolute w-1.5 h-1.5 bg-[var(--fc-black)] rotate-45 ${position === 'right'
                ? 'left-0 top-1/2 -translate-x-1/2 -translate-y-1/2'
                : position === 'left'
                  ? 'right-0 top-1/2 translate-x-1/2 -translate-y-1/2'
                  : position === 'top'
                    ? 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2'
                    : 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2'
                }`}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

function getSessionTitle(session: SessionListEntry): string {
  let baseTitle = session.displayName || '';
  if (baseTitle === 'fc-team-chat') {
    baseTitle = '';
  }
  if (!baseTitle) {
    if (!session.sessionKey) return DEFAULT_NEW_TITLE;
    const sessionId = typeof session.sessionId === 'string' ? session.sessionId : '';
    if (sessionId && GENERATED_SESSION_ID_REGEX.test(sessionId)) {
      const randomPart = sessionId.split('-')[1] || '';
      baseTitle = `Chat ${randomPart.slice(0, 6)}`;
    } else if (sessionId) {
      // Most likely the pinned/main session (sessionId is a stable user id).
      baseTitle = DEFAULT_MAIN_TITLE;
    } else {
      // Stable, unique-ish fallback derived from the session key.
      const keySuffix = session.sessionKey.replace(/[^a-z0-9]/gi, '').slice(-6);
      baseTitle = keySuffix ? `Chat ${keySuffix}` : DEFAULT_NEW_TITLE;
    }
  }

  if (session.resetAt) {
    const resetTime = new Date(session.resetAt).getTime();
    if (!Number.isNaN(resetTime) && Date.now() - resetTime < RESET_TITLE_WINDOW_MS) {
      return `Reset: ${baseTitle}`;
    }
  }

  return baseTitle;
}

function formatSessionDate(dateStr?: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '';
  const now = new Date();
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const startOfNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((startOfNow.getTime() - startOfDate.getTime()) / MS_PER_DAY);

  // Treat future/skewed timestamps as "today" for display purposes.
  if (diffDays <= 0) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function groupSessionsByDate(sessions: SessionListEntry[]) {
  const groups: { label: string; sessions: SessionListEntry[] }[] = [];
  const today: SessionListEntry[] = [];
  const yesterday: SessionListEntry[] = [];
  const previous: SessionListEntry[] = [];

  sessions.forEach((session) => {
    const sessionTimestamp = session.updatedAt || session.createdAt;
    if (!sessionTimestamp) {
      previous.push(session);
      return;
    }
    const date = new Date(sessionTimestamp);
    if (Number.isNaN(date.getTime())) {
      previous.push(session);
      return;
    }
    const now = new Date();
    const MS_PER_DAY = 24 * 60 * 60 * 1000;
    const startOfNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffDays = Math.round((startOfNow.getTime() - startOfDate.getTime()) / MS_PER_DAY);

    if (diffDays <= 0) today.push(session);
    else if (diffDays === 1) yesterday.push(session);
    else previous.push(session);
  });

  if (today.length > 0) groups.push({ label: 'Today', sessions: today });
  if (yesterday.length > 0) groups.push({ label: 'Yesterday', sessions: yesterday });
  if (previous.length > 0) groups.push({ label: 'Previous', sessions: previous });

  return groups;
}

// Confirmation Dialog Component
interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog = memo(function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onCancel}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
        className="bg-white rounded-2xl shadow-2xl p-6 mx-4 max-w-sm w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <Trash2 size={18} className="text-[var(--fc-action-red)]" />
          </div>
          <h3 className="text-[16px] font-semibold text-[var(--fc-black)]">{title}</h3>
        </div>
        <p className="text-[14px] text-[var(--fc-body-gray)] mb-6 leading-relaxed">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 text-[13px] font-medium text-[var(--fc-body-gray)] bg-[var(--fc-subtle-gray)] rounded-xl hover:bg-[var(--fc-border-gray)] transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 text-[13px] font-medium text-white bg-[var(--fc-action-red)] rounded-xl hover:bg-[#c41922] transition-colors shadow-md"
          >
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
});

// Empty State Component
const EmptyState = memo(function EmptyState({ onNewSession }: { onNewSession: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className="flex flex-col items-center justify-center py-12 px-6 text-center"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--fc-subtle-gray)] to-[var(--fc-border-gray)] flex items-center justify-center mb-4"
      >
        <History size={28} className="text-[var(--fc-light-gray)]" />
      </motion.div>
      <h3 className="text-[15px] font-semibold text-[var(--fc-black)] mb-2">
        No conversations yet
      </h3>
      <p className="text-[13px] text-[var(--fc-body-gray)] mb-5 max-w-[200px]">
        Start a new chat to begin your conversation
      </p>
      <motion.button
        onClick={onNewSession}
        className="flex items-center gap-2 px-4 py-2 bg-[var(--fc-black)] text-white rounded-xl text-[13px] font-medium shadow-md hover:shadow-lg transition-shadow"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Plus size={16} />
        Start New Chat
      </motion.button>
    </motion.div>
  );
});

// Icon Rail Mode for collapsed sidebar
const IconRail = memo(function IconRail({
  sessions,
  currentSessionKey,
  mainSessionKey,
  pinnedSessionKeys,
  onNewSession,
  onSelectSession,
  onToggle,
  agentStatus,
}: {
  sessions: SessionListEntry[];
  currentSessionKey: string;
  mainSessionKey: string;
  pinnedSessionKeys: string[];
  onNewSession: () => void;
  onSelectSession: (sessionKey: string) => void;
  onToggle: () => void;
  agentStatus?: AgentStatusProps;
}) {
  const recentSessions = useMemo(() => {
    const pinnedSet = new Set(pinnedSessionKeys);
    const pinned = sessions.filter(
      (s) => s.sessionKey !== mainSessionKey && pinnedSet.has(s.sessionKey)
    );
    const others = sessions.filter(
      (s) => s.sessionKey !== mainSessionKey && !pinnedSet.has(s.sessionKey)
    );
    return [...pinned, ...others].slice(0, 5);
  }, [sessions, mainSessionKey, pinnedSessionKeys]);

  const mainSession = useMemo(() => {
    return sessions.find((s) => s.sessionKey === mainSessionKey);
  }, [sessions, mainSessionKey]);

  return (
    <motion.div
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 72, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
      className="h-full bg-[#f9f9f9] border-r border-[var(--fc-border-gray)] flex flex-col items-center py-4 overflow-hidden"
    >
      {/* Toggle Button */}
      <Tooltip content="Expand sidebar (⌘K)" position="right">
        <button
          onClick={onToggle}
          className="p-2.5 mb-4 hover:bg-[var(--fc-subtle-gray)] rounded-xl transition-all duration-200 group"
          aria-label="Expand sidebar"
        >
          <PanelLeft size={20} className="text-[var(--fc-body-gray)] group-hover:text-[var(--fc-black)] transition-colors" />
        </button>
      </Tooltip>

      {/* New Chat Button */}
      <Tooltip content="New chat" position="right">
        <button
          onClick={onNewSession}
          className="w-11 h-11 mb-4 flex items-center justify-center bg-[var(--fc-black)] text-white rounded-xl hover:bg-[var(--fc-charcoal)] transition-all shadow-md hover:shadow-lg"
          aria-label="New chat"
        >
          <Plus size={20} />
        </button>
      </Tooltip>

      <div className="w-8 h-px bg-[var(--fc-border-gray)] my-2" />

      {/* Main Session */}
      {mainSession && (
        <Tooltip content={getSessionTitle(mainSession)} position="right">
          <button
            onClick={() => onSelectSession(mainSession.sessionKey)}
            className={`relative w-11 h-11 mb-2 flex items-center justify-center rounded-xl transition-all duration-200 ${currentSessionKey === mainSession.sessionKey
              ? 'bg-[var(--fc-black)] text-white shadow-md'
              : 'hover:bg-[var(--fc-subtle-gray)] text-[var(--fc-body-gray)]'
              }`}
            aria-label={getSessionTitle(mainSession)}
            aria-current={currentSessionKey === mainSession.sessionKey ? 'page' : undefined}
          >
            <Pin size={18} />
            {(mainSession.unreadCount || 0) > 0 && currentSessionKey !== mainSession.sessionKey && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-[var(--fc-action-red)] text-white text-[10px] font-bold rounded-full shadow-sm">
                {(mainSession.unreadCount || 0) > 99 ? '99+' : mainSession.unreadCount}
              </span>
            )}
          </button>
        </Tooltip>
      )}

      {/* Recent Sessions */}
      <div className="flex-1 overflow-y-auto w-full px-2.5 space-y-2 scrollbar-thin">
        {recentSessions.map((session) => (
          <Tooltip key={session.sessionKey} content={getSessionTitle(session)} position="right">
            <button
              onClick={() => onSelectSession(session.sessionKey)}
              className={`relative w-full aspect-square flex items-center justify-center rounded-xl transition-all duration-200 ${currentSessionKey === session.sessionKey
                ? 'bg-[var(--fc-black)] text-white shadow-md'
                : 'hover:bg-[var(--fc-subtle-gray)] text-[var(--fc-body-gray)]'
                }`}
              aria-label={getSessionTitle(session)}
              aria-current={currentSessionKey === session.sessionKey ? 'page' : undefined}
            >
              {pinnedSessionKeys.includes(session.sessionKey) ? (
                <Pin size={18} />
              ) : (
                <MessageSquare size={18} />
              )}
              {(session.unreadCount || 0) > 0 && currentSessionKey !== session.sessionKey && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-[var(--fc-action-red)] text-white text-[10px] font-bold rounded-full shadow-sm">
                  {(session.unreadCount || 0) > 99 ? '99+' : session.unreadCount}
                </span>
              )}
            </button>
          </Tooltip>
        ))}
      </div>

      {/* Agent Status Dot */}
      {agentStatus && (
        <Tooltip content={agentStatus.isConnected ? 'Agent connected' : 'Agent disconnected'} position="right">
          <div className="flex justify-center py-3 border-t border-[var(--fc-border-gray)]">
            <span className="relative flex h-3 w-3">
              {agentStatus.isLoading && agentStatus.isConnected && (
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
              )}
              <span className={`relative inline-flex rounded-full h-3 w-3 ${!agentStatus.isConnected ? 'bg-[var(--fc-action-red)]' :
                  agentStatus.isLoading ? 'bg-emerald-500 animate-pulse' :
                    'bg-emerald-500'
                }`} />
            </span>
          </div>
        </Tooltip>
      )}
    </motion.div>
  );
});

export const ChatSidebar = memo(function ChatSidebar({
  sessions,
  currentSessionKey,
  mainSessionKey,
  pinnedSessionKeys,
  isOpen,
  onNewSession,
  onSelectSession,
  onDeleteSession,
  onTogglePin,
  onToggle,
  agentStatus,
}: ChatSidebarProps) {
  const [isIconRail, setIsIconRail] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<SessionListEntry | null>(null);

  const handleDeleteClick = useCallback((session: SessionListEntry) => {
    setSessionToDelete(session);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (sessionToDelete) {
      onDeleteSession(sessionToDelete.sessionKey);
      setSessionToDelete(null);
    }
  }, [sessionToDelete, onDeleteSession]);

  const handleCancelDelete = useCallback(() => {
    setSessionToDelete(null);
  }, []);

  const { mainSession, pinnedSessions, otherSessions } = useMemo(() => {
    const pinnedSet = new Set(pinnedSessionKeys);
    const main = sessions.find((s) => s.sessionKey === mainSessionKey);
    const pinned = sessions
      .filter((s) => s.sessionKey !== mainSessionKey && pinnedSet.has(s.sessionKey))
      .sort((a, b) => {
        const aTime = Date.parse(a.updatedAt || a.createdAt || '') || 0;
        const bTime = Date.parse(b.updatedAt || b.createdAt || '') || 0;
        return bTime - aTime;
      });
    const others = sessions.filter(
      (s) => s.sessionKey !== mainSessionKey && !pinnedSet.has(s.sessionKey)
    );
    return { mainSession: main, pinnedSessions: pinned, otherSessions: others };
  }, [sessions, mainSessionKey, pinnedSessionKeys]);

  const groupedSessions = useMemo(() => groupSessionsByDate(otherSessions), [otherSessions]);

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ⌘K or Ctrl+K to toggle sidebar
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onToggle();
      }
      // Escape to close sidebar
      if (e.key === 'Escape' && isOpen) {
        onToggle();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onToggle]);

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024 && window.innerWidth >= 768) {
        setIsIconRail(true);
      } else if (window.innerWidth < 768) {
        setIsIconRail(false);
      } else {
        setIsIconRail(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const renderSession = (session: SessionListEntry, mode: 'main' | 'pinned' | 'regular') => {
    const isMain = mode === 'main';
    const isPinned = mode !== 'regular';
    const isActive = session.sessionKey === currentSessionKey;
    const unreadCount = session.unreadCount || 0;
    const sessionTimestamp = session.updatedAt || session.createdAt;
    return (
      <motion.div
        key={session.sessionKey}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -10 }}
        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
        className="group relative"
      >
        <div
          role="button"
          tabIndex={0}
          onClick={() => onSelectSession(session.sessionKey)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onSelectSession(session.sessionKey);
            }
          }}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 ease-out cursor-pointer ${isActive
            ? 'bg-[var(--fc-black)] text-white shadow-md selection:bg-white/30 selection:text-white'
            : 'text-[var(--fc-dark-gray)] hover:bg-[var(--fc-subtle-gray)] hover:text-[var(--fc-black)]'
            }`}
          aria-label={getSessionTitle(session)}
          aria-current={isActive ? 'page' : undefined}
        >
          <div
            className={`flex-shrink-0 transition-colors duration-150 ${isActive ? 'text-white' : 'text-[var(--fc-body-gray)] group-hover:text-[var(--fc-dark-gray)]'
              }`}
          >
            {isPinned ? <Pin size={15} /> : <MessageSquare size={15} />}
          </div>

          <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <p
                className={`text-[13px] truncate font-medium transition-colors duration-150 ${isActive ? 'text-white' : 'text-[var(--fc-black)]'
                  } ${unreadCount > 0 && !isActive ? 'font-semibold' : ''}`}
              >
                {getSessionTitle(session)}
              </p>
              {unreadCount > 0 && !isActive && (
                <span className="flex-shrink-0 min-w-[18px] h-[18px] px-1.5 flex items-center justify-center bg-[var(--fc-action-red)] text-white text-[10px] font-bold rounded-full shadow-sm">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <span
                className={`text-[10px] transition-all duration-150 ${isActive ? 'text-white/60' : 'text-[var(--fc-light-gray)]'
                  } ${!isMain ? 'group-hover:hidden' : ''}`}
              >
                {formatSessionDate(sessionTimestamp)}
              </span>
              {!isMain && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onTogglePin(session.sessionKey);
                  }}
                  className={`p-0.5 rounded transition-all duration-150 opacity-60 hover:opacity-100 ${isActive
                    ? 'text-white/90 hover:text-white'
                    : isPinned
                      ? 'text-[var(--fc-black)] hover:text-[var(--fc-black)]'
                      : 'text-[var(--fc-body-gray)] hover:text-[var(--fc-black)]'
                    }`}
                  aria-label={isPinned ? 'Unpin conversation' : 'Pin conversation'}
                  title={isPinned ? 'Unpin conversation' : 'Pin conversation'}
                >
                  {isPinned ? <PinOff size={12} /> : <Pin size={12} />}
                </button>
              )}
              {!isMain && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteClick(session);
                  }}
                  className={`p-0.5 rounded hidden group-hover:block transition-all duration-150 ${isActive
                    ? 'text-white/90 hover:text-white'
                    : 'text-[var(--fc-body-gray)] hover:text-[var(--fc-action-red)]'
                    }`}
                  aria-label="Delete conversation"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  // Icon Rail Mode (for tablet-sized screens)
  if (!isOpen && isIconRail) {
    return (
      <IconRail
        sessions={sessions}
        currentSessionKey={currentSessionKey}
        mainSessionKey={mainSessionKey}
        pinnedSessionKeys={pinnedSessionKeys}
        onNewSession={onNewSession}
        onSelectSession={onSelectSession}
        onToggle={onToggle}
        agentStatus={agentStatus}
      />
    );
  }

  return (
    <>
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className="h-full bg-[#f9f9f9] border-r border-[var(--fc-border-gray)] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 px-5 py-5 flex items-center justify-between bg-[#f9f9f9]/80 backdrop-blur-md border-b border-transparent transition-colors duration-200">
              <h2 className="text-[18px] font-bold tracking-tight text-[var(--fc-black)] font-[family-name:var(--font-manrope)]">
                Chat History
              </h2>
              <Tooltip content="Close sidebar (⌘K)" position="bottom" delay={200}>
                <button
                  onClick={onToggle}
                  className="p-1.5 hover:bg-[var(--fc-subtle-gray)] rounded-lg transition-all duration-200 focus:outline-none group opacity-60 hover:opacity-100"
                  aria-label="Close sidebar"
                >
                  <PanelLeftClose size={16} className="text-[var(--fc-black)]" />
                </button>
              </Tooltip>
            </div>

            {/* New Chat Button */}
            <div className="px-5 pb-4 pt-3">
              <motion.button
                onClick={onNewSession}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[var(--fc-black)] text-white rounded-xl hover:bg-[var(--fc-charcoal)] transition-all duration-200 font-medium text-[13px] shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[var(--fc-black)] focus:ring-offset-2"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
              >
                <Plus size={16} />
                New Chat
              </motion.button>
            </div>

            {/* Sessions List - Enhanced scrollable area with custom scrollbar */}
            <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-5 scrollbar-thin scrollbar-thumb-[var(--fc-border-gray)] scrollbar-track-transparent hover:scrollbar-thumb-[var(--fc-light-gray)]">
              {sessions.length === 0 ? (
                <EmptyState onNewSession={onNewSession} />
              ) : (
                <>
                  {/* Pinned Sessions */}
                  {(mainSession || pinnedSessions.length > 0) && (
                    <div className="space-y-1">
                      <p className="text-[11px] font-semibold text-[var(--fc-body-gray)] uppercase tracking-wider px-3 mb-2">
                        Pinned
                      </p>
                      <AnimatePresence mode="popLayout">
                        {mainSession && renderSession(mainSession, 'main')}
                        {pinnedSessions.map((session) => renderSession(session, 'pinned'))}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Grouped Sessions */}
                  {groupedSessions.map((group) => (
                    <div key={group.label} className="space-y-1">
                      <p className="text-[11px] font-semibold text-[var(--fc-body-gray)] uppercase tracking-wider px-3 mb-2">
                        {group.label}
                      </p>
                      <AnimatePresence mode="popLayout">
                        {group.sessions.map((session) => renderSession(session, 'regular'))}
                      </AnimatePresence>
                    </div>
                  ))}
                </>
              )}
            </div>



            {/* Footer - Enhanced with keyboard shortcut hint */}
            <div className="px-4 py-3 border-t border-[var(--fc-border-gray)] bg-[var(--fc-subtle-gray)]/50">
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-[var(--fc-light-gray)]">
                  <kbd className="px-1.5 py-0.5 bg-white border border-[var(--fc-border-gray)] rounded text-[9px] font-mono text-[var(--fc-body-gray)]">
                    ⌘K
                  </kbd>
                  {' '}to toggle
                </p>
                <p className="text-[10px] text-[var(--fc-light-gray)]">
                  {sessions.length} chat{sessions.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Toggle button when closed - Enhanced with tooltip */}
      {!isOpen && !isIconRail && (
        <Tooltip content="Open sidebar (⌘K)" position="right">
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={onToggle}
            className="fixed left-4 top-32 z-50 p-2.5 bg-white border border-[var(--fc-border-gray)] rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--fc-border-gray)]"
            aria-label="Open sidebar"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <PanelLeft size={20} className="text-[var(--fc-body-gray)]" />
          </motion.button>
        </Tooltip>
      )}

      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {sessionToDelete && (
          <ConfirmDialog
            isOpen={!!sessionToDelete}
            title="Delete conversation?"
            message={`Are you sure you want to delete "${getSessionTitle(sessionToDelete)}"? This action cannot be undone.`}
            confirmLabel="Delete"
            cancelLabel="Cancel"
            onConfirm={handleConfirmDelete}
            onCancel={handleCancelDelete}
          />
        )}
      </AnimatePresence>
    </>
  );
});
