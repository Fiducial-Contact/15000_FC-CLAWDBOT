'use client';

import React, { useCallback, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, ExternalLink, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import VideoPlayer from './VideoPlayer';

export interface VideoItem {
  src: string;
  label: string;
}

interface VideoLightboxProps {
  videos: VideoItem[];
  initialIndex: number;
  onClose: () => void;
}

function safeFileBaseName(value: string) {
  const cleaned = (value || 'video').replace(/[^a-zA-Z0-9._-]/g, '_');
  return cleaned.length > 0 ? cleaned : 'video';
}

export function VideoLightbox({ videos, initialIndex, onClose }: VideoLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const current = videos[currentIndex];

  const handlePrev = useCallback(
    () => setCurrentIndex((i) => (i > 0 ? i - 1 : videos.length - 1)),
    [videos.length]
  );
  const handleNext = useCallback(
    () => setCurrentIndex((i) => (i < videos.length - 1 ? i + 1 : 0)),
    [videos.length]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && videos.length > 1) handlePrev();
      if (e.key === 'ArrowRight' && videos.length > 1) handleNext();
    },
    [onClose, handlePrev, handleNext, videos.length]
  );

  const handleOpen = useCallback(() => {
    window.open(current.src, '_blank', 'noopener,noreferrer');
  }, [current.src]);

  const handleDownload = useCallback(() => {
    const a = document.createElement('a');
    a.href = current.src;
    const extension = current.src.split('.').pop()?.split('?')[0] || 'mp4';
    a.download = `${safeFileBaseName(current.label)}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [current]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] bg-black/90 flex items-center justify-center"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleOpen();
          }}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          aria-label="Open"
        >
          <ExternalLink size={18} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDownload();
          }}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          aria-label="Download"
        >
          <Download size={18} />
        </button>
        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          aria-label="Close"
        >
          <X size={20} />
        </button>
      </div>

      {videos.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-10"
            aria-label="Previous"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-10"
            aria-label="Next"
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}

      <div
        className="w-[92vw] max-w-5xl px-4"
        onClick={(e) => e.stopPropagation()}
      >
        <VideoPlayer key={current.src} src={current.src} />
        {current.label ? (
          <div className="mt-3 text-center text-white/80 text-sm truncate">{current.label}</div>
        ) : null}
      </div>

      <AnimatePresence>
        {videos.length > 1 && (
          <motion.div
            className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {videos.map((_, i) => (
              <button
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(i);
                }}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === currentIndex ? 'bg-white' : 'bg-white/40 hover:bg-white/60'
                }`}
                aria-label={`Go to video ${i + 1}`}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

