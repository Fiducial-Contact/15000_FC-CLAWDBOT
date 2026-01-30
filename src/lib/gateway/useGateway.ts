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

const SESSION_TITLE_CACHE_KEY = 'fc-session-titles';
const DEFAULT_MAIN_TITLE = 'Main Chat';
const DEFAULT_NEW_TITLE = 'New Chat';
const CLIENT_DISPLAY_NAME = 'fc-team-chat';
const MAX_SESSION_TITLE_LENGTH = 80;

function normalizeTitleCacheEntry(value: unknown): SessionTitleCacheEntry | null {
  if (typeof value === 'string') {
    if (value === CLIENT_DISPLAY_NAME) return null;
    return { title: value, source: 'auto', updatedAtMs: 0 };
  }
  if (!value || typeof value !== 'object') return null;
  const entry = value as Record<string, unknown>;
  if (typeof entry.title !== 'string' || entry.title.trim().length === 0) return null;
  if (entry.title === CLIENT_DISPLAY_NAME) return null;
  const source =
    entry.source === 'user' || entry.source === 'remote' ? entry.source : 'auto';
  const updatedAtMs = typeof entry.updatedAtMs === 'number' ? entry.updatedAtMs : 0;
  return { title: entry.title, source, updatedAtMs };
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

function formatTitleTimestampSuffix(date = new Date()): string {
  const year = date.getFullYear().toString();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  const hours = `${date.getHours()}`.padStart(2, '0');
  const minutes = `${date.getMinutes()}`.padStart(2, '0');
  const seconds = `${date.getSeconds()}`.padStart(2, '0');
  return `${year}${month}${day}-${hours}${minutes}${seconds}`;
}

function appendTitleTimestamp(baseTitle: string, date = new Date()): string {
  const suffix = formatTitleTimestampSuffix(date);
  const separator = ' ';
  const maxBaseLength = MAX_SESSION_TITLE_LENGTH - (separator.length + suffix.length);
  const trimmedBase =
    maxBaseLength > 0 ? baseTitle.slice(0, maxBaseLength).trimEnd() : baseTitle.slice(0, MAX_SESSION_TITLE_LENGTH);
  const combined = `${trimmedBase}${separator}${suffix}`.trim();
  if (combined.length <= MAX_SESSION_TITLE_LENGTH) return combined;
  return combined.slice(0, MAX_SESSION_TITLE_LENGTH).trimEnd();
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
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDraftSession, setIsDraftSession] = useState(false);
  const [activeTools, setActiveTools] = useState<Map<string, ToolEventPayload>>(new Map());

  const clientRef = useRef<GatewayClient | null>(null);
  const currentRunIdRef = useRef<string | null>(null);
  const streamBufferRef = useRef('');
  const streamPendingRef = useRef('');
  const streamFrameRef = useRef<number | null>(null);
  const currentSessionKeyRef = useRef(currentSessionKey);
  const sessionsRef = useRef(sessions);
  const messagesRef = useRef(messages);
  const canPatchSessionsRef = useRef(true);
  const pendingSessionsRef = useRef(new Set<string>());
  const isDraftSessionRef = useRef(isDraftSession);
  const skipHistoryLoadRef = useRef(false);
  const toolRemovalTimersRef = useRef<Map<string, number>>(new Map());
  const sessionTitleCacheRef = useRef<Record<string, SessionTitleCacheEntry | undefined>>({});
  const pendingTitleUpdatesRef = useRef<Map<string, PendingTitleUpdate>>(new Map());
  const sessionIdByKeyRef = useRef<Map<string, string>>(new Map());
  const suppressedRemoteTitlesRef = useRef<Set<string>>(new Set());
  const resetAtByKeyRef = useRef<Map<string, number>>(new Map());
  const historyRefreshTimeoutRef = useRef<number | null>(null);
  const errorTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (errorTimeoutRef.current !== null) {
        window.clearTimeout(errorTimeoutRef.current);
        errorTimeoutRef.current = null;
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

  const queuePendingTitleUpdate = useCallback(
    (sessionKey: string, title: string, source: SessionTitleSource) => {
      pendingTitleUpdatesRef.current.set(sessionKey, {
        title,
        source,
        queuedAtMs: Date.now(),
      });
    },
    []
  );

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
    if (historyRefreshTimeoutRef.current !== null) {
      window.clearTimeout(historyRefreshTimeoutRef.current);
      historyRefreshTimeoutRef.current = null;
    }
    toolRemovalTimersRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    toolRemovalTimersRef.current.clear();
  }, []);

  const updateMessage = useCallback((messageId: string, updater: (message: Message) => Message) => {
    setMessages((prev) => prev.map((message) => (message.id === messageId ? updater(message) : message)));
  }, []);

  const applyGatewaySessions = useCallback(
    (sessionList: SessionEntry[]) => {
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
        }
        const remoteLabel = typeof session.label === 'string' ? session.label.trim() : '';
        const remoteDisplayName =
          typeof session.displayName === 'string' ? session.displayName.trim() : '';
        const originLabel =
          typeof session.origin?.label === 'string' ? session.origin.label.trim() : '';
        const rawRemoteTitle = remoteLabel || remoteDisplayName || originLabel || '';
        const remoteTitle = rawRemoteTitle === CLIENT_DISPLAY_NAME ? '' : rawRemoteTitle;
        const hasRemoteTitle = Boolean(remoteTitle);

        const previousSessionId = sessionIdByKeyRef.current.get(session.sessionKey);
        const currentSessionId = session.sessionId;
        const sessionIdChanged =
          Boolean(previousSessionId && currentSessionId && previousSessionId !== currentSessionId);
        if (currentSessionId) {
          sessionIdByKeyRef.current.set(session.sessionKey, currentSessionId);
        }

        if (
          sessionIdChanged &&
          cachedEntry?.source === 'auto' &&
          cachedTitle &&
          remoteTitle === cachedTitle
        ) {
          suppressedRemoteTitlesRef.current.add(session.sessionKey);
          resetAtByKeyRef.current.set(session.sessionKey, Date.now());
          removeSessionTitleCache(session.sessionKey);
        }

        const pendingUpdate = pendingTitleUpdatesRef.current.get(session.sessionKey);
        if (pendingUpdate && remoteTitle && remoteTitle === pendingUpdate.title) {
          pendingTitleUpdatesRef.current.delete(session.sessionKey);
        }

        if (cachedTitle && remoteTitle && remoteTitle !== cachedTitle) {
          suppressedRemoteTitlesRef.current.delete(session.sessionKey);
          resetAtByKeyRef.current.delete(session.sessionKey);
        }

        const suppressRemote = suppressedRemoteTitlesRef.current.has(session.sessionKey);
        const effectiveRemoteTitle = suppressRemote ? '' : remoteTitle;

        if (hasRemoteTitle && !pendingTitleUpdatesRef.current.has(session.sessionKey) && !suppressRemote) {
          if (!cachedEntry || cachedEntry.title !== remoteTitle || cachedEntry.source !== 'remote') {
            persistSessionTitle(session.sessionKey, remoteTitle, 'remote');
          }
        }

        const hasPendingTitle = pendingTitleUpdatesRef.current.has(session.sessionKey);
        const shouldPreferCache = Boolean(cachedTitle && (!effectiveRemoteTitle || hasPendingTitle));
        const displayName = shouldPreferCache ? cachedTitle : effectiveRemoteTitle;
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
      pruneSessionTitleCache(keepKeys);
      for (const key of suppressedRemoteTitlesRef.current) {
        if (!keepKeys.has(key)) suppressedRemoteTitlesRef.current.delete(key);
      }
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
    [persistSessionTitle, pruneSessionTitleCache, removeSessionTitleCache, userId]
  );

  const refreshSessionsFromGateway = useCallback(async () => {
    if (!clientRef.current || !clientRef.current.isConnected()) {
      return;
    }
    try {
      const sessionList = await clientRef.current.listSessions();
      applyGatewaySessions(sessionList);
    } catch (err) {
      console.error('Failed to refresh sessions:', err);
    }
  }, [applyGatewaySessions]);

  const patchSessionTitle = useCallback(async (sessionKey: string, title: string) => {
    if (!clientRef.current || !clientRef.current.isConnected()) {
      return 'disconnected';
    }

    try {
      await clientRef.current.patchSession(sessionKey, { label: title });
      return 'patched';
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      const lowered = message.toLowerCase();
      if (lowered.includes('missing scope')) {
        canPatchSessionsRef.current = false;
        return 'missing_scope';
      }
      if (lowered.includes('label already in use')) {
        return 'duplicate';
      }
      if (lowered.includes('unexpected property') && lowered.includes('label')) {
        try {
          await clientRef.current.patchSession(sessionKey, { displayName: title });
          return 'patched';
        } catch (fallbackErr) {
          console.error('Failed to update session title:', fallbackErr);
          return 'error';
        }
      }
      console.error('Failed to update session title:', err);
      return 'error';
    }
  }, []);

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

      suppressedRemoteTitlesRef.current.delete(sessionKey);
      resetAtByKeyRef.current.delete(sessionKey);
      persistSessionTitle(sessionKey, normalizedTitle, source);

      setSessions((prev) =>
        prev.map((session) =>
          session.sessionKey === sessionKey
            ? {
                ...session,
                displayName: normalizedTitle,
                label: normalizedTitle,
                updatedAt: new Date().toISOString(),
              }
            : session
        )
      );

      if (!clientRef.current || !clientRef.current.isConnected()) {
        queuePendingTitleUpdate(sessionKey, normalizedTitle, source);
        console.warn('Gateway not connected; queued title update.');
        return;
      }

      if (!canPatchSessionsRef.current) {
        queuePendingTitleUpdate(sessionKey, normalizedTitle, source);
        pushTransientError('Missing permission to update session titles.');
        return;
      }

      const result = await patchSessionTitle(sessionKey, normalizedTitle);
      if (result === 'patched') {
        pendingTitleUpdatesRef.current.delete(sessionKey);
        await refreshSessionsFromGateway();
        return;
      }

      if (result === 'disconnected') {
        queuePendingTitleUpdate(sessionKey, normalizedTitle, source);
        return;
      }

      if (result === 'missing_scope') {
        queuePendingTitleUpdate(sessionKey, normalizedTitle, source);
        pushTransientError('Missing permission to update session titles.');
        return;
      }

      if (result === 'duplicate') {
        pendingTitleUpdatesRef.current.delete(sessionKey);
        const dedupedTitle = appendTitleTimestamp(normalizedTitle);
        if (dedupedTitle === normalizedTitle) {
          pushTransientError('Session title already in use.');
          await refreshSessionsFromGateway();
          return;
        }
        persistSessionTitle(sessionKey, dedupedTitle, source);
        setSessions((prev) =>
          prev.map((session) =>
            session.sessionKey === sessionKey
              ? {
                  ...session,
                  displayName: dedupedTitle,
                  label: dedupedTitle,
                  updatedAt: new Date().toISOString(),
                }
              : session
          )
        );
        const retryResult = await patchSessionTitle(sessionKey, dedupedTitle);
        if (retryResult === 'patched') {
          pendingTitleUpdatesRef.current.delete(sessionKey);
          pushTransientError('Session title already in use. Added timestamp.');
          await refreshSessionsFromGateway();
          return;
        }
        if (retryResult === 'missing_scope') {
          queuePendingTitleUpdate(sessionKey, dedupedTitle, source);
          pushTransientError('Missing permission to update session titles.');
          return;
        }
        if (retryResult === 'disconnected') {
          queuePendingTitleUpdate(sessionKey, dedupedTitle, source);
          return;
        }
        queuePendingTitleUpdate(sessionKey, dedupedTitle, source);
        pushTransientError('Failed to update session title.');
        return;
      }

      if (result === 'error') {
        queuePendingTitleUpdate(sessionKey, normalizedTitle, source);
        pushTransientError('Failed to update session title.');
      }
    },
    [
      patchSessionTitle,
      persistSessionTitle,
      pushTransientError,
      queuePendingTitleUpdate,
      refreshSessionsFromGateway,
    ]
  );

  const flushPendingTitleUpdates = useCallback(async () => {
    if (!clientRef.current || !clientRef.current.isConnected()) {
      return;
    }
    if (!canPatchSessionsRef.current) {
      return;
    }
    const pendingEntries = Array.from(pendingTitleUpdatesRef.current.entries());
    if (pendingEntries.length === 0) return;

    let patchedAny = false;
    for (const [sessionKey, pending] of pendingEntries) {
      const result = await patchSessionTitle(sessionKey, pending.title);
      if (result === 'patched') {
        pendingTitleUpdatesRef.current.delete(sessionKey);
        persistSessionTitle(sessionKey, pending.title, pending.source);
        patchedAny = true;
        continue;
      }
      if (result === 'disconnected') {
        break;
      }
      if (result === 'duplicate') {
        pendingTitleUpdatesRef.current.delete(sessionKey);
        const dedupedTitle = appendTitleTimestamp(pending.title);
        if (dedupedTitle === pending.title) {
          pushTransientError('Session title already in use.');
          continue;
        }
        const retryResult = await patchSessionTitle(sessionKey, dedupedTitle);
        if (retryResult === 'patched') {
          persistSessionTitle(sessionKey, dedupedTitle, pending.source);
          pushTransientError('Session title already in use. Added timestamp.');
          patchedAny = true;
        } else if (retryResult === 'missing_scope') {
          queuePendingTitleUpdate(sessionKey, dedupedTitle, pending.source);
          pushTransientError('Missing permission to update session titles.');
          break;
        } else if (retryResult === 'disconnected') {
          queuePendingTitleUpdate(sessionKey, dedupedTitle, pending.source);
          break;
        } else {
          queuePendingTitleUpdate(sessionKey, dedupedTitle, pending.source);
          pushTransientError('Failed to sync session titles.');
        }
        continue;
      }
      if (result === 'missing_scope') {
        pushTransientError('Missing permission to update session titles.');
        break;
      }
      if (result === 'error') {
        pushTransientError('Failed to sync session titles.');
      }
    }

    if (patchedAny) {
      await refreshSessionsFromGateway();
    }
  }, [
    patchSessionTitle,
    persistSessionTitle,
    pushTransientError,
    queuePendingTitleUpdate,
    refreshSessionsFromGateway,
  ]);

  const ensureMainSessionLabel = useCallback(
    async (sessionList: SessionEntry[]) => {
      if (!userId) return;
      const mainKey = buildSessionKey(buildPeerId(userId));
      const mainSession = sessionList.find((session) => session.sessionKey === mainKey);
      if (!mainSession) return;
      const hasExplicitLabel =
        (typeof mainSession.label === 'string' && mainSession.label.trim().length > 0) ||
        (typeof mainSession.displayName === 'string' && mainSession.displayName.trim().length > 0);
      if (hasExplicitLabel) return;
      if (pendingTitleUpdatesRef.current.has(mainKey)) return;
      await updateSessionTitle(mainKey, DEFAULT_MAIN_TITLE, 'auto');
    },
    [updateSessionTitle, userId]
  );

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

    const handleChatEvent = (event: ChatEventPayload) => {
      if (event.sessionKey !== currentSessionKeyRef.current) return;

      if (event.state === 'delta' && event.message) {
        const text = extractTextFromContent(
          (event.message as { content?: unknown })?.content
        );
        if (text) {
          streamBufferRef.current = text;
          streamPendingRef.current = text;
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
        const finalText = streamBufferRef.current || extractTextFromContent(messageContent);

        if (finalText || blocks.length > 0) {
          const messageId = `${event.runId || 'msg'}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
          const assistantMessage: Message = {
            id: messageId,
            sessionKey: event.sessionKey,
            content: finalText,
            role: 'assistant',
            timestamp: formatTimestamp(),
            blocks: blocks.length > 0 ? blocks : undefined,
            sent: true,
          };
          setMessages((prev) => [...prev, assistantMessage]);
        }

        streamBufferRef.current = '';
        setStreamingContent('');
        setIsLoading(false);
        currentRunIdRef.current = null;
        if (historyRefreshTimeoutRef.current !== null) {
          window.clearTimeout(historyRefreshTimeoutRef.current);
        }
        historyRefreshTimeoutRef.current = window.setTimeout(() => {
          historyRefreshTimeoutRef.current = null;
          setHistoryRefreshKey((prev) => prev + 1);
        }, 400);
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

    let unsubscribe = activeClient.onChat(handleChatEvent);

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

    const connect = async () => {
      const connectClient = async (client: GatewayClient) => {
        await client.connect();
        setIsConnected(true);
        setError(null);
        canPatchSessionsRef.current = true;

        const sessionList = await client.listSessions();
        applyGatewaySessions(sessionList);
        await ensureMainSessionLabel(sessionList);
        await flushPendingTitleUpdates();
      };

      try {
        await connectClient(activeClient);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Connection failed';
        if (errorMessage.startsWith('PAIRING_REQUIRED')) {
          const pairingCode = errorMessage.split(':')[1] || 'unknown';
          setError(`Authorization required. Your pairing code: ${pairingCode}. Please contact admin to approve.`);
          setIsConnected(false);
          return;
        }

        if (fallbackUrl) {
          console.warn(`[Gateway] Primary connection failed (${wsUrl}); retrying local gateway.`);
          unsubscribe();
          unsubscribeTool();
          activeClient.disconnect();

          activeClient = createGatewayClient(fallbackUrl);
          clientRef.current = activeClient;
          unsubscribe = activeClient.onChat(handleChatEvent);
          unsubscribeTool = activeClient.onTool(handleToolEvent);

          try {
            await connectClient(activeClient);
          } catch (fallbackErr) {
            const fallbackMessage =
              fallbackErr instanceof Error ? fallbackErr.message : 'Connection failed';
            setError(`Primary gateway failed (${errorMessage}). Local fallback failed (${fallbackMessage}).`);
            setIsConnected(false);
          }
          return;
        }

        setError(errorMessage);
        setIsConnected(false);
      }
    };

    connect();

    const timers = toolRemovalTimersRef.current;
    return () => {
      unsubscribe();
      unsubscribeTool();
      activeClient.disconnect();
      clientRef.current = null;
      if (streamFrameRef.current !== null) {
        cancelAnimationFrame(streamFrameRef.current);
        streamFrameRef.current = null;
      }
      timers.forEach((timeoutId) => window.clearTimeout(timeoutId));
      timers.clear();
      if (historyRefreshTimeoutRef.current !== null) {
        window.clearTimeout(historyRefreshTimeoutRef.current);
        historyRefreshTimeoutRef.current = null;
      }
    };
  }, [userId, applyGatewaySessions, ensureMainSessionLabel, flushPendingTitleUpdates]);

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
      try {
        const history = await clientRef.current!.getHistory(currentSessionKey);
        if (Array.isArray(history) && history.length > 0) {
          const sessionHash = currentSessionKey.slice(-8);
          const loadTime = Date.now();
          const loaded: Message[] = history.map((msg, idx) => {
            const m = msg as HistoryMessage;
            const normalizedRole = typeof m.role === 'string' ? m.role.toLowerCase() : '';
            const isToolResult =
              normalizedRole === 'toolresult' ||
              normalizedRole === 'tool_result' ||
              normalizedRole === 'tool' ||
              normalizedRole === 'tool_output' ||
              normalizedRole === 'tooloutput';
            const contentText = extractTextFromContent(m.content);
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
            const isUser = m.role === 'user';
            const parsed = isUser && !isToolResult ? parseAttachmentMetadata(contentText) : null;
            return {
              id: `hist_${sessionHash}_${loadTime}_${idx}`,
              sessionKey: currentSessionKey,
              content: isToolResult ? '' : (parsed ? parsed.cleanText : contentText),
              role: isUser ? 'user' : 'assistant',
              isToolResult,
              timestamp: '',
              blocks: blocks.length > 0 ? blocks : undefined,
              attachments: parsed && parsed.attachments.length > 0 ? parsed.attachments : undefined,
              sent: true,
            };
          });
          setMessages(loaded);

          const firstUserMsg = loaded.find((m) => m.role === 'user');
          const sessionEntry = sessionsRef.current.find(
            (session) => session.sessionKey === currentSessionKey
          );
          const displayName = sessionEntry?.label || sessionEntry?.displayName;
          const shouldUpdateTitle =
            !!firstUserMsg &&
            (!displayName || displayName === DEFAULT_MAIN_TITLE || displayName === DEFAULT_NEW_TITLE);

        if (shouldUpdateTitle) {
          const newTitle = generateSessionTitle(firstUserMsg.content);
          updateSessionTitle(currentSessionKey, newTitle);
        }
        }
      } catch (err) {
        console.error('Failed to load history:', err);
      } finally {
        setLoadingHistoryKey(null);
      }
    };

    loadHistory();
  }, [currentSessionKey, isConnected, updateSessionTitle, historyRefreshKey]);

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
    async ({ text, attachments = [], sessionKey }: SendMessagePayload) => {
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
      const isFirstMessage = messages.length === 0;
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
      setIsLoading(true);
      setError(null);
      streamBufferRef.current = '';
      setStreamingContent('');

      if (isFirstMessage) {
        const titleSeed = trimmedText || (imageInputs.length > 0 ? 'Image' : fileInputs.length > 0 ? 'File' : '');
        if (titleSeed) {
          const newTitle = generateSessionTitle(titleSeed);
          updateSessionTitle(activeSessionKey, newTitle);
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
          setIsLoading(false);
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
        await clientRef.current.sendMessage({
          sessionKey: activeSessionKey,
          message: outboundText,
          idempotencyKey,
          attachments: gatewayAttachments,
        });
        updateMessage(messageId, (message) => ({ ...message, sent: true }));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to send message');
        setIsLoading(false);
      }
    },
    [currentSessionKey, messages.length, updateSessionTitle, userId, commitDraftSession, updateMessage]
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
      suppressedRemoteTitlesRef.current.delete(sessionKey);
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
  }, [userId, currentSessionKey, sessions, createNewSession, removeSessionTitleCache]);

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
    return client.getHistory(sessionKey);
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
