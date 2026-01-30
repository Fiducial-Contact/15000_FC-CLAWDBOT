'use client';

import { MessageSquare, Flame, Calendar, Users, Hash } from 'lucide-react';
import { motion } from 'motion/react';
import type { SocialViewType } from '@/lib/types/social';

interface TabBarProps {
  activeTab: SocialViewType;
  onTabChange: (tab: SocialViewType) => void;
}

const tabs: Array<{ id: SocialViewType; label: string; icon: typeof MessageSquare }> = [
  { id: 'feed', label: 'Feed', icon: MessageSquare },
  { id: 'wins', label: 'Wins', icon: Flame },
  { id: 'daily', label: 'Daily', icon: Calendar },
  { id: 'network', label: 'Network', icon: Users },
  { id: 'submolt', label: 'Submolt', icon: Hash },
];

export function TabBar({ activeTab, onTabChange }: TabBarProps) {
  return (
    <div className="bg-white rounded-2xl border border-[var(--fc-border-gray)] shadow-sm p-2 overflow-x-auto scrollbar-hide">
      <div className="flex gap-2 min-w-max">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                isActive
                  ? 'bg-[var(--fc-black)] text-white shadow-md'
                  : 'text-[var(--fc-body-gray)] hover:bg-[var(--fc-subtle-gray)]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm">{tab.label}</span>
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-[var(--fc-black)] rounded-lg -z-10"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
