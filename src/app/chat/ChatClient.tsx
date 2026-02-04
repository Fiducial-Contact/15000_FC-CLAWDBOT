'use client';

import { useRef, useEffect, useMemo, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bot,
  Video,
  Palette,
  Film,
  Megaphone,
  Bell,
  BellRing,
  FileText,
  Mic,
  MoreHorizontal,
  Sparkles,
  AlertCircle,
  Zap,
  Copy,
  Check,
  Play,
  Square,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useGateway } from '@/lib/gateway/useGateway';
import { Header } from '@/components/Header';
import { ChatMessage } from '@/components/ChatMessage';
import { ChatInput } from '@/components/ChatInput';
import { ChatSidebar } from '@/components/ChatSidebar';
import { AgentInsightPanel } from '@/components/AgentInsightPanel';

import { CapabilityCard } from '@/components/CapabilityCard';
import { ChangePasswordModal } from '@/components/ChangePasswordModal';
import { LoginModal } from '@/components/LoginModal';
import { UserProfileModal } from '@/components/UserProfileModal';
import { ToolStream } from '@/components/ToolStream';
import { MessageGroup } from '@/components/MessageGroup';
import { ReplayControls } from '@/components/ReplayControls';
import { useReplayMode } from '@/hooks/useReplayMode';
import { useSessionHints } from '@/hooks/useSessionHints';
import type { SessionHint } from '@/hooks/useSessionHints';
import { useSignalCapture } from '@/hooks/useSignalCapture';
import { createDefaultProfile } from '@/lib/profile';
import type { UserProfile, LearningEvent } from '@/lib/types/profile';
import type { ChatAttachmentInput } from '@/lib/gateway/types';

interface ChatClientProps {
  userEmail: string;
  userId: string;
}

const CAPABILITY_CATEGORIES = [
  {
    id: 'image',
    icon: Palette,
    title: 'Image Creation',
    description: 'Generate & edit images',
    color: '#be1e2c',
    defaultAction: 'Draw a cat wearing sunglasses',
    requiresInput: false,
  },
  {
    id: 'video-post',
    icon: Video,
    title: 'Video Post',
    description: 'AE & Premiere Pro',
    color: '#e20613',
    defaultAction: 'How to write AE loop expression',
    requiresInput: false,
  },
  {
    id: 'video-tools',
    icon: Film,
    title: 'Video Tools',
    description: 'Download & subtitles',
    color: '#cd2e26',
    defaultAction: 'Download this YouTube video: ',
    requiresInput: true,
  },
  {
    id: 'marketing',
    icon: Megaphone,
    title: 'Marketing',
    description: 'Copywriting & SEO',
    color: '#be1e2c',
    defaultAction: 'Write product copy for: ',
    requiresInput: true,
  },
  {
    id: 'reminders',
    icon: Bell,
    title: 'Reminders',
    description: 'Task management',
    color: '#e20613',
    defaultAction: 'Remind me in 10 minutes to join the meeting',
    requiresInput: false,
  },
  {
    id: 'summarize',
    icon: FileText,
    title: 'Summarize',
    description: 'URLs, PDFs & videos',
    color: '#cd2e26',
    defaultAction: 'Summarize this link: ',
    requiresInput: true,
  },
  {
    id: 'voice',
    icon: Mic,
    title: 'Voice',
    description: 'Speech to text',
    color: '#be1e2c',
    defaultAction: 'What can you do with voice messages?',
    requiresInput: false,
  },
  {
    id: 'more',
    icon: MoreHorizontal,
    title: 'More Tools',
    description: 'Weather, social & more',
    color: '#64748b',
    defaultAction: 'Weather in London',
    requiresInput: false,
  },
];

const THINKING_PHRASES = [
  'Thinking...',
  'Pulling context...',
  'Cross-referencing...',
  'Composing response...',
  'Still working...',
];

const FAST_ACK_DELAY_MS = 300;
const PINNED_SESSIONS_STORAGE_KEY = 'fc-pinned-sessions';
const PINNED_SESSIONS_API_PATH = '/api/pinned-sessions';
const MAX_PINNED_SESSIONS = 50;
const MAX_SESSION_KEY_LENGTH = 512;

type StoredPinnedSessions = {
  keys: string[];
  updatedAtMs: number;
};

function normalizePinnedSessionKeys(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const keys: string[] = [];
  const seen = new Set<string>();
  for (const item of value) {
    if (typeof item !== 'string') continue;
    const key = item.trim();
    if (!key) continue;
    if (key.length > MAX_SESSION_KEY_LENGTH) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    keys.push(key);
    if (keys.length >= MAX_PINNED_SESSIONS) break;
  }
  return keys;
}

function normalizeStoredPinnedSessions(value: unknown): StoredPinnedSessions {
  if (Array.isArray(value)) {
    return { keys: normalizePinnedSessionKeys(value), updatedAtMs: 0 };
  }
  if (!value || typeof value !== 'object') {
    return { keys: [], updatedAtMs: 0 };
  }
  const record = value as Record<string, unknown>;
  const updatedAtMs = typeof record.updatedAtMs === 'number' ? record.updatedAtMs : 0;
  return { keys: normalizePinnedSessionKeys(record.keys), updatedAtMs };
}
const PROFILE_SYNC_PREFIX = '[fc:profile-sync:v1]';
const HISTORY_DISPLAY_LIMIT = 1000;

type ProfileSyncSource = 'initial' | 'update' | 'context_break';
type ProfileSyncStatus = 'sent' | 'skipped' | 'failed';

type ProfileSyncInfo = {
  at: string;
  source: ProfileSyncSource;
  status: ProfileSyncStatus;
  sessionKey?: string;
  fingerprint?: string;
  reason?: string;
};

type ToolTraceItem = {
  id: string;
  toolName: string;
  status?: string;
  when?: string;
  summary?: string;
};

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function hashString(input: string) {
  let hash = 5381;
  for (let i = 0; i < input.length; i += 1) {
    hash = ((hash << 5) + hash + input.charCodeAt(i)) >>> 0;
  }
  return hash.toString(16);
}

function redactPotentialSecrets(text: string) {
  // Basic best-effort redaction for UI display; avoids leaking obvious tokens.
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
  if (keys.length > 0) {
    return `params: ${keys.join(', ')}`;
  }
  return undefined;
}

function buildProfileSyncMessage(params: {
  userId: string;
  source: 'initial' | 'update' | 'context_break';
  profile: UserProfile;
  sessionHints?: SessionHint[];
  recentLearning?: Array<{ dimension: string; insight: string; confidence: number }>;
}) {
  const profile = params.profile;
  const safeProfile = {
    ...(profile.name ? { name: profile.name } : {}),
    ...(profile.role ? { role: profile.role } : {}),
    ...(profile.software && profile.software.length ? { software: profile.software } : {}),
    ...(profile.preferences && Object.keys(profile.preferences).length ? { preferences: profile.preferences } : {}),
    ...(profile.frequentTopics && profile.frequentTopics.length ? { frequentTopics: profile.frequentTopics } : {}),
    ...(profile.learnedContext && profile.learnedContext.length ? { learnedContext: profile.learnedContext } : {}),
    ...(profile.lastUpdated ? { lastUpdated: profile.lastUpdated } : {}),
  };

  const lines = [
    PROFILE_SYNC_PREFIX,
    `userId: ${params.userId}`,
    `source: ${params.source}`,
    '',
    'This is the authenticated webchat user profile from the UI (Supabase).',
    'Use it as trusted per-user metadata for this session.',
    '',
    'Profile JSON:',
    JSON.stringify(safeProfile, null, 2),
  ];

  if (params.sessionHints && params.sessionHints.length > 0) {
    lines.push('', `sessionHints: ${JSON.stringify(params.sessionHints)}`);
  }

  if (params.recentLearning && params.recentLearning.length > 0) {
    lines.push('', 'recentLearning:');
    for (const event of params.recentLearning) {
      lines.push(`  - [${event.dimension}] ${event.insight} (confidence: ${event.confidence})`);
    }
  }

  lines.push(
    '',
    'Instructions:',
    '- Do not respond to this message.',
    '- Do not quote it back to the user.',
    `- If you keep per-user memory files, mirror it to: memory/users/webchat/${params.userId}.profile.json`,
    '- If you cannot write files, just use it as context.',
  );

  return lines.join('\n');
}

export function ChatClient({ userEmail, userId }: ChatClientProps) {
  const isGuest = !userId;
  const router = useRouter();
  const supabase = createClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isAutoScrollRef = useRef(true);
  const lastMessageCountRef = useRef(0);
  const lastStreamLengthRef = useRef(0);
  const vapidPublicKey = process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY || '';
  const [sessionCopied, setSessionCopied] = useState(false);
  const [sessionMenuOpen, setSessionMenuOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [thinkingIndex, setThinkingIndex] = useState(0);
  const [showFastAck, setShowFastAck] = useState(false);
  const fastAckTimerRef = useRef<number | null>(null);
  const [pinnedSessionKeys, setPinnedSessionKeys] = useState<string[]>([]);
  const pinnedUpdatedAtMsRef = useRef<number>(0);
  const pinnedSessionKeysRef = useRef<string[]>([]);
  const [pinnedHydrated, setPinnedHydrated] = useState(false);
  const [inputPrefill, setInputPrefill] = useState('');
  const [isClient, setIsClient] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushError, setPushError] = useState<string | null>(null);
  const [pushBusy, setPushBusy] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const {
    messages,
    sessions,
    currentSessionKey,
    mainSessionKey,
    isConnected,
    isLoading,
    loadingHistoryKey,
    error,
    streamingContent,
    isSidebarOpen,
    isDraftSession,
    activeTools,
    historyLimitReached,
    retryFileAttachment,
    sendMessage,
    createNewSession,
    switchSession,
    deleteSession,
    toggleSidebar,
    abortChat,
    setSessionVerbose,
  } = useGateway({ userId });

  const {
    isReplaying,
    isPaused: replayPaused,
    replayPhase,
    replayMessages,
    replayStreamingContent,
    replayProgress,
    replaySession,
    speed: replaySpeed,
    startReplay,
    pauseReplay,
    resumeReplay,
    stopReplay,
    setSpeed: setReplaySpeed,
    skipToNext,
  } = useReplayMode();

  const currentSession = useMemo(
    () => sessions.find((session) => session.sessionKey === currentSessionKey),
    [sessions, currentSessionKey]
  );

  const lastThinking = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const blocks = messages[i].blocks;
      if (!blocks) continue;
      for (let j = blocks.length - 1; j >= 0; j--) {
        if (blocks[j].type === 'thinking' && blocks[j].text) {
          return blocks[j].text as string;
        }
      }
    }
    return null;
  }, [messages]);

  const getPushSubscription = useCallback(async () => {
    if (!('serviceWorker' in navigator)) return null;
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) return null;
    return registration.pushManager.getSubscription();
  }, []);

  const savePushSubscription = useCallback(async (subscription: PushSubscription, sessionKey: string) => {
    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        sessionKey,
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data?.error || 'Failed to save push subscription');
    }
  }, []);

  const enablePush = useCallback(async () => {
    if (!pushSupported) {
      setPushError('Push notifications are not supported in this browser.');
      return;
    }
    if (!vapidPublicKey) {
      setPushError('Missing push public key.');
      return;
    }
    if (!currentSessionKey) {
      setPushError('No active session.');
      return;
    }

    setPushBusy(true);
    setPushError(null);

    const permission = await Notification.requestPermission();
    setPushPermission(permission);
    if (permission !== 'granted') {
      setPushBusy(false);
      return;
    }

    const registration = await navigator.serviceWorker.register('/sw.js');
    const existing = await registration.pushManager.getSubscription();
    const subscription =
      existing ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      }));

    await savePushSubscription(subscription, currentSessionKey);
    setPushEnabled(true);
    setPushBusy(false);
  }, [currentSessionKey, pushSupported, savePushSubscription, vapidPublicKey]);

  const disablePush = useCallback(async () => {
    setPushBusy(true);
    setPushError(null);
    const subscription = await getPushSubscription();
    if (subscription) {
      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });
      await subscription.unsubscribe();
    }
    setPushEnabled(false);
    setPushBusy(false);
  }, [getPushSubscription]);

  const handleSwitchSession = useCallback(
    async (sessionKey: string) => {
      switchSession(sessionKey);
      if (!pushSupported || pushPermission !== 'granted') return;
      try {
        const subscription = await getPushSubscription();
        if (!subscription) return;
        await savePushSubscription(subscription, sessionKey);
        setPushEnabled(true);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to sync push subscription';
        setPushError(message);
      }
    },
    [getPushSubscription, pushPermission, pushSupported, savePushSubscription, switchSession]
  );

  const isNoiseText = useCallback((text: string) => {
    const content = text.trim().toLowerCase();
    if (!content) return false;
    const noisePatterns = [
      /^no_reply$/i,
      /\(no new output\)/i,
      /process still running/i,
      /command still running/i,
      /use process \(list\/poll\/log\/write\/kill\/clear\/remove\) for follow-up/i,
    ];
    if (!noisePatterns.some((pattern) => pattern.test(content))) {
      return false;
    }
    const stripped = noisePatterns.reduce((acc, pattern) => acc.replace(pattern, ' '), content);
    return stripped.replace(/[^a-z0-9]+/g, '').length === 0;
  }, []);

  const visibleMessages = useMemo(() => {
    const sessionMessages = messages.filter((message) => message.sessionKey === currentSessionKey);
    const hasStreamingAssistant = Boolean(streamingContent && !isNoiseText(streamingContent));
    const shouldHideStandaloneNo = (message: (typeof sessionMessages)[number], index: number) => {
      if (message.role !== 'assistant' || typeof message.content !== 'string') return false;
      const trimmed = message.content.trim();
      if (trimmed !== 'NO') return false;
      if (hasStreamingAssistant) return true;
      const next = sessionMessages[index + 1];
      if (next && next.role === 'assistant') return true;
      const prev = sessionMessages[index - 1];
      if (
        prev &&
        prev.role === 'user' &&
        typeof prev.content === 'string' &&
        prev.content.trim().startsWith(PROFILE_SYNC_PREFIX)
      ) {
        return true;
      }
      return false;
    };
    if (showDetails) {
      return sessionMessages.filter((message, index) => !shouldHideStandaloneNo(message, index));
    }
    return sessionMessages.filter((message, index) => {
      if (message.role === 'user' && typeof message.content === 'string') {
        if (message.content.trim().startsWith(PROFILE_SYNC_PREFIX)) return false;
      }
      if (message.role !== 'assistant') return true;
      if (shouldHideStandaloneNo(message, index)) return false;
      if (message.isToolResult) return false;
      if (message.attachments && message.attachments.length > 0) return true;
      const blocks = message.blocks || [];
      const hasImageBlock = blocks.some((block) => block.type === 'image' || block.type === 'image_url');
      if (hasImageBlock) return true;
      const hasToolBlock = blocks.some((block) => block.type === 'toolCall' || block.type === 'tool_call');
      if (hasToolBlock) return false;
      const hasThinkingOnly = blocks.length > 0 && blocks.every((block) => block.type === 'thinking');
      if (hasThinkingOnly && !message.content.trim()) return false;
      return !isNoiseText(message.content || '');
    });
  }, [messages, currentSessionKey, showDetails, isNoiseText, streamingContent]);

  const recentToolTrace = useMemo<ToolTraceItem[]>(() => {
    if (!currentSessionKey) return [];

    const results: ToolTraceItem[] = [];
    const seen = new Set<string>();

    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const message = messages[i];
      if (message.sessionKey !== currentSessionKey) continue;
      const blocks = message.blocks ?? [];
      if (blocks.length === 0) continue;

      for (let j = blocks.length - 1; j >= 0; j -= 1) {
        const block = blocks[j] as Record<string, unknown>;
        if (block.type !== 'toolCall') continue;
        const toolName = typeof block.toolName === 'string'
          ? block.toolName
          : typeof block.name === 'string'
            ? block.name
            : '';
        if (!toolName) continue;

        const toolCallId = typeof block.toolCallId === 'string'
          ? block.toolCallId
          : typeof block.id === 'string'
            ? block.id
            : `${message.id}:${j}:${toolName}`;

        if (seen.has(toolCallId)) continue;
        seen.add(toolCallId);

        const status = typeof block.status === 'string' ? block.status : undefined;
        const summary = summarizeToolParameters(block.parameters);

        results.push({
          id: toolCallId,
          toolName,
          status,
          when: message.timestamp || undefined,
          summary,
        });

        if (results.length >= 8) return results;
      }
    }

    return results;
  }, [messages, currentSessionKey]);

  const displayStreamingContent = useMemo(() => {
    if (isReplaying) return replayStreamingContent;
    if (showDetails) return streamingContent;
    if (streamingContent.trim().toUpperCase() === 'NO') return '';
    return isNoiseText(streamingContent) ? '' : streamingContent;
  }, [streamingContent, showDetails, isNoiseText, isReplaying, replayStreamingContent]);

  useEffect(() => {
    const shouldHide = !isLoading || Boolean(displayStreamingContent) || isReplaying;
    if (shouldHide) {
      setShowFastAck(false);
      if (fastAckTimerRef.current !== null) {
        window.clearTimeout(fastAckTimerRef.current);
        fastAckTimerRef.current = null;
      }
      return;
    }

    if (showFastAck) return;
    if (fastAckTimerRef.current !== null) return;

    fastAckTimerRef.current = window.setTimeout(() => {
      fastAckTimerRef.current = null;
      if (!isLoading) return;
      if (isReplaying) return;
      if (displayStreamingContent) return;
      setShowFastAck(true);
    }, FAST_ACK_DELAY_MS);

    return () => {
      if (fastAckTimerRef.current !== null) {
        window.clearTimeout(fastAckTimerRef.current);
        fastAckTimerRef.current = null;
      }
    };
  }, [displayStreamingContent, isLoading, isReplaying, showFastAck]);

  useEffect(() => {
    if (isReplaying) stopReplay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSessionKey]);

  useEffect(() => {
    if (!isReplaying) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') stopReplay();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isReplaying, stopReplay]);

  useEffect(() => {
    setIsClient(true);
    const supported =
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window;
    setPushSupported(supported);
    if ('Notification' in window) {
      setPushPermission(Notification.permission);
    }
    if (supported && Notification.permission === 'granted') {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (!reg) return;
        reg.pushManager.getSubscription().then((sub) => {
          if (sub) setPushEnabled(true);
        });
      });
    }
  }, []);

  const pinnedStorageKey = useMemo(
    () => `${PINNED_SESSIONS_STORAGE_KEY}:${userId || 'guest'}`,
    [userId]
  );

  useEffect(() => {
    pinnedSessionKeysRef.current = pinnedSessionKeys;
  }, [pinnedSessionKeys]);

  const persistPinnedSessions = useCallback(
    (next: StoredPinnedSessions) => {
      if (!isClient) return;
      try {
        localStorage.setItem(pinnedStorageKey, JSON.stringify(next));
      } catch {
        // ignore localStorage errors
      }
    },
    [isClient, pinnedStorageKey]
  );

  const pushPinnedSessionsToSupabase = useCallback(
    async (next: StoredPinnedSessions) => {
      if (isGuest) return;
      try {
        const res = await fetch(PINNED_SESSIONS_API_PATH, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(next),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          console.error(
            'Failed to save pinned sessions:',
            (data as { error?: string }).error || res.statusText
          );
          return;
        }
        const data = await res.json().catch(() => ({}));
        const remotePinned = normalizeStoredPinnedSessions(
          (data as { pinnedSessions?: unknown }).pinnedSessions
        );
        const normalizedKeys = remotePinned.keys.filter((key) => key !== mainSessionKey);
        pinnedUpdatedAtMsRef.current = remotePinned.updatedAtMs;
        setPinnedSessionKeys(normalizedKeys);
        persistPinnedSessions({ keys: normalizedKeys, updatedAtMs: remotePinned.updatedAtMs });
      } catch (err) {
        console.error('Failed to save pinned sessions:', err);
      }
    },
    [isGuest, mainSessionKey, persistPinnedSessions]
  );

  const hydratePinnedSessionsFromSupabase = useCallback(async () => {
    if (isGuest) return;
    try {
      const res = await fetch(PINNED_SESSIONS_API_PATH);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.error(
          'Failed to load pinned sessions:',
          (data as { error?: string }).error || res.statusText
        );
        return;
      }
      const data = await res.json().catch(() => ({}));
      const remotePinned = normalizeStoredPinnedSessions(
        (data as { pinnedSessions?: unknown }).pinnedSessions
      );
      const normalizedKeys = remotePinned.keys.filter((key) => key !== mainSessionKey);
      const remoteNormalized: StoredPinnedSessions = {
        keys: normalizedKeys,
        updatedAtMs: remotePinned.updatedAtMs,
      };

      const localUpdatedAtMs = pinnedUpdatedAtMsRef.current;
      const localKeys = pinnedSessionKeysRef.current.filter((key) => key !== mainSessionKey);
      const shouldUseRemote =
        (remoteNormalized.updatedAtMs ?? 0) > (localUpdatedAtMs ?? 0) ||
        ((remoteNormalized.updatedAtMs ?? 0) === (localUpdatedAtMs ?? 0) &&
          remoteNormalized.keys.length >= localKeys.length);

      if (shouldUseRemote) {
        pinnedUpdatedAtMsRef.current = remoteNormalized.updatedAtMs;
        setPinnedSessionKeys(remoteNormalized.keys);
        persistPinnedSessions(remoteNormalized);
        return;
      }

      void pushPinnedSessionsToSupabase({ keys: localKeys, updatedAtMs: localUpdatedAtMs });
    } catch (err) {
      console.error('Failed to load pinned sessions:', err);
    }
  }, [
    isGuest,
    mainSessionKey,
    persistPinnedSessions,
    pushPinnedSessionsToSupabase,
  ]);

  useEffect(() => {
    if (!isClient) return;
    let raw: unknown = null;
    try {
      raw = JSON.parse(localStorage.getItem(pinnedStorageKey) || 'null');
    } catch {
      raw = null;
    }
    const stored = normalizeStoredPinnedSessions(raw);
    const normalizedKeys = stored.keys.filter((key) => key !== mainSessionKey);
    const normalized: StoredPinnedSessions = { keys: normalizedKeys, updatedAtMs: stored.updatedAtMs };
    pinnedUpdatedAtMsRef.current = normalized.updatedAtMs;
    setPinnedSessionKeys(normalized.keys);
    persistPinnedSessions(normalized);
    setPinnedHydrated(true);
  }, [isClient, mainSessionKey, persistPinnedSessions, pinnedStorageKey]);

  useEffect(() => {
    if (!isClient) return;
    if (!pinnedHydrated) return;
    if (isGuest) return;
    void hydratePinnedSessionsFromSupabase();
  }, [hydratePinnedSessionsFromSupabase, isClient, isGuest, pinnedHydrated]);

  const togglePinnedSession = useCallback(
    (sessionKey: string) => {
      if (!sessionKey) return;
      if (sessionKey === mainSessionKey) return;
      setPinnedSessionKeys((prev) => {
        const has = prev.includes(sessionKey);
        const nextKeys = has
          ? prev.filter((key) => key !== sessionKey)
          : normalizePinnedSessionKeys([sessionKey, ...prev]);
        const updatedAtMs = Date.now();
        pinnedUpdatedAtMsRef.current = updatedAtMs;
        const next: StoredPinnedSessions = { keys: nextKeys, updatedAtMs };
        persistPinnedSessions(next);
        void pushPinnedSessionsToSupabase(next);
        return nextKeys;
      });
    },
    [mainSessionKey, persistPinnedSessions, pushPinnedSessionsToSupabase]
  );

  const handleDeleteSession = useCallback(
    (sessionKey: string) => {
      if (!sessionKey) return;
      setPinnedSessionKeys((prev) => {
        if (!prev.includes(sessionKey)) return prev;
        const nextKeys = prev.filter((key) => key !== sessionKey);
        const updatedAtMs = Date.now();
        pinnedUpdatedAtMsRef.current = updatedAtMs;
        const next: StoredPinnedSessions = { keys: nextKeys, updatedAtMs };
        persistPinnedSessions(next);
        void pushPinnedSessionsToSupabase(next);
        return nextKeys;
      });
      deleteSession(sessionKey);
    },
    [deleteSession, persistPinnedSessions, pushPinnedSessionsToSupabase]
  );

  useEffect(() => {
    if (!currentSessionKey || !isConnected) return;
    setSessionVerbose(currentSessionKey, showDetails);
  }, [currentSessionKey, isConnected, setSessionVerbose, showDetails]);

  useEffect(() => {
    if (!isLoading || displayStreamingContent || isReplaying) return;
    const interval = window.setInterval(() => {
      setThinkingIndex((prev) => (prev + 1) % THINKING_PHRASES.length);
    }, 4000);

    return () => window.clearInterval(interval);
  }, [isLoading, displayStreamingContent, isReplaying]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior) => {
    messagesEndRef.current?.scrollIntoView({ behavior });
    isAutoScrollRef.current = true;
  }, []);

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const threshold = 100;
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    isAutoScrollRef.current = distanceFromBottom < threshold;
  }, []);

  const effectiveMessageCount = isReplaying ? replayMessages.length : visibleMessages.length;

  useEffect(() => {
    const hasNewMessage = effectiveMessageCount > lastMessageCountRef.current;
    const streamLength = displayStreamingContent.length;
    const streamingGrowing = streamLength > lastStreamLengthRef.current;

    if (hasNewMessage) {
      scrollToBottom('smooth');
    } else if (streamingGrowing && isAutoScrollRef.current) {
      scrollToBottom('auto');
    }

    lastMessageCountRef.current = effectiveMessageCount;
    lastStreamLengthRef.current = streamLength;
  }, [effectiveMessageCount, displayStreamingContent, scrollToBottom]);

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileModalSource, setProfileModalSource] = useState<'manual' | 'onboarding'>('manual');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [recentLearning, setRecentLearning] = useState<LearningEvent[]>([]);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSyncInfo, setProfileSyncInfo] = useState<ProfileSyncInfo | null>(null);
  const lastProfileSyncKeyRef = useRef<string | null>(null);
  const lastContextBreakSyncAtRef = useRef<number>(0);
  const [sessionHints, setSessionHints] = useState<SessionHint[]>([]);
  const { processMessage: processSessionHints } = useSessionHints(currentSessionKey);
  const {
    setSessionKey: setSignalSessionKey,
    captureMessage: captureSignalMessage,
    captureAssistantReply,
    captureGatewayHealth,
    captureFeedback,
  } = useSignalCapture(userId);


  useEffect(() => {
    try {
      const stored = localStorage.getItem('fc-chat-show-details');
      if (stored !== null) {
        setShowDetails(stored === 'true');
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  useEffect(() => {
    try {
      const prefill = localStorage.getItem('fc-chat-prefill');
      if (prefill) {
        setInputPrefill(prefill);
        localStorage.removeItem('fc-chat-prefill');
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('fc-chat-show-details', String(showDetails));
    } catch {
      // ignore storage errors
    }
  }, [showDetails]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleChangePassword = async (currentPassword: string, newPassword: string) => {
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
  };

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

  const syncProfileToAgent = useCallback(async (source: ProfileSyncSource, profileOverride?: UserProfile) => {
    const nowIso = new Date().toISOString();
    const profileToSync = profileOverride ?? profile;
    if (!profileToSync) {
      setProfileSyncInfo({ at: nowIso, source, status: 'skipped', reason: 'No profile loaded' });
      return;
    }
    if (!isConnected) {
      setProfileSyncInfo({ at: nowIso, source, status: 'skipped', reason: 'Gateway disconnected' });
      return;
    }
    if (!currentSessionKey) {
      setProfileSyncInfo({ at: nowIso, source, status: 'skipped', reason: 'No active session' });
      return;
    }
    if (typeof window === 'undefined') {
      setProfileSyncInfo({ at: nowIso, source, status: 'skipped', sessionKey: currentSessionKey, reason: 'Not in browser context' });
      return;
    }

    const syncPayload = {
      userId,
      source,
      profile: {
        name: profileToSync.name,
        role: profileToSync.role,
        software: profileToSync.software,
        preferences: profileToSync.preferences,
        frequentTopics: profileToSync.frequentTopics,
        learnedContext: profileToSync.learnedContext,
        lastUpdated: profileToSync.lastUpdated,
      },
      sessionHints: sessionHints.length > 0 ? sessionHints : undefined,
    };

    const fingerprint = hashString(JSON.stringify(syncPayload));
    const syncKey = `${currentSessionKey}:${fingerprint}`;
    if (lastProfileSyncKeyRef.current === syncKey) {
      setProfileSyncInfo({
        at: nowIso,
        source,
        status: 'skipped',
        sessionKey: currentSessionKey,
        fingerprint,
        reason: 'Already synced (same fingerprint in memory)',
      });
      return;
    }

    const storageKey = `fc-profile-sync:${currentSessionKey}`;
    const storedFingerprint = localStorage.getItem(storageKey);
    if (storedFingerprint === fingerprint) {
      lastProfileSyncKeyRef.current = syncKey;
      setProfileSyncInfo({
        at: nowIso,
        source,
        status: 'skipped',
        sessionKey: currentSessionKey,
        fingerprint,
        reason: 'Already synced (same fingerprint in localStorage)',
      });
      return;
    }

    const highConfidenceLearning = recentLearning
      .filter((e) => e.confidence > 0.7)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5)
      .map((e) => ({ dimension: e.dimension, insight: e.insight, confidence: e.confidence }));

    try {
      await sendMessage({ text: buildProfileSyncMessage({
        userId,
        source,
        profile: profileToSync,
        sessionHints: sessionHints.length > 0 ? sessionHints : undefined,
        recentLearning: highConfidenceLearning.length > 0 ? highConfidenceLearning : undefined,
      }), silent: true });
      setProfileSyncInfo({
        at: new Date().toISOString(),
        source,
        status: 'sent',
        sessionKey: currentSessionKey,
        fingerprint,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to sync profile';
      setProfileSyncInfo({
        at: new Date().toISOString(),
        source,
        status: 'failed',
        sessionKey: currentSessionKey,
        fingerprint,
        reason: message,
      });
      throw err;
    }

    localStorage.setItem(storageKey, fingerprint);
    lastProfileSyncKeyRef.current = syncKey;
  }, [profile, isConnected, currentSessionKey, userId, sendMessage, sessionHints, recentLearning]);

  const handleSend = useCallback(async (message: string, attachments: ChatAttachmentInput[] = []) => {
    const trimmed = message.trim();
    const hasAttachments = attachments.length > 0;
    if (!trimmed && !hasAttachments) return;

    setThinkingIndex(0);
    setShowFastAck(false);
    if (fastAckTimerRef.current !== null) {
      window.clearTimeout(fastAckTimerRef.current);
      fastAckTimerRef.current = null;
    }

    if (isGuest) {
      setIsLoginModalOpen(true);
      return;
    }

    const hasProfileData =
      Boolean(profile?.name?.trim()) ||
      Boolean(profile?.role?.trim()) ||
      Boolean(profile?.software?.length) ||
      Boolean(profile?.frequentTopics?.length) ||
      Boolean(profile?.learnedContext?.length) ||
      Boolean(profile?.preferences && Object.keys(profile.preferences).length);

    if (hasProfileData) {
      try {
        await syncProfileToAgent('initial');
      } catch (err) {
        console.error('Failed to sync profile to agent:', err);
      }
    }

    captureSignalMessage(trimmed);
    sendMessage({ text: trimmed, attachments });
  }, [captureSignalMessage, isGuest, profile, sendMessage, setIsLoginModalOpen, syncProfileToAgent]);

  const handleSuggestionClick = useCallback((text: string, requiresInput = false) => {
    if (requiresInput || (!isGuest && !isConnected)) {
      setInputPrefill(text);
      return;
    }
    void handleSend(text, []);
  }, [handleSend, isConnected, isGuest, setInputPrefill]);

  const handleSurpriseMe = useCallback(() => {
    const sendable = CAPABILITY_CATEGORIES.filter((c) => !c.requiresInput);
    const pool = sendable.length > 0 ? sendable : CAPABILITY_CATEGORIES;
    if (pool.length === 0) return;

    const randomIndex = Math.floor(Math.random() * pool.length);
    const selected = pool[randomIndex];
    handleSuggestionClick(selected.defaultAction, selected.requiresInput);
  }, [handleSuggestionClick]);

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
      setProfileModalSource('manual');
      try {
        localStorage.removeItem(`fc-profile-onboarding-snooze-until:${userId}`);
      } catch {
        // ignore storage errors
      }
      await syncProfileToAgent('update', data.profile);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save profile';
      setProfileError(message);
    } finally {
      setProfileSaving(false);
    }
  }, [syncProfileToAgent, userId]);

  const handleOpenProfile = useCallback(() => {
    setProfileError(null);
    setProfileModalSource('manual');
    setIsProfileModalOpen(true);
    fetchProfile();
  }, [fetchProfile]);

  const handleCloseProfile = useCallback(() => {
    setIsProfileModalOpen(false);
    if (profileModalSource !== 'onboarding') return;
    const missingBasics = !profile?.name?.trim() || !profile?.role?.trim();
    if (!missingBasics) return;
    try {
      const snoozeUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      localStorage.setItem(`fc-profile-onboarding-snooze-until:${userId}`, snoozeUntil);
    } catch {
      // ignore storage errors
    }
  }, [profileModalSource, profile, userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (profileLoading) return;
    if (isProfileModalOpen) return;
    if (!profile) return;
    const missingBasics = !profile.name.trim() || !profile.role.trim();
    if (!missingBasics) return;
    try {
      const snoozeUntil = localStorage.getItem(`fc-profile-onboarding-snooze-until:${userId}`);
      if (snoozeUntil) {
        const snoozeMs = Date.parse(snoozeUntil);
        if (!Number.isNaN(snoozeMs) && snoozeMs > Date.now()) return;
      }
    } catch {
      // ignore storage errors
    }

    setProfileModalSource('onboarding');
    setIsProfileModalOpen(true);
  }, [profile, profileLoading, isProfileModalOpen, userId]);

  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!last || last.role !== 'assistant') return;
    const content = (last.content || '').toLowerCase();
    const isContextBreak =
      content.includes('context overflow') ||
      content.includes('summary unavailable due to context limits') ||
      content.includes('对话被压缩') ||
      content.includes('上下文被压缩') ||
      content.includes('上下文压缩');
    if (!isContextBreak) return;

    const now = Date.now();
    if (now - lastContextBreakSyncAtRef.current < 60_000) return;
    lastContextBreakSyncAtRef.current = now;

    void syncProfileToAgent('context_break');
  }, [messages, syncProfileToAgent]);

  useEffect(() => {
    if (!currentSessionKey) return;
    const sessionMessages = messages
      .filter((m) => m.sessionKey === currentSessionKey)
      .map((m) => ({ id: m.id, role: m.role, content: m.content || '' }));
    if (sessionMessages.length === 0) return;
    processSessionHints(sessionMessages, (newHints) => {
      setSessionHints(newHints);
    });
  }, [messages, currentSessionKey, processSessionHints]);

  useEffect(() => {
    void setSignalSessionKey(currentSessionKey ?? null);
  }, [currentSessionKey, setSignalSessionKey]);

  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!last) return;
    if (last.role === 'assistant' && !last.id.startsWith('hist_')) {
      captureAssistantReply();
    }
  }, [messages, captureAssistantReply]);

  const prevConnectedRef = useRef(isConnected);
  useEffect(() => {
    if (prevConnectedRef.current && !isConnected) {
      captureGatewayHealth('disconnect');
    } else if (!prevConnectedRef.current && isConnected) {
      captureGatewayHealth('reconnect');
    }
    prevConnectedRef.current = isConnected;
  }, [isConnected, captureGatewayHealth]);

  const handleAbortWithSignal = useCallback(() => {
    captureGatewayHealth('stream_aborted', { reason: 'user_abort' });
    abortChat();
  }, [captureGatewayHealth, abortChat]);

  const buildSessionText = useCallback(() => {
    const lines: string[] = [];
    for (const message of visibleMessages) {
      const role = message.role === 'user' ? 'You' : 'Assistant';
      const header = message.timestamp ? `[${message.timestamp}] ${role}` : role;
      lines.push(header);
      if (message.content) {
        lines.push(message.content);
      }
      if (showDetails && message.blocks && message.blocks.length > 0) {
        message.blocks.forEach((block) => {
          if (block.type === 'thinking' && typeof block.text === 'string' && block.text.trim()) {
            lines.push(`[Thinking]\n${block.text}`);
          }
          if (block.type === 'toolCall') {
            const toolName =
              typeof block.toolName === 'string'
                ? block.toolName
                : typeof block.name === 'string'
                  ? block.name
                  : 'Tool';
            lines.push(`[Tool] ${toolName}`);
            if (block.parameters) {
              lines.push(`[Tool Params]\n${JSON.stringify(block.parameters, null, 2)}`);
            }
            if (block.result) {
              lines.push(
                `[Tool Result]\n${typeof block.result === 'string'
                  ? block.result
                  : JSON.stringify(block.result, null, 2)
                }`
              );
            }
          }
          if (block.type === 'image_url' && typeof block.url === 'string') {
            lines.push(`[Image] ${block.url}`);
          }
        });
      }
      if (message.attachments && message.attachments.length > 0) {
        message.attachments.forEach((file) => {
          const url = file.url || file.previewUrl;
          lines.push(`[Attachment] ${file.fileName}${url ? ` — ${url}` : ''}`);
        });
      }
      lines.push('');
    }
    if (displayStreamingContent) {
      lines.push(`[Assistant - streaming]\n${displayStreamingContent}`);
    }
    return lines.join('\n').trim();
  }, [visibleMessages, displayStreamingContent, showDetails]);

  const handleCopySession = useCallback(async () => {
    const text = buildSessionText();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setSessionCopied(true);
      window.setTimeout(() => setSessionCopied(false), 1500);
    } catch (err) {
      console.error('Failed to copy session:', err);
    }
  }, [buildSessionText]);

  const sessionIdToCopy = currentSession?.sessionId || currentSessionKey || '';
  const canCopySession = Boolean(visibleMessages.length || displayStreamingContent);
  const canCopySessionId = isClient && Boolean(sessionIdToCopy);
  const canCopyAnything = isClient && (canCopySession || canCopySessionId);

  const handleCopySessionId = useCallback(async () => {
    if (!sessionIdToCopy) return;
    try {
      await navigator.clipboard.writeText(sessionIdToCopy);
      setSessionCopied(true);
      window.setTimeout(() => setSessionCopied(false), 1500);
    } catch (err) {
      console.error('Failed to copy session id:', err);
    }
  }, [sessionIdToCopy]);

  const sessionMenuRef = useRef<HTMLDivElement>(null);
  const sessionMenuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!sessionMenuOpen) return;
    const dismiss = (event: MouseEvent) => {
      if (sessionMenuRef.current?.contains(event.target as Node)) return;
      if (sessionMenuButtonRef.current?.contains(event.target as Node)) return;
      setSessionMenuOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSessionMenuOpen(false);
    };
    document.addEventListener('mousedown', dismiss);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', dismiss);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [sessionMenuOpen]);

  const isLoadingHistory = loadingHistoryKey === currentSessionKey && visibleMessages.length === 0;
  const isEmpty = !isReplaying && ((visibleMessages.length === 0 && !displayStreamingContent) || isDraftSession) && !isLoadingHistory;

  const effectiveMessages = isReplaying ? replayMessages : visibleMessages;

  const groupedMessages = useMemo(() => {
    const groups: Array<{
      role: 'user' | 'assistant';
      messages: typeof effectiveMessages;
    }> = [];

    for (const message of effectiveMessages) {
      const lastGroup = groups[groups.length - 1];
      if (lastGroup && lastGroup.role === message.role) {
        lastGroup.messages.push(message);
      } else {
        groups.push({ role: message.role, messages: [message] });
      }
    }
    return groups;
  }, [effectiveMessages]);

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-[var(--fc-off-white)] to-white">
      <Header
        userName={isGuest ? undefined : userEmail}
        onLogout={isGuest ? undefined : handleLogout}
        onChangePassword={isGuest ? undefined : () => setIsPasswordModalOpen(true)}
        onOpenProfile={isGuest ? undefined : handleOpenProfile}
        onLogin={isGuest ? () => setIsLoginModalOpen(true) : undefined}
      />

      <div className="flex-1 flex overflow-hidden">
        <ChatSidebar
          sessions={sessions}
          currentSessionKey={currentSessionKey}
          mainSessionKey={mainSessionKey}
          pinnedSessionKeys={pinnedSessionKeys}
          isOpen={isSidebarOpen}
          onNewSession={() => {
            createNewSession();
          }}
          onSelectSession={handleSwitchSession}
          onDeleteSession={handleDeleteSession}
          onTogglePin={togglePinnedSession}
          onToggle={toggleSidebar}
          agentStatus={{
            isConnected,
            isLoading,
            activeTools,
            currentSession: sessions.find((s) => s.sessionKey === currentSessionKey),
            lastThinking,
          }}
        />

        <main className="flex-1 overflow-hidden flex flex-col relative">
          {/* Error Banner */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -20, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -20, height: 0 }}
                className="flex items-center gap-2 bg-amber-50 border-b border-amber-200 px-4 py-3 text-sm text-amber-800"
              >
                <AlertCircle size={16} className="flex-shrink-0 text-amber-600" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Session Actions */}
          <div className="px-4 md:px-6 py-3 flex items-center justify-between border-b border-[var(--fc-border-gray)] bg-white/70 backdrop-blur">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowDetails((prev) => !prev)}
                className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${showDetails
                  ? 'bg-[var(--fc-black)] text-white border-[var(--fc-black)]'
                  : 'bg-white text-[var(--fc-body-gray)] border-[var(--fc-border-gray)] hover:border-[var(--fc-light-gray)]'
                  }`}
                aria-pressed={showDetails}
                title="Shows thinking process and tool calls. Tool details appear after the response completes."
              >
                Details {showDetails ? 'On' : 'Off'}
              </button>
              <button
                type="button"
                disabled={visibleMessages.length === 0 && !isReplaying}
                onClick={() => isReplaying ? stopReplay() : startReplay(visibleMessages, currentSessionKey && currentSession ? { sessionKey: currentSessionKey, sessionTitle: currentSession.displayName || currentSession.label || 'Chat' } : undefined)}
                className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5 ${isReplaying
                  ? 'bg-[var(--fc-black)] text-white border-[var(--fc-black)]'
                  : visibleMessages.length === 0
                    ? 'bg-white text-[var(--fc-light-gray)] border-[var(--fc-border-gray)] cursor-not-allowed'
                    : 'bg-white text-[var(--fc-body-gray)] border-[var(--fc-border-gray)] hover:border-[var(--fc-light-gray)]'
                  }`}
                title={isReplaying ? 'Stop replay' : 'Replay session messages for screen recording'}
              >
                {isReplaying ? <><Square size={12} /> Stop</> : <><Play size={12} /> Replay</>}
              </button>
            </div>

            <div className="flex items-center gap-2">
              {isClient && pushSupported && (
                <motion.button
                  layout
                  onClick={pushEnabled ? disablePush : enablePush}
                  disabled={pushBusy || pushPermission === 'denied' || (!pushEnabled && !vapidPublicKey)}
                  className={`relative inline-flex items-center justify-center w-[34px] h-[34px] rounded-full transition-all duration-300 ${pushEnabled
                    ? 'bg-black text-white shadow-md hover:shadow-lg border border-black'
                    : pushPermission === 'denied'
                      ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                      : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:text-gray-900 shadow-sm'
                    }`}
                  title={
                    pushError ||
                    (pushEnabled ? 'Notifications enabled' : 'Enable notifications')
                  }
                  whileHover={{ scale: pushPermission === 'denied' ? 1 : 1.05 }}
                  whileTap={{ scale: pushPermission === 'denied' ? 1 : 0.95 }}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {pushEnabled ? (
                      <motion.div
                        key="on"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center justify-center"
                      >
                        <BellRing size={16} className="animate-pulse-slow" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="off"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center justify-center"
                      >
                        <Bell size={16} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              )}
              <div className="relative">
                <button
                  ref={sessionMenuButtonRef}
                  onClick={() => {
                    if (!canCopyAnything) return;
                    setSessionMenuOpen((prev) => !prev);
                  }}
                  disabled={!canCopyAnything}
                  aria-haspopup="menu"
                  aria-expanded={sessionMenuOpen}
                  className="inline-flex items-center justify-center w-[34px] h-[34px] rounded-full border border-[var(--fc-border-gray)] bg-white hover:bg-[var(--fc-subtle-gray)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Copy options"
                >
                  {sessionCopied ? <Check size={16} /> : <Copy size={16} />}
                </button>
                {sessionMenuOpen && (
                  <div
                    ref={sessionMenuRef}
                    role="menu"
                    className="absolute right-0 mt-2 min-w-[180px] py-1 bg-white rounded-lg shadow-lg border border-[var(--fc-border-gray)] z-30"
                  >
                    <button
                      role="menuitem"
                      disabled={!canCopySession}
                      onClick={() => {
                        handleCopySession();
                        setSessionMenuOpen(false);
                      }}
                      className={`w-full px-3 py-1.5 text-left text-xs flex items-center gap-2 ${
                        canCopySession
                          ? 'text-[var(--fc-body-gray)] hover:bg-[var(--fc-subtle-gray)]'
                          : 'text-[var(--fc-light-gray)] cursor-not-allowed'
                      }`}
                    >
                      <Copy size={12} /> Copy Session
                    </button>
                    <button
                      role="menuitem"
                      disabled={!canCopySessionId}
                      onClick={() => {
                        handleCopySessionId();
                        setSessionMenuOpen(false);
                      }}
                      className={`w-full px-3 py-1.5 text-left text-xs flex items-center gap-2 ${
                        canCopySessionId
                          ? 'text-[var(--fc-body-gray)] hover:bg-[var(--fc-subtle-gray)]'
                          : 'text-[var(--fc-light-gray)] cursor-not-allowed'
                      }`}
                    >
                      <FileText size={12} /> Copy Session ID
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto scroll-smooth"
            onScroll={handleScroll}
          >
            <div className="max-w-3xl mx-auto px-4 py-6">
              {isLoadingHistory ? (
                <div className="space-y-6 py-8 animate-pulse">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className={`flex gap-3 ${i % 2 === 0 ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className="w-8 h-8 rounded-xl bg-zinc-200 flex-shrink-0" />
                      <div className={`flex flex-col ${i % 2 === 0 ? 'items-end' : 'items-start'} max-w-[70%]`}>
                        <div className="w-12 h-3 bg-zinc-100 rounded mb-2" />
                        <div className={`rounded-2xl ${i % 2 === 0 ? 'bg-zinc-300 rounded-tr-sm' : 'bg-zinc-100 rounded-tl-sm'} p-4 space-y-2`}>
                          <div className="h-3 bg-zinc-200 rounded w-48" />
                          <div className="h-3 bg-zinc-200 rounded w-32" />
                          {i % 2 !== 0 && <div className="h-3 bg-zinc-200 rounded w-56" />}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : isEmpty ? (
                <motion.div
                  className="min-h-[calc(100vh-280px)] flex flex-col justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  {/* Hero Section */}
                  <motion.div
                    className="text-center mb-10"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                  >
                    <motion.div
                      className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--fc-red)] to-[var(--fc-action-red)] mx-auto mb-6 flex items-center justify-center shadow-xl"
                      initial={{ scale: 0.8, rotate: -10 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    >
                      <Bot size={40} className="text-white" />
                    </motion.div>

                    {/* 主标题 */}
                    <h1 className="text-3xl md:text-4xl font-bold text-[var(--fc-black)] mb-3 tracking-tight">
                      Hey! I&apos;m Fiducial&apos;s unpaid intern.
                    </h1>

                    {/* 副标题 */}
                    <p className="text-[var(--fc-body-gray)] max-w-md mx-auto mb-3 text-base leading-relaxed">
                      24/7 availability is expected. No salary, but endless enthusiasm.
                    </p>

                    {/* 品牌标识 */}
                    <div className="flex items-center justify-center gap-1.5 text-sm text-[var(--fc-light-gray)]">
                      <Zap size={12} />
                      <span>Powered by Fiducial AI</span>
                    </div>
                  </motion.div>

                  {/* Capability Bento Grid */}
                  <div className="mb-8">
                    <p className="text-[15px] font-semibold tracking-tight text-[var(--fc-body-gray)] mb-4 text-center font-[family-name:var(--font-manrope)]">
                      Here&apos;s what I can help you with:
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {CAPABILITY_CATEGORIES.map((category, index) => (
                        <CapabilityCard
                          key={category.id}
                          icon={category.icon}
                          title={category.title}
                          description={category.description}
                          color={category.color}
                          delay={index * 0.05}
                          disabled={isLoading}
                          onClick={() =>
                            handleSuggestionClick(category.defaultAction, category.requiresInput)
                          }
                        />
                      ))}
                    </div>
                  </div>

                  {/* Surprise Me Button */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                  >
                    <motion.button
                      type="button"
                      onClick={handleSurpriseMe}
                      disabled={isLoading}
                      className="mx-auto flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[var(--fc-red)] to-[var(--fc-action-red)] text-white rounded-full text-sm font-medium shadow-lg hover:shadow-xl transition-shadow disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-lg"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Sparkles size={16} />
                      Surprise Me
                    </motion.button>
                  </motion.div>
                </motion.div>
              ) : (
                <div className="space-y-2 pb-4">
                  {historyLimitReached && (
                    <div className="flex items-center justify-center gap-2 px-4 py-2.5 mx-auto max-w-md rounded-full bg-[var(--fc-subtle-gray)] text-[var(--fc-light-gray)] text-xs">
                      <AlertCircle size={13} />
                      <span>Showing the latest {HISTORY_DISPLAY_LIMIT} messages. Older messages are not loaded.</span>
                    </div>
                  )}
                  {groupedMessages.map((group, groupIndex) => (
                    <MessageGroup
                      key={`group-${groupIndex}-${group.messages[0]?.id}`}
                      messages={group.messages}
                      role={group.role}
                      showThinking={showDetails}
                      showTools={showDetails}
                      onRetryAttachment={retryFileAttachment}
                      onFeedback={(messageId, value) => captureFeedback(messageId, value)}
                    />
                  ))}

                  {displayStreamingContent && (
                    <ChatMessage
                      messageId="stream"
                      content={displayStreamingContent}
                      role="assistant"
                      isStreaming={isReplaying ? replayPhase === 'streaming' : true}
                    />
                  )}

                  {!displayStreamingContent && !isReplaying && showFastAck && (
                    <ChatMessage
                      messageId="fast-ack"
                      content={THINKING_PHRASES[thinkingIndex]}
                      role="assistant"
                      isStreaming
                    />
                  )}

                  {!displayStreamingContent && isReplaying && replayPhase === 'thinking' && (
                    <ChatMessage
                      messageId="replay-thinking"
                      content="Thinking..."
                      role="assistant"
                      isStreaming
                    />
                  )}

                  <ToolStream
                    activeTools={activeTools}
                    isLoading={isLoading}
                    showDetails={showDetails}
                  />


                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Chat Input */}
          {isReplaying ? null : (
            <ChatInput
              onSend={handleSend}
              onAbort={handleAbortWithSignal}
              disabled={isLoading || (!isGuest && !isConnected)}
              isLoading={isLoading}
              prefillValue={inputPrefill}
              onPrefillConsumed={() => setInputPrefill('')}
              isSidebarOpen={isSidebarOpen}
            />
          )}

          <AnimatePresence>
            {isReplaying && (
              <ReplayControls
                isPaused={replayPaused}
                phase={replayPhase}
                progress={replayProgress}
                speed={replaySpeed}
                sessionTitle={replaySession?.sessionTitle}
                onPlay={resumeReplay}
                onPause={pauseReplay}
                onStop={stopReplay}
                onSpeedChange={setReplaySpeed}
                onSkipNext={skipToNext}
              />
            )}
          </AnimatePresence>
        </main>
      </div>

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={() => {
          setIsLoginModalOpen(false);
          router.refresh();
        }}
      />

      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSubmit={handleChangePassword}
      />

      <UserProfileModal
        key={`${userId}:${profileLoading ? 'loading' : profile?.lastUpdated ?? 'empty'}`}
        isOpen={isProfileModalOpen}
        onClose={handleCloseProfile}
        profile={profile}
        isLoading={profileLoading}
        isSaving={profileSaving}
        error={profileError}
        onSave={saveProfile}
      />

      <AgentInsightPanel
        isConnected={isConnected}
        isLoading={isLoading}
        activeTools={activeTools}
        currentSession={sessions.find((s) => s.sessionKey === currentSessionKey)}
        lastThinking={lastThinking}
        userId={userId}
        userProfile={profile}
        profileSyncInfo={profileSyncInfo}
        recentToolTrace={recentToolTrace}
        recentLearning={recentLearning}
      />
    </div>
  );
}
