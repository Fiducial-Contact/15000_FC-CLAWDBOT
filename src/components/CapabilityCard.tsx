'use client';

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

export function CapabilityCard({
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
      className="flex flex-col items-center gap-2 p-4 bg-white border border-[var(--fc-border-gray)] rounded-xl text-center hover:border-[var(--fc-action-red)] hover:shadow-md transition-all group cursor-pointer"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.05, duration: 0.3 }}
      whileHover={{ scale: 1.03, y: -2 }}
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
}
