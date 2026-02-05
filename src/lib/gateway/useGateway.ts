'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { GatewayClient } from './client';
import type {
  ChatAttachment,
  ChatAttachmentInput,
  ChatContentBlock,
  ChatEventPayload,
  SessionEntry,
  ToolEventPayload,
} from './types';
import { uploadFileAndCreateSignedUrl } from '@/lib/storage/upload';

interface Message {
  id: string;
  sessionKey: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
  blocks?: ChatContentBlock[];
  attachments?: ChatAttachment[];
  sent?: boolean;
  isToolResult?: boolean;
}

interface HistoryMessage {
  role: string;
  content: ChatContentBlock[] | string;
  toolName?: string;
  toolCallId?: string;
}

interface SendMessagePayload {
  text: string;
  attachments?: ChatAttachmentInput[];
  sessionKey?: string;
  silent?: boolean;
}

interface UseGatewayOptions {
  userId: string;
}

type SessionTitleSource = 'auto' | 'user' | 'remote';

type SessionTitleCacheEntry = {
  title: string;
  source: SessionTitleSource;
  updatedAtMs: number;
};

type PendingTitleUpdate = {
  title: string;
  source: SessionTitleSource;
  queuedAtMs: number;
};

type SessionListEntry = SessionEntry & {
  resetAt?: string;
};

type PendingSuppressedRun = {
  sessionKey: string;
  runId: string | null;
  queuedAtMs: number;
};

const SESSION_TITLE_CACHE_KEY = 'fc-session-titles';
const SESSION_TITLES_API_PATH = '/api/session-titles';
const DEFAULT_MAIN_TITLE = 'Main Chat';
const DEFAULT_NEW_TITLE = 'New Chat';
const CLIENT_DISPLAY_NAME = 'fc-team-chat';
const MAX_SESSION_TITLE_LENGTH = 80;
const PROFILE_SYNC_PREFIX = '[fc:profile-sync:v1]';

function isNoiseTitleSeed(seed: string): boolean {
  const trimmed = seed.trim();
  if (!trimmed) return true;
  if (trimmed.startsWith(PROFILE_SYNC_PREFIX)) return true;
  // Reserve `[fc:*]` for internal/system messages (profile sync, etc).
  if (trimmed.startsWith('[fc:')) return true;
  return false;
}

function isProfileSyncMessage(text: string): boolean {
  return text.trim().startsWith(PROFILE_SYNC_PREFIX);
}

function isNoReplyText(text: string): boolean {
  return text.trim().toUpperCase() === 'NO_REPLY';
}

function isStandaloneNoText(text: string): boolean {
  return text.trim().toUpperCase() === 'NO';
}

function normalizeTitleCacheEntry(value: unknown): SessionTitleCacheEntry | null {
  if (typeof value === 'string') {
    const title = value.trim();
    if (!title) return null;
    if (title === CLIENT_DISPLAY_NAME) return null;
    if (isNoiseTitleSeed(title)) return null;
    return { title, source: 'auto', updatedAtMs: 0 };
  }
  if (!value || typeof value !== 'object') return null;
  const entry = value as Record<string, unknown>;
  if (typeof entry.title !== 'string' || entry.title.trim().length === 0) return null;
  const title = entry.title.trim();
  if (title === CLIENT_DISPLAY_NAME) return null;
  if (isNoiseTitleSeed(title)) return null;
  const source =
    entry.source === 'user' || entry.source === 'remote' ? entry.source : 'auto';
  const updatedAtMs = typeof entry.updatedAtMs === 'number' ? entry.updatedAtMs : 0;
  return { title, source, updatedAtMs };
}

function normalizeContentBlocks(content: unknown): ChatContentBlock[] {
  if (!content) return [];
  if (typeof content === 'string') {
    return [{ type: 'text', text: content }];
  }
  if (Array.isArray(content)) {
    return content
      .map((block) => normalizeBlock(block))
      .filter((block): block is ChatContentBlock => Boolean(block && block.type));
  }
  return [];
}

function normalizeBlock(raw: unknown): ChatContentBlock | null {
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

    return {
      ...block,
      type: 'toolCall',
      toolName,
      toolCallId,
      parameters,
      result,
      error,
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
}

function extractTextFromContent(content: unknown): string {
  const blocks = normalizeContentBlocks(content);
  if (blocks.length === 0) return '';
  return blocks
    .filter((block) => block.type === 'text' && typeof block.text === 'string')
    .map((block) => block.text)
    .join('');
}

function mergeStreamingText(prev: string, next: string): string {
  if (!prev) return next;
  if (!next) return prev;
  if (next === prev) return prev;
  if (next.startsWith(prev)) return next;

  // Best-effort overlap join to support both:
  // - "full so far" payloads (next startsWith prev)
  // - "delta chunk" payloads (next is just new text)
  // - "sliding window" payloads (next includes tail of prev + new)
  const maxOverlap = Math.min(prev.length, next.length, 4000);
  for (let overlap = maxOverlap; overlap > 0; overlap -= 1) {
    if (prev.slice(-overlap) === next.slice(0, overlap)) {
      return prev + next.slice(overlap);
    }
  }

  return prev + next;
}

function chooseFinalText(streamText: string, eventText: string): string {
  const streamTrimmed = streamText.trim();
  const eventTrimmed = eventText.trim();
  if (!eventTrimmed) return streamText;
  if (!streamTrimmed) return eventText;
  return eventText.length >= streamText.length ? eventText : streamText;
}

function formatTimestamp(): string {
  return new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function parseAttachmentMetadata(text: string): {
  cleanText: string;
  attachments: ChatAttachment[];
} {
  const attachments: ChatAttachment[] = [];
  const pattern = /(?:Image|File): ([^\n]*)\nURL: ([^\n]*)/g;
  let match;
  while ((match = pattern.exec(text)) !== null) {
    const name = match[1].trim();
    const url = match[2].trim();
    const isImage = match[0].startsWith('Image:');
    attachments.push({
      id: crypto.randomUUID(),
      kind: isImage ? 'image' : 'file',
      fileName: name,
      mimeType: isImage ? 'image/jpeg' : 'application/octet-stream',
      size: 0,
      url,
      previewUrl: isImage ? url : undefined,
      status: 'ready',
    });
  }
  const cleanText = text
    .replace(/\n\n(?:(?:Image|File): [^\n]*\nURL: [^\n]*(?:\n|$))+/g, '')
    .replace(/^(?:(?:Image|File): [^\n]*\nURL: [^\n]*(?:\n|$))+/g, '')
    .replace(/^Attached (?:image|file)\(s\)\.$/g, '')
    .trim();
  return { cleanText, attachments };
}

function generateSessionTitle(message: string): string {
  const cleaned = message.trim().replace(/\s+/g, ' ');
  if (cleaned.length <= 30) return cleaned;
  return cleaned.slice(0, 30).trim() + '...';
}

function normalizeSessionTitleInput(title: string): string | null {
  const trimmed = title.trim().replace(/\s+/g, ' ');
  if (!trimmed) return null;
  if (trimmed.length <= MAX_SESSION_TITLE_LENGTH) return trimmed;
  return trimmed.slice(0, MAX_SESSION_TITLE_LENGTH).trim();
}

function buildFileUrlText(entries: Array<{ name: string; url: string }>) {
  if (entries.length === 0) return '';
  return entries.map((entry) => `File: ${entry.name}\nURL: ${entry.url}`).join('\n');
}

function buildImageUrlText(entries: Array<{ name: string; url: string }>) {
  if (entries.length === 0) return '';
  return entries.map((entry) => `Image: ${entry.name}\nURL: ${entry.url}`).join('\n');
}

function buildOutboundText(params: {
  text: string;
  imageUrlText: string;
  fileUrlText: string;
  hasImages: boolean;
  hasFiles: boolean;
}) {
  const { text, imageUrlText, fileUrlText, hasImages, hasFiles } = params;
  const outboundParts: string[] = [];
  if (text) outboundParts.push(text);
  if (imageUrlText) outboundParts.push(imageUrlText);
  if (fileUrlText) outboundParts.push(fileUrlText);
  const fallbackText = hasImages && !hasFiles ? 'Attached image(s).' : 'Attached file(s).';
  return outboundParts.join('\n\n') || fallbackText;
}

interface UploadResult {
  id: string;
  url: string;
  name: string;
}

interface AttachmentUploadResult {
  imageResults: UploadResult[];
  fileResults: UploadResult[];
  imageError: Error | null;
  fileError: Error | null;
}

async function uploadAttachmentsInParallel(
  imageInputs: ChatAttachmentInput[],
  fileInputs: ChatAttachmentInput[],
  userId: string
): Promise<AttachmentUploadResult> {
  const uploadBatch = async (inputs: ChatAttachmentInput[]): Promise<UploadResult[]> => {
    return Promise.all(
      inputs.map(async (item) => {
        const upload = await uploadFileAndCreateSignedUrl({
          file: item.file,
          userId,
        });
        return { id: item.id, url: upload.signedUrl, name: item.file.name };
      })
    );
  };

  const [imageSettled, fileSettled] = await Promise.allSettled([
    imageInputs.length > 0 ? uploadBatch(imageInputs) : Promise.resolve([]),
    fileInputs.length > 0 ? uploadBatch(fileInputs) : Promise.resolve([]),
  ]);

  return {
    imageResults: imageSettled.status === 'fulfilled' ? imageSettled.value : [],
    fileResults: fileSettled.status === 'fulfilled' ? fileSettled.value : [],
    imageError: imageSettled.status === 'rejected' ? imageSettled.reason as Error : null,
    fileError: fileSettled.status === 'rejected' ? fileSettled.reason as Error : null,
  };
}

const CURRENT_SESSION_KEY = 'fc-chat-current-session';
const GATEWAY_AGENT_ID = 'work';
const WEBCHAT_CHANNEL = 'webchat';
// Gateway chat.history API enforces limit <= 1000
const HISTORY_LIMIT = 1000;
const GATEWAY_KEEPALIVE_INTERVAL_MS = 20_000;
const GATEWAY_CONNECTION_MONITOR_INTERVAL_MS = 2_000;
const GATEWAY_RECONNECT_BASE_DELAY_MS = 1_000;
const GATEWAY_RECONNECT_MAX_DELAY_MS = 30_000;

function buildSessionKey(peerId: string): string {
  return `agent:${GATEWAY_AGENT_ID}:${WEBCHAT_CHANNEL}:dm:${peerId}`;
}

function buildPeerId(userId: string, sessionId?: string): string {
  if (!sessionId) return userId;
  return `${userId}-${sessionId}`;
}

function isUserWebchatSession(sessionKey: string | undefined, userId: string): boolean {
  if (!sessionKey) return false;
  const parts = sessionKey.split(':');
  if (parts.length < 5) return false;
  if (parts[0] !== 'agent' || parts[1] !== GATEWAY_AGENT_ID) return false;
  if (parts[2] !== WEBCHAT_CHANNEL) return false;
  if (parts[3] !== 'dm') return false;

  const peerId = parts.slice(4).join(':');
  return peerId.startsWith(userId);
}

export function useGateway({ userId }: UseGatewayOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessions, setSessions] = useState<SessionListEntry[]>([]);
  const [currentSessionKey, setCurrentSessionKey] = useState<string>(() => {
    if (!userId) return '';
    try {
      const stored = localStorage.getItem(`${CURRENT_SESSION_KEY}:${userId}`) || '';
      if (stored && isUserWebchatSession(stored, userId)) {
        return stored;
      }
      return '';
    } catch {
      return '';
    }
  });
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingHistoryKey, setLoadingHistoryKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDraftSession, setIsDraftSession] = useState(false);
  const [activeTools, setActiveTools] = useState<Map<string, ToolEventPayload>>(new Map());
  const [historyLimitReached, setHistoryLimitReached] = useState(false);

  const clientRef = useRef<GatewayClient | null>(null);
  const currentRunIdRef = useRef<string | null>(null);
  const streamBufferRef = useRef('');
  const streamPendingRef = useRef('');
  const streamFrameRef = useRef<number | null>(null);
  const currentSessionKeyRef = useRef(currentSessionKey);
  const sessionsRef = useRef(sessions);
  const messagesRef = useRef(messages);
  const pendingSessionsRef = useRef(new Set<string>());
  const isDraftSessionRef = useRef(isDraftSession);
  const skipHistoryLoadRef = useRef(false);
  const pendingSuppressedRunRef = useRef<PendingSuppressedRun | null>(null);
  const toolRemovalTimersRef = useRef<Map<string, number>>(new Map());
  const sessionTitleCacheRef = useRef<Record<string, SessionTitleCacheEntry | undefined>>({});
  const pendingTitleUpdatesRef = useRef<Map<string, PendingTitleUpdate>>(new Map());
  const pendingTitleRemovalsRef = useRef<Set<string>>(new Set());
  const titleSyncInFlightRef = useRef(false);
  const titleSyncTimerRef = useRef<number | null>(null);
  const lastGatewaySessionListRef = useRef<SessionEntry[] | null>(null);
  const sessionIdByKeyRef = useRef<Map<string, string>>(new Map());
  const resetAtByKeyRef = useRef<Map<string, number>>(new Map());
  const errorTimeoutRef = useRef<number | null>(null);
  const isLoadingRef = useRef(isLoading);

  useEffect(() => {
    return () => {
      if (errorTimeoutRef.current !== null) {
        window.clearTimeout(errorTimeoutRef.current);
        errorTimeoutRef.current = null;
      }
      if (titleSyncTimerRef.current !== null) {
        window.clearTimeout(titleSyncTimerRef.current);
        titleSyncTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!userId) return;
    try {
      const raw = localStorage.getItem(`${SESSION_TITLE_CACHE_KEY}:${userId}`);
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        if (parsed && typeof parsed === 'object') {
          const normalized: Record<string, SessionTitleCacheEntry> = {};
          for (const [key, value] of Object.entries(parsed)) {
            const entry = normalizeTitleCacheEntry(value);
            if (entry) normalized[key] = entry;
          }
          sessionTitleCacheRef.current = normalized;
        }
      }
    } catch {
      sessionTitleCacheRef.current = {};
    }
  }, [userId]);

  const persistSessionTitle = useCallback(
    (sessionKey: string, title: string, source: SessionTitleSource) => {
      if (!userId) return;
      if (title === CLIENT_DISPLAY_NAME) return;
      sessionTitleCacheRef.current = {
        ...sessionTitleCacheRef.current,
        [sessionKey]: {
          title,
          source,
          updatedAtMs: Date.now(),
        },
      };
      try {
        localStorage.setItem(
          `${SESSION_TITLE_CACHE_KEY}:${userId}`,
          JSON.stringify(sessionTitleCacheRef.current)
        );
      } catch {
        // ignore localStorage errors
      }
    },
    [userId]
  );

  const removeSessionTitleCache = useCallback((sessionKey: string) => {
    if (!userId) return;
    if (!sessionTitleCacheRef.current[sessionKey]) return;
    const next = { ...sessionTitleCacheRef.current };
    delete next[sessionKey];
    sessionTitleCacheRef.current = next;
    try {
      localStorage.setItem(
        `${SESSION_TITLE_CACHE_KEY}:${userId}`,
        JSON.stringify(sessionTitleCacheRef.current)
      );
    } catch {
      // ignore localStorage errors
    }
  }, [userId]);

  const pruneSessionTitleCache = useCallback((keepKeys: Set<string>) => {
    if (!userId) return;
    let changed = false;
    const next: Record<string, SessionTitleCacheEntry> = {};
    for (const [key, entry] of Object.entries(sessionTitleCacheRef.current)) {
      if (keepKeys.has(key) && entry) {
        next[key] = entry;
      } else {
        changed = true;
      }
    }
    if (!changed) return;
    sessionTitleCacheRef.current = next;
    try {
      localStorage.setItem(
        `${SESSION_TITLE_CACHE_KEY}:${userId}`,
        JSON.stringify(sessionTitleCacheRef.current)
      );
    } catch {
      // ignore localStorage errors
    }
  }, [userId]);

  const pushTransientError = useCallback((message: string, timeoutMs = 6000) => {
    setError(message);
    if (errorTimeoutRef.current !== null) {
      window.clearTimeout(errorTimeoutRef.current);
    }
    errorTimeoutRef.current = window.setTimeout(() => {
      setError((current) => (current === message ? null : current));
      errorTimeoutRef.current = null;
    }, timeoutMs);
  }, []);

  const flushPendingTitleUpdates = useCallback(async () => {
    if (titleSyncInFlightRef.current) return;
    if (!userId) return;

    const pendingEntries = Array.from(pendingTitleUpdatesRef.current.entries());
    const pendingRemovals = Array.from(pendingTitleRemovalsRef.current);
    if (pendingEntries.length === 0 && pendingRemovals.length === 0) return;

    titleSyncInFlightRef.current = true;
    pendingTitleUpdatesRef.current.clear();
    pendingTitleRemovalsRef.current.clear();

    const setPayload: Record<string, SessionTitleCacheEntry> = {};
    for (const [sessionKey, pending] of pendingEntries) {
      setPayload[sessionKey] = {
        title: pending.title,
        source: pending.source,
        updatedAtMs: pending.queuedAtMs,
      };
    }

    try {
      const res = await fetch(SESSION_TITLES_API_PATH, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          set: setPayload,
          remove: pendingRemovals,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || 'Failed to sync session titles');
      }
    } catch (err) {
      console.error('Failed to sync session titles:', err);
      // Re-queue so we can retry later.
      for (const [sessionKey, pending] of pendingEntries) {
        pendingTitleUpdatesRef.current.set(sessionKey, pending);
      }
      for (const key of pendingRemovals) {
        pendingTitleRemovalsRef.current.add(key);
      }
      pushTransientError('Failed to sync session titles.');
    } finally {
      titleSyncInFlightRef.current = false;
    }
  }, [pushTransientError, userId]);

  const scheduleTitleSync = useCallback(
    (delayMs = 1200) => {
      if (titleSyncTimerRef.current !== null) {
        window.clearTimeout(titleSyncTimerRef.current);
      }
      titleSyncTimerRef.current = window.setTimeout(() => {
        titleSyncTimerRef.current = null;
        void flushPendingTitleUpdates();
      }, delayMs);
    },
    [flushPendingTitleUpdates]
  );

  const queuePendingTitleUpdate = useCallback(
    (sessionKey: string, title: string, source: SessionTitleSource, queuedAtMs = Date.now()) => {
      pendingTitleUpdatesRef.current.set(sessionKey, {
        title,
        source,
        queuedAtMs,
      });
      pendingTitleRemovalsRef.current.delete(sessionKey);
      scheduleTitleSync();
    },
    [scheduleTitleSync]
  );

  const queuePendingTitleRemoval = useCallback(
    (sessionKey: string) => {
      pendingTitleRemovalsRef.current.add(sessionKey);
      pendingTitleUpdatesRef.current.delete(sessionKey);
      scheduleTitleSync();
    },
    [scheduleTitleSync]
  );

  const setSessionVerbose = useCallback(async (sessionKey: string, enabled: boolean) => {
    if (!clientRef.current || !clientRef.current.isConnected()) {
      return;
    }
    try {
      await clientRef.current.patchSession(sessionKey, { verboseLevel: enabled ? 'on' : 'off' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update details mode';
      setError(message);
    }
  }, []);

  useEffect(() => {
    if (userId && !currentSessionKey) {
      const key = buildSessionKey(buildPeerId(userId));
      setCurrentSessionKey(key);
      currentSessionKeyRef.current = key;
      
      setSessions((prev) => {
        const exists = prev.some((s) => s.sessionKey === key);
        if (exists) return prev;
        return [
          {
            sessionKey: key,
            sessionId: userId,
            displayName: DEFAULT_MAIN_TITLE,
            label: DEFAULT_MAIN_TITLE,
            updatedAt: new Date().toISOString(),
          },
          ...prev,
        ];
      });
    }
  }, [userId, currentSessionKey]);

  useEffect(() => {
    currentSessionKeyRef.current = currentSessionKey;
    if (userId && currentSessionKey) {
      try {
        localStorage.setItem(`${CURRENT_SESSION_KEY}:${userId}`, currentSessionKey);
      } catch {
        return;
      }
    }
  }, [userId, currentSessionKey]);

  useEffect(() => {
    sessionsRef.current = sessions;
  }, [sessions]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);

  const resetStreamingState = useCallback(() => {
    if (streamFrameRef.current !== null) {
      cancelAnimationFrame(streamFrameRef.current);
      streamFrameRef.current = null;
    }
    streamPendingRef.current = '';
    streamBufferRef.current = '';
    setStreamingContent('');
    setIsLoading(false);
    currentRunIdRef.current = null;
    setActiveTools(new Map());
    toolRemovalTimersRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    toolRemovalTimersRef.current.clear();
  }, []);

  const updateMessage = useCallback((messageId: string, updater: (message: Message) => Message) => {
    setMessages((prev) => prev.map((message) => (message.id === messageId ? updater(message) : message)));
  }, []);

  const applyGatewaySessions = useCallback(
    (sessionList: SessionEntry[]) => {
      lastGatewaySessionListRef.current = sessionList;
      const gatewaySessions = sessionList.filter((session) =>
        isUserWebchatSession(session.sessionKey, userId)
      );
      const gatewayKeys = new Set(gatewaySessions.map((session) => session.sessionKey));
      for (const key of gatewayKeys) {
        pendingSessionsRef.current.delete(key);
      }

      const normalizedSessions: SessionListEntry[] = gatewaySessions.map((session) => {
        const cachedEntry = sessionTitleCacheRef.current[session.sessionKey];
        let cachedTitle = cachedEntry?.title;
        if (cachedTitle === CLIENT_DISPLAY_NAME) {
          cachedTitle = undefined;
          removeSessionTitleCache(session.sessionKey);
          queuePendingTitleRemoval(session.sessionKey);
        }
        const remoteLabel = typeof session.label === 'string' ? session.label.trim() : '';
        const remoteDisplayName =
          typeof session.displayName === 'string' ? session.displayName.trim() : '';
        const originLabel =
          typeof session.origin?.label === 'string' ? session.origin.label.trim() : '';
        const rawRemoteTitle = remoteLabel || remoteDisplayName || originLabel || '';
        const remoteTitle = rawRemoteTitle === CLIENT_DISPLAY_NAME ? '' : rawRemoteTitle;

        const previousSessionId = sessionIdByKeyRef.current.get(session.sessionKey);
        const currentSessionId = session.sessionId;
        const sessionIdChanged =
          Boolean(previousSessionId && currentSessionId && previousSessionId !== currentSessionId);
        if (currentSessionId) {
          sessionIdByKeyRef.current.set(session.sessionKey, currentSessionId);
        }

        if (sessionIdChanged && cachedEntry?.source === 'auto' && cachedTitle) {
          resetAtByKeyRef.current.set(session.sessionKey, Date.now());
          removeSessionTitleCache(session.sessionKey);
          queuePendingTitleRemoval(session.sessionKey);
          cachedTitle = undefined;
        }

        const displayName = cachedTitle || remoteTitle || '';
        const resetAt = resetAtByKeyRef.current.get(session.sessionKey);
        return {
          ...session,
          displayName,
          resetAt: resetAt ? new Date(resetAt).toISOString() : undefined,
        };
      });

      const defaultKey = buildSessionKey(buildPeerId(userId));
      const hasDefaultSession = normalizedSessions.some((s) => s.sessionKey === defaultKey);
      const nextSessions: SessionListEntry[] = hasDefaultSession
        ? [...normalizedSessions]
        : [
            {
              sessionKey: defaultKey,
              sessionId: userId,
              displayName: DEFAULT_MAIN_TITLE,
              label: DEFAULT_MAIN_TITLE,
              updatedAt: new Date().toISOString(),
            },
            ...normalizedSessions,
          ];

      if (pendingSessionsRef.current.size > 0) {
        const existingByKey = new Map(
          sessionsRef.current.map((session) => [session.sessionKey, session])
        );
        for (const key of pendingSessionsRef.current) {
          const pendingSession = existingByKey.get(key);
          if (pendingSession && !nextSessions.some((session) => session.sessionKey === key)) {
            nextSessions.push(pendingSession);
          }
        }
      }

      setSessions(nextSessions);

      const keepKeys = new Set(nextSessions.map((session) => session.sessionKey));
      for (const key of pendingTitleUpdatesRef.current.keys()) {
        keepKeys.add(key);
      }

      const cachedKeys = Object.keys(sessionTitleCacheRef.current);
      const removedKeys = cachedKeys.filter((key) => !keepKeys.has(key));
      for (const key of removedKeys) {
        queuePendingTitleRemoval(key);
      }
      pruneSessionTitleCache(keepKeys);
      for (const key of resetAtByKeyRef.current.keys()) {
        if (!keepKeys.has(key)) resetAtByKeyRef.current.delete(key);
      }
      for (const key of sessionIdByKeyRef.current.keys()) {
        if (!keepKeys.has(key)) sessionIdByKeyRef.current.delete(key);
      }

      const activeKey = currentSessionKeyRef.current;
      const hasActive = activeKey
        ? nextSessions.some((session) => session.sessionKey === activeKey)
        : false;
      const isPending = activeKey ? pendingSessionsRef.current.has(activeKey) : false;

      if (!hasActive && !isPending) {
        const fallbackKey = nextSessions[0]?.sessionKey || defaultKey;
        setCurrentSessionKey(fallbackKey);
        currentSessionKeyRef.current = fallbackKey;
      }
    },
    [pruneSessionTitleCache, queuePendingTitleRemoval, removeSessionTitleCache, userId]
  );

  const updateSessionTitle = useCallback(
    async (sessionKey: string, title: string, source: SessionTitleSource = 'auto') => {
      if (!sessionKey) {
        console.warn('Missing session key for title update.');
        return;
      }

      const normalizedTitle = normalizeSessionTitleInput(title);
      if (!normalizedTitle) {
        pushTransientError('Session title cannot be empty.');
        return;
      }

      resetAtByKeyRef.current.delete(sessionKey);
      persistSessionTitle(sessionKey, normalizedTitle, source);

      setSessions((prev) =>
        prev.map((session) =>
          session.sessionKey === sessionKey
            ? {
                ...session,
                displayName: normalizedTitle,
                label: normalizedTitle,
              }
            : session
        )
      );

      // Persist titles cross-device (duplicates allowed) without patching the gateway label.
      queuePendingTitleUpdate(sessionKey, normalizedTitle, source);
    },
    [persistSessionTitle, pushTransientError, queuePendingTitleUpdate]
  );

  const ensureMainSessionLabel = useCallback(
    async (sessionList: SessionEntry[]) => {
      if (!userId) return;
      const mainKey = buildSessionKey(buildPeerId(userId));
      const cachedEntry = sessionTitleCacheRef.current[mainKey];
      const cachedTitle = typeof cachedEntry?.title === 'string' ? cachedEntry.title.trim() : '';
      const legacyFallback = `Chat ${userId.slice(0, 6)}`;
      const shouldSeedDefault =
        !cachedTitle ||
        cachedTitle === DEFAULT_NEW_TITLE ||
        cachedTitle === CLIENT_DISPLAY_NAME ||
        cachedTitle === legacyFallback;
      if (!shouldSeedDefault) return;

      const mainSession = sessionList.find((session) => session.sessionKey === mainKey);
      const remoteLabel = typeof mainSession?.label === 'string' ? mainSession.label.trim() : '';
      const remoteDisplayName =
        typeof mainSession?.displayName === 'string' ? mainSession.displayName.trim() : '';
      const remoteTitle = (remoteLabel || remoteDisplayName).trim();
      if (remoteTitle && remoteTitle !== CLIENT_DISPLAY_NAME && remoteTitle !== legacyFallback) {
        return;
      }

      if (pendingTitleUpdatesRef.current.has(mainKey)) return;
      await updateSessionTitle(mainKey, DEFAULT_MAIN_TITLE, 'auto');
    },
    [updateSessionTitle, userId]
  );

  const hydrateSessionTitlesFromSupabase = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch(SESSION_TITLES_API_PATH);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.error(
          'Failed to load session titles:',
          (data as { error?: string }).error || res.statusText
        );
        return;
      }
      const data = await res.json().catch(() => ({}));
      const rawTitles = (data as { titles?: unknown }).titles;
      const remoteTitles = rawTitles && typeof rawTitles === 'object'
        ? (rawTitles as Record<string, unknown>)
        : {};

      const normalizedRemote: Record<string, SessionTitleCacheEntry> = {};
      for (const [key, value] of Object.entries(remoteTitles)) {
        const entry = normalizeTitleCacheEntry(value);
        if (entry) normalizedRemote[key] = entry;
      }

      const local = sessionTitleCacheRef.current;
      let changed = false;
      const next: Record<string, SessionTitleCacheEntry | undefined> = { ...local };

      // Prefer the newer value (updatedAtMs) across localStorage vs Supabase.
      for (const [key, remoteEntry] of Object.entries(normalizedRemote)) {
        const localEntry = local[key];
        if (!localEntry || (localEntry.updatedAtMs ?? 0) < remoteEntry.updatedAtMs) {
          next[key] = remoteEntry;
          changed = true;
        }
      }

      // Migrate any newer local entries back to Supabase (cross-device).
      for (const [key, localEntry] of Object.entries(local)) {
        if (!localEntry) continue;
        if (localEntry.title === CLIENT_DISPLAY_NAME) continue;
        const remoteEntry = normalizedRemote[key];
        if (!remoteEntry && localEntry.updatedAtMs > 0) {
          queuePendingTitleUpdate(key, localEntry.title, localEntry.source, localEntry.updatedAtMs);
          continue;
        }
        if (remoteEntry && (localEntry.updatedAtMs ?? 0) > (remoteEntry.updatedAtMs ?? 0)) {
          queuePendingTitleUpdate(key, localEntry.title, localEntry.source, localEntry.updatedAtMs);
        }
      }

      if (!changed) return;
      sessionTitleCacheRef.current = next;
      try {
        localStorage.setItem(
          `${SESSION_TITLE_CACHE_KEY}:${userId}`,
          JSON.stringify(sessionTitleCacheRef.current)
        );
      } catch {
        // ignore localStorage errors
      }

      if (lastGatewaySessionListRef.current) {
        applyGatewaySessions(lastGatewaySessionListRef.current);
      } else {
        setSessions((prev) =>
          prev.map((session) => {
            const title = next[session.sessionKey]?.title;
            if (!title) return session;
            if (session.displayName === title) return session;
            return {
              ...session,
              displayName: title,
              label: title,
            };
          })
        );
      }
    } catch (err) {
      console.error('Failed to load session titles:', err);
    }
  }, [applyGatewaySessions, queuePendingTitleUpdate, userId]);

  useEffect(() => {
    if (!userId) return;

    const wsUrl = process.env.NEXT_PUBLIC_GATEWAY_WS_URL;
    const token = process.env.NEXT_PUBLIC_GATEWAY_TOKEN;

    if (!wsUrl) {
      setError('Gateway URL not configured');
      return;
    }

    const fallbackUrl =
      process.env.NODE_ENV === 'development' && wsUrl !== 'ws://127.0.0.1:18789'
        ? 'ws://127.0.0.1:18789'
        : null;

    const createGatewayClient = (url: string) =>
      new GatewayClient({
        url,
        token,
        clientName: CLIENT_DISPLAY_NAME,
        clientVersion: '1.0.0',
        mode: 'webchat',
        userId,
      });

    let activeClient = createGatewayClient(wsUrl);
    clientRef.current = activeClient;

    let reconnectTimer: number | null = null;
    let monitorTimer: number | null = null;
    let keepaliveTimer: number | null = null;
    let reconnectInFlight = false;
    let connectInFlight = false;
    let reconnectAttempt = 0;
    let pairingBlocked = false;

    const handleChatEvent = (event: ChatEventPayload) => {
      if (event.sessionKey !== currentSessionKeyRef.current) return;

      const suppression = pendingSuppressedRunRef.current;
      const isSuppressedRun =
        Boolean(suppression && suppression.sessionKey === event.sessionKey && event.runId) &&
        (() => {
          if (!suppression) return false;
          if (!event.runId) return false;
          if (!suppression.runId) {
            suppression.runId = event.runId;
          }
          return suppression.runId === event.runId;
        })();

      if (isSuppressedRun) {
        if (event.state === 'final' || event.state === 'error' || event.state === 'aborted') {
          pendingSuppressedRunRef.current = null;
        }
        // Extra safety: if we ever started streaming this run, clean it up without
        // touching the global loading flag (a user message may be in-flight).
        if (currentRunIdRef.current === event.runId) {
          if (streamFrameRef.current !== null) {
            cancelAnimationFrame(streamFrameRef.current);
            streamFrameRef.current = null;
          }
          streamPendingRef.current = '';
          streamBufferRef.current = '';
          setStreamingContent('');
          currentRunIdRef.current = null;
        }
        return;
      }

      if (event.state === 'delta' && event.message) {
        const nextText = extractTextFromContent(
          (event.message as { content?: unknown })?.content
        );
        if (nextText) {
          const merged = mergeStreamingText(streamBufferRef.current, nextText);
          streamBufferRef.current = merged;
          streamPendingRef.current = merged;
          if (streamFrameRef.current === null) {
            streamFrameRef.current = requestAnimationFrame(() => {
              streamFrameRef.current = null;
              setStreamingContent((prev) => {
                const pending = streamPendingRef.current;
                return prev === pending ? prev : pending;
              });
            });
          }
        }
        currentRunIdRef.current = event.runId;
      } else if (event.state === 'final') {
        if (streamFrameRef.current !== null) {
          cancelAnimationFrame(streamFrameRef.current);
          streamFrameRef.current = null;
        }
        streamPendingRef.current = '';
        const messageContent = (event.message as { content?: unknown })?.content;
        const blocks = normalizeContentBlocks(messageContent);
        const eventText = extractTextFromContent(messageContent);
        const finalText = chooseFinalText(streamBufferRef.current, eventText);
        const shouldDropReply = isNoReplyText(finalText);

        if (shouldDropReply) {
          streamBufferRef.current = '';
          setStreamingContent('');
          setIsLoading(false);
          currentRunIdRef.current = null;
          return;
        }

        if (finalText || blocks.length > 0) {
          const messageId = `run_${event.runId}`;
          const assistantMessage: Message = {
            id: messageId,
            sessionKey: event.sessionKey,
            content: finalText,
            role: 'assistant',
            timestamp: formatTimestamp(),
            blocks: blocks.length > 0 ? blocks : undefined,
            sent: true,
          };
          setMessages((prev) => {
            const existingIndex = prev.findIndex((message) => message.id === messageId);
            if (existingIndex === -1) {
              return [...prev, assistantMessage];
            }
            const next = prev.slice();
            next[existingIndex] = assistantMessage;
            return next;
          });
        }

        streamBufferRef.current = '';
        setStreamingContent('');
        setIsLoading(false);
        currentRunIdRef.current = null;
      } else if (event.state === 'error' || event.state === 'aborted') {
        if (streamFrameRef.current !== null) {
          cancelAnimationFrame(streamFrameRef.current);
          streamFrameRef.current = null;
        }
        streamPendingRef.current = '';
        setError(event.errorMessage || 'Response failed');
        streamBufferRef.current = '';
        setStreamingContent('');
        setIsLoading(false);
        currentRunIdRef.current = null;
      }
    };

    let unsubscribeChat = activeClient.onChat(handleChatEvent);

    const handleToolEvent = (event: ToolEventPayload) => {
      if (event.sessionKey !== currentSessionKeyRef.current) return;
      if (!event.toolCallId) return;

      const toolId = event.toolCallId;
      const existingTimeout = toolRemovalTimersRef.current.get(toolId);
      if (existingTimeout) {
        window.clearTimeout(existingTimeout);
        toolRemovalTimersRef.current.delete(toolId);
      }

      setActiveTools((prev) => {
        const next = new Map(prev);
        const existing = next.get(toolId);
        const nextOutput = event.outputDelta
          ? `${existing?.output ?? ''}${event.outputDelta}`
          : event.output ?? existing?.output;

        next.set(toolId, {
          ...existing,
          ...event,
          output: nextOutput,
        });

        return next;
      });

      if (event.phase === 'end') {
        const timeoutId = window.setTimeout(() => {
          setActiveTools((prev) => {
            const next = new Map(prev);
            next.delete(toolId);
            return next;
          });
          toolRemovalTimersRef.current.delete(toolId);
        }, 3000);
        toolRemovalTimersRef.current.set(toolId, timeoutId);
      }
    };

    let unsubscribeTool = activeClient.onTool(handleToolEvent);

    const replaceClient = (url: string) => {
      unsubscribeChat();
      unsubscribeTool();
      activeClient.disconnect();
      activeClient = createGatewayClient(url);
      clientRef.current = activeClient;
      unsubscribeChat = activeClient.onChat(handleChatEvent);
      unsubscribeTool = activeClient.onTool(handleToolEvent);
    };

    const markDisconnected = (message?: string) => {
      setIsConnected(false);
      if (message) setError(message);
      if (isLoadingRef.current || streamBufferRef.current) {
        resetStreamingState();
      }
    };

    const startKeepalive = () => {
      if (keepaliveTimer !== null) {
        window.clearInterval(keepaliveTimer);
        keepaliveTimer = null;
      }
      keepaliveTimer = window.setInterval(async () => {
        const client = clientRef.current;
        if (!client || !client.isConnected()) return;
        try {
          await client.health();
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Gateway keepalive failed';
          markDisconnected(message);
          // Keepalive is the earliest reliable signal of a dead socket behind proxies.
          // Reconnect quickly so chat history can refresh without a full page reload.
          scheduleReconnect(`keepalive_failed:${message}`, true);
        }
      }, GATEWAY_KEEPALIVE_INTERVAL_MS);
    };

    const connect = async () => {
      const connectClient = async (client: GatewayClient) => {
        connectInFlight = true;
        await client.connect();
        setIsConnected(true);
        setError(null);

        await hydrateSessionTitlesFromSupabase();
        const sessionList = await client.listSessions();
        applyGatewaySessions(sessionList);
        await ensureMainSessionLabel(sessionList);
        await flushPendingTitleUpdates();
        connectInFlight = false;
        startKeepalive();
      };

      const handleConnectError = (err: unknown) => {
        const errorMessage = err instanceof Error ? err.message : 'Connection failed';
        if (errorMessage.startsWith('PAIRING_REQUIRED')) {
          const pairingCode = errorMessage.split(':')[1] || 'unknown';
          setError(`Authorization required. Your pairing code: ${pairingCode}. Please contact admin to approve.`);
          setIsConnected(false);
          pairingBlocked = true;
          return { handled: true };
        }
        return { handled: false, message: errorMessage };
      };

      try {
        await connectClient(activeClient);
      } catch (err) {
        connectInFlight = false;
        const handled = handleConnectError(err);
        if (handled.handled) return;
        const errorMessage = handled.message ?? 'Connection failed';

        if (fallbackUrl) {
          console.warn(`[Gateway] Primary connection failed (${wsUrl}); retrying local gateway.`);
          replaceClient(fallbackUrl);

          try {
            await connectClient(activeClient);
          } catch (fallbackErr) {
            connectInFlight = false;
            const fallbackHandled = handleConnectError(fallbackErr);
            if (fallbackHandled.handled) return;
            const fallbackMessage = fallbackHandled.message ?? 'Connection failed';
            setError(`Primary gateway failed (${errorMessage}). Local fallback failed (${fallbackMessage}).`);
            setIsConnected(false);
            markDisconnected();
            scheduleReconnect(`initial_failed:${fallbackMessage}`);
          }
          return;
        }

        setError(errorMessage);
        setIsConnected(false);
        markDisconnected();
        scheduleReconnect(`initial_failed:${errorMessage}`);
      }
    };

    const scheduleReconnect = (reason: string, immediate = false) => {
      if (pairingBlocked) return;
      if (reconnectInFlight || connectInFlight) return;
      if (reconnectTimer !== null) return;

      const attempt = reconnectAttempt;
      const baseDelay = Math.min(
        GATEWAY_RECONNECT_MAX_DELAY_MS,
        GATEWAY_RECONNECT_BASE_DELAY_MS * 2 ** attempt
      );
      const jitter = Math.round(Math.random() * 500);
      const delay = immediate ? 0 : baseDelay + jitter;

      reconnectAttempt = Math.min(reconnectAttempt + 1, 6);
      reconnectTimer = window.setTimeout(() => {
        reconnectTimer = null;
        void reconnectNow(reason);
      }, delay);
    };

    const reconnectNow = async (reason: string) => {
      if (pairingBlocked) return;
      if (reconnectInFlight || connectInFlight) return;
      reconnectInFlight = true;
      try {
        // Force a fresh WS instance; GatewayClient.connect() cannot be reused after close.
        replaceClient(wsUrl);
        await activeClient.connect();
        setIsConnected(true);
        setError(null);
        reconnectAttempt = 0;
        startKeepalive();

        await hydrateSessionTitlesFromSupabase();
        const sessionList = await activeClient.listSessions();
        applyGatewaySessions(sessionList);
        await ensureMainSessionLabel(sessionList);
        await flushPendingTitleUpdates();
      } catch (err) {
        const handled = (() => {
          const errorMessage = err instanceof Error ? err.message : 'Connection failed';
          if (errorMessage.startsWith('PAIRING_REQUIRED')) {
            const pairingCode = errorMessage.split(':')[1] || 'unknown';
            setError(`Authorization required. Your pairing code: ${pairingCode}. Please contact admin to approve.`);
            setIsConnected(false);
            pairingBlocked = true;
            return { handled: true };
          }
          return { handled: false, message: errorMessage };
        })();
        if (!handled.handled) {
          setError((prev) => prev ?? `Gateway disconnected (${reason}). Reconnecting...`);
          setIsConnected(false);
          scheduleReconnect(`reconnect_failed:${handled.message}`);
        }
      } finally {
        reconnectInFlight = false;
      }
    };

    connect();

    const timers = toolRemovalTimersRef.current;
    monitorTimer = window.setInterval(() => {
      const client = clientRef.current;
      if (!client) return;
      if (connectInFlight || reconnectInFlight) return;
      if (!client.isConnected()) {
        markDisconnected();
        setError((prev) => prev ?? 'Gateway disconnected. Reconnecting...');
        scheduleReconnect('socket_closed');
      }
    }, GATEWAY_CONNECTION_MONITOR_INTERVAL_MS);
    return () => {
      if (reconnectTimer !== null) {
        window.clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      if (monitorTimer !== null) {
        window.clearInterval(monitorTimer);
        monitorTimer = null;
      }
      if (keepaliveTimer !== null) {
        window.clearInterval(keepaliveTimer);
        keepaliveTimer = null;
      }
      unsubscribeChat();
      unsubscribeTool();
      activeClient.disconnect();
      clientRef.current = null;
      if (streamFrameRef.current !== null) {
        cancelAnimationFrame(streamFrameRef.current);
        streamFrameRef.current = null;
      }
      timers.forEach((timeoutId) => window.clearTimeout(timeoutId));
      timers.clear();
    };
  }, [userId, applyGatewaySessions, ensureMainSessionLabel, flushPendingTitleUpdates, hydrateSessionTitlesFromSupabase, resetStreamingState]);

  useEffect(() => {
    if (!clientRef.current || !clientRef.current.isConnected() || !currentSessionKey) {
      return;
    }

    if (skipHistoryLoadRef.current) {
      skipHistoryLoadRef.current = false;
      return;
    }

    const loadHistory = async () => {
      setLoadingHistoryKey(currentSessionKey);
      setHistoryLimitReached(false);
      try {
        const history = await clientRef.current!.getHistory(currentSessionKey, HISTORY_LIMIT);
        if (Array.isArray(history) && history.length > 0) {
          const sessionHash = currentSessionKey.slice(-8);
          const loadTime = Date.now();
          const loaded: Message[] = [];
          history.forEach((msg, idx) => {
            const m = msg as HistoryMessage;
            const normalizedRole = typeof m.role === 'string' ? m.role.toLowerCase() : '';
            const isToolResult =
              normalizedRole === 'toolresult' ||
              normalizedRole === 'tool_result' ||
              normalizedRole === 'tool' ||
              normalizedRole === 'tool_output' ||
              normalizedRole === 'tooloutput';
            const contentText = extractTextFromContent(m.content);
            const isUser = normalizedRole === 'user';
            const prev = idx > 0 ? (history[idx - 1] as HistoryMessage) : null;
            const prevText = prev ? extractTextFromContent(prev.content) : '';
            const prevIsProfileSync = prevText.trim().startsWith(PROFILE_SYNC_PREFIX);

            if (!isToolResult && !isUser) {
              if (isNoReplyText(contentText)) return;
              if (isStandaloneNoText(contentText) && prevIsProfileSync) return;
            }

            const blocks = isToolResult
              ? ([
                  {
                    type: 'toolCall',
                    toolName: m.toolName || 'Tool',
                    toolCallId: m.toolCallId,
                    result: contentText,
                    status: 'completed',
                  },
                ] as ChatContentBlock[])
              : normalizeContentBlocks(m.content);
            const parsed = isUser && !isToolResult ? parseAttachmentMetadata(contentText) : null;
            loaded.push({
              id: `hist_${sessionHash}_${loadTime}_${idx}`,
              sessionKey: currentSessionKey,
              content: isToolResult ? '' : (parsed ? parsed.cleanText : contentText),
              role: isUser ? 'user' : 'assistant',
              isToolResult,
              timestamp: '',
              blocks: blocks.length > 0 ? blocks : undefined,
              attachments: parsed && parsed.attachments.length > 0 ? parsed.attachments : undefined,
              sent: true,
            });
          });
          setMessages(loaded);
          setHistoryLimitReached(history.length >= HISTORY_LIMIT);

          const firstUserMsg = loaded.find((m) => m.role === 'user' && !isNoiseTitleSeed(m.content));
          const sessionEntry = sessionsRef.current.find(
            (session) => session.sessionKey === currentSessionKey
          );
          const displayName = (sessionEntry?.label || sessionEntry?.displayName || '').trim();
          const shouldUpdateTitle =
            !!firstUserMsg &&
            (!displayName ||
              displayName === DEFAULT_MAIN_TITLE ||
              displayName === DEFAULT_NEW_TITLE ||
              isNoiseTitleSeed(displayName));

          if (shouldUpdateTitle) {
            const newTitle = generateSessionTitle(firstUserMsg.content);
            if (!isNoiseTitleSeed(newTitle)) {
              updateSessionTitle(currentSessionKey, newTitle);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load history:', err);
      } finally {
        setLoadingHistoryKey(null);
      }
    };

    loadHistory();
  }, [currentSessionKey, isConnected, updateSessionTitle]);

  const commitDraftSession = useCallback(() => {
    const newSessionId = generateSessionId();
    const peerId = buildPeerId(userId, newSessionId);
    const newSessionKey = buildSessionKey(peerId);

    const newSession: SessionEntry = {
      sessionKey: newSessionKey,
      sessionId: newSessionId,
      displayName: DEFAULT_NEW_TITLE,
      label: DEFAULT_NEW_TITLE,
      updatedAt: new Date().toISOString(),
    };

    skipHistoryLoadRef.current = true;
    setSessions((prev) => [newSession, ...prev]);
    setCurrentSessionKey(newSessionKey);
    currentSessionKeyRef.current = newSessionKey;
    pendingSessionsRef.current.add(newSessionKey);
    setIsDraftSession(false);
    isDraftSessionRef.current = false;
    return newSessionKey;
  }, [userId]);

  const sendMessage = useCallback(
    async ({ text, attachments = [], sessionKey, silent }: SendMessagePayload) => {
      if (!clientRef.current || !clientRef.current.isConnected()) {
        setError('Not connected to gateway');
        return;
      }

      let activeSessionKey = sessionKey || currentSessionKeyRef.current || currentSessionKey;

      if (isDraftSessionRef.current && !sessionKey) {
        activeSessionKey = commitDraftSession();
      }

      if (!activeSessionKey) {
        setError('No active session');
        return;
      }

      const trimmedText = text.trim();
      const isProfileSync = isProfileSyncMessage(trimmedText);
      const isSilent = Boolean(silent) || isProfileSync;
      if (isProfileSync) {
        pendingSuppressedRunRef.current = {
          sessionKey: activeSessionKey,
          runId: null,
          queuedAtMs: Date.now(),
        };
      }
      const imageInputs = attachments.filter((item) => item.kind === 'image');
      const fileInputs = attachments.filter((item) => item.kind === 'file');

      const messageId = crypto.randomUUID();
      const displayAttachments: ChatAttachment[] = attachments.map((item) => ({
        id: item.id,
        kind: item.kind,
        fileName: item.file.name,
        mimeType: item.file.type || 'application/octet-stream',
        size: item.file.size,
        previewUrl: item.previewUrl,
        file: item.file,
        status: item.kind === 'file' ? 'uploading' : 'ready',
      }));

      const userMessage: Message = {
        id: messageId,
        sessionKey: activeSessionKey,
        content: trimmedText,
        role: 'user',
        timestamp: formatTimestamp(),
        attachments: displayAttachments.length > 0 ? displayAttachments : undefined,
        sent: false,
      };

      setMessages((prev) => [...prev, userMessage]);
      setError(null);
      if (!isSilent) {
        setIsLoading(true);
        streamBufferRef.current = '';
        setStreamingContent('');
      }

      const titleSeed =
        trimmedText || (imageInputs.length > 0 ? 'Image' : fileInputs.length > 0 ? 'File' : '');
      if (titleSeed && !isNoiseTitleSeed(titleSeed)) {
        const sessionEntry = sessionsRef.current.find((session) => session.sessionKey === activeSessionKey);
        const currentTitle = (sessionEntry?.label || sessionEntry?.displayName || '').trim();
        const shouldUpdateTitle =
          !currentTitle ||
          currentTitle === DEFAULT_MAIN_TITLE ||
          currentTitle === DEFAULT_NEW_TITLE ||
          isNoiseTitleSeed(currentTitle);
        if (shouldUpdateTitle) {
          const newTitle = generateSessionTitle(titleSeed);
          if (!isNoiseTitleSeed(newTitle)) {
            updateSessionTitle(activeSessionKey, newTitle);
          }
        }
      }

      let imageUrlText = '';
      let fileUrlText = '';

      if (imageInputs.length > 0 || fileInputs.length > 0) {
        const uploadResult = await uploadAttachmentsInParallel(imageInputs, fileInputs, userId);
        const imageUrlById = new Map(uploadResult.imageResults.map((r) => [r.id, r.url]));
        const fileUrlById = new Map(uploadResult.fileResults.map((r) => [r.id, r.url]));
        const updatedAttachments: ChatAttachment[] = displayAttachments.map((item) => {
          if (item.kind === 'image') {
            const url = imageUrlById.get(item.id);
            if (uploadResult.imageError) {
              return { ...item, url, status: 'error' as const };
            }
            return url ? { ...item, url, status: 'ready' as const } : item;
          }
          if (item.kind === 'file') {
            const url = fileUrlById.get(item.id);
            if (uploadResult.fileError) {
              return { ...item, url, status: 'error' as const };
            }
            return url ? { ...item, url, status: 'ready' as const } : item;
          }
          return item;
        });

        setMessages((prev) =>
          prev.map((message) =>
            message.id === messageId ? { ...message, attachments: updatedAttachments } : message
          )
        );

        if (uploadResult.imageError || uploadResult.fileError) {
          const errorMsg =
            uploadResult.imageError?.message || uploadResult.fileError?.message || 'Upload failed';
          setError(errorMsg);
          if (!isSilent) setIsLoading(false);
          return;
        }

        imageUrlText = buildImageUrlText(
          uploadResult.imageResults.map((r) => ({ name: r.name, url: r.url }))
        );
        fileUrlText = buildFileUrlText(
          uploadResult.fileResults.map((r) => ({ name: r.name, url: r.url }))
        );
      }

      const outboundText = buildOutboundText({
        text: trimmedText,
        imageUrlText,
        fileUrlText,
        hasImages: imageInputs.length > 0,
        hasFiles: fileInputs.length > 0,
      });
      const gatewayAttachments = undefined;

      try {
        const idempotencyKey = crypto.randomUUID();
        const result = await clientRef.current.sendMessage({
          sessionKey: activeSessionKey,
          message: outboundText,
          idempotencyKey,
          attachments: gatewayAttachments,
        });

        if (isProfileSync) {
          const runId = result && typeof result.runId === 'string' ? result.runId : null;
          const pending = pendingSuppressedRunRef.current;
          if (pending && pending.sessionKey === activeSessionKey) {
            pending.runId = runId ?? pending.runId;
          } else if (runId) {
            pendingSuppressedRunRef.current = {
              sessionKey: activeSessionKey,
              runId,
              queuedAtMs: Date.now(),
            };
          }
        }
        updateMessage(messageId, (message) => ({ ...message, sent: true }));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to send message');
        if (!isSilent) setIsLoading(false);
        if (isProfileSync) {
          const pending = pendingSuppressedRunRef.current;
          if (pending && pending.sessionKey === activeSessionKey) {
            pendingSuppressedRunRef.current = null;
          }
        }
      }
    },
    [currentSessionKey, updateSessionTitle, userId, commitDraftSession, updateMessage]
  );

  const retryFileAttachment = useCallback(
    async (messageId: string, attachmentId: string) => {
      if (!clientRef.current || !clientRef.current.isConnected()) {
        setError('Not connected to gateway');
        return;
      }

      const message = messagesRef.current.find((item) => item.id === messageId);
      if (!message || message.sent) {
        return;
      }

      const attachments = message.attachments || [];
      const imageInputs = attachments.filter((item) => item.kind === 'image' && item.file);
      const fileTargets = attachments.filter(
        (item) => item.kind === 'file' && item.file && item.id === attachmentId
      );

      if (fileTargets.length === 0) return;

      setIsLoading(true);
      setError(null);

      updateMessage(messageId, (current) => {
        const nextAttachments = (current.attachments || []).map((item) =>
          item.id === attachmentId
            ? { ...item, status: 'uploading' as ChatAttachment['status'] }
            : item
        );
        return { ...current, attachments: nextAttachments };
      });

      let updatedAttachments = attachments;
      try {
        const uploadResults = await Promise.all(
          fileTargets.map(async (item) => {
            const upload = await uploadFileAndCreateSignedUrl({
              file: item.file!,
              userId,
            });
            return { id: item.id, url: upload.signedUrl, name: item.fileName };
          })
        );

        const urlById = new Map(uploadResults.map((result) => [result.id, result.url]));
        updatedAttachments = attachments.map((item) => {
          if (item.kind !== 'file') return item;
          if (item.id !== attachmentId) return item;
          const url = urlById.get(item.id);
          const status: ChatAttachment['status'] = url ? 'ready' : 'error';
          return { ...item, url, status };
        });

        updateMessage(messageId, (current) => ({ ...current, attachments: updatedAttachments }));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to upload file');
        updatedAttachments = attachments.map((item) =>
          item.kind === 'file' && item.id === attachmentId ? { ...item, status: 'error' } : item
        );
        updateMessage(messageId, (current) => ({ ...current, attachments: updatedAttachments }));
        setIsLoading(false);
        return;
      }

      const fileEntries = updatedAttachments
        .filter((item) => item.kind === 'file' && item.url)
        .map((item) => ({ name: item.fileName, url: item.url! }));
      const imageEntries = updatedAttachments
        .filter((item) => item.kind === 'image' && item.url)
        .map((item) => ({ name: item.fileName, url: item.url! }));
      const fileUrlText = buildFileUrlText(fileEntries);
      const imageUrlText = buildImageUrlText(imageEntries);
      const outboundText = buildOutboundText({
        text: message.content.trim(),
        imageUrlText,
        fileUrlText,
        hasImages: imageInputs.length > 0,
        hasFiles: updatedAttachments.some((item) => item.kind === 'file'),
      });
      const gatewayAttachments = undefined;

      try {
        const idempotencyKey = crypto.randomUUID();
        await clientRef.current.sendMessage({
          sessionKey: currentSessionKeyRef.current || currentSessionKey,
          message: outboundText,
          idempotencyKey,
          attachments: gatewayAttachments,
        });
        updateMessage(messageId, (current) => ({ ...current, sent: true }));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to send message');
      } finally {
        setIsLoading(false);
      }
    },
    [currentSessionKey, updateMessage, userId]
  );

  const createNewSession = useCallback(() => {
    setIsDraftSession(true);
    isDraftSessionRef.current = true;
    resetStreamingState();
    setMessages([]);
  }, [resetStreamingState]);

  const switchSession = useCallback((sessionKey: string) => {
    if (sessionKey !== currentSessionKey || isDraftSessionRef.current) {
      setIsDraftSession(false);
      isDraftSessionRef.current = false;
      setCurrentSessionKey(sessionKey);
      currentSessionKeyRef.current = sessionKey;
      resetStreamingState();
      setMessages([]);
    }
  }, [currentSessionKey, resetStreamingState]);

  const deleteSession = useCallback(async (sessionKey: string) => {
    if (!clientRef.current || !clientRef.current.isConnected()) {
      return;
    }

    const isMainSession = sessionKey === buildSessionKey(buildPeerId(userId)) ||
                          sessionKey.endsWith(':main');
    if (isMainSession) {
      setError('Cannot delete the main chat. Create a new chat instead.');
      return;
    }

    try {
      await clientRef.current.deleteSession(sessionKey);
      pendingSessionsRef.current.delete(sessionKey);
      pendingTitleUpdatesRef.current.delete(sessionKey);
      queuePendingTitleRemoval(sessionKey);
      resetAtByKeyRef.current.delete(sessionKey);
      sessionIdByKeyRef.current.delete(sessionKey);
      removeSessionTitleCache(sessionKey);
      setSessions((prev) => prev.filter((s) => s.sessionKey !== sessionKey));

      if (sessionKey === currentSessionKey) {
        const remaining = sessions.filter((s) => s.sessionKey !== sessionKey);
        if (remaining.length > 0) {
          setCurrentSessionKey(remaining[0].sessionKey);
        } else {
          createNewSession();
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete session';
      if (message.toLowerCase().includes('main session')) {
        setError('Cannot delete the main chat.');
      } else {
        console.error('Failed to delete session:', err);
      }
    }
  }, [userId, currentSessionKey, sessions, createNewSession, queuePendingTitleRemoval, removeSessionTitleCache]);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  const abortChat = useCallback(async () => {
    if (!clientRef.current || !clientRef.current.isConnected() || !currentSessionKey) {
      return;
    }

    try {
      await clientRef.current.abortChat(currentSessionKey);
      if (streamFrameRef.current !== null) {
        cancelAnimationFrame(streamFrameRef.current);
        streamFrameRef.current = null;
      }
      streamPendingRef.current = '';
      streamBufferRef.current = '';
      setStreamingContent('');
      setIsLoading(false);
      currentRunIdRef.current = null;
    } catch (err) {
      console.error('Failed to abort chat:', err);
    }
  }, [currentSessionKey]);

  const mainSessionKey = buildSessionKey(buildPeerId(userId));

  const fetchSessionHistory = useCallback(async (sessionKey: string) => {
    if (!sessionKey) {
      throw new Error('Missing session key');
    }
    if (!isUserWebchatSession(sessionKey, userId)) {
      throw new Error('Unauthorized session key');
    }
    const client = clientRef.current;
    if (!client || !client.isConnected()) {
      throw new Error('Gateway not connected');
    }
    return client.getHistory(sessionKey, HISTORY_LIMIT);
  }, [userId]);

  return {
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
    sendMessage,
    retryFileAttachment,
    createNewSession,
    switchSession,
    deleteSession,
    toggleSidebar,
    abortChat,
    setSessionVerbose,
    fetchSessionHistory,
  };
}
