import { useState, useRef, useCallback, useEffect } from 'react';
import type { ChatContentBlock, ChatAttachment } from '@/lib/gateway/types';

export interface ReplayMessage {
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

export type ReplaySpeed = 1 | 2 | 4 | 8 | 16;

export type ReplayPhase =
  | 'idle'
  | 'user'
  | 'thinking'
  | 'streaming'
  | 'pause'
  | 'complete';

const DEFAULT_TIMINGS = {
  userMessageDelay: 500,
  thinkingDuration: 1500,
  streamCharsPerSec: 30,
  interGroupPause: 800,
  initialDelay: 600,
};

export interface ReplaySessionInfo {
  sessionKey: string;
  sessionTitle: string;
}

export function useReplayMode() {
  const [isReplaying, setIsReplaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [replayPhase, setReplayPhase] = useState<ReplayPhase>('idle');
  const [replayMessages, setReplayMessages] = useState<ReplayMessage[]>([]);
  const [replayStreamingContent, setReplayStreamingContent] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalMessages, setTotalMessages] = useState(0);
  const [speed, setSpeedState] = useState<ReplaySpeed>(1);
  const [replaySession, setReplaySession] = useState<ReplaySessionInfo | null>(null);

  const queueRef = useRef<ReplayMessage[]>([]);
  const indexRef = useRef(0);
  const revealedRef = useRef<ReplayMessage[]>([]);
  const speedRef = useRef<ReplaySpeed>(1);
  const pausedRef = useRef(false);
  const stoppedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);
  const advanceRef = useRef<() => void>(() => {});

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const scheduleTimeout = useCallback((fn: () => void, baseMs: number) => {
    cleanup();
    const adjusted = baseMs / speedRef.current;
    timerRef.current = setTimeout(fn, adjusted);
  }, [cleanup]);

  const scheduleNext = useCallback((delayMs: number) => {
    scheduleTimeout(() => {
      if (!stoppedRef.current) advanceRef.current();
    }, delayMs);
  }, [scheduleTimeout]);

  const advanceReplay = useCallback(() => {
    if (stoppedRef.current || pausedRef.current) return;

    const queue = queueRef.current;
    const idx = indexRef.current;

    if (idx >= queue.length) {
      setReplayPhase('complete');
      setReplayStreamingContent('');
      return;
    }

    const msg = queue[idx];

    if (msg.role === 'user') {
      setReplayPhase('user');
      setCurrentIndex(idx + 1);

      scheduleTimeout(() => {
        if (stoppedRef.current) return;
        revealedRef.current = [...revealedRef.current, msg];
        setReplayMessages([...revealedRef.current]);
        indexRef.current = idx + 1;
        scheduleNext(DEFAULT_TIMINGS.interGroupPause);
      }, DEFAULT_TIMINGS.userMessageDelay);
    } else {
      setReplayPhase('thinking');
      setReplayStreamingContent('');
      setCurrentIndex(idx + 1);

      const thinkingDuration = msg.blocks?.some((b) => b.type === 'thinking')
        ? DEFAULT_TIMINGS.thinkingDuration * 1.3
        : DEFAULT_TIMINGS.thinkingDuration;

      scheduleTimeout(() => {
        if (stoppedRef.current) return;

        const content = msg.content || '';
        if (!content.trim()) {
          revealedRef.current = [...revealedRef.current, msg];
          setReplayMessages([...revealedRef.current]);
          setReplayStreamingContent('');
          indexRef.current = idx + 1;
          setReplayPhase('pause');
          scheduleNext(DEFAULT_TIMINGS.interGroupPause);
          return;
        }

        setReplayPhase('streaming');
        let charPos = 0;
        let lastTime: number | null = null;

        const streamFrame = (timestamp: number) => {
          if (stoppedRef.current) return;
          if (pausedRef.current) {
            rafRef.current = requestAnimationFrame(streamFrame);
            return;
          }

          if (lastTime === null) lastTime = timestamp;
          const dt = (timestamp - lastTime) / 1000;
          lastTime = timestamp;

          const charsToAdvance = dt * DEFAULT_TIMINGS.streamCharsPerSec * speedRef.current;
          charPos = Math.min(charPos + charsToAdvance, content.length);
          const rounded = Math.floor(charPos);

          setReplayStreamingContent(content.slice(0, rounded));

          if (rounded >= content.length) {
            revealedRef.current = [...revealedRef.current, msg];
            setReplayMessages([...revealedRef.current]);
            setReplayStreamingContent('');
            indexRef.current = idx + 1;
            setReplayPhase('pause');
            scheduleNext(DEFAULT_TIMINGS.interGroupPause);
            return;
          }

          rafRef.current = requestAnimationFrame(streamFrame);
        };

        rafRef.current = requestAnimationFrame(streamFrame);
      }, thinkingDuration);
    }
  }, [scheduleTimeout, scheduleNext]);

  useEffect(() => {
    advanceRef.current = advanceReplay;
  }, [advanceReplay]);

  const startReplay = useCallback(
    (messages: ReplayMessage[], session?: ReplaySessionInfo) => {
      cleanup();
      stoppedRef.current = false;
      pausedRef.current = false;
      queueRef.current = [...messages];
      indexRef.current = 0;
      revealedRef.current = [];
      speedRef.current = 1;

      setIsReplaying(true);
      setIsPaused(false);
      setReplayPhase('pause');
      setReplayMessages([]);
      setReplayStreamingContent('');
      setCurrentIndex(0);
      setTotalMessages(messages.length);
      setSpeedState(1);
      setReplaySession(session ?? null);

      scheduleTimeout(() => {
        advanceRef.current();
      }, DEFAULT_TIMINGS.initialDelay);
    },
    [cleanup, scheduleTimeout],
  );

  const stopReplay = useCallback(() => {
    stoppedRef.current = true;
    pausedRef.current = false;
    cleanup();
    setIsReplaying(false);
    setIsPaused(false);
    setReplayPhase('idle');
    setReplayMessages([]);
    setReplayStreamingContent('');
    setCurrentIndex(0);
    setTotalMessages(0);
    setReplaySession(null);
  }, [cleanup]);

  const pauseReplay = useCallback(() => {
    pausedRef.current = true;
    setIsPaused(true);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const resumeReplay = useCallback(() => {
    pausedRef.current = false;
    setIsPaused(false);
  }, []);

  const setSpeed = useCallback((s: ReplaySpeed) => {
    speedRef.current = s;
    setSpeedState(s);
  }, []);

  const skipToNext = useCallback(() => {
    if (!isReplaying || stoppedRef.current) return;
    cleanup();

    const queue = queueRef.current;
    const idx = indexRef.current;

    if (idx >= queue.length) {
      setReplayPhase('complete');
      setReplayStreamingContent('');
      return;
    }

    const msg = queue[idx];
    revealedRef.current = [...revealedRef.current, msg];
    setReplayMessages([...revealedRef.current]);
    setReplayStreamingContent('');
    indexRef.current = idx + 1;
    setCurrentIndex(idx + 1);

    if (indexRef.current >= queue.length) {
      setReplayPhase('complete');
      return;
    }

    setReplayPhase('pause');
    scheduleNext(DEFAULT_TIMINGS.interGroupPause);
  }, [isReplaying, cleanup, scheduleNext]);

  return {
    isReplaying,
    isPaused,
    replayPhase,
    replayMessages,
    replayStreamingContent,
    replayProgress: { current: currentIndex, total: totalMessages },
    replaySession,
    speed,
    startReplay,
    pauseReplay,
    resumeReplay,
    stopReplay,
    setSpeed,
    skipToNext,
  };
}
