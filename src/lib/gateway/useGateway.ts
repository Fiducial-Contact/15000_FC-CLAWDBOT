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

const SESSION_TITLE_CACHE_KEY = 'fc-session-titles';

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

function generateSessionTitle(message: string): string {
  const cleaned = message.trim().replace(/\s+/g, ' ');
  if (cleaned.length <= 30) return cleaned;
  return cleaned.slice(0, 30).trim() + '...';
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
  const [sessions, setSessions] = useState<SessionEntry[]>([]);
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
  const sessionTitleCacheRef = useRef<Record<string, string>>({});
  const historyRefreshTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!userId) return;
    try {
      const raw = localStorage.getItem(`${SESSION_TITLE_CACHE_KEY}:${userId}`);
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, string>;
        if (parsed && typeof parsed === 'object') {
          sessionTitleCacheRef.current = parsed;
        }
      }
    } catch {
      sessionTitleCacheRef.current = {};
    }
  }, [userId]);

  const persistSessionTitle = useCallback((sessionKey: string, title: string) => {
    if (!userId) return;
    sessionTitleCacheRef.current = {
      ...sessionTitleCacheRef.current,
      [sessionKey]: title,
    };
    try {
      localStorage.setItem(
        `${SESSION_TITLE_CACHE_KEY}:${userId}`,
        JSON.stringify(sessionTitleCacheRef.current)
      );
    } catch {
      // ignore localStorage errors
    }
  }, [userId]);

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
            displayName: 'Main Chat',
            label: 'Main Chat',
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

      const normalizedSessions: SessionEntry[] = gatewaySessions.map((session) => {
        const cachedTitle = sessionTitleCacheRef.current[session.sessionKey];
        const remoteTitle = session.label || session.displayName || session.origin?.label || '';
        const shouldPreferCache = Boolean(
          cachedTitle &&
            (!remoteTitle ||
              remoteTitle === 'fc-team-chat' ||
              remoteTitle === 'Main Chat' ||
              remoteTitle === 'New Chat')
        );
        const displayName = shouldPreferCache ? cachedTitle : remoteTitle;
        return {
          ...session,
          displayName,
        };
      });

      const defaultKey = buildSessionKey(buildPeerId(userId));
      const hasDefaultSession = normalizedSessions.some((s) => s.sessionKey === defaultKey);
      const nextSessions: SessionEntry[] = hasDefaultSession
        ? [...normalizedSessions]
        : [
            {
              sessionKey: defaultKey,
              sessionId: userId,
              displayName: 'Main Chat',
              label: 'Main Chat',
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
    [userId]
  );

  const updateSessionTitle = useCallback(
    async (sessionKey: string, title: string) => {
      if (!sessionKey) {
        return;
      }
      persistSessionTitle(sessionKey, title);
      setSessions((prev) =>
        prev.map((session) =>
          session.sessionKey === sessionKey
            ? { ...session, displayName: title, label: title, updatedAt: new Date().toISOString() }
            : session
        )
      );

      if (!clientRef.current || !clientRef.current.isConnected()) {
        return;
      }

      if (!canPatchSessionsRef.current) {
        return;
      }

      let patched = false;
      try {
        await clientRef.current.patchSession(sessionKey, { label: title });
        patched = true;
      } catch (err) {
        const message = err instanceof Error ? err.message : '';
        if (message.toLowerCase().includes('missing scope')) {
          canPatchSessionsRef.current = false;
          return;
        }
        if (message.toLowerCase().includes('label already in use')) {
          return;
        }
        if (message.toLowerCase().includes('unexpected property') && message.includes('label')) {
          try {
            await clientRef.current.patchSession(sessionKey, { displayName: title });
            patched = true;
          } catch (fallbackErr) {
            console.error('Failed to update session title:', fallbackErr);
          }
        } else {
          console.error('Failed to update session title:', err);
        }
      }

      if (patched) {
        const sessionList = await clientRef.current.listSessions();
        applyGatewaySessions(sessionList);
      }
    },
    [applyGatewaySessions, persistSessionTitle]
  );

  useEffect(() => {
    if (!userId) return;

    const wsUrl = process.env.NEXT_PUBLIC_GATEWAY_WS_URL;
    const token = process.env.NEXT_PUBLIC_GATEWAY_TOKEN;

    if (!wsUrl) {
      setError('Gateway URL not configured');
      return;
    }

    const client = new GatewayClient({
      url: wsUrl,
      token,
      clientName: 'fc-team-chat',
      clientVersion: '1.0.0',
      mode: 'webchat',
      userId,
    });

    clientRef.current = client;

    const unsubscribe = client.onChat((event: ChatEventPayload) => {
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
    });

    const unsubscribeTool = client.onTool((event: ToolEventPayload) => {
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
    });

    const connect = async () => {
      try {
        await client.connect();
        setIsConnected(true);
        setError(null);

        const sessionList = await client.listSessions();
        applyGatewaySessions(sessionList);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Connection failed';
        if (errorMessage.startsWith('PAIRING_REQUIRED')) {
          const pairingCode = errorMessage.split(':')[1] || 'unknown';
          setError(`Authorization required. Your pairing code: ${pairingCode}. Please contact Haiwei to approve.`);
        } else {
          setError(errorMessage);
        }
        setIsConnected(false);
      }
    };

    connect();

    const timers = toolRemovalTimersRef.current;
    return () => {
      unsubscribe();
      unsubscribeTool();
      client.disconnect();
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
  }, [userId, applyGatewaySessions]);

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
            return {
              id: `hist_${sessionHash}_${loadTime}_${idx}`,
              sessionKey: currentSessionKey,
              content: isToolResult ? '' : contentText,
              role: m.role === 'user' ? 'user' : 'assistant',
              isToolResult,
              timestamp: '',
              blocks: blocks.length > 0 ? blocks : undefined,
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
            (!displayName || displayName === 'Main Chat' || displayName === 'New Chat');

          if (shouldUpdateTitle) {
            const newTitle = generateSessionTitle(firstUserMsg.content);
            updateSessionTitle(currentSessionKey, newTitle);
          }
        } else {
          setMessages([]);
        }
      } catch (err) {
        console.error('Failed to load history:', err);
        setMessages([]);
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
      displayName: `New Chat`,
      label: 'New Chat',
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
      if (imageInputs.length > 0) {
        try {
          const uploadResults = await Promise.all(
            imageInputs.map(async (item) => {
              const upload = await uploadFileAndCreateSignedUrl({
                file: item.file,
                userId,
              });
              return { id: item.id, url: upload.signedUrl, name: item.file.name };
            })
          );

          const urlById = new Map(uploadResults.map((result) => [result.id, result.url]));
          const updatedAttachments: ChatAttachment[] = displayAttachments.map((item) => {
            if (item.kind !== 'image') return item;
            const url = urlById.get(item.id);
            return { ...item, url, status: url ? 'ready' : 'error' };
          });

          setMessages((prev) =>
            prev.map((message) =>
              message.id === messageId ? { ...message, attachments: updatedAttachments } : message
            )
          );

          imageUrlText = buildImageUrlText(
            uploadResults.map((result) => ({ name: result.name, url: result.url }))
          );
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to upload image');
          const updatedAttachments: ChatAttachment[] = displayAttachments.map((item) =>
            item.kind === 'image' ? { ...item, status: 'error' } : item
          );
          setMessages((prev) =>
            prev.map((message) =>
              message.id === messageId ? { ...message, attachments: updatedAttachments } : message
            )
          );
          setIsLoading(false);
          return;
        }
      }

      if (fileInputs.length > 0) {
        try {
          const uploadResults = await Promise.all(
            fileInputs.map(async (item) => {
              const upload = await uploadFileAndCreateSignedUrl({
                file: item.file,
                userId,
              });
              return { id: item.id, url: upload.signedUrl, name: item.file.name };
            })
          );

          const urlById = new Map(uploadResults.map((result) => [result.id, result.url]));
          const updatedAttachments: ChatAttachment[] = displayAttachments.map((item) => {
            if (item.kind !== 'file') return item;
            const url = urlById.get(item.id);
            const status: ChatAttachment['status'] = url ? 'ready' : 'error';
            return { ...item, url, status };
          });

          setMessages((prev) =>
            prev.map((message) =>
              message.id === messageId ? { ...message, attachments: updatedAttachments } : message
            )
          );

          fileUrlText = buildFileUrlText(
            uploadResults.map((result) => ({ name: result.name, url: result.url }))
          );
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to upload file');
          const updatedAttachments: ChatAttachment[] = displayAttachments.map((item) =>
            item.kind === 'file' ? { ...item, status: 'error' } : item
          );
          setMessages((prev) =>
            prev.map((message) =>
              message.id === messageId ? { ...message, attachments: updatedAttachments } : message
            )
          );
          setIsLoading(false);
          return;
        }
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
  }, [userId, currentSessionKey, sessions, createNewSession]);

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
  };
}
