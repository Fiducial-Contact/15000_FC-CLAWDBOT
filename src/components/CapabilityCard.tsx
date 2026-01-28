'use client';

import { memo } from 'react';
import { motion } from 'motion/react';
import type { LucideIcon } from 'lucide-react';

interface CapabilityCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  color: string;
  onClick?: () => void;
  index?: number;
}

export const CapabilityCard = memo(function CapabilityCard({
  icon: Icon,
  title,
  description,
  color,
  onClick,
  index = 0,
}: CapabilityCardProps) {
  return (
    <motion.button
      onClick={onClick}
      className="flex flex-col items-center gap-2 p-4 bg-white border border-[var(--fc-border-gray)] rounded-2xl text-center hover:border-[var(--fc-action-red)] shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-md)] transition-all group cursor-pointer"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12 + index * 0.06, duration: 0.32 }}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center transition-all group-hover:scale-110"
        style={{ backgroundColor: `${color}15` }}
      >
        <Icon size={24} style={{ color }} />
      </div>
      <span className="text-sm font-medium text-[var(--fc-black)] group-hover:text-[var(--fc-action-red)] transition-colors">
        {title}
      </span>
      <span className="text-xs text-[var(--fc-body-gray)]">{description}</span>
    </motion.button>
  );
});
