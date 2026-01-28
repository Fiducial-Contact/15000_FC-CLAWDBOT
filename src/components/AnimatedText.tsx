'use client';

import { motion, AnimatePresence } from 'motion/react';

const containerVariants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.025 } },
  exit: { transition: { staggerChildren: 0.015, staggerDirection: -1 as const } },
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

interface AnimatedTextProps {
  text: string;
  className?: string;
  isVisible?: boolean;
}

export function AnimatedText({ text, className, isVisible = true }: AnimatedTextProps) {
  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.span
          key={text}
          variants={containerVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className={className}
        >
          {text.split('').map((char, idx) => (
            <motion.span key={`${char}-${idx}`} variants={letterVariants} className="inline-block">
              {char === ' ' ? '\u00A0' : char}
            </motion.span>
          ))}
        </motion.span>
      )}
    </AnimatePresence>
  );
}
