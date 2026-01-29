'use client';

import { memo, useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { LogOut, Sparkles, ChevronDown, KeyRound, Zap, Info, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HeaderProps {
  userName?: string;
  onLogout?: () => void;
  onChangePassword?: () => void;
  onOpenProfile?: () => void;
}

export const Header = memo(function Header({ userName, onLogout, onChangePassword, onOpenProfile }: HeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setIsDropdownOpen(false);
    onLogout?.();
  };

  const handleChangePassword = () => {
    setIsDropdownOpen(false);
    onChangePassword?.();
  };

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-[var(--fc-border-gray)] px-4 md:px-6 py-3 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image
            src="/brand/Fiducial-logo-2021_RGB.svg"
            alt="Fiducial Communications"
            width={140}
            height={35}
            priority
            className="h-7 w-auto"
          />
          <div className="hidden sm:flex items-center gap-2">
            <div className="h-4 w-px bg-[var(--fc-border-gray)]" />
            <div className="flex items-center gap-1.5">
              <Sparkles size={12} className="text-[var(--fc-action-red)]" />
              <span className="text-xs font-medium text-[var(--fc-body-gray)] uppercase tracking-wider">
                AI Agent
              </span>
            </div>
            <div className="h-4 w-px bg-[var(--fc-border-gray)]" />
            <Link
              href="/skills"
              className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium text-[var(--fc-body-gray)] hover:text-[var(--fc-dark-gray)] hover:bg-[var(--fc-subtle-gray)] transition-colors"
            >
              <Zap size={12} />
              Skills
            </Link>
            <Link
              href="/how-it-works"
              className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium text-[var(--fc-body-gray)] hover:text-[var(--fc-dark-gray)] hover:bg-[var(--fc-subtle-gray)] transition-colors"
            >
              <Info size={12} />
              How It Works
            </Link>
          </div>
        </div>

        {userName && (
          <div className="relative" ref={dropdownRef}>
            <motion.button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all ${isDropdownOpen
                  ? 'bg-[var(--fc-subtle-gray)] ring-2 ring-[var(--fc-border-gray)]'
                  : 'bg-[var(--fc-subtle-gray)] hover:bg-[var(--fc-border-gray)]'
                }`}
              whileTap={{ scale: 0.98 }}
            >
              <img
                src="https://api.dicebear.com/9.x/lorelei/svg?seed=user&backgroundColor=262626"
                alt="User avatar"
                className="w-6 h-6 rounded-full"
              />
              <span className="hidden sm:block text-xs font-medium text-[var(--fc-dark-gray)] max-w-[120px] truncate">
                {userName.split('@')[0]}
              </span>
              <ChevronDown
                size={14}
                className={`text-[var(--fc-body-gray)] transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
              />
            </motion.button>

            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
                  className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-[var(--fc-border-gray)] overflow-hidden z-50"
                >
                  <div className="px-4 py-3 border-b border-[var(--fc-border-gray)] bg-[var(--fc-subtle-gray)]/50">
                    <p className="text-sm font-medium text-[var(--fc-black)] truncate">
                      {userName.split('@')[0]}
                    </p>
                    <p className="text-xs text-[var(--fc-body-gray)] truncate">
                      {userName}
                    </p>
                  </div>

                  <div className="py-1.5">
                    {onOpenProfile && (
                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          onOpenProfile();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--fc-dark-gray)] hover:bg-[var(--fc-subtle-gray)] transition-colors"
                      >
                        <User size={16} className="text-[var(--fc-body-gray)]" />
                        My Profile
                      </button>
                    )}
                    {onChangePassword && (
                      <button
                        onClick={handleChangePassword}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--fc-dark-gray)] hover:bg-[var(--fc-subtle-gray)] transition-colors"
                      >
                        <KeyRound size={16} className="text-[var(--fc-body-gray)]" />
                        Change Password
                      </button>
                    )}
                    {onLogout && (
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--fc-action-red)] hover:bg-red-50 transition-colors"
                      >
                        <LogOut size={16} />
                        Sign Out
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </header>
  );
});
