'use client';

import { memo, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Copy, Check, FileText, X, Download, AlertTriangle, Loader2, ZoomIn, ChevronLeft, ChevronRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import type { Components } from 'react-markdown';
import type { ChatAttachment, ChatContentBlock, ToolCallBlock, ThinkingBlock as ThinkingBlockType } from '@/lib/gateway/types';
import { isToolCallBlock, isThinkingBlock } from '@/lib/gateway/types';
import { ThinkingBlock } from './ThinkingBlock';
import { ToolCard } from './ToolCard';
import { VideoLightbox, type VideoItem } from './VideoLightbox';
import { VideoPreviewCard } from './VideoPreviewCard';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp?: string;
  blocks?: ChatContentBlock[];
  attachments?: ChatAttachment[];
}

interface MessageGroupProps {
  messages: Message[];
  role: 'user' | 'assistant';
  showThinking?: boolean;
  showTools?: boolean;
  onRetryAttachment?: (messageId: string, attachmentId: string) => void;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
        copied
          ? 'bg-green-100 text-green-700'
          : 'bg-white/80 text-[var(--fc-body-gray)] hover:text-[var(--fc-black)] hover:bg-white shadow-sm'
      }`}
      title={copied ? 'Copied!' : 'Copy message'}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied && <span>Copied</span>}
    </button>
  );
}

function CodeBlock({ children, className }: { children: string; className?: string }) {
  const language = className?.replace('language-', '') || '';
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(children);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [children]);

  return (
    <div className="relative group my-3 rounded-xl overflow-hidden bg-[#1e1e1e] border border-[#333]">
      <div className="flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-[#333]">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
            <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
            <div className="w-3 h-3 rounded-full bg-[#27ca40]" />
          </div>
          {language && (
            <span className="ml-3 text-[11px] font-medium text-[#858585] uppercase tracking-wider">
              {language}
            </span>
          )}
        </div>
        <button
          onClick={handleCopy}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
            copied ? 'text-green-400' : 'text-[#858585] hover:text-white'
          }`}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <div className="overflow-x-auto">
        <pre className="p-4 text-[13px] leading-relaxed">
          <code className={className}>{children}</code>
        </pre>
      </div>
    </div>
  );
}

const markdownComponents: Components = {
  code({ className, children, ...props }) {
    const isInline = !className;
    const content = String(children).replace(/\n$/, '');
    if (isInline) {
      return (
        <code
          className="px-1.5 py-0.5 bg-[var(--fc-subtle-gray)] rounded-md text-[13px] font-mono text-[var(--fc-action-red)]"
          {...props}
        >
          {content}
        </code>
      );
    }
    return <CodeBlock className={className}>{content}</CodeBlock>;
  },
  pre({ children }) {
    return <>{children}</>;
  },
  a({ href, children }) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="text-[var(--fc-action-red)] hover:underline font-medium">
        {children}
      </a>
    );
  },
  ul({ children }) {
    return <ul className="list-disc list-inside my-2 space-y-1 text-[var(--fc-body-gray)]">{children}</ul>;
  },
  ol({ children }) {
    return <ol className="list-decimal list-inside my-2 space-y-1 text-[var(--fc-body-gray)]">{children}</ol>;
  },
  li({ children }) {
    return <li className="leading-relaxed">{children}</li>;
  },
  p({ children }) {
    return <p className="my-2 leading-relaxed text-[var(--fc-body-gray)]">{children}</p>;
  },
  h1({ children }) {
    return <h1 className="text-xl font-bold mt-4 mb-2 text-[var(--fc-black)]">{children}</h1>;
  },
  h2({ children }) {
    return <h2 className="text-lg font-bold mt-3 mb-2 text-[var(--fc-black)]">{children}</h2>;
  },
  h3({ children }) {
    return <h3 className="text-base font-bold mt-3 mb-1.5 text-[var(--fc-black)]">{children}</h3>;
  },
  blockquote({ children }) {
    return (
      <blockquote className="border-l-4 border-[var(--fc-action-red)] pl-4 my-3 py-1 bg-[var(--fc-subtle-gray)] rounded-r-lg text-[var(--fc-body-gray)] italic">
        {children}
      </blockquote>
    );
  },
  table({ children }) {
    return (
      <div className="overflow-x-auto my-3 rounded-lg border border-[var(--fc-border-gray)]">
        <table className="w-full text-sm">{children}</table>
      </div>
    );
  },
  thead({ children }) {
    return <thead className="bg-[var(--fc-subtle-gray)]">{children}</thead>;
  },
  th({ children }) {
    return <th className="px-4 py-2.5 font-semibold text-[var(--fc-black)] text-left border-b border-[var(--fc-border-gray)]">{children}</th>;
  },
  td({ children }) {
    return <td className="px-4 py-2.5 text-[var(--fc-body-gray)] border-b border-[var(--fc-border-gray)] last:border-b-0">{children}</td>;
  },
  hr() {
    return <hr className="my-4 border-[var(--fc-border-gray)]" />;
  },
  strong({ children }) {
    return <strong className="font-semibold text-[var(--fc-black)]">{children}</strong>;
  },
  img({ src, alt }) {
    if (!src) return null;
    return (
      <span className="block my-3">
        <img src={src} alt={alt || 'Image'} className="max-w-full max-h-80 rounded-xl border border-[var(--fc-border-gray)] object-contain" loading="lazy" />
      </span>
    );
  },
};

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

interface LightboxProps {
  images: { src: string; label: string }[];
  initialIndex: number;
  onClose: () => void;
}

function Lightbox({ images, initialIndex, onClose }: LightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const current = images[currentIndex];

  const handlePrev = useCallback(() => setCurrentIndex((i) => (i > 0 ? i - 1 : images.length - 1)), [images.length]);
  const handleNext = useCallback(() => setCurrentIndex((i) => (i < images.length - 1 ? i + 1 : 0)), [images.length]);
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    },
    [onClose, handlePrev, handleNext]
  );

  const handleDownload = useCallback(async () => {
    try {
      const response = await fetch(current.src);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const extension = current.src.split('.').pop()?.split('?')[0] || 'png';
      a.download = `${current.label || 'image'}.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download image:', err);
      window.open(current.src, '_blank');
    }
  }, [current]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        <button
          onClick={(e) => { e.stopPropagation(); handleDownload(); }}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
        >
          <Download size={18} />
        </button>
        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
        >
          <X size={20} />
        </button>
      </div>
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); handlePrev(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-10"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleNext(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-10"
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}
      <motion.img
        key={current.src}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        src={current.src}
        alt={current.label}
        className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
      {images.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); setCurrentIndex(i); }}
              className={`w-2 h-2 rounded-full transition-colors ${i === currentIndex ? 'bg-white' : 'bg-white/40 hover:bg-white/60'}`}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}

interface ImageGridProps {
  images: { src: string; label: string }[];
  onImageClick: (index: number) => void;
}

function ImageGrid({ images, onImageClick }: ImageGridProps) {
  const count = images.length;
  if (count === 1) {
    return (
      <button onClick={() => onImageClick(0)} className="block w-full max-w-xs overflow-hidden rounded-xl border border-[var(--fc-border-gray)] group relative">
        <img src={images[0].src} alt={images[0].label} className="w-full h-auto max-h-64 object-cover transition-transform group-hover:scale-[1.02]" loading="lazy" />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
          <ZoomIn className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" size={24} />
        </div>
      </button>
    );
  }
  if (count === 2) {
    return (
      <div className="grid grid-cols-2 gap-1.5 max-w-sm">
        {images.map((image, i) => (
          <button key={image.src} onClick={() => onImageClick(i)} className="block overflow-hidden rounded-xl border border-[var(--fc-border-gray)] group relative aspect-square">
            <img src={image.src} alt={image.label} className="w-full h-full object-cover transition-transform group-hover:scale-[1.02]" loading="lazy" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          </button>
        ))}
      </div>
    );
  }
  const displayImages = count > 4 ? images.slice(0, 4) : images;
  const remaining = count - 4;
  return (
    <div className="grid grid-cols-2 gap-1.5 max-w-sm">
      {displayImages.map((image, i) => (
        <button key={image.src} onClick={() => onImageClick(i)} className="block overflow-hidden rounded-xl border border-[var(--fc-border-gray)] group relative aspect-square">
          <img src={image.src} alt={image.label} className="w-full h-full object-cover transition-transform group-hover:scale-[1.02]" loading="lazy" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          {i === 3 && remaining > 0 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white text-xl font-semibold">+{remaining}</span>
            </div>
          )}
        </button>
      ))}
    </div>
  );
}

function FileCard({ file, onRetry }: { file: ChatAttachment; onRetry?: () => void }) {
  const sizeLabel = formatFileSize(file.size);
  const isUploading = file.status === 'uploading';
  const isError = file.status === 'error';
  const isReady = file.status === 'ready' || (!file.status && file.url);

  const content = (
    <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all ${
      isError ? 'border-red-200 bg-red-50' : isUploading ? 'border-[var(--fc-border-gray)] bg-[var(--fc-off-white)]' : 'border-[var(--fc-border-gray)] bg-[var(--fc-off-white)] hover:border-[var(--fc-light-gray)] hover:shadow-sm cursor-pointer'
    }`}>
      <div className={`w-10 h-10 rounded-lg border flex items-center justify-center flex-shrink-0 ${isError ? 'bg-red-100 border-red-200' : 'bg-white border-[var(--fc-border-gray)]'}`}>
        {isUploading ? <Loader2 size={18} className="text-[var(--fc-action-red)] animate-spin" /> : isError ? <AlertTriangle size={18} className="text-red-500" /> : <FileText size={18} className="text-[var(--fc-action-red)]" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-medium text-[var(--fc-black)] truncate max-w-[200px]">{file.fileName}</p>
        <p className={`text-[10px] ${isError ? 'text-red-500' : 'text-[var(--fc-light-gray)]'}`}>{isUploading ? 'Uploading...' : isError ? 'Upload failed' : sizeLabel}</p>
      </div>
      {isError && onRetry && (
        <button type="button" onClick={(e) => { e.preventDefault(); onRetry(); }} className="text-[11px] font-medium text-[var(--fc-action-red)] px-2 py-1 rounded-lg border border-red-100 hover:bg-red-50">
          Retry
        </button>
      )}
      {isReady && file.url && <Download size={16} className="text-[var(--fc-light-gray)] group-hover:text-[var(--fc-action-red)] transition-colors flex-shrink-0" />}
    </div>
  );

  if (isReady && file.url) {
    return <a href={file.url} target="_blank" rel="noopener noreferrer" className="block group">{content}</a>;
  }
  return <div className={isError ? '' : 'opacity-80'}>{content}</div>;
}

function resolveImageSource(block: ChatContentBlock) {
  if (block.type === 'image_url' && typeof block.url === 'string') return block.url;
  if (block.type === 'image') {
    if (typeof block.url === 'string') return block.url;
    if (typeof block.data === 'string') {
      const mimeType = typeof block.mimeType === 'string' ? block.mimeType : 'image/png';
      return block.data.startsWith('data:') ? block.data : `data:${mimeType};base64,${block.data}`;
    }
  }
  return '';
}

const MARKDOWN_IMAGE_REGEX = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;

function extractMarkdownImages(content: string): { images: Array<{ src: string; label: string }>; cleanedContent: string } {
  const images: Array<{ src: string; label: string }> = [];
  const cleanedContent = content.replace(MARKDOWN_IMAGE_REGEX, (_match, alt, url) => {
    if (url && typeof url === 'string') images.push({ src: url, label: alt || 'Image' });
    return '';
  });
  return { images, cleanedContent: cleanedContent.trim() };
}

const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.webm', '.m4v'];
const MARKDOWN_LINK_REGEX = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
const RAW_URL_REGEX = /https?:\/\/[^\s<>()]+/g;

function isVideoUrl(value: string) {
  if (!value) return false;
  const normalized = value.split('#')[0]?.split('?')[0]?.toLowerCase() ?? '';
  return VIDEO_EXTENSIONS.some((ext) => normalized.endsWith(ext));
}

function guessLabelFromUrl(value: string) {
  const fallback = 'Video';
  if (!value) return fallback;
  try {
    const url = new URL(value);
    const base = url.pathname.split('/').filter(Boolean).pop();
    return decodeURIComponent(base || fallback);
  } catch {
    const base = value.split('#')[0]?.split('?')[0]?.split('/').filter(Boolean).pop();
    return base || fallback;
  }
}

function extractVideoLinks(content: string): { videos: VideoItem[]; cleanedContent: string } {
  const bySrc = new Map<string, VideoItem>();

  let intermediate = content.replace(MARKDOWN_LINK_REGEX, (match, label, url) => {
    if (typeof url === 'string' && isVideoUrl(url)) {
      const textLabel = typeof label === 'string' && label.trim().length > 0 ? label.trim() : guessLabelFromUrl(url);
      bySrc.set(url, { src: url, label: textLabel });
      return textLabel;
    }
    return match;
  });

  intermediate = intermediate.replace(RAW_URL_REGEX, (match) => {
    const trimmed = match.replace(/[),.;!?]+$/, '');
    if (isVideoUrl(trimmed)) {
      if (!bySrc.has(trimmed)) {
        bySrc.set(trimmed, { src: trimmed, label: guessLabelFromUrl(trimmed) });
      }
      return '';
    }
    return match;
  });

  const cleanedContent = intermediate
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();

  return { videos: Array.from(bySrc.values()), cleanedContent };
}

function isVideoAttachment(file: ChatAttachment) {
  if (!file) return false;
  if (typeof file.mimeType === 'string' && file.mimeType.toLowerCase().startsWith('video/')) return true;
  if (typeof file.url === 'string' && isVideoUrl(file.url)) return true;
  if (typeof file.previewUrl === 'string' && isVideoUrl(file.previewUrl)) return true;
  if (typeof file.fileName === 'string') {
    const lower = file.fileName.toLowerCase();
    return VIDEO_EXTENSIONS.some((ext) => lower.endsWith(ext));
  }
  return false;
}

export const MessageGroup = memo(function MessageGroup({
  messages,
  role,
  showThinking = false,
  showTools = false,
  onRetryAttachment,
}: MessageGroupProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [videoLightboxIndex, setVideoLightboxIndex] = useState<number | null>(null);
  const isUser = role === 'user';

  const aggregated = useMemo(() => {
    const allThinking: Array<{ messageId: string; block: ThinkingBlockType }> = [];
    const allTools: Array<{ messageId: string; block: ToolCallBlock }> = [];
    const allImages: { src: string; label: string }[] = [];
    const allVideos: VideoItem[] = [];
    const allFiles: ChatAttachment[] = [];
    const textParts: { messageId: string; content: string }[] = [];
    const seenImages = new Set<string>();
    const seenVideos = new Set<string>();

    for (const message of messages) {
      const blocks = message.blocks || [];
      const attachments = message.attachments || [];

      blocks.filter(isThinkingBlock).filter((b) => b.text?.trim()).forEach((b) => allThinking.push({ messageId: message.id, block: b as ThinkingBlockType }));
      blocks.filter(isToolCallBlock).forEach((b) => allTools.push({ messageId: message.id, block: b as ToolCallBlock }));

      const imageAttachments = attachments.filter((a) => a.kind === 'image');
      const fileAttachments = attachments.filter((a) => a.kind === 'file');
      fileAttachments.forEach((f) => {
        if (isVideoAttachment(f)) {
          const src = f.url || f.previewUrl || '';
          if (src && !seenVideos.has(src)) {
            seenVideos.add(src);
            allVideos.push({ src, label: f.fileName || guessLabelFromUrl(src) });
          }
        } else {
          allFiles.push(f);
        }
      });

      imageAttachments.forEach((a) => {
        const src = a.previewUrl || a.url || '';
        if (src && !seenImages.has(src)) {
          seenImages.add(src);
          allImages.push({ src, label: a.fileName });
        }
      });

      blocks.filter((b) => b.type === 'image' || b.type === 'image_url').forEach((b) => {
        const src = resolveImageSource(b);
        if (src && !seenImages.has(src)) {
          seenImages.add(src);
          allImages.push({ src, label: 'Image' });
        }
      });

      const { images: mdImages, cleanedContent } = extractMarkdownImages(message.content || '');
      mdImages.forEach((img) => {
        if (!seenImages.has(img.src)) {
          seenImages.add(img.src);
          allImages.push(img);
        }
      });

      const { videos: mdVideos, cleanedContent: cleanedContentWithoutMedia } = extractVideoLinks(cleanedContent);
      mdVideos.forEach((video) => {
        if (video.src && !seenVideos.has(video.src)) {
          seenVideos.add(video.src);
          allVideos.push(video);
        }
      });

      const displayContent = isUser ? message.content : cleanedContentWithoutMedia;
      if (displayContent?.trim()) {
        textParts.push({ messageId: message.id, content: displayContent });
      }
    }

    return { allThinking, allTools, allImages, allVideos, allFiles, textParts };
  }, [messages, isUser]);

  const { allThinking, allTools, allImages, allVideos, allFiles, textParts } = aggregated;

  const hasContent = textParts.length > 0 || allImages.length > 0 || allVideos.length > 0 || allFiles.length > 0;
  const hasRenderableBlocks = !isUser && ((showThinking && allThinking.length > 0) || (showTools && allTools.length > 0));

  if (!hasContent && !hasRenderableBlocks) return null;

  return (
    <motion.div
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} mb-6`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
    >
      <div className="flex-shrink-0 w-8 h-8 rounded-xl overflow-hidden shadow-sm">
        <img
          src={isUser ? 'https://api.dicebear.com/9.x/lorelei/svg?seed=user&backgroundColor=262626' : 'https://api.dicebear.com/9.x/bottts/svg?seed=assistant&backgroundColor=c41e3a'}
          alt={isUser ? 'User avatar' : 'Assistant avatar'}
          className="w-full h-full object-cover"
        />
      </div>

      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[calc(100%-48px)] ${!isUser ? 'mr-[52px]' : ''}`}>
        <span className="text-[11px] font-medium text-[var(--fc-light-gray)] mb-1 px-1">
          {isUser ? 'You' : "Fiducial's unpaid intern"}
        </span>

        <div className="w-full space-y-2">
          {!isUser && showThinking && allThinking.length > 0 && (
            <div className="space-y-2">
              {allThinking.map((item, idx) => (
                <ThinkingBlock key={`${item.messageId}-thinking-${idx}`} text={item.block.text || ''} />
              ))}
            </div>
          )}

          {!isUser && showTools && allTools.length > 0 && (
            <div className="space-y-2">
              {allTools.map((item, idx) => (
                <ToolCard
                  key={`${item.messageId}-${item.block.toolCallId || idx}`}
                  toolName={item.block.toolName || 'Unknown Tool'}
                  parameters={item.block.parameters}
                  result={item.block.result}
                  status={item.block.status || 'completed'}
                  error={item.block.error}
                />
              ))}
            </div>
          )}

          {textParts.map((part, idx) => (
            <div key={part.messageId} className="relative group max-w-full">
              <div className={`px-4 py-3 text-[14px] leading-relaxed max-w-full overflow-hidden break-words ${
                isUser
                  ? 'bg-[var(--fc-charcoal)] text-white rounded-2xl rounded-tr-sm'
                  : 'bg-white text-[var(--fc-black)] rounded-2xl rounded-tl-sm shadow-sm border border-[var(--fc-border-gray)]'
              }`}>
                {idx === 0 && (allImages.length > 0 || allVideos.length > 0 || allFiles.length > 0) && (
                  <div className="space-y-3 mb-3">
                    {allImages.length > 0 && <ImageGrid images={allImages} onImageClick={setLightboxIndex} />}
                    {allVideos.length > 0 && (
                      <div className="grid grid-cols-1 gap-2 max-w-sm">
                        {allVideos.map((video, index) => (
                          <VideoPreviewCard
                            key={video.src}
                            video={video}
                            onOpen={() => setVideoLightboxIndex(index)}
                          />
                        ))}
                      </div>
                    )}
                    {allFiles.length > 0 && (
                      <div className="space-y-2">
                        {allFiles.map((file) => (
                          <FileCard
                            key={file.id}
                            file={file}
                            onRetry={file.status === 'error' && onRetryAttachment ? () => onRetryAttachment(messages[0].id, file.id) : undefined}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {isUser ? (
                  <span className="whitespace-pre-wrap text-white">{part.content}</span>
                ) : (
                  <div className="markdown-content">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]} components={markdownComponents}>
                      {part.content}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
              <div className={`absolute ${isUser ? 'left-0 -translate-x-full pl-2' : 'right-0 translate-x-full pr-2'} top-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200`}>
                <CopyButton text={part.content} />
              </div>
            </div>
          ))}

          {textParts.length === 0 && (allImages.length > 0 || allVideos.length > 0 || allFiles.length > 0) && (
            <div className={`px-4 py-3 max-w-full ${
              isUser
                ? 'bg-[var(--fc-charcoal)] text-white rounded-2xl rounded-tr-sm'
                : 'bg-white text-[var(--fc-black)] rounded-2xl rounded-tl-sm shadow-sm border border-[var(--fc-border-gray)]'
            }`}>
              <div className="space-y-3">
                {allImages.length > 0 && <ImageGrid images={allImages} onImageClick={setLightboxIndex} />}
                {allVideos.length > 0 && (
                  <div className="grid grid-cols-1 gap-2 max-w-sm">
                    {allVideos.map((video, index) => (
                      <VideoPreviewCard
                        key={video.src}
                        video={video}
                        onOpen={() => setVideoLightboxIndex(index)}
                      />
                    ))}
                  </div>
                )}
                {allFiles.length > 0 && (
                  <div className="space-y-2">
                    {allFiles.map((file) => (
                      <FileCard
                        key={file.id}
                        file={file}
                        onRetry={file.status === 'error' && onRetryAttachment ? () => onRetryAttachment(messages[0].id, file.id) : undefined}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      <AnimatePresence>
        {lightboxIndex !== null && allImages.length > 0 && (
          <Lightbox images={allImages} initialIndex={lightboxIndex} onClose={() => setLightboxIndex(null)} />
        )}
        {videoLightboxIndex !== null && allVideos.length > 0 && (
          <VideoLightbox
            videos={allVideos}
            initialIndex={videoLightboxIndex}
            onClose={() => setVideoLightboxIndex(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
});
