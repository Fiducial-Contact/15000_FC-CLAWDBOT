'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { GatewayClient } from './client';
import type { ChatEventPayload, SessionEntry } from './types';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
}

interface ContentBlock {
  type: string;
  text?: string;
}

interface HistoryMessage {
  role: string;
  content: ContentBlock[];
}

interface UseGatewayOptions {
  userId: string;
}

function extractTextFromContent(content: unknown): string {
  if (!content) return '';
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .filter((block: ContentBlock) => block.type === 'text' && block.text)
      .map((block: ContentBlock) => block.text)
      .join('');
  }
  return '';
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
  const [error, setError] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const clientRef = useRef<GatewayClient | null>(null);
  const currentRunIdRef = useRef<string | null>(null);
  const streamBufferRef = useRef('');
  const streamPendingRef = useRef('');
  const streamFrameRef = useRef<number | null>(null);
  const currentSessionKeyRef = useRef(currentSessionKey);
  const sessionsRef = useRef(sessions);
  const canPatchSessionsRef = useRef(true);
  const pendingSessionsRef = useRef(new Set<string>());

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

  const applyGatewaySessions = useCallback(
    (sessionList: SessionEntry[]) => {
      const gatewaySessions = sessionList.filter((session) =>
        isUserWebchatSession(session.sessionKey, userId)
      );
      const gatewayKeys = new Set(gatewaySessions.map((session) => session.sessionKey));
      for (const key of gatewayKeys) {
        pendingSessionsRef.current.delete(key);
      }

      const defaultKey = buildSessionKey(buildPeerId(userId));
      const hasDefaultSession = gatewaySessions.some((s) => s.sessionKey === defaultKey);
      const nextSessions = hasDefaultSession
        ? [...gatewaySessions]
        : [
            {
              sessionKey: defaultKey,
              sessionId: userId,
              displayName: 'Main Chat',
              updatedAt: new Date().toISOString(),
            },
            ...gatewaySessions,
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
      setSessions((prev) =>
        prev.map((session) =>
          session.sessionKey === sessionKey
            ? { ...session, displayName: title, updatedAt: new Date().toISOString() }
            : session
        )
      );

      if (!clientRef.current || !clientRef.current.isConnected()) {
        return;
      }

      if (!canPatchSessionsRef.current) {
        return;
      }

      try {
        await clientRef.current.patchSession(sessionKey, { displayName: title });
        const sessionList = await clientRef.current.listSessions();
        applyGatewaySessions(sessionList);
      } catch (err) {
        const message = err instanceof Error ? err.message : '';
        if (message.toLowerCase().includes('missing scope')) {
          canPatchSessionsRef.current = false;
          return;
        }
        console.error('Failed to update session title:', err);
      }
    },
    [applyGatewaySessions]
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
        const finalText =
          streamBufferRef.current ||
          extractTextFromContent((event.message as { content?: unknown })?.content);

        if (finalText) {
          const assistantMessage: Message = {
            id: event.runId || Date.now().toString(),
            content: finalText,
            role: 'assistant',
            timestamp: formatTimestamp(),
          };
          setMessages((prev) => [...prev, assistantMessage]);
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

    return () => {
      unsubscribe();
      client.disconnect();
      clientRef.current = null;
      if (streamFrameRef.current !== null) {
        cancelAnimationFrame(streamFrameRef.current);
        streamFrameRef.current = null;
      }
    };
  }, [userId, applyGatewaySessions]);

  useEffect(() => {
    if (!clientRef.current || !clientRef.current.isConnected() || !currentSessionKey) {
      return;
    }

    const loadHistory = async () => {
      try {
        const history = await clientRef.current!.getHistory(currentSessionKey);
        if (Array.isArray(history) && history.length > 0) {
          const loaded: Message[] = history.map((msg, idx) => {
            const m = msg as HistoryMessage;
            return {
              id: `hist_${idx}`,
              content: extractTextFromContent(m.content),
              role: m.role === 'user' ? 'user' : 'assistant',
              timestamp: '',
            };
          });
          setMessages(loaded);
          
          const firstUserMsg = loaded.find((m) => m.role === 'user');
          const sessionEntry = sessionsRef.current.find(
            (session) => session.sessionKey === currentSessionKey
          );
          const displayName = sessionEntry?.displayName;
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
      }
    };

    loadHistory();
  }, [currentSessionKey, isConnected, updateSessionTitle]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!clientRef.current || !clientRef.current.isConnected()) {
        setError('Not connected to gateway');
        return;
      }

      const userMessage: Message = {
        id: Date.now().toString(),
        content,
        role: 'user',
        timestamp: formatTimestamp(),
      };

      const isFirstMessage = messages.length === 0;
      
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);
      streamBufferRef.current = '';
      setStreamingContent('');

      if (isFirstMessage) {
        const newTitle = generateSessionTitle(content);
        updateSessionTitle(currentSessionKey, newTitle);
      }

      try {
        const idempotencyKey = crypto.randomUUID();
        await clientRef.current.sendMessage({
          sessionKey: currentSessionKey,
          message: content,
          idempotencyKey,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to send message');
        setIsLoading(false);
      }
    },
    [currentSessionKey, messages.length, updateSessionTitle]
  );

  const createNewSession = useCallback(() => {
    const newSessionId = generateSessionId();
    const peerId = buildPeerId(userId, newSessionId);
    const newSessionKey = buildSessionKey(peerId);
    
    const newSession: SessionEntry = {
      sessionKey: newSessionKey,
      sessionId: newSessionId,
      displayName: `New Chat`,
      updatedAt: new Date().toISOString(),
    };
    
    setSessions((prev) => [newSession, ...prev]);
    setCurrentSessionKey(newSessionKey);
    currentSessionKeyRef.current = newSessionKey;
    pendingSessionsRef.current.add(newSessionKey);
    setMessages([]);
  }, [userId]);

  const switchSession = useCallback((sessionKey: string) => {
    if (sessionKey !== currentSessionKey) {
      setCurrentSessionKey(sessionKey);
      setMessages([]);
      setStreamingContent('');
      streamBufferRef.current = '';
    }
  }, [currentSessionKey]);

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
    error,
    streamingContent,
    isSidebarOpen,
    sendMessage,
    createNewSession,
    switchSession,
    deleteSession,
    toggleSidebar,
    abortChat,
  };
}
