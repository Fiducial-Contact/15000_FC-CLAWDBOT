'use client';

import { Activity, TrendingUp, Trophy } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { SocialViewType } from '@/lib/types/social';

interface TabBarProps {
  activeTab: SocialViewType;
  onTabChange: (tab: SocialViewType) => void;
}

const TABS: { id: SocialViewType; label: string; icon: LucideIcon }[] = [
  { id: 'feed', label: 'Activity', icon: Activity },
  { id: 'daily', label: 'Performance', icon: TrendingUp },
  { id: 'wins', label: 'Wins', icon: Trophy },
];

export function TabBar({ activeTab, onTabChange }: TabBarProps) {
  return (
    <div className="bg-white rounded-2xl border border-[var(--fc-border-gray)] shadow-sm p-2 overflow-x-auto scrollbar-hide">
      <div className="flex gap-2 min-w-max">
        {TABS.map((tab) => {
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
            </button>
          );
        })}
      </div>
    </div>
  );
}
