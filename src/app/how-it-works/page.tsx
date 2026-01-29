'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronDown } from 'lucide-react';
import { ArchitectureGraph } from './components/ArchitectureGraph';

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--fc-off-white)]">
      <header className="sticky top-0 flex-shrink-0 border-b border-[var(--fc-border-gray)] bg-white/80 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/chat"
            className="flex items-center gap-2 text-[var(--fc-body-gray)] hover:text-[var(--fc-black)] transition-colors"
          >
            <ChevronLeft size={20} />
            <span className="text-sm font-medium">Back to Chat</span>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <div className="h-screen">
          <ArchitectureGraph />
        </div>

        {/* Scroll Indicator */}
        <div className="flex flex-col items-center py-8 bg-gradient-to-b from-[var(--fc-off-white)] to-white">
          <div className="flex items-center gap-3 text-[var(--fc-body-gray)]">
            <div className="h-px w-16 bg-[var(--fc-border-gray)]" />
            <span className="text-sm font-medium">Agent Learning Architecture</span>
            <div className="h-px w-16 bg-[var(--fc-border-gray)]" />
          </div>
          <ChevronDown size={20} className="mt-2 text-[var(--fc-light-gray)] animate-bounce" />
        </div>

        {/* System Architecture Overview */}
        <div className="max-w-5xl mx-auto px-4 py-12">
          {/* Architecture Flow - Circuit Style */}
          <div className="bg-slate-900 rounded-xl p-8 shadow-lg mb-10 overflow-hidden relative">
            <div className="absolute inset-0 opacity-[0.03]" style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)',
              backgroundSize: '24px 24px'
            }} />

            {/* SVG Circuit Lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
              <defs>
                <linearGradient id="gradBlue" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="gradPurple" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* User fan-out to channels - L-shaped */}
              <path d="M 50% 70 L 50% 85 L 18% 85 L 18% 105" stroke="#3b82f6" strokeWidth="1" strokeOpacity="0.25" fill="none" />
              <path d="M 50% 70 L 50% 85 L 36% 85 L 36% 105" stroke="#3b82f6" strokeWidth="1" strokeOpacity="0.25" fill="none" />
              <path d="M 50% 70 L 50% 85 L 64% 85 L 64% 105" stroke="#3b82f6" strokeWidth="1" strokeOpacity="0.25" fill="none" />
              <path d="M 50% 70 L 50% 85 L 82% 85 L 82% 105" stroke="#3b82f6" strokeWidth="1" strokeOpacity="0.25" fill="none" />
              {/* Channels converge to gateway - L-shaped */}
              <path d="M 18% 130 L 18% 145 L 50% 145 L 50% 160" stroke="#a855f7" strokeWidth="1" strokeOpacity="0.2" fill="none" />
              <path d="M 36% 130 L 36% 150 L 50% 150" stroke="#a855f7" strokeWidth="1" strokeOpacity="0.2" fill="none" />
              <path d="M 64% 130 L 64% 150 L 50% 150" stroke="#a855f7" strokeWidth="1" strokeOpacity="0.2" fill="none" />
              <path d="M 82% 130 L 82% 145 L 50% 145" stroke="#a855f7" strokeWidth="1" strokeOpacity="0.2" fill="none" />
              {/* Gateway to agents - branching */}
              <path d="M 50% 195 L 50% 210 L 40% 210 L 40% 225" stroke="#f59e0b" strokeWidth="1" strokeOpacity="0.3" fill="none" />
              <path d="M 50% 195 L 50% 210 L 60% 210 L 60% 225" stroke="#64748b" strokeWidth="1" strokeOpacity="0.15" fill="none" />
              {/* Agents to Claude - merge */}
              <path d="M 40% 265 L 40% 280 L 50% 280 L 50% 295" stroke="#f97316" strokeWidth="1" strokeOpacity="0.3" fill="none" />
              <path d="M 60% 265 L 60% 280 L 50% 280" stroke="#f97316" strokeWidth="1" strokeOpacity="0.15" fill="none" />
              {/* Claude to services - fan out */}
              <path d="M 50% 335 L 50% 350 L 20% 350 L 20% 365" stroke="#3ecf8e" strokeWidth="1" strokeOpacity="0.25" fill="none" />
              <path d="M 50% 335 L 50% 355 L 38% 355 L 38% 365" stroke="#0078d4" strokeWidth="1" strokeOpacity="0.25" fill="none" />
              <path d="M 50% 335 L 50% 355 L 62% 355 L 62% 365" stroke="#64748b" strokeWidth="1" strokeOpacity="0.15" fill="none" />
              <path d="M 50% 335 L 50% 350 L 80% 350 L 80% 365" stroke="#64748b" strokeWidth="1" strokeOpacity="0.15" fill="none" />
              {/* Decorative horizontal rails */}
              <line x1="5%" y1="145" x2="15%" y2="145" stroke="#334155" strokeWidth="1" strokeOpacity="0.3" />
              <line x1="85%" y1="145" x2="95%" y2="145" stroke="#334155" strokeWidth="1" strokeOpacity="0.3" />
              <line x1="5%" y1="280" x2="25%" y2="280" stroke="#334155" strokeWidth="1" strokeOpacity="0.2" />
              <line x1="75%" y1="280" x2="95%" y2="280" stroke="#334155" strokeWidth="1" strokeOpacity="0.2" />
            </svg>

            <div className="text-slate-500 text-xs mb-6 font-mono relative z-10">{'// System Architecture'}</div>

            <div className="relative z-10 space-y-1">
              {/* Layer 1: User */}
              <div className="flex justify-center">
                <div className="bg-blue-500/20 border border-blue-500/40 rounded px-6 py-2.5 text-blue-300 text-sm font-mono">
                  Fiducial Team
                </div>
              </div>
              <div className="h-10" />

              {/* Layer 2: Channels */}
              <div className="flex justify-center items-center gap-3">
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded px-3 py-1.5 text-emerald-400 text-xs font-mono">WhatsApp</div>
                <div className="bg-violet-500/10 border border-violet-500/30 rounded px-3 py-1.5 text-violet-400 text-xs font-mono">MS Teams</div>
                <div className="bg-rose-500/10 border border-rose-500/30 rounded px-3 py-1.5 text-rose-400 text-xs font-mono">Web Chat</div>
                <div className="bg-sky-500/10 border border-sky-500/30 rounded px-3 py-1.5 text-sky-400 text-xs font-mono">Telegram</div>
              </div>
              <div className="h-8" />

              {/* Layer 3: Gateway Cluster */}
              <div className="flex justify-center items-center gap-2">
                <div className="text-slate-600 text-[10px] font-mono">Tailscale</div>
                <div className="text-slate-700">·</div>
                <div className="text-slate-600 text-[10px] font-mono">Session</div>
                <div className="text-slate-700">·</div>
                <div className="bg-purple-500/20 border border-purple-500/40 rounded px-4 py-1.5 text-purple-300 text-xs font-mono">Gateway :18789</div>
                <div className="text-slate-700">·</div>
                <div className="text-slate-600 text-[10px] font-mono">Security</div>
              </div>
              <div className="h-8" />

              {/* Layer 4: Agents */}
              <div className="flex justify-center items-end gap-6">
                <div className="text-center">
                  <div className="bg-amber-500/20 border border-amber-500/40 rounded px-4 py-1.5 text-amber-300 text-xs font-mono">Agent: Work</div>
                  <div className="text-slate-600 text-[10px] mt-1 font-mono">sonnet · ♥3h</div>
                </div>
                <div className="text-center opacity-50">
                  <div className="bg-slate-800 border border-slate-700 rounded px-4 py-1.5 text-slate-500 text-xs font-mono">Agent: Main</div>
                  <div className="text-slate-700 text-[10px] mt-1 font-mono">cron</div>
                </div>
              </div>
              <div className="h-8" />

              {/* Layer 5: Claude API */}
              <div className="flex justify-center">
                <div className="bg-orange-500/15 border border-orange-500/40 rounded px-6 py-2.5 text-orange-300 text-sm font-mono">
                  Claude API <span className="text-orange-500/60">(Anthropic)</span>
                </div>
              </div>
              <div className="h-8" />

              {/* Layer 6: Services */}
              <div className="flex justify-center items-center gap-3">
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded px-3 py-1.5 text-emerald-400 text-xs font-mono">Supabase</div>
                <div className="bg-blue-500/10 border border-blue-500/30 rounded px-3 py-1.5 text-blue-400 text-xs font-mono">Azure Bot</div>
                <div className="bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-slate-400 text-xs font-mono">Notion</div>
                <div className="bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-slate-400 text-xs font-mono">Vercel</div>
              </div>
            </div>
          </div>

          {/* Section Title */}
          <div className="flex items-center gap-3 mb-8">
            <div className="h-px flex-1 bg-[var(--fc-border-gray)]" />
            <span className="text-sm font-semibold text-[var(--fc-black)]">Self-Learning Architecture</span>
            <div className="h-px flex-1 bg-[var(--fc-border-gray)]" />
          </div>

          {/* Work Agent Card */}
          <div className="bg-white rounded-xl border border-[var(--fc-border-gray)] p-6 mb-8 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[var(--fc-black)]">Team Assistant Agent</h2>
              <div className="flex items-center gap-2">
                <span className="text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-700">09:00-17:30</span>
                <span className="text-xs px-3 py-1 rounded-full bg-emerald-100 text-emerald-700">♥ 3h heartbeat</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div><span className="text-[var(--fc-light-gray)]">Model:</span> <span className="font-mono">claude-sonnet-4-5</span></div>
              <div><span className="text-[var(--fc-light-gray)]">Context:</span> <span className="font-mono">1,000K</span></div>
              <div><span className="text-[var(--fc-light-gray)]">Scope:</span> <span className="font-mono">per-channel-peer</span></div>
            </div>
          </div>

          {/* Learning Flow Diagram - Circuit Style */}
          <div className="bg-slate-900 rounded-xl p-8 shadow-lg mb-8 overflow-hidden relative">
            <div className="absolute inset-0 opacity-[0.03]" style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)',
              backgroundSize: '24px 24px'
            }} />

            {/* SVG Circuit Lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
              {/* Heartbeat to files - fan out */}
              <path d="M 50% 55 L 50% 70 L 30% 70 L 30% 85" stroke="#f59e0b" strokeWidth="1" strokeOpacity="0.25" fill="none" />
              <path d="M 50% 55 L 50% 85" stroke="#f59e0b" strokeWidth="1" strokeOpacity="0.25" fill="none" />
              <path d="M 50% 55 L 50% 70 L 70% 70 L 70% 85" stroke="#f59e0b" strokeWidth="1" strokeOpacity="0.25" fill="none" />
              {/* Files converge to scan */}
              <path d="M 30% 110 L 30% 120 L 50% 120 L 50% 135" stroke="#64748b" strokeWidth="1" strokeOpacity="0.2" fill="none" />
              <path d="M 50% 110 L 50% 135" stroke="#64748b" strokeWidth="1" strokeOpacity="0.2" fill="none" />
              <path d="M 70% 110 L 70% 120 L 50% 120" stroke="#64748b" strokeWidth="1" strokeOpacity="0.2" fill="none" />
              {/* Scan to triggers - fan out */}
              <path d="M 50% 165 L 50% 180 L 28% 180 L 28% 195" stroke="#a855f7" strokeWidth="1" strokeOpacity="0.2" fill="none" />
              <path d="M 50% 165 L 50% 195" stroke="#a855f7" strokeWidth="1" strokeOpacity="0.2" fill="none" />
              <path d="M 50% 165 L 50% 180 L 72% 180 L 72% 195" stroke="#a855f7" strokeWidth="1" strokeOpacity="0.2" fill="none" />
              {/* Triggers to actions - branch */}
              <path d="M 50% 220 L 50% 235 L 40% 235 L 40% 250" stroke="#64748b" strokeWidth="1" strokeOpacity="0.2" fill="none" />
              <path d="M 50% 220 L 50% 235 L 60% 235 L 60% 250" stroke="#64748b" strokeWidth="1" strokeOpacity="0.2" fill="none" />
              {/* Actions merge to output */}
              <path d="M 40% 290 L 40% 305 L 50% 305 L 50% 320" stroke="#3ecf8e" strokeWidth="1" strokeOpacity="0.25" fill="none" />
              <path d="M 60% 290 L 60% 305 L 50% 305" stroke="#f43f5e" strokeWidth="1" strokeOpacity="0.25" fill="none" />
              {/* Decorative side rails */}
              <line x1="8%" y1="120" x2="18%" y2="120" stroke="#334155" strokeWidth="1" strokeOpacity="0.25" />
              <line x1="82%" y1="120" x2="92%" y2="120" stroke="#334155" strokeWidth="1" strokeOpacity="0.25" />
              <line x1="8%" y1="235" x2="22%" y2="235" stroke="#334155" strokeWidth="1" strokeOpacity="0.2" />
              <line x1="78%" y1="235" x2="92%" y2="235" stroke="#334155" strokeWidth="1" strokeOpacity="0.2" />
              {/* Corner accents */}
              <path d="M 8% 55 L 8% 45 L 18% 45" stroke="#334155" strokeWidth="1" strokeOpacity="0.15" fill="none" />
              <path d="M 92% 55 L 92% 45 L 82% 45" stroke="#334155" strokeWidth="1" strokeOpacity="0.15" fill="none" />
              <path d="M 8% 320 L 8% 330 L 18% 330" stroke="#334155" strokeWidth="1" strokeOpacity="0.15" fill="none" />
              <path d="M 92% 320 L 92% 330 L 82% 330" stroke="#334155" strokeWidth="1" strokeOpacity="0.15" fill="none" />
            </svg>

            <div className="text-slate-500 text-xs mb-6 font-mono relative z-10">{'// Heartbeat Learning Flow'}</div>

            <div className="relative z-10 space-y-1">
              {/* Row 1: Trigger */}
              <div className="flex justify-center">
                <div className="bg-amber-500/20 border border-amber-500/40 rounded px-5 py-2 text-amber-300 text-sm font-mono">
                  HEARTBEAT <span className="text-amber-500/60">(every 3h)</span>
                </div>
              </div>
              <div className="h-8" />

              {/* Row 2: Read Files */}
              <div className="flex justify-center items-center gap-2">
                <div className="bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-slate-400 text-[11px] font-mono">AGENTS.md</div>
                <div className="bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-slate-400 text-[11px] font-mono">HEARTBEAT.md</div>
                <div className="bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-slate-400 text-[11px] font-mono">self-review.md</div>
              </div>
              <div className="h-6" />

              {/* Row 3: Decision */}
              <div className="flex justify-center">
                <div className="bg-violet-500/20 border border-violet-500/40 rounded px-5 py-2 text-violet-300 text-sm font-mono">
                  Scan Recent Conversations
                </div>
              </div>
              <div className="h-6" />

              {/* Row 4: Triggers */}
              <div className="flex justify-center items-center gap-2">
                <div className="bg-slate-800/50 rounded px-2.5 py-1 text-[10px] text-slate-500 border border-slate-700/50 font-mono">&quot;remember this&quot;</div>
                <div className="bg-slate-800/50 rounded px-2.5 py-1 text-[10px] text-slate-500 border border-slate-700/50 font-mono">repeated ≥2x</div>
                <div className="bg-slate-800/50 rounded px-2.5 py-1 text-[10px] text-slate-500 border border-slate-700/50 font-mono">user correction</div>
              </div>
              <div className="h-6" />

              {/* Row 5: Actions */}
              <div className="flex justify-center items-start gap-4">
                <div className="text-center">
                  <div className="bg-emerald-500/20 border border-emerald-500/40 rounded px-3 py-1.5 text-emerald-300 text-xs font-mono">Update Profile</div>
                  <div className="text-slate-600 text-[9px] mt-1 font-mono">users/*.profile.json</div>
                </div>
                <div className="text-center">
                  <div className="bg-rose-500/20 border border-rose-500/40 rounded px-3 py-1.5 text-rose-300 text-xs font-mono">Self-Review</div>
                  <div className="text-slate-600 text-[9px] mt-1 font-mono">TAG → MISS → FIX</div>
                </div>
              </div>
              <div className="h-6" />

              {/* Row 6: Output */}
              <div className="flex justify-center">
                <div className="bg-blue-500/15 border border-blue-500/40 rounded px-5 py-2 text-blue-300 text-sm font-mono">
                  HEARTBEAT_OK <span className="text-blue-500/60">or Proactive Action</span>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Schema */}
          <div className="bg-white rounded-xl border border-[var(--fc-border-gray)] p-6 shadow-sm">
            <h3 className="font-semibold text-[var(--fc-black)] mb-4">User Profile Schema</h3>
            <div className="bg-slate-50 rounded-lg p-4 font-mono text-sm text-slate-700">
              <div className="text-slate-400">{'// memory/users/webchat/<userId>.profile.json'}</div>
              <div className="mt-2">{'{'}</div>
              <div className="ml-4">&quot;name&quot;: &quot;string&quot;,</div>
              <div className="ml-4">&quot;role&quot;: &quot;string&quot;,</div>
              <div className="ml-4">&quot;software&quot;: [&quot;AE&quot;, &quot;Premiere&quot;, ...],</div>
              <div className="ml-4">&quot;preferences&quot;: {'{'} &quot;language&quot;, &quot;responseStyle&quot; {'}'},</div>
              <div className="ml-4 text-emerald-600">&quot;learnedContext&quot;: [&quot;Prefers shortcuts&quot;, ...]</div>
              <div>{'}'}</div>
            </div>
          </div>
        </div>
      </main>

      <footer className="flex-shrink-0 border-t border-[var(--fc-border-gray)] py-4 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-[var(--fc-light-gray)]">
          <p>Built by Haiwei | Fiducial Communications</p>
        </div>
      </footer>
    </div>
  );
}
