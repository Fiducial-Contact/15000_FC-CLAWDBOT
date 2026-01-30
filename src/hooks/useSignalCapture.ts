'use client';

import { useRef, useCallback, useEffect } from 'react';

interface Signal {
  signal_type: string;
  payload?: Record<string, unknown>;
  session_key_hash?: string;
  created_at?: string;
}

const FLUSH_INTERVAL_MS = 30_000;

function hash32Djb2(input: string): number {
  let hash = 5381;
  for (let i = 0; i < input.length; i += 1) {
    hash = ((hash << 5) + hash + input.charCodeAt(i)) >>> 0;
  }
  return hash >>> 0;
}

function hash32Sdbm(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = input.charCodeAt(i) + (hash << 6) + (hash << 16) - hash;
    hash >>>= 0;
  }
  return hash >>> 0;
}

function fallbackHashSessionKey(raw: string): string {
  const a = hash32Djb2(raw).toString(16).padStart(8, '0');
  const b = hash32Sdbm(raw).toString(16).padStart(8, '0');
  return `${a}${b}`.slice(0, 16);
}

async function hashSessionKey(raw: string): Promise<string> {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    return fallbackHashSessionKey(raw);
  }
  try {
    const encoded = new TextEncoder().encode(raw);
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
  } catch {
    return fallbackHashSessionKey(raw);
  }
}

const TOPIC_KEYWORDS: Record<string, string[]> = {
  'after-effects': ['after effects', 'ae', 'aftereffects'],
  'premiere': ['premiere', 'premiere pro'],
  'render': ['render', 'rendering'],
  'expressions': ['expression', 'expressions'],
  'workflow': ['workflow', 'pipeline'],
  'subtitles': ['subtitle', 'subtitles', 'caption', 'srt'],
};

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function containsKeyword(textLower: string, keywordLower: string): boolean {
  if (!keywordLower) return false;
  if (keywordLower.length <= 3 && /^[a-z0-9]+$/.test(keywordLower)) {
    return new RegExp(`\\b${escapeRegex(keywordLower)}\\b`).test(textLower);
  }
  return textLower.includes(keywordLower);
}

function detectTopicTags(text: string): string[] {
  const lower = text.toLowerCase();
  const tags: string[] = [];
  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    if (keywords.some((kw) => containsKeyword(lower, kw))) {
      tags.push(topic);
    }
  }
  return tags;
}

const RAPID_THRESHOLD = 3;
const RAPID_WINDOW_MS = 60_000;
const FOLLOW_UP_WINDOW_MS = 30_000;

export function useSignalCapture(userId: string | null) {
  const bufferRef = useRef<Signal[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionHashRef = useRef<string | null>(null);
  const userTimestampsRef = useRef<number[]>([]);
  const lastAssistantTimeRef = useRef<number>(0);

  const flush = useCallback(async () => {
    if (bufferRef.current.length === 0) return;
    const batch = bufferRef.current.splice(0, 50);
    try {
      await fetch('/api/signals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signals: batch }),
      });
    } catch {
      // fire-and-forget; re-enqueue on failure is not critical
    }
  }, []);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      void flush();
    }, FLUSH_INTERVAL_MS);

    const handleUnload = () => {
      if (bufferRef.current.length === 0) return;
      const batch = bufferRef.current.splice(0, 50);
      const blob = new Blob(
        [JSON.stringify({ signals: batch })],
        { type: 'application/json' }
      );
      navigator.sendBeacon('/api/signals', blob);
    };

    window.addEventListener('beforeunload', handleUnload);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      window.removeEventListener('beforeunload', handleUnload);
      void flush();
    };
  }, [flush]);

  const setSessionKey = useCallback(async (raw: string | null) => {
    if (!raw) {
      sessionHashRef.current = null;
      return;
    }
    sessionHashRef.current = await hashSessionKey(raw);
  }, []);

  const captureSignal = useCallback((signal: Signal) => {
    if (!userId) return;
    bufferRef.current.push({
      ...signal,
      session_key_hash: signal.session_key_hash ?? sessionHashRef.current ?? undefined,
      created_at: signal.created_at ?? new Date().toISOString(),
    });
  }, [userId]);

  const captureMessage = useCallback((text: string, wordCount?: number) => {
    const now = Date.now();
    const topicTags = detectTopicTags(text);
    const wc = wordCount ?? text.split(/\s+/).filter(Boolean).length;

    captureSignal({
      signal_type: 'message_sent',
      payload: { wordCount: wc, topicTags },
    });

    if (topicTags.length > 0) {
      captureSignal({
        signal_type: 'topic_mentioned',
        payload: { topics: topicTags },
      });
    }

    userTimestampsRef.current.push(now);
    userTimestampsRef.current = userTimestampsRef.current.filter(
      (t) => now - t < RAPID_WINDOW_MS
    );

    if (userTimestampsRef.current.length >= RAPID_THRESHOLD) {
      const intervals = [];
      for (let i = 1; i < userTimestampsRef.current.length; i++) {
        intervals.push(userTimestampsRef.current[i] - userTimestampsRef.current[i - 1]);
      }
      const avg = Math.round(intervals.reduce((a, b) => a + b, 0) / intervals.length);
      captureSignal({
        signal_type: 'rapid_messages',
        payload: { count: userTimestampsRef.current.length, intervalAvgMs: avg },
      });
    }

    if (lastAssistantTimeRef.current > 0) {
      const gap = now - lastAssistantTimeRef.current;
      if (gap > 0 && gap < FOLLOW_UP_WINDOW_MS) {
        captureSignal({
          signal_type: 'follow_up',
          payload: { gapMs: gap },
        });
      }
    }
  }, [captureSignal]);

  const captureAssistantReply = useCallback(() => {
    lastAssistantTimeRef.current = Date.now();
  }, []);

  const captureGatewayHealth = useCallback((event: 'disconnect' | 'reconnect' | 'stream_aborted', payload?: Record<string, unknown>) => {
    captureSignal({
      signal_type: event === 'disconnect' ? 'gateway_disconnect' : event === 'reconnect' ? 'gateway_reconnect' : 'stream_aborted',
      payload: payload ?? {},
    });
  }, [captureSignal]);

  const captureFeedback = useCallback((messageId: string, value: 'helpful' | 'not_helpful') => {
    captureSignal({
      signal_type: 'feedback',
      payload: { messageId, value },
    });
  }, [captureSignal]);

  const captureSessionDuration = useCallback((durationMs: number) => {
    captureSignal({
      signal_type: 'session_duration',
      payload: { durationMs },
    });
  }, [captureSignal]);

  return {
    setSessionKey,
    captureMessage,
    captureAssistantReply,
    captureGatewayHealth,
    captureFeedback,
    captureSessionDuration,
    captureSignal,
    flush,
  };
}
