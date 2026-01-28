'use client';

import { memo } from 'react';
import Image from 'next/image';
import { LogOut, User } from 'lucide-react';
import { motion } from 'motion/react';

interface HeaderProps {
  userName?: string;
  onLogout?: () => void;
}

export const Header = memo(function Header({ userName, onLogout }: HeaderProps) {
  return (
    <header className="bg-white border-b border-[var(--fc-border-gray)] px-4 md:px-6 py-3 shadow-[var(--shadow-sm)]">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image
            src="/brand/Fiducial-logo-2021_RGB.svg"
            alt="Fiducial Communications"
            width={140}
            height={35}
            priority
            className="h-8 w-auto"
          />
          <div className="hidden sm:flex items-center gap-2">
            <div className="h-5 w-px bg-[var(--fc-border-gray)]" />
            <span className="text-xs font-medium text-[var(--fc-light-gray)] uppercase tracking-wider">
              AI Assistant
            </span>
          </div>
        </div>

        {userName && (
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[var(--fc-off-white)] rounded-full">
              <User size={14} className="text-[var(--fc-body-gray)]" />
              <span className="text-sm text-[var(--fc-body-gray)]">
                {userName.split('@')[0]}
              </span>
            </div>
            {onLogout && (
              <motion.button
                onClick={onLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-[var(--fc-body-gray)] hover:text-[var(--fc-action-red)] hover:bg-red-50 rounded-full transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <LogOut size={14} />
                <span className="hidden sm:inline">Sign out</span>
              </motion.button>
            )}
          </div>
        )}
      </div>
    </header>
  );
});
