'use client';

import { motion } from 'motion/react';
import { Play, Pause, Square, SkipForward, MessageSquare } from 'lucide-react';
import type { ReplayPhase, ReplaySpeed } from '@/hooks/useReplayMode';

interface ReplayControlsProps {
  isPaused: boolean;
  phase: ReplayPhase;
  progress: { current: number; total: number };
  speed: ReplaySpeed;
  sessionTitle?: string;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onSpeedChange: (speed: ReplaySpeed) => void;
  onSkipNext: () => void;
}

const SPEEDS: ReplaySpeed[] = [1, 2, 4, 8, 16];

export function ReplayControls({
  isPaused,
  phase,
  progress,
  speed,
  sessionTitle,
  onPlay,
  onPause,
  onStop,
  onSpeedChange,
  onSkipNext,
}: ReplayControlsProps) {
  const isComplete = phase === 'complete';
  const isActive = !isComplete && !isPaused;
  const progressPercent = progress.total > 0
    ? Math.round((progress.current / progress.total) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-1.5"
    >
      {sessionTitle && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--fc-black)]/80 backdrop-blur-md text-white text-[11px] font-medium"
        >
          <MessageSquare size={11} />
          <span className="max-w-[200px] truncate">{sessionTitle}</span>
        </motion.div>
      )}

      <div className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-[var(--fc-border-gray)] bg-white/90 backdrop-blur-xl shadow-lg">
        <button
          onClick={onStop}
          className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-[var(--fc-subtle-gray)] transition-colors text-[var(--fc-body-gray)]"
          title="Stop"
        >
          <Square size={14} />
        </button>

        <button
          onClick={isComplete ? onStop : isActive ? onPause : onPlay}
          className="flex items-center justify-center w-9 h-9 rounded-full bg-[var(--fc-black)] text-white hover:opacity-90 transition-opacity"
          title={isComplete ? 'Done' : isActive ? 'Pause' : 'Play'}
        >
          {isActive ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
        </button>

        <button
          onClick={onSkipNext}
          disabled={isComplete}
          className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-[var(--fc-subtle-gray)] transition-colors text-[var(--fc-body-gray)] disabled:opacity-30 disabled:cursor-not-allowed"
          title="Skip"
        >
          <SkipForward size={14} />
        </button>

        <div className="w-px h-5 bg-[var(--fc-border-gray)] mx-1" />

        <div className="flex items-center gap-0.5">
          {SPEEDS.map((s) => (
            <button
              key={s}
              onClick={() => onSpeedChange(s)}
              className={`min-w-[32px] h-7 px-1.5 rounded-full text-[11px] font-semibold transition-all ${
                speed === s
                  ? 'bg-[var(--fc-black)] text-white'
                  : 'text-[var(--fc-body-gray)] hover:bg-[var(--fc-subtle-gray)]'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-[var(--fc-border-gray)] mx-1" />

        <div className="flex items-center gap-2">
          <div className="w-16 h-1.5 rounded-full bg-[var(--fc-border-gray)] overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-[var(--fc-black)]"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          </div>
          <span className="text-[11px] font-medium text-[var(--fc-light-gray)] tabular-nums whitespace-nowrap">
            {isComplete
              ? `${progress.total}/${progress.total}`
              : `${progress.current}/${progress.total}`}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
