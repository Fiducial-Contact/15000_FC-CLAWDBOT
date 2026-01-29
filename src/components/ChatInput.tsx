'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles, Mic, Globe, Paperclip, Send, Square, FileText, X, Upload, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { ChatAttachmentInput } from '@/lib/gateway/types';
import { AnimatedText } from '@/components/AnimatedText';

const PLACEHOLDERS = [
  'How do I export 4K ProRes from Premiere?',
  'Best color grading workflow for HDR?',
  'After Effects expression for looping',
  'How to optimize render times?',
  'Explain LUTs vs color correction',
];

const IMAGE_MAX_MB = Number(process.env.NEXT_PUBLIC_CHAT_IMAGE_MAX_MB) || 10;
const FILE_MAX_MB = Number(process.env.NEXT_PUBLIC_CHAT_FILE_MAX_MB) || 50;
const IMAGE_MAX_BYTES = IMAGE_MAX_MB * 1024 * 1024;
const FILE_MAX_BYTES = FILE_MAX_MB * 1024 * 1024;

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

interface ChatInputProps {
  onSend: (message: string, attachments: ChatAttachmentInput[]) => void | Promise<void>;
  onAbort?: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  prefillValue?: string;
  onPrefillConsumed?: () => void;
  isSidebarOpen?: boolean;
}

export function ChatInput({ onSend, onAbort, disabled, isLoading, prefillValue, onPrefillConsumed, isSidebarOpen = false }: ChatInputProps) {
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [attachments, setAttachments] = useState<ChatAttachmentInput[]>([]);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [thinkActive, setThinkActive] = useState(true);
  const [deepSearchActive, setDeepSearchActive] = useState(true);
  const [isPrefillHighlight, setIsPrefillHighlight] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  useEffect(() => {
    if (prefillValue) {
      setInputValue(prefillValue);
      onPrefillConsumed?.();
      setIsPrefillHighlight(true);
      setTimeout(() => {
        inputRef.current?.focus();
        const len = prefillValue.length;
        inputRef.current?.setSelectionRange(len, len);
      }, 0);
      setTimeout(() => setIsPrefillHighlight(false), 2000);
    }
  }, [prefillValue, onPrefillConsumed]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = inputRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [inputValue]);

  // Placeholder rotation with character animation
  useEffect(() => {
    if (isFocused || inputValue) return;

    const interval = setInterval(() => {
      setShowPlaceholder(false);
      setTimeout(() => {
        setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
        setShowPlaceholder(true);
      }, 400);
    }, 4000);

    return () => clearInterval(interval);
  }, [isFocused, inputValue]);

  const hasContent = inputValue.trim().length > 0 || attachments.length > 0;

  const addFiles = useCallback(async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    const errors: string[] = [];
    const next: ChatAttachmentInput[] = [];

    for (const file of files) {
      const isImage = file.type.startsWith('image/');
      const maxBytes = isImage ? IMAGE_MAX_BYTES : FILE_MAX_BYTES;
      if (file.size > maxBytes) {
        errors.push(`${file.name} exceeds the ${isImage ? IMAGE_MAX_MB : FILE_MAX_MB}MB limit.`);
        continue;
      }

      let previewUrl: string | undefined;
      if (isImage) {
        try {
          previewUrl = await fileToDataUrl(file);
        } catch {
          previewUrl = undefined;
        }
      }

      next.push({
        id: crypto.randomUUID(),
        file,
        kind: isImage ? 'image' : 'file',
        previewUrl,
      });
    }

    if (next.length > 0) {
      setAttachments((prev) => [...prev, ...next]);
    }
    if (errors.length > 0) {
      const addedLabel = next.length > 0 ? `Added ${next.length} file(s). ` : '';
      setAttachmentError(`${addedLabel}Skipped ${errors.length} file(s): ${errors.join(' ')}`);
    } else {
      setAttachmentError(null);
    }
  }, []);

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      addFiles(event.target.files);
      event.target.value = '';
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = event.clipboardData?.items;
    if (!items) return;
    const files = Array.from(items)
      .filter((item) => item.kind === 'file')
      .map((item) => item.getAsFile())
      .filter((file): file is File => Boolean(file));
    if (files.length > 0) {
      addFiles(files);
    }
  };

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      addFiles(files);
    }
  }, [addFiles]);

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => {
      const next = prev.filter((item) => item.id !== id);
      const removed = prev.find((item) => item.id === id);
      if (removed?.previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(removed.previewUrl);
      }
      return next;
    });
    setAttachmentError(null);
  }, []);

  const clearAttachments = useCallback(() => {
    attachments.forEach((item) => {
      if (item.previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(item.previewUrl);
      }
    });
    setAttachments([]);
  }, [attachments]);

  const handleSubmit = useCallback(() => {
    const trimmed = inputValue.trim();
    if (!hasContent || disabled) return;
    onSend(trimmed, attachments);
    setInputValue('');
    clearAttachments();
    setAttachmentError(null);
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
  }, [inputValue, disabled, onSend, attachments, hasContent, clearAttachments]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <>
      <AnimatePresence>
        {isPrefillHighlight && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="fixed top-20 z-50 flex justify-center"
            style={{
              left: isSidebarOpen ? 300 : 0,
              right: 0,
            }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2.5 bg-[var(--fc-charcoal)] text-white text-sm font-medium rounded-full shadow-lg">
              <Sparkles size={14} className="text-[var(--fc-action-red)]" />
              Add your link or content, then send
            </span>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="w-full px-4 pb-4 pt-2">
        <motion.div
          ref={containerRef}
          className={`relative max-w-3xl mx-auto bg-white rounded-2xl border-2 shadow-[var(--shadow-md)] transition-colors duration-300 ${
            isDragging
              ? 'border-[var(--fc-action-red)] border-dashed bg-red-50/30'
              : isPrefillHighlight
                ? 'animate-breathing-glow'
                : 'border-[var(--fc-border-gray)] hover:border-[var(--fc-light-gray)]'
          }`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
        {/* Drag Overlay */}
        <AnimatePresence>
          {isDragging && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex items-center justify-center rounded-2xl bg-red-50/80 backdrop-blur-sm pointer-events-none"
            >
              <div className="flex flex-col items-center gap-2 text-[var(--fc-action-red)]">
                <Upload size={32} strokeWidth={1.5} />
                <span className="text-sm font-medium">Drop files here</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Attachment Preview */}
        {attachments.length > 0 && (
          <div className="px-4 pt-3 flex flex-wrap gap-2">
            {attachments.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative group"
              >
                {item.kind === 'image' && item.previewUrl ? (
                  <div className="relative">
                    <img
                      src={item.previewUrl}
                      alt={item.file.name}
                      className="w-20 h-20 rounded-xl object-cover border border-[var(--fc-border-gray)] shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removeAttachment(item.id)}
                      className="absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center rounded-full bg-[var(--fc-charcoal)] text-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[var(--fc-action-red)]"
                      aria-label="Remove"
                    >
                      <X size={12} strokeWidth={2.5} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5 bg-[var(--fc-off-white)] border border-[var(--fc-border-gray)] rounded-xl px-3 py-2.5 pr-10">
                    <div className="w-10 h-10 rounded-lg bg-white border border-[var(--fc-border-gray)] flex items-center justify-center flex-shrink-0">
                      <FileText size={18} className="text-[var(--fc-action-red)]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[12px] font-medium text-[var(--fc-black)] truncate max-w-[140px]">
                        {item.file.name}
                      </p>
                      <p className="text-[10px] text-[var(--fc-light-gray)]">
                        {formatFileSize(item.file.size)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(item.id)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full text-[var(--fc-light-gray)] hover:text-[var(--fc-action-red)] hover:bg-red-50 transition-colors"
                      aria-label="Remove"
                    >
                      <X size={14} strokeWidth={2} />
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Attachment Error */}
        <AnimatePresence>
          {attachmentError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-4 pt-2"
            >
              <div className="flex items-center gap-2 text-[12px] text-red-600 bg-red-50 rounded-lg px-3 py-2">
                <AlertCircle size={14} />
                <span>{attachmentError}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Area */}
        <div className="px-4 pt-3 pb-2 relative">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            disabled={disabled}
            rows={1}
            aria-label="Message input"
            className="w-full bg-transparent border-none outline-none focus-visible:ring-2 focus-visible:ring-[var(--fc-action-red)] focus-visible:ring-offset-2 resize-none text-[15px] text-[var(--fc-black)] placeholder:text-transparent leading-relaxed min-h-[24px] max-h-[200px] rounded-lg"
            style={{ fontFamily: 'inherit' }}
          />
          
          {/* Animated Placeholder */}
          <div className="absolute left-4 top-3 pointer-events-none flex items-center">
            <AnimatedText
              text={PLACEHOLDERS[placeholderIndex]}
              isVisible={showPlaceholder && !isFocused && !inputValue}
              className="text-[var(--fc-light-gray)] text-[15px] select-none"
            />
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between px-3 pb-3">
          {/* Left Tools */}
          <div className="flex items-center gap-1">
            {/* Attach Button */}
            <button
              className="p-2 rounded-lg text-[var(--fc-body-gray)] hover:bg-[var(--fc-subtle-gray)] hover:text-[var(--fc-black)] transition-colors focus-visible:ring-2 focus-visible:ring-[var(--fc-action-red)] focus-visible:ring-offset-2"
              title="Attach file"
              aria-label="Attach file"
              type="button"
              disabled={disabled}
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip size={18} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileInputChange}
              accept="image/*,audio/*,video/*,application/pdf,text/*"
              disabled={disabled}
            />

            {/* Think Mode */}
            <button
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium transition-all duration-200 ${
                thinkActive
                  ? 'bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border border-amber-200'
                  : 'text-[var(--fc-body-gray)] hover:bg-[var(--fc-subtle-gray)]'
              }`}
              onClick={() => setThinkActive(!thinkActive)}
              type="button"
              disabled={disabled}
            >
              <Sparkles size={13} className={thinkActive ? 'fill-amber-500 text-amber-500' : ''} />
              <span>Think</span>
            </button>

            {/* Search Mode */}
            <button
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium transition-all duration-200 ${
                deepSearchActive
                  ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200'
                  : 'text-[var(--fc-body-gray)] hover:bg-[var(--fc-subtle-gray)]'
              }`}
              onClick={() => setDeepSearchActive(!deepSearchActive)}
              type="button"
              disabled={disabled}
            >
              <Globe size={13} className={deepSearchActive ? 'fill-blue-500 text-blue-500' : ''} />
              <span>Search</span>
            </button>

            {/* Mic Button - Only show when empty */}
            <AnimatePresence>
              {!hasContent && !isLoading && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                  className="p-2 rounded-lg text-[var(--fc-body-gray)] hover:bg-[var(--fc-subtle-gray)] hover:text-[var(--fc-black)] transition-colors focus-visible:ring-2 focus-visible:ring-[var(--fc-action-red)] focus-visible:ring-offset-2"
                  type="button"
                  disabled={disabled}
                  aria-label="Voice input"
                >
                  <Mic size={18} />
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* Right Tools */}
          <div className="flex items-center gap-2">
            {/* Send/Stop Button */}
            {isLoading ? (
              <motion.button
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-r from-[var(--fc-red)] to-[var(--fc-action-red)] text-white shadow-lg hover:shadow-xl transition-shadow focus-visible:ring-2 focus-visible:ring-[var(--fc-action-red)] focus-visible:ring-offset-2"
                onClick={onAbort}
                title="Stop generating"
                aria-label="Stop generating"
                type="button"
              >
                <Square size={14} className="fill-current" />
              </motion.button>
            ) : (
              <button
                className={`flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-300 focus-visible:ring-2 focus-visible:ring-[var(--fc-action-red)] focus-visible:ring-offset-2 ${
                  hasContent
                    ? 'bg-[var(--fc-black)] text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95'
                    : 'bg-[var(--fc-subtle-gray)] text-[var(--fc-light-gray)] cursor-not-allowed'
                }`}
                disabled={!hasContent || disabled}
                onClick={handleSubmit}
                type="button"
                aria-label="Send message"
              >
                <Send size={18} className={hasContent ? 'ml-0.5' : ''} />
              </button>
            )}
          </div>
        </div>
      </motion.div>

        {/* Footer hint */}
        <p className="text-center text-[11px] text-[var(--fc-light-gray)] mt-2">
          AI can make mistakes. Please verify important information.
        </p>
      </div>
    </>
  );
}
