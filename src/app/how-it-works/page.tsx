'use client';

import Link from 'next/link';
import { Bot, ChevronLeft } from 'lucide-react';
import { ArchitectureGraph } from './components/ArchitectureGraph';

export default function HowItWorksPage() {
  return (
    <div className="h-screen flex flex-col bg-[var(--fc-off-white)] overflow-hidden">
      <header className="flex-shrink-0 border-b border-[var(--fc-border-gray)] bg-white/80 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/chat"
            className="flex items-center gap-2 text-[var(--fc-body-gray)] hover:text-[var(--fc-black)] transition-colors"
          >
            <ChevronLeft size={20} />
            <span className="text-sm font-medium">Back to Chat</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--fc-red)] to-[var(--fc-action-red)] flex items-center justify-center">
              <Bot size={16} className="text-white" />
            </div>
            <span className="font-semibold text-[var(--fc-black)]">Fiducial AI</span>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        <ArchitectureGraph />
      </main>

      <footer className="flex-shrink-0 border-t border-[var(--fc-border-gray)] py-4 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-[var(--fc-light-gray)]">
          <p>Built by Haiwei | Fiducial Communications | Powered by Clawdbot</p>
        </div>
      </footer>
    </div>
  );
}
