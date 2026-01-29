'use client';

import { memo, useState, useCallback } from 'react';
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

interface ChatMessageProps {
  messageId: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp?: string;
  blocks?: ChatContentBlock[];
  attachments?: ChatAttachment[];
  showThinking?: boolean;
  showTools?: boolean;
  onRetryAttachment?: (messageId: string, attachmentId: string) => void;
  isGroupContinuation?: boolean;
  isStreaming?: boolean;
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
      className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-all duration-200 ${copied
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
      {/* Header bar */}
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
          className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-all duration-200 ${copied
              ? 'text-green-400'
              : 'text-[#858585] hover:text-white'
            }`}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      {/* Code content */}
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
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[var(--fc-action-red)] hover:underline font-medium"
      >
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
  h4({ children }) {
    return <h4 className="text-sm font-bold mt-2 mb-1 text-[var(--fc-black)]">{children}</h4>;
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
        <table className="w-full text-sm">
          {children}
        </table>
      </div>
    );
  },
  thead({ children }) {
    return <thead className="bg-[var(--fc-subtle-gray)]">{children}</thead>;
  },
  th({ children }) {
    return (
      <th className="px-4 py-2.5 font-semibold text-[var(--fc-black)] text-left border-b border-[var(--fc-border-gray)]">
        {children}
      </th>
    );
  },
  td({ children }) {
    return (
      <td className="px-4 py-2.5 text-[var(--fc-body-gray)] border-b border-[var(--fc-border-gray)] last:border-b-0">
        {children}
      </td>
    );
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
        <img
          src={src}
          alt={alt || 'Image'}
          className="max-w-full max-h-80 rounded-xl border border-[var(--fc-border-gray)] object-contain"
          loading="lazy"
        />
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

  const handlePrev = useCallback(() => {
    setCurrentIndex((i) => (i > 0 ? i - 1 : images.length - 1));
  }, [images.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((i) => (i < images.length - 1 ? i + 1 : 0));
  }, [images.length]);

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

      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); handlePrev(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-10"
            aria-label="Previous"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleNext(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-10"
            aria-label="Next"
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
              className={`w-2 h-2 rounded-full transition-colors ${i === currentIndex ? 'bg-white' : 'bg-white/40 hover:bg-white/60'
                }`}
              aria-label={`Go to image ${i + 1}`}
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
      <button
        onClick={() => onImageClick(0)}
        className="block w-full max-w-xs overflow-hidden rounded-xl border border-[var(--fc-border-gray)] group relative"
      >
        <img
          src={images[0].src}
          alt={images[0].label}
          className="w-full h-auto max-h-64 object-cover transition-transform group-hover:scale-[1.02]"
          loading="lazy"
        />
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
          <button
            key={image.src}
            onClick={() => onImageClick(i)}
            className="block overflow-hidden rounded-xl border border-[var(--fc-border-gray)] group relative aspect-square"
          >
            <img
              src={image.src}
              alt={image.label}
              className="w-full h-full object-cover transition-transform group-hover:scale-[1.02]"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          </button>
        ))}
      </div>
    );
  }

  if (count === 3) {
    return (
      <div className="grid grid-cols-2 gap-1.5 max-w-sm">
        <button
          onClick={() => onImageClick(0)}
          className="row-span-2 block overflow-hidden rounded-xl border border-[var(--fc-border-gray)] group relative"
        >
          <img
            src={images[0].src}
            alt={images[0].label}
            className="w-full h-full object-cover transition-transform group-hover:scale-[1.02]"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
        </button>
        {images.slice(1).map((image, i) => (
          <button
            key={image.src}
            onClick={() => onImageClick(i + 1)}
            className="block overflow-hidden rounded-xl border border-[var(--fc-border-gray)] group relative aspect-square"
          >
            <img
              src={image.src}
              alt={image.label}
              className="w-full h-full object-cover transition-transform group-hover:scale-[1.02]"
              loading="lazy"
            />
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
        <button
          key={image.src}
          onClick={() => onImageClick(i)}
          className="block overflow-hidden rounded-xl border border-[var(--fc-border-gray)] group relative aspect-square"
        >
          <img
            src={image.src}
            alt={image.label}
            className="w-full h-full object-cover transition-transform group-hover:scale-[1.02]"
            loading="lazy"
          />
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

interface FileCardProps {
  file: ChatAttachment;
  onRetry?: () => void;
}

function FileCard({ file, onRetry }: FileCardProps) {
  const sizeLabel = formatFileSize(file.size);
  const isUploading = file.status === 'uploading';
  const isError = file.status === 'error';
  const isReady = file.status === 'ready' || (!file.status && file.url);

  const content = (
    <div
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all ${isError
          ? 'border-red-200 bg-red-50'
          : isUploading
            ? 'border-[var(--fc-border-gray)] bg-[var(--fc-off-white)]'
            : 'border-[var(--fc-border-gray)] bg-[var(--fc-off-white)] hover:border-[var(--fc-light-gray)] hover:shadow-sm cursor-pointer'
        }`}
    >
      <div
        className={`w-10 h-10 rounded-lg border flex items-center justify-center flex-shrink-0 ${isError
            ? 'bg-red-100 border-red-200'
            : 'bg-white border-[var(--fc-border-gray)]'
          }`}
      >
        {isUploading ? (
          <Loader2 size={18} className="text-[var(--fc-action-red)] animate-spin" />
        ) : isError ? (
          <AlertTriangle size={18} className="text-red-500" />
        ) : (
          <FileText size={18} className="text-[var(--fc-action-red)]" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-medium text-[var(--fc-black)] truncate max-w-[200px]">
          {file.fileName}
        </p>
        <p className={`text-[10px] ${isError ? 'text-red-500' : 'text-[var(--fc-light-gray)]'}`}>
          {isUploading ? 'Uploading...' : isError ? 'Upload failed' : sizeLabel}
        </p>
      </div>
      {isError && onRetry ? (
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            onRetry();
          }}
          className="text-[11px] font-medium text-[var(--fc-action-red)] px-2 py-1 rounded-lg border border-red-100 hover:bg-red-50"
        >
          Retry
        </button>
      ) : null}
      {isReady && file.url && (
        <Download size={16} className="text-[var(--fc-light-gray)] group-hover:text-[var(--fc-action-red)] transition-colors flex-shrink-0" />
      )}
    </div>
  );

  if (isReady && file.url) {
    return (
      <a
        href={file.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block group"
      >
        {content}
      </a>
    );
  }

  return <div className={isError ? '' : 'opacity-80'}>{content}</div>;
}

function resolveImageSource(block: ChatContentBlock) {
  if (block.type === 'image_url' && typeof block.url === 'string') {
    return block.url;
  }
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
    if (url && typeof url === 'string') {
      images.push({ src: url, label: alt || 'Image' });
    }
    return '';
  });
  return { images, cleanedContent: cleanedContent.trim() };
}

export const ChatMessage = memo(function ChatMessage({
  messageId,
  content,
  role,
  timestamp,
  blocks,
  attachments,
  showThinking = false,
  showTools = false,
  onRetryAttachment,
  isGroupContinuation = false,
  isStreaming = false,
}: ChatMessageProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const isUser = role === 'user';
  const showHeader = !isGroupContinuation;
  const imageAttachments = (attachments || []).filter((item) => item.kind === 'image');
  const fileAttachments = (attachments || []).filter((item) => item.kind === 'file');
  const imageBlocks = (blocks || []).filter(
    (block) => block.type === 'image' || block.type === 'image_url'
  );
  const thinkingBlocks = (blocks || [])
    .filter(isThinkingBlock)
    .filter((block) => block.text && block.text.trim().length > 0) as ThinkingBlockType[];
  const toolCallBlocks = (blocks || []).filter(isToolCallBlock) as ToolCallBlock[];

  const { images: markdownImages, cleanedContent } = extractMarkdownImages(content || '');

  const imageSources = new Map<string, { src: string; label: string }>();
  imageAttachments.forEach((item) => {
    const src = item.previewUrl || item.url || '';
    if (src) {
      imageSources.set(src, { src, label: item.fileName });
    }
  });
  imageBlocks.forEach((block) => {
    const src = resolveImageSource(block);
    if (src) {
      imageSources.set(src, { src, label: 'Image' });
    }
  });
  markdownImages.forEach((img) => {
    if (img.src && !imageSources.has(img.src)) {
      imageSources.set(img.src, img);
    }
  });

  const images = Array.from(imageSources.values());

  const displayContent = isUser ? content : cleanedContent;
  const hasContent = displayContent && displayContent.trim().length > 0;
  const hasMedia = images.length > 0 || fileAttachments.length > 0;
  const hasRenderableBlocks =
    !isUser &&
    ((showThinking && thinkingBlocks.length > 0) || (showTools && toolCallBlocks.length > 0));
  if (!hasContent && !hasMedia && !hasRenderableBlocks) {
    return null;
  }

  const handleImageClick = (index: number) => {
    setLightboxIndex(index);
  };

  return (
    <motion.div
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} ${showHeader ? 'mb-6' : 'mb-2'}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
    >
      {/* Avatar - DiceBear (hidden for group continuations) */}
      {showHeader ? (
        <div className="flex-shrink-0 w-8 h-8 rounded-xl overflow-hidden shadow-sm">
          <img
            src={
              isUser
                ? 'https://api.dicebear.com/9.x/lorelei/svg?seed=user&backgroundColor=262626'
                : 'https://api.dicebear.com/9.x/bottts/svg?seed=assistant&backgroundColor=c41e3a'
            }
            alt={isUser ? 'User avatar' : 'Assistant avatar'}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="flex-shrink-0 w-8" />
      )}

      {/* Message Container */}
      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[calc(100%-48px)] ${!isUser ? 'mr-[52px]' : ''}`}>
        {/* Role label (hidden for group continuations) */}
        {showHeader && (
          <span className="text-[11px] font-medium text-[var(--fc-light-gray)] mb-1 px-1">
            {isUser ? 'You' : "Fiducial's unpaid intern"}
          </span>
        )}

        {/* Message Content Group */}
        <div className="w-full space-y-2">

          {/* 1. Thinking Blocks (Standalone) */}
          {!isUser && showThinking && thinkingBlocks.length > 0 && (
            <div className="space-y-2">
              {thinkingBlocks.map((block, idx) => (
                <ThinkingBlock key={idx} text={block.text || ''} />
              ))}
            </div>
          )}

          {/* 2. Main Message Bubble (Text + Media) */}
          {(hasContent || hasMedia) && (
            <div className={`relative group max-w-full ${isUser ? 'items-end' : 'items-start'}`}>
              <div
                className={`px-4 py-3 text-[14px] leading-relaxed max-w-full overflow-hidden break-words ${isUser
                    ? 'bg-[var(--fc-charcoal)] text-white rounded-2xl rounded-tr-sm'
                    : 'bg-white text-[var(--fc-black)] rounded-2xl rounded-tl-sm shadow-sm border border-[var(--fc-border-gray)]'
                  }`}
              >
                {(images.length > 0 || fileAttachments.length > 0) && (
                  <div className="space-y-3 mb-3">
                    {images.length > 0 && (
                      <ImageGrid images={images} onImageClick={handleImageClick} />
                    )}
                    {fileAttachments.length > 0 && (
                      <div className="space-y-2">
                        {fileAttachments.map((file) => (
                          <FileCard
                            key={file.id}
                            file={file}
                            onRetry={
                              file.status === 'error' && onRetryAttachment
                                ? () => onRetryAttachment(messageId, file.id)
                                : undefined
                            }
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {hasContent ? (
                  isUser ? (
                    <span className="whitespace-pre-wrap break-words text-white" style={{ color: '#ffffff !important' }}>{displayContent}</span>
                  ) : (
                    <div className="markdown-content">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeHighlight]}
                        components={markdownComponents}
                      >
                        {displayContent}
                      </ReactMarkdown>
                      {isStreaming && (
                        <span
                          className="inline-block w-[3px] h-[1em] bg-[var(--fc-body-gray)] rounded-full align-middle ml-0.5 animate-blink"
                          aria-hidden="true"
                        />
                      )}
                    </div>
                  )
                ) : null}
              </div>

              {content && (
                <div className={`absolute ${isUser ? 'left-0 -translate-x-full pl-2' : 'right-0 translate-x-full pr-2'} top-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200`}>
                  <CopyButton text={content} />
                </div>
              )}
            </div>
          )}

          {/* 3. Tool Calls (Standalone) */}
          {!isUser && showTools && toolCallBlocks.length > 0 && (
            <div className="space-y-2 pt-1">
              {toolCallBlocks.map((block, idx) => (
                <ToolCard
                  key={block.toolCallId || idx}
                  toolName={block.toolName || 'Unknown Tool'}
                  parameters={block.parameters}
                  result={block.result}
                  status={block.status || 'completed'}
                  error={block.error}
                />
              ))}
            </div>
          )}
        </div>

        {/* Timestamp */}
        {timestamp && (
          <span className="text-[10px] text-[var(--fc-light-gray)] mt-1.5 px-1">
            {timestamp}
          </span>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && images.length > 0 && (
          <Lightbox
            images={images}
            initialIndex={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
});
