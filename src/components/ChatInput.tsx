'use client';

import { useState, useEffect, useRef } from 'react';
import { Sparkles, Mic, Globe, Paperclip, Send, Square } from 'lucide-react';
import { motion } from 'motion/react';

const PLACEHOLDERS = [
  'How do I export 4K ProRes from Premiere?',
  'Best color grading workflow for HDR?',
  'After Effects expression for looping',
  'How to optimize render times?',
  'Explain LUTs vs color correction',
];

interface ChatInputProps {
  onSend: (message: string) => void;
  onAbort?: () => void;
  disabled?: boolean;
  isLoading?: boolean;
}

export function ChatInput({ onSend, onAbort, disabled, isLoading }: ChatInputProps) {
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const [isActive, setIsActive] = useState(false);
  const [thinkActive, setThinkActive] = useState(false);
  const [deepSearchActive, setDeepSearchActive] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isActive || inputValue) return;

    const interval = setInterval(() => {
      setShowPlaceholder(false);
      setTimeout(() => {
        setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
        setShowPlaceholder(true);
      }, 400);
    }, 3500);

    return () => clearInterval(interval);
  }, [isActive, inputValue]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        if (!inputValue) setIsActive(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [inputValue]);

  const handleActivate = () => {
    setIsActive(true);
    inputRef.current?.focus();
  };

  const handleSubmit = () => {
    if (inputValue.trim() && !disabled) {
      onSend(inputValue.trim());
      setInputValue('');
      setIsActive(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="w-full flex justify-center items-center px-6 pb-6 pt-2 bg-transparent pointer-events-none">
      <motion.div
        ref={wrapperRef}
        className={`pointer-events-auto w-full max-w-3xl bg-white border flex flex-col items-stretch overflow-hidden transition-all duration-300 relative ${isActive
            ? 'animate-breathing-glow border-[var(--fc-action-red)]/30'
            : 'border-[var(--fc-border-gray)] shadow-[var(--shadow-float)] hover:shadow-[var(--shadow-lg)] hover:border-[var(--fc-light-gray)]'
          }`}
        initial={{ borderRadius: 16 }}
        animate={{ borderRadius: 16 }}
        onClick={handleActivate}
      >
        <div className="flex flex-col w-full">
          {/* Main Input Text Area */}
          <div className="relative w-full px-4 pt-4 pb-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={disabled}
              placeholder={showPlaceholder && !isActive ? PLACEHOLDERS[placeholderIndex] : "Ask anything..."}
              className="w-full text-[15px] bg-transparent border-none outline-none focus-visible:shadow-none text-[var(--fc-black)] placeholder:text-[var(--fc-light-gray)] font-medium leading-relaxed"
              style={{ minHeight: '24px' }}
              onFocus={handleActivate}
            />
          </div>

          {/* Toolbar Row */}
          <div className="flex items-center justify-between px-3 pb-3 pt-1">
            {/* Left Tools */}
            <div className="flex items-center gap-1">
              <button
                className={`p-2 rounded-lg transition-colors duration-200 group ${isActive || inputValue ? 'text-[var(--fc-body-gray)] hover:bg-[var(--fc-off-white)] hover:text-[var(--fc-black)]' : 'text-[var(--fc-light-gray)]'
                  }`}
                title="Attach file"
                type="button"
                tabIndex={-1}
              >
                <div className="relative">
                  <Paperclip size={18} strokeWidth={2} />
                </div>
              </button>

              <button
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[12px] font-medium transition-all duration-200 border ${thinkActive
                    ? 'bg-red-50 text-[var(--fc-action-red)] border-red-100'
                    : 'bg-transparent text-[var(--fc-body-gray)] border-transparent hover:bg-[var(--fc-off-white)]'
                  }`}
                onClick={(e) => { e.stopPropagation(); setThinkActive(!thinkActive); }}
              >
                <Sparkles size={13} className={thinkActive ? 'fill-current' : ''} />
                <span>Think</span>
              </button>

              <button
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[12px] font-medium transition-all duration-200 border ${deepSearchActive
                    ? 'bg-blue-50 text-blue-600 border-blue-100'
                    : 'bg-transparent text-[var(--fc-body-gray)] border-transparent hover:bg-[var(--fc-off-white)]'
                  }`}
                onClick={(e) => { e.stopPropagation(); setDeepSearchActive(!deepSearchActive); }}
              >
                <Globe size={13} />
                <span>Search</span>
              </button>
            </div>

            {/* Right Tools */}
            <div className="flex items-center gap-2">
              {inputValue.length === 0 && (
                <button
                  className="p-2 rounded-lg text-[var(--fc-light-gray)] hover:text-[var(--fc-black)] hover:bg-[var(--fc-off-white)] transition-colors"
                  type="button"
                >
                  <Mic size={18} />
                </button>
              )}

              {isLoading ? (
                <button
                  className="flex items-center justify-center p-2 rounded-lg bg-[var(--fc-action-red)] text-white shadow-md transition-all duration-300 active:scale-95 hover:bg-[var(--fc-dark-red)]"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAbort?.();
                  }}
                  title="Stop generating"
                >
                  <Square size={14} className="fill-current" />
                </button>
              ) : (
                <button
                  className={`flex items-center justify-center p-2 rounded-lg transition-all duration-300 ${inputValue.trim()
                      ? 'bg-[var(--fc-black)] text-white shadow-md active:scale-95'
                      : 'bg-[var(--fc-off-white)] text-[var(--fc-light-gray)] cursor-not-allowed'
                    }`}
                  disabled={!inputValue.trim() || disabled}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSubmit();
                  }}
                >
                  <Send size={16} className={inputValue.trim() ? 'ml-0.5' : ''} />
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
