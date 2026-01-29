'use client';

import React from 'react';
import { Play } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface VideoPreviewItem {
  src: string;
  label: string;
}

export function VideoPreviewCard({
  video,
  onOpen,
  className,
}: {
  video: VideoPreviewItem;
  onOpen: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        'block w-full max-w-sm overflow-hidden rounded-xl border border-[var(--fc-border-gray)] group relative bg-black',
        className
      )}
      aria-label={video.label ? `Open video: ${video.label}` : 'Open video'}
    >
      <video
        src={video.src}
        className="w-full h-auto max-h-64 object-cover"
        muted
        playsInline
        preload="metadata"
      />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors flex items-center justify-center">
        <div className="w-12 h-12 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center shadow-lg">
          <Play className="text-white drop-shadow-lg ml-0.5" size={22} />
        </div>
      </div>
      {video.label ? (
        <div className="absolute bottom-2 left-2 right-2">
          <div className="px-2.5 py-1.5 rounded-lg bg-black/55 text-white text-[12px] truncate">
            {video.label}
          </div>
        </div>
      ) : null}
    </button>
  );
}

