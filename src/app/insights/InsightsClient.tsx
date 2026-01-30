'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, CalendarDays, ChevronDown, ExternalLink, Loader2, MessageSquare, ThumbsDown, ThumbsUp, Zap } from 'lucide-react';

import { createClient } from '@/lib/supabase/client';
import { useGateway } from '@/lib/gateway/useGateway';
import type { ChatContentBlock } from '@/lib/gateway/types';
import { Header } from '@/components/Header';
import { LoginModal } from '@/components/LoginModal';
import { ChangePasswordModal } from '@/components/ChangePasswordModal';
import { UserProfileModal } from '@/components/UserProfileModal';
import { createDefaultProfile } from '@/lib/profile';
import type { LearningEvent, UserProfile } from '@/lib/types/profile';
import { PixelRoom } from '@/components/PixelRoom';

type SessionTrace = {
  toolCalls: Array<{
    id: string;
    toolName: string;
    status?: string;
    summary?: string;
  }>;
  lastThinking?: string;
};

type SessionTraceState = {
  status: 'idle' | 'loading' | 'ready' | 'error';
  error?: string;
  trace?: SessionTrace;
};

type UserSignal = {
  id: string;
  user_id: string;
  signal_type: string;
  payload: unknown;
  session_key_hash: string | null;
  created_at: string;
};

function dimensionBadgeClasses(dimension: LearningEvent['dimension']): string {
  switch (dimension) {
    case 'skill-level':
      return 'bg-blue-500/10 text-blue-700 border-blue-500/20';
    case 'interaction-style':
      return 'bg-purple-500/10 text-purple-700 border-purple-500/20';
    case 'topic-interests':
      return 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20';
    case 'frustration-signals':
      return 'bg-red-500/10 text-red-700 border-red-500/20';
    default:
      return 'bg-[var(--fc-subtle-gray)] text-[var(--fc-body-gray)] border-[var(--fc-border-gray)]/50';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function redactPotentialSecrets(text: string) {
  return text
    .replace(/\bsk-[A-Za-z0-9_-]{10,}\b/g, 'sk-***')
    .replace(/\bntn_[A-Za-z0-9]{10,}\b/g, 'ntn_***')
    .replace(/\b(eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,})\b/g, 'jwt_***');
}

function summarizeToolParameters(params: unknown): string | undefined {
  if (!params || typeof params !== 'object') return undefined;
  const record = params as Record<string, unknown>;

  const filePath = record.filePath ?? record.path;
  if (typeof filePath === 'string' && filePath.trim()) {
    return `file: ${filePath}`;
  }

  const url = record.url;
  if (typeof url === 'string' && url.trim()) {
    return `url: ${url}`;
  }

  const query = record.query;
  if (typeof query === 'string' && query.trim()) {
    return `query: ${query}`;
  }

  const command = record.command;
  if (typeof command === 'string' && command.trim()) {
    return `cmd: ${redactPotentialSecrets(command).slice(0, 120)}`;
  }

  const keys = Object.keys(record).slice(0, 4);
  if (keys.length > 0) return `params: ${keys.join(', ')}`;
  return undefined;
}

function normalizeContentBlocks(content: unknown): ChatContentBlock[] {
  if (!content) return [];
  if (typeof content === 'string') return [{ type: 'text', text: content }];
  if (!Array.isArray(content)) return [];

  return content
    .map((raw) => {
      if (!raw || typeof raw !== 'object') return null;
      const block = raw as Record<string, unknown>;
      const type = typeof block.type === 'string' ? block.type : '';
      if (!type) return null;

      if (type === 'thinking') {
        const text =
          typeof block.text === 'string'
            ? block.text
            : typeof block.thinking === 'string'
              ? block.thinking
              : '';
        return { ...block, type: 'thinking', text } as ChatContentBlock;
      }

      if (type === 'toolCall' || type === 'tool_call') {
        const toolName =
          typeof block.toolName === 'string'
            ? block.toolName
            : typeof block.name === 'string'
              ? block.name
              : '';
        const toolCallId =
          typeof block.toolCallId === 'string'
            ? block.toolCallId
            : typeof block.id === 'string'
              ? block.id
              : undefined;
        let parameters = (block.parameters as Record<string, unknown> | undefined) ?? undefined;
        const args = block.arguments;
        if (!parameters && args) {
          if (typeof args === 'string') {
            try {
              parameters = JSON.parse(args) as Record<string, unknown>;
            } catch {
              parameters = { raw: args };
            }
          } else if (typeof args === 'object') {
            parameters = args as Record<string, unknown>;
          }
        }
        const result = block.result ?? block.output;
        const error = typeof block.error === 'string' ? block.error : undefined;
        const status = typeof block.status === 'string' ? block.status : undefined;

        return {
          ...block,
          type: 'toolCall',
          toolName,
          toolCallId,
          parameters,
          result,
          error,
          status,
        } as ChatContentBlock;
      }

      if (type === 'toolResult' || type === 'tool_result') {
        const toolName =
          typeof block.toolName === 'string'
            ? block.toolName
            : typeof block.name === 'string'
              ? block.name
              : 'Tool Result';
        const toolCallId =
          typeof block.toolCallId === 'string'
            ? block.toolCallId
            : typeof block.id === 'string'
              ? block.id
              : undefined;
        const result = block.result ?? block.output ?? block.content;
        const error = typeof block.error === 'string' ? block.error : undefined;
        return {
          ...block,
          type: 'toolCall',
          toolName,
          toolCallId,
          result,
          status: 'completed',
          error,
        } as ChatContentBlock;
      }

      return block as ChatContentBlock;
    })
    .filter((b): b is ChatContentBlock => Boolean(b && b.type));
}

function formatDateLabel(dateKey: string) {
  if (dateKey === 'unknown') return 'Unknown date';
  const d = new Date(dateKey + 'T00:00:00');
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function coerceDate(value: unknown): Date | null {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === 'number') {
    // Heuristic: seconds are usually < 1e12, ms are >= 1e12 for modern dates.
    const ms = value < 1e12 ? value * 1000 : value;
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const d = new Date(trimmed);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  return null;
}

function getDayKey(updatedAt: unknown): string {
  const d = coerceDate(updatedAt);
  if (!d) return 'unknown';
  return d.toISOString().slice(0, 10);
}

function getTimeMs(updatedAt: unknown): number {
  const d = coerceDate(updatedAt);
  return d ? d.getTime() : 0;
}

function formatTime(updatedAt: unknown): string {
  const d = coerceDate(updatedAt);
  if (!d) return '—';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function extractStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

function extractTopicTags(signal: UserSignal): string[] {
  const payload = isRecord(signal.payload) ? signal.payload : {};

  if (signal.signal_type === 'topic_mentioned') {
    return extractStringArray(payload.topics);
  }

  if (signal.signal_type === 'message_sent') {
    return extractStringArray(payload.topicTags);
  }

  return [];
}

function extractFeedbackValue(signal: UserSignal): 'helpful' | 'not_helpful' | null {
  if (signal.signal_type !== 'feedback') return null;
  const payload = isRecord(signal.payload) ? signal.payload : {};
  const value = payload.value;
  return value === 'helpful' || value === 'not_helpful' ? value : null;
}

export function InsightsClient({ userEmail, userId }: { userEmail: string; userId: string }) {
  const isGuest = !userId;
  const router = useRouter();
  const supabase = createClient();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const {
    sessions,
    isConnected,
    isLoading,
    error,
    fetchSessionHistory,
  } = useGateway({ userId });

  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});
  const [traceBySession, setTraceBySession] = useState<Record<string, SessionTraceState>>({});

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [recentLearning, setRecentLearning] = useState<LearningEvent[]>([]);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [signals, setSignals] = useState<UserSignal[]>([]);
  const [signalsLoading, setSignalsLoading] = useState(false);
  const [signalsError, setSignalsError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setProfileLoading(true);
    setProfileError(null);
    try {
      const res = await fetch('/api/profile');
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to load profile');
      }
      const data = await res.json();
      const emailPrefix = userEmail.split('@')[0] || '';
      const fallback = createDefaultProfile({ name: emailPrefix });
      setProfile(data.profile ?? fallback);
      setRecentLearning(Array.isArray(data.recentLearning) ? data.recentLearning : []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load profile';
      setProfileError(message);
    } finally {
      setProfileLoading(false);
    }
  }, [userEmail]);

  const saveProfile = useCallback(async (updatedProfile: UserProfile) => {
    setProfileSaving(true);
    setProfileError(null);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProfile),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save profile');
      }
      const data = await res.json();
      setProfile(data.profile);
      setIsProfileModalOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save profile';
      setProfileError(message);
    } finally {
      setProfileSaving(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const fetchSignals = useCallback(async () => {
    setSignalsLoading(true);
    setSignalsError(null);
    try {
      const res = await fetch('/api/signals?limit=100');
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to load signals');
      }
      const data = await res.json();
      setSignals(Array.isArray(data.signals) ? data.signals : []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load signals';
      setSignalsError(message);
    } finally {
      setSignalsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSignals();
  }, [fetchSignals]);

  const signalSummary = useMemo(() => {
    const now = Date.now();
    const window24hMs = 24 * 60 * 60 * 1000;
    const window7dMs = 7 * 24 * 60 * 60 * 1000;
    const cutoff24h = now - window24hMs;
    const cutoff7d = now - window7dMs;

    const counts24h = {
      messages: 0,
      followUps: 0,
      rapid: 0,
      feedbackHelpful: 0,
      feedbackNotHelpful: 0,
      disconnects: 0,
      reconnects: 0,
      aborted: 0,
    };

    const topicCounts = new Map<string, number>();
    let lastSignalMs = 0;

    for (const s of signals) {
      const ms = getTimeMs(s.created_at);
      if (ms > lastSignalMs) lastSignalMs = ms;

      if (ms >= cutoff24h) {
        if (s.signal_type === 'message_sent') counts24h.messages += 1;
        if (s.signal_type === 'follow_up') counts24h.followUps += 1;
        if (s.signal_type === 'rapid_messages') counts24h.rapid += 1;
        if (s.signal_type === 'gateway_disconnect') counts24h.disconnects += 1;
        if (s.signal_type === 'gateway_reconnect') counts24h.reconnects += 1;
        if (s.signal_type === 'stream_aborted') counts24h.aborted += 1;

        const feedback = extractFeedbackValue(s);
        if (feedback === 'helpful') counts24h.feedbackHelpful += 1;
        if (feedback === 'not_helpful') counts24h.feedbackNotHelpful += 1;
      }

      if (ms >= cutoff7d) {
        const tags = extractTopicTags(s);
        tags.forEach((tag) => {
          topicCounts.set(tag, (topicCounts.get(tag) ?? 0) + 1);
        });
      }
    }

    const topTopics = Array.from(topicCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([topic, count]) => ({ topic, count }));

    return {
      counts24h,
      topTopics,
      lastSignalAt: lastSignalMs ? new Date(lastSignalMs).toISOString() : null,
      sampleSize: signals.length,
    };
  }, [signals]);

  const grouped = useMemo(() => {
    const byDay: Record<string, typeof sessions> = {};
    sessions.forEach((s) => {
      const day = getDayKey(s.updatedAt);
      byDay[day] = byDay[day] ? [...byDay[day], s] : [s];
    });
    const days = Object.keys(byDay).sort((a, b) => {
      if (a === 'unknown') return 1;
      if (b === 'unknown') return -1;
      return a > b ? -1 : 1;
    });
    return days.map((day) => ({
      day,
      label: formatDateLabel(day),
      sessions: byDay[day].sort((a, b) => getTimeMs(b.updatedAt) - getTimeMs(a.updatedAt)),
    }));
  }, [sessions]);

  const extractTraceFromHistory = useCallback((history: unknown): SessionTrace => {
    const toolCalls: SessionTrace['toolCalls'] = [];
    const seen = new Set<string>();
    let lastThinking: string | undefined;

    if (!Array.isArray(history)) {
      return { toolCalls, lastThinking };
    }

    for (const msg of history) {
      const m = isRecord(msg) ? msg : {};
      const blocks = normalizeContentBlocks(m.content);
      for (const block of blocks) {
        const type = block.type;
        if (type === 'thinking' && typeof block.text === 'string' && block.text.trim()) {
          lastThinking = block.text.trim();
        }
        if (type === 'toolCall') {
          const toolName = typeof block.toolName === 'string' ? block.toolName : 'Tool';
          const paramsForId = isRecord(block.parameters) ? block.parameters : {};
          const toolCallId = typeof block.toolCallId === 'string'
            ? block.toolCallId
            : `${toolName}:${JSON.stringify(paramsForId)}`;
          if (seen.has(toolCallId)) continue;
          seen.add(toolCallId);
          toolCalls.push({
            id: toolCallId,
            toolName,
            status: typeof block.status === 'string' ? block.status : undefined,
            summary: summarizeToolParameters(block.parameters),
          });
        }
      }
    }

    return { toolCalls, lastThinking };
  }, []);

  const loadTraceForSession = useCallback(async (sessionKey: string) => {
    setTraceBySession((prev) => ({
      ...prev,
      [sessionKey]: { status: 'loading' },
    }));
    try {
      const history = await fetchSessionHistory(sessionKey);
      const trace = extractTraceFromHistory(history);
      setTraceBySession((prev) => ({
        ...prev,
        [sessionKey]: { status: 'ready', trace },
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load session trace';
      setTraceBySession((prev) => ({
        ...prev,
        [sessionKey]: { status: 'error', error: message },
      }));
    }
  }, [extractTraceFromHistory, fetchSessionHistory]);

  const openInChat = useCallback((sessionKey: string) => {
    try {
      localStorage.setItem(`fc-chat-current-session:${userId}`, sessionKey);
    } catch {
      // ignore storage errors
    }
    router.push('/chat');
  }, [router, userId]);

  const handleChangePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: currentPassword,
      });
      if (signInError) {
        return { success: false, error: 'Current password is incorrect' };
      }

      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) {
        return { success: false, error: updateError.message };
      }
      return { success: true };
    } catch {
      return { success: false, error: 'An unexpected error occurred' };
    }
  }, [supabase.auth, userEmail]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleOpenChangePassword = () => setIsPasswordModalOpen(true);
  const handleOpenProfile = () => {
    setIsProfileModalOpen(true);
    fetchProfile();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--fc-off-white)] to-white">
      <Header
        userName={isGuest ? undefined : userEmail}
        onLogout={isGuest ? undefined : handleLogout}
        onChangePassword={isGuest ? undefined : handleOpenChangePassword}
        onOpenProfile={isGuest ? undefined : handleOpenProfile}
        onLogin={isGuest ? () => setIsLoginModalOpen(true) : undefined}
      />

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
        <div className="flex items-start justify-between gap-6 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[var(--fc-black)] tracking-tight font-[family-name:var(--font-manrope)]">
              Agent Memory
            </h1>
            <p className="text-[14px] text-[var(--fc-body-gray)] mt-2 leading-relaxed max-w-2xl">
              Everything your assistant has picked up about how you work &mdash; the topics you care about, how you like to communicate, and where it can do better.
            </p>
            <div className="mt-3 flex items-center gap-2 text-[12px] text-[var(--fc-light-gray)]">
              <span className={`inline-flex w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-[var(--fc-action-red)]'}`} />
              <span>{isConnected ? 'Gateway connected' : 'Gateway disconnected'}</span>
              {isLoading && <span className="ml-2">· Loading…</span>}
              {error && <span className="ml-2 text-[var(--fc-action-red)]">· {error}</span>}
            </div>
          </div>

          <button
            onClick={() => router.push('/chat')}
            className="px-4 py-2 rounded-xl bg-[var(--fc-black)] text-white text-[13px] font-semibold hover:opacity-95 transition-opacity"
          >
            Back to Chat
          </button>
        </div>

        <div className="grid grid-cols-12 gap-4 mb-6">
          <div className="col-span-12 bg-white rounded-2xl border border-[var(--fc-border-gray)] shadow-sm overflow-hidden">
            {/* Learning Loop - Compact node flow above animation */}
            <div className="px-4 py-2 border-b border-[var(--fc-border-gray)]/40 bg-gradient-to-r from-[var(--fc-subtle-gray)]/30 via-white to-[var(--fc-subtle-gray)]/30">
              <div className="flex items-center justify-center gap-1">
                {[
                  { icon: '💬', label: 'Chat', active: true },
                  { icon: '📡', label: 'Signals', active: signalSummary.counts24h.messages > 0 },
                  { icon: '🧠', label: 'Learn', active: recentLearning.length > 0 },
                  { icon: '💾', label: 'Store', active: recentLearning.length > 0 },
                  { icon: '✨', label: 'UI', active: true },
                ].map((node, idx) => (
                  <div key={node.label} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <div 
                        className={`
                          relative flex items-center justify-center w-7 h-7 rounded-full 
                          ${node.active 
                            ? 'bg-emerald-50 border-2 border-emerald-400' 
                            : 'bg-gray-50 border border-gray-200'
                          }
                          transition-all duration-300
                        `}
                      >
                        <span className="text-[11px]">{node.icon}</span>
                        {node.active && (
                          <span className="absolute inset-0 rounded-full animate-ping bg-emerald-400/20" />
                        )}
                      </div>
                      <span className={`text-[9px] mt-0.5 font-medium ${node.active ? 'text-emerald-600' : 'text-gray-400'}`}>
                        {node.label}
                      </span>
                    </div>
                    {idx < 4 && (
                      <div className="relative w-5 h-[2px] mx-0.5 mb-3">
                        <div className="absolute inset-0 bg-gray-200 rounded-full" />
                        {node.active && (
                          <div 
                            className="absolute inset-0 bg-emerald-400 rounded-full origin-left"
                            style={{
                              animation: `flowPulse 2s ease-in-out infinite`,
                              animationDelay: `${idx * 0.3}s`,
                            }}
                          />
                        )}
                      </div>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => router.push('/how-it-works')}
                  className="ml-2 text-[10px] text-[var(--fc-light-gray)] hover:text-[var(--fc-black)] flex items-center gap-0.5"
                  title="How it works"
                >
                  <ExternalLink size={10} />
                </button>
              </div>
            </div>
            <style jsx>{`
              @keyframes flowPulse {
                0%, 100% { transform: scaleX(0.3); opacity: 0.5; }
                50% { transform: scaleX(1); opacity: 1; }
              }
            `}</style>
            <PixelRoom
              learningEvents={recentLearning}
              signalCount24h={signalSummary.counts24h.messages}
              isConnected={isConnected}
            />
          </div>

          <div className="col-span-12 lg:col-span-7 lg:row-span-2 bg-white rounded-2xl border border-[var(--fc-border-gray)] shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--fc-border-gray)]/60 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[var(--fc-subtle-gray)] text-[var(--fc-dark-gray)]">
                  <BookOpen size={16} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[12px] uppercase tracking-wider font-bold text-[var(--fc-light-gray)]">
                    Agent Learning
                  </span>
                  <span className="text-[12px] text-[var(--fc-body-gray)]">
                    What your assistant figured out about you over time
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-[11px] text-[var(--fc-body-gray)] bg-[var(--fc-subtle-gray)] px-2 py-0.5 rounded-full font-semibold">
                  {recentLearning.length}
                </span>
              </div>
            </div>

            <div className="p-5">
              {recentLearning.length === 0 ? (
                <div className="p-4 rounded-xl bg-[var(--fc-subtle-gray)]/40 border border-[var(--fc-border-gray)]/50 text-[13px] text-[var(--fc-body-gray)] leading-relaxed">
                  Your assistant hasn&apos;t picked up any patterns yet. Keep chatting &mdash; it learns in the background and updates here automatically.
                </div>
              ) : (
                <div className="space-y-3">
                  {recentLearning.slice(0, 8).map((event) => (
                    <div
                      key={event.id}
                      className="rounded-xl border border-[var(--fc-border-gray)]/60 bg-white shadow-sm p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${dimensionBadgeClasses(event.dimension)}`}
                          >
                            {event.dimension}
                          </span>
                          <span className="text-[11px] text-[var(--fc-light-gray)] font-mono">
                            {formatTime(event.created_at)} · {event.evidence?.length ?? 0} evidence
                          </span>
                        </div>
                        <span className="text-[11px] text-[var(--fc-light-gray)] font-mono flex-shrink-0">
                          {Math.round(event.confidence * 100)}%
                        </span>
                      </div>
                      <div className="text-[13px] text-[var(--fc-body-gray)] leading-relaxed">
                        <p className="line-clamp-3">{event.insight}</p>
                      </div>
                      <div className="h-1.5 rounded-full bg-[var(--fc-subtle-gray)] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-all"
                          style={{ width: `${Math.round(event.confidence * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="col-span-12 lg:col-span-5 bg-white rounded-2xl border border-[var(--fc-border-gray)] shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--fc-border-gray)]/60 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[var(--fc-subtle-gray)] text-[var(--fc-dark-gray)]">
                  <Zap size={16} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[12px] uppercase tracking-wider font-bold text-[var(--fc-light-gray)]">
                    Activity (24h)
                  </span>
                  <span className="text-[12px] text-[var(--fc-body-gray)]">
                    How active you&apos;ve been in the last 24 hours
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {signalsLoading && <Loader2 size={14} className="animate-spin text-[var(--fc-light-gray)]" />}
                <button
                  type="button"
                  onClick={fetchSignals}
                  className="text-[12px] font-semibold text-[var(--fc-body-gray)] hover:text-[var(--fc-black)]"
                >
                  Refresh
                </button>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {signalsError && (
                <div className="text-[12px] text-[var(--fc-action-red)]">
                  {signalsError}
                </div>
              )}

              {!signalsError && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-[var(--fc-subtle-gray)]/40 border border-[var(--fc-border-gray)]/50 p-3">
                      <div className="text-[11px] uppercase tracking-wider font-bold text-[var(--fc-light-gray)]">
                        Messages
                      </div>
                      <div className="text-[20px] font-bold text-[var(--fc-black)] mt-1">
                        {signalSummary.counts24h.messages}
                      </div>
                    </div>
                    <div className="rounded-xl bg-[var(--fc-subtle-gray)]/40 border border-[var(--fc-border-gray)]/50 p-3">
                      <div className="text-[11px] uppercase tracking-wider font-bold text-[var(--fc-light-gray)]">
                        Follow-ups
                      </div>
                      <div className="text-[20px] font-bold text-[var(--fc-black)] mt-1">
                        {signalSummary.counts24h.followUps}
                      </div>
                    </div>
                    <div className="rounded-xl bg-[var(--fc-subtle-gray)]/40 border border-[var(--fc-border-gray)]/50 p-3">
                      <div className="text-[11px] uppercase tracking-wider font-bold text-[var(--fc-light-gray)]">
                        Bursts
                      </div>
                      <div className="text-[20px] font-bold text-[var(--fc-black)] mt-1">
                        {signalSummary.counts24h.rapid}
                      </div>
                    </div>
                    <div className="rounded-xl bg-[var(--fc-subtle-gray)]/40 border border-[var(--fc-border-gray)]/50 p-3">
                      <div className="text-[11px] uppercase tracking-wider font-bold text-[var(--fc-light-gray)]">
                        Interruptions
                      </div>
                      <div className="text-[20px] font-bold text-[var(--fc-black)] mt-1">
                        {signalSummary.counts24h.aborted}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-[12px] text-[var(--fc-body-gray)]">
                      <ThumbsUp size={14} className="text-emerald-600" />
                      <span className="font-semibold">{signalSummary.counts24h.feedbackHelpful}</span>
                      <ThumbsDown size={14} className="text-[var(--fc-action-red)] ml-2" />
                      <span className="font-semibold">{signalSummary.counts24h.feedbackNotHelpful}</span>
                    </div>
                    <div className="text-[11px] text-[var(--fc-light-gray)] font-mono">
                      {signalSummary.sampleSize} events
                      {signalSummary.lastSignalAt ? ` · last ${formatTime(signalSummary.lastSignalAt)}` : ''}
                    </div>
                  </div>

                  {(signalSummary.counts24h.disconnects > 0 || signalSummary.counts24h.reconnects > 0) && (
                    <div className="text-[12px] text-[var(--fc-body-gray)]">
                      <span className="font-semibold">Gateway:</span>{' '}
                      {signalSummary.counts24h.disconnects} disconnect · {signalSummary.counts24h.reconnects} reconnect
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="col-span-12 lg:col-span-5 bg-white rounded-2xl border border-[var(--fc-border-gray)] shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--fc-border-gray)]/60 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[var(--fc-subtle-gray)] text-[var(--fc-dark-gray)]">
                  <MessageSquare size={16} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[12px] uppercase tracking-wider font-bold text-[var(--fc-light-gray)]">
                    Your Topics (7d)
                  </span>
                  <span className="text-[12px] text-[var(--fc-body-gray)]">
                    What you&apos;ve been asking about this week
                  </span>
                </div>
              </div>
            </div>

            <div className="p-5">
              {signalSummary.topTopics.length === 0 ? (
                <div className="text-[13px] text-[var(--fc-body-gray)]">
                  No topics detected yet. Start a conversation and your interests will appear here.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {signalSummary.topTopics.map((t) => (
                    <span
                      key={t.topic}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--fc-subtle-gray)] text-[var(--fc-body-gray)] border border-[var(--fc-border-gray)]/60 text-[12px] font-medium"
                    >
                      {t.topic}
                      <span className="text-[11px] text-[var(--fc-light-gray)] font-mono">
                        {t.count}
                      </span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {grouped.map((group) => {
            const isOpen = expandedDays[group.day] ?? false;
            return (
              <div key={group.day} className="bg-white rounded-2xl border border-[var(--fc-border-gray)] shadow-sm overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExpandedDays((prev) => ({ ...prev, [group.day]: !isOpen }))}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-[var(--fc-subtle-gray)] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-[var(--fc-subtle-gray)] text-[var(--fc-dark-gray)]">
                      <CalendarDays size={16} />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-[14px] font-bold text-[var(--fc-black)]">
                        {group.label}
                      </span>
                      <span className="text-[12px] text-[var(--fc-light-gray)]">
                        {group.sessions.length} sessions
                      </span>
                    </div>
                  </div>
                  <ChevronDown
                    size={18}
                    className={`text-[var(--fc-light-gray)] transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 space-y-3">
                        {group.sessions.map((s) => {
                          const state = traceBySession[s.sessionKey] ?? { status: 'idle' as const };
                          const toolCount = state.trace?.toolCalls.length ?? 0;
                          return (
                            <div key={s.sessionKey} className="border border-[var(--fc-border-gray)] rounded-xl p-4">
                              <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                  <div className="text-[13px] font-semibold text-[var(--fc-black)] truncate">
                                    {s.label || s.displayName || 'Chat Session'}
                                  </div>
                                  <div className="text-[12px] text-[var(--fc-light-gray)] mt-1">
                                    {formatTime(s.updatedAt)}
                                    {typeof s.totalTokens === 'number' ? ` · ${s.totalTokens} tokens` : ''}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <button
                                    onClick={() => openInChat(s.sessionKey)}
                                    className="px-3 py-2 rounded-lg text-[12px] font-semibold bg-[var(--fc-subtle-gray)] text-[var(--fc-body-gray)] hover:bg-[var(--fc-border-gray)] transition-colors flex items-center gap-1.5"
                                    type="button"
                                  >
                                    <ExternalLink size={14} />
                                    Open
                                  </button>
                                  <button
                                    onClick={() => loadTraceForSession(s.sessionKey)}
                                    disabled={state.status === 'loading'}
                                    className="px-3 py-2 rounded-lg text-[12px] font-semibold bg-[var(--fc-black)] text-white hover:opacity-95 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-1.5"
                                    type="button"
                                  >
                                    {state.status === 'loading' ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                                    {state.status === 'ready' ? `Reload (${toolCount})` : 'Load Trace'}
                                  </button>
                                </div>
                              </div>

                              {state.status === 'error' && (
                                <div className="mt-3 text-[12px] text-[var(--fc-action-red)]">
                                  {state.error}
                                </div>
                              )}

                              {state.status === 'ready' && state.trace && (
                                <div className="mt-4 space-y-3">
                                  <div className="text-[11px] uppercase tracking-wider font-bold text-[var(--fc-light-gray)]">
                                    Tool Calls ({state.trace.toolCalls.length})
                                  </div>
                                  {state.trace.toolCalls.length === 0 ? (
                                    <div className="text-[12px] text-[var(--fc-body-gray)]">
                                      No tool calls captured in this session.
                                    </div>
                                  ) : (
                                    <div className="space-y-2">
                                      {state.trace.toolCalls.slice(0, 12).map((t) => (
                                        <div key={t.id} className="flex items-center justify-between gap-3 bg-[var(--fc-subtle-gray)]/50 border border-[var(--fc-border-gray)]/50 rounded-lg px-3 py-2">
                                          <div className="min-w-0">
                                            <div className="text-[12px] font-semibold text-[var(--fc-black)] truncate">
                                              {t.toolName.replace(/_/g, ' ')}
                                            </div>
                                            {t.summary && (
                                              <div className="text-[11px] text-[var(--fc-light-gray)] truncate">
                                                {t.summary}
                                              </div>
                                            )}
                                          </div>
                                          <div className="text-[10px] font-bold text-[var(--fc-body-gray)] bg-white border border-[var(--fc-border-gray)]/60 px-2 py-0.5 rounded-full">
                                            {t.status || '—'}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {state.trace.lastThinking && (
                                    <div className="pt-2">
                                      <div className="text-[11px] uppercase tracking-wider font-bold text-[var(--fc-light-gray)] mb-2">
                                        Thinking Excerpt
                                      </div>
                                      <div className="text-[12px] text-[var(--fc-body-gray)] leading-relaxed bg-white border border-[var(--fc-border-gray)]/50 rounded-xl p-3">
                                        <p className="line-clamp-6">
                                          {state.trace.lastThinking}
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>



      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSubmit={handleChangePassword}
      />

      <UserProfileModal
        key={`${userId}:${profileLoading ? 'loading' : profile?.lastUpdated ?? 'empty'}`}
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profile={profile}
        isLoading={profileLoading}
        isSaving={profileSaving}
        error={profileError}
        onSave={saveProfile}
      />

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={() => {
          setIsLoginModalOpen(false);
          router.refresh();
        }}
      />
    </div>
  );
}
