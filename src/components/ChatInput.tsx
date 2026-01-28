'use client';

import { useState, useEffect, useRef } from 'react';
import { Sparkles, Mic, Globe, Paperclip, Send } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

const PLACEHOLDERS = [
  'How do I export 4K ProRes from Premiere?',
  'Best color grading workflow for HDR?',
  'After Effects expression for looping',
  'How to optimize render times?',
  'Explain LUTs vs color correction',
];

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const [isActive, setIsActive] = useState(false);
  const [thinkActive, setThinkActive] = useState(false);
  const [deepSearchActive, setDeepSearchActive] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isActive || inputValue) return;

    const interval = setInterval(() => {
      setShowPlaceholder(false);
      setTimeout(() => {
        setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
        setShowPlaceholder(true);
      }, 400);
    }, 3000);

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

  const handleActivate = () => setIsActive(true);

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

  const containerVariants = {
    collapsed: {
      height: 68,
      boxShadow: '0 2px 8px 0 rgba(0,0,0,0.08)',
      transition: { type: 'spring' as const, stiffness: 120, damping: 18 },
    },
    expanded: {
      height: 128,
      boxShadow: '0 8px 32px 0 rgba(0,0,0,0.16)',
      transition: { type: 'spring' as const, stiffness: 120, damping: 18 },
    },
  };

  const placeholderContainerVariants = {
    initial: {},
    animate: { transition: { staggerChildren: 0.025 } },
    exit: { transition: { staggerChildren: 0.015, staggerDirection: -1 } },
  };

  const letterVariants = {
    initial: {
      opacity: 0,
      filter: 'blur(12px)',
      y: 10,
    },
    animate: {
      opacity: 1,
      filter: 'blur(0px)',
      y: 0,
      transition: {
        opacity: { duration: 0.25 },
        filter: { duration: 0.4 },
        y: { type: 'spring' as const, stiffness: 80, damping: 20 },
      },
    },
    exit: {
      opacity: 0,
      filter: 'blur(12px)',
      y: -10,
      transition: {
        opacity: { duration: 0.2 },
        filter: { duration: 0.3 },
        y: { type: 'spring' as const, stiffness: 80, damping: 20 },
      },
    },
  };

  return (
    <div className="w-full flex justify-center items-center p-4 bg-[var(--fc-off-white)]">
      <motion.div
        ref={wrapperRef}
        className="w-full max-w-3xl"
        variants={containerVariants}
        animate={isActive || inputValue ? 'expanded' : 'collapsed'}
        initial="collapsed"
        style={{ overflow: 'hidden', borderRadius: 32, background: '#fff' }}
        onClick={handleActivate}
      >
        <div className="flex flex-col items-stretch w-full h-full">
          <div className="flex items-center gap-2 p-3 rounded-full bg-white max-w-3xl w-full">
            <button
              className="p-3 rounded-full hover:bg-gray-100 transition text-[var(--fc-body-gray)]"
              title="Attach file"
              type="button"
              tabIndex={-1}
            >
              <Paperclip size={20} />
            </button>

            <div className="relative flex-1">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={disabled}
                className="flex-1 border-0 outline-0 rounded-md py-2 text-base bg-transparent w-full font-normal text-[var(--fc-black)] disabled:opacity-50"
                style={{ position: 'relative', zIndex: 1 }}
                onFocus={handleActivate}
              />
              <div className="absolute left-0 top-0 w-full h-full pointer-events-none flex items-center px-3 py-2">
                <AnimatePresence mode="wait">
                  {showPlaceholder && !isActive && !inputValue && (
                    <motion.span
                      key={placeholderIndex}
                      className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400 select-none pointer-events-none"
                      style={{
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        zIndex: 0,
                      }}
                      variants={placeholderContainerVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                    >
                      {PLACEHOLDERS[placeholderIndex].split('').map((char, i) => (
                        <motion.span
                          key={i}
                          variants={letterVariants}
                          style={{ display: 'inline-block' }}
                        >
                          {char === ' ' ? '\u00A0' : char}
                        </motion.span>
                      ))}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <button
              className="p-3 rounded-full hover:bg-gray-100 transition text-[var(--fc-body-gray)]"
              title="Voice input"
              type="button"
              tabIndex={-1}
            >
              <Mic size={20} />
            </button>
            <button
              className="flex items-center gap-1 bg-[var(--fc-action-red)] hover:bg-[var(--fc-dark-red)] disabled:bg-gray-300 disabled:cursor-not-allowed text-white p-3 rounded-full font-medium justify-center transition-colors"
              title="Send"
              type="button"
              tabIndex={-1}
              disabled={!inputValue.trim() || disabled}
              onClick={(e) => {
                e.stopPropagation();
                handleSubmit();
              }}
            >
              <Send size={18} />
            </button>
          </div>

          <motion.div
            className="w-full flex justify-start px-4 items-center text-sm"
            variants={{
              hidden: {
                opacity: 0,
                y: 20,
                pointerEvents: 'none' as const,
                transition: { duration: 0.25 },
              },
              visible: {
                opacity: 1,
                y: 0,
                pointerEvents: 'auto' as const,
                transition: { duration: 0.35, delay: 0.08 },
              },
            }}
            initial="hidden"
            animate={isActive || inputValue ? 'visible' : 'hidden'}
            style={{ marginTop: 8 }}
          >
            <div className="flex gap-3 items-center">
              <button
                className={`flex items-center gap-1 px-4 py-2 rounded-full transition-all font-medium group ${
                  thinkActive
                    ? 'bg-[var(--fc-action-red)]/10 outline outline-[var(--fc-action-red)]/60 text-[var(--fc-black)]'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title="Think"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setThinkActive((a) => !a);
                }}
              >
                <Sparkles
                  className={`transition-all ${thinkActive ? 'text-[var(--fc-action-red)]' : 'group-hover:text-[var(--fc-action-red)]'}`}
                  size={18}
                />
                Think
              </button>

              <motion.button
                className={`flex items-center px-4 gap-1 py-2 rounded-full transition font-medium whitespace-nowrap overflow-hidden justify-start ${
                  deepSearchActive
                    ? 'bg-[var(--fc-action-red)]/10 outline outline-[var(--fc-action-red)]/60 text-[var(--fc-black)]'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title="Deep Search"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeepSearchActive((a) => !a);
                }}
                initial={false}
                animate={{
                  width: deepSearchActive ? 140 : 44,
                  paddingLeft: deepSearchActive ? 16 : 12,
                }}
              >
                <div className="flex-shrink-0">
                  <Globe size={18} className={deepSearchActive ? 'text-[var(--fc-action-red)]' : ''} />
                </div>
                <motion.span
                  className="pb-[2px]"
                  initial={false}
                  animate={{
                    opacity: deepSearchActive ? 1 : 0,
                  }}
                >
                  Deep Search
                </motion.span>
              </motion.button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
