'use client';

import { useRef, useMemo, useCallback, useEffect } from 'react';

export type SessionHint =
  | 'user-frustrated'
  | 'needs-clarification'
  | 'detailed-question'
  | `topic:${string}`;

interface MessageLike {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const PROFILE_SYNC_PREFIX = '[fc:profile-sync:v1]';
const HISTORY_MESSAGE_ID_PREFIX = 'hist_';

const TOPIC_KEYWORDS: Record<string, string[]> = {
  'after-effects': ['after effects', 'ae', 'aftereffects'],
  'premiere': ['premiere', 'premiere pro', 'prpro'],
  'render': ['render', 'rendering', 'render settings', 'render queue'],
  'expressions': ['expression', 'expressions', 'wiggle', 'loopOut'],
  'workflow': ['workflow', 'pipeline', 'automation'],
  'subtitles': ['subtitle', 'subtitles', 'caption', 'captions', 'srt'],
};

const RAPID_FIRE_THRESHOLD = 3;
const RAPID_FIRE_WINDOW_MS = 60_000;
const FOLLOW_UP_WINDOW_MS = 30_000;
const LONG_INPUT_CHARS = 200;
const DEBOUNCE_MS = 2_000;
const COOLDOWN_MS = 10_000;

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

function detectTopics(text: string): SessionHint[] {
  const lower = text.toLowerCase();
  const hints: SessionHint[] = [];
  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    if (keywords.some((kw) => containsKeyword(lower, kw))) {
      hints.push(`topic:${topic}`);
    }
  }
  return hints;
}

export function useSessionHints(sessionKey: string | null) {
  const userTimestampsRef = useRef<number[]>([]);
  const lastAssistantTimeRef = useRef<number>(0);
  const lastUserTimeRef = useRef<number>(0);
  const lastUserContentRef = useRef<string>('');
  const lastProcessedMessageIdRef = useRef<string | null>(null);
  const lastHintsRef = useRef<string>('');
  const lastEmitTimeRef = useRef<number>(0);
  const debounceTimerRef = useRef<number | null>(null);
  const pendingHintsRef = useRef<SessionHint[]>([]);
  const pendingCallbackRef = useRef<((hints: SessionHint[]) => void) | null>(null);

  useEffect(() => {
    userTimestampsRef.current = [];
    lastAssistantTimeRef.current = 0;
    lastUserTimeRef.current = 0;
    lastUserContentRef.current = '';
    lastProcessedMessageIdRef.current = null;
    lastHintsRef.current = '';
    lastEmitTimeRef.current = 0;
    pendingHintsRef.current = [];
    pendingCallbackRef.current = null;
    if (debounceTimerRef.current !== null) {
      window.clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  }, [sessionKey]);

  useEffect(() => {
    return () => {
      pendingCallbackRef.current = null;
      if (debounceTimerRef.current !== null) {
        window.clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, []);

  const computeHints = useCallback((now: number): SessionHint[] => {
    const hints: SessionHint[] = [];

    userTimestampsRef.current = userTimestampsRef.current.filter((t) => now - t < RAPID_FIRE_WINDOW_MS);
    if (userTimestampsRef.current.length >= RAPID_FIRE_THRESHOLD) {
      hints.push('user-frustrated');
    }

    if (lastUserTimeRef.current > 0 && lastAssistantTimeRef.current > 0) {
      const gap = lastUserTimeRef.current - lastAssistantTimeRef.current;
      if (gap > 0 && gap < FOLLOW_UP_WINDOW_MS) {
        hints.push('needs-clarification');
      }
    }

    const lastUserText = lastUserContentRef.current;
    if (lastUserText && lastUserText.length > LONG_INPUT_CHARS) {
      hints.push('detailed-question');
    }

    if (lastUserText) {
      const topicHints = detectTopics(lastUserText);
      for (const th of topicHints) {
        if (!hints.includes(th)) hints.push(th);
      }
    }

    return hints;
  }, []);

  const processMessage = useCallback(
    (messages: MessageLike[], onHintsChanged: (hints: SessionHint[]) => void) => {
      if (!Array.isArray(messages) || messages.length === 0) return;
      const last = messages[messages.length - 1];
      if (!last || !last.id) return;
      if (last.id === lastProcessedMessageIdRef.current) return;
      lastProcessedMessageIdRef.current = last.id;

      if (last.id.startsWith(HISTORY_MESSAGE_ID_PREFIX)) {
        return;
      }

      const now = Date.now();

      if (last.role === 'assistant') {
        lastAssistantTimeRef.current = now;
      } else {
        const trimmed = (last.content || '').trim();
        if (!trimmed) return;
        if (trimmed.startsWith(PROFILE_SYNC_PREFIX)) return;
        lastUserTimeRef.current = now;
        lastUserContentRef.current = last.content || '';
        userTimestampsRef.current.push(now);
      }

      const hints = computeHints(now);
      const hintsKey = JSON.stringify(hints.slice().sort());
      if (hintsKey === lastHintsRef.current) return;

      pendingHintsRef.current = hints;
      pendingCallbackRef.current = onHintsChanged;

      if (debounceTimerRef.current !== null) {
        window.clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = window.setTimeout(() => {
        debounceTimerRef.current = null;
        const emitAt = Date.now();
        if (emitAt - lastEmitTimeRef.current < COOLDOWN_MS) return;

        lastHintsRef.current = hintsKey;
        lastEmitTimeRef.current = emitAt;
        pendingCallbackRef.current?.(pendingHintsRef.current);
        pendingCallbackRef.current = null;
      }, DEBOUNCE_MS);
    },
    [computeHints]
  );

  return useMemo(
    () => ({ processMessage, computeHints }),
    [processMessage, computeHints]
  );
}
