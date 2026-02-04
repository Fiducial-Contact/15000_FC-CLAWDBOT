'use client';

import { memo } from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface CapabilityCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  color: string;
  onClick?: () => void;
  disabled?: boolean;
  delay?: number;
}

export const CapabilityCard = memo(function CapabilityCard({
  icon: Icon,
  title,
  description,
  color,
  onClick,
  disabled = false,
  delay = 0,
}: CapabilityCardProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-white border border-[var(--fc-border-gray)] h-full min-h-[160px] text-left transition-opacity ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:border-[var(--fc-light-gray)]'}`}
      style={{
        boxShadow: '0 0 0 1px rgba(0,0,0,.03), 0 2px 4px rgba(0,0,0,.05), 0 12px 24px rgba(0,0,0,.05)',
      }}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Content - moves up on hover */}
      <div className="pointer-events-none z-10 flex transform-gpu flex-col gap-1.5 p-5 pt-6 transition-all duration-300 group-hover:-translate-y-6">
        {/* Icon */}
        <Icon
          size={28}
          style={{ color }}
          strokeWidth={1.5}
          className="mb-2 origin-left transform-gpu transition-all duration-300 ease-in-out group-hover:scale-75"
        />

        {/* Text */}
        <h3
          className="text-[17px] font-bold text-[var(--fc-black)] tracking-tight transition-colors duration-300 group-hover:text-[color:var(--hover-color)] font-[family-name:var(--font-manrope)]"
          style={{ '--hover-color': color } as React.CSSProperties}
        >
          {title}
        </h3>
        <p className="text-[12px] text-[var(--fc-body-gray)] leading-relaxed">
          {description}
        </p>
      </div>

      {/* CTA - slides up on hover */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 flex w-full translate-y-8 transform-gpu flex-row items-center px-5 pb-5 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
        <span
          className="flex items-center gap-1.5 text-[12px] font-medium"
          style={{ color }}
        >
          Try it
          <ArrowRight size={14} />
        </span>
      </div>

      {/* Hover overlay */}
      <div className="pointer-events-none absolute inset-0 transform-gpu transition-all duration-300 group-hover:bg-black/[.02]" />
    </motion.button>
  );
});
