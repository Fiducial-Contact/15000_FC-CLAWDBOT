'use client';

import { memo, useState, useEffect, useMemo, useRef, startTransition } from 'react';
import { motion } from 'motion/react';
import { Zap, Brain, Activity, Sparkles, Minimize2, ChevronDown, ArrowUpRight } from 'lucide-react';
import type { SessionEntry, ToolEventPayload } from '@/lib/gateway/types';
import type { UserProfile } from '@/lib/types/profile';

type ProfileSyncSource = 'initial' | 'update' | 'context_break';
type ProfileSyncStatus = 'sent' | 'skipped' | 'failed';

type ProfileSyncInfo = {
  at: string;
  source: ProfileSyncSource;
  status: ProfileSyncStatus;
  sessionKey?: string;
  fingerprint?: string;
  reason?: string;
};

type ToolTraceItem = {
  id: string;
  toolName: string;
  status?: string;
  when?: string;
  summary?: string;
};

type PanelSectionKey = 'learningProfile' | 'profileSync' | 'activeTools' | 'researchTrace' | 'thoughtProcess';

interface AgentInsightPanelProps {
  isConnected: boolean;
  isLoading: boolean;
  activeTools: Map<string, ToolEventPayload>;
  currentSession: SessionEntry | undefined;
  lastThinking: string | null;
  userId: string;
  userProfile: UserProfile | null;
  profileSyncInfo: ProfileSyncInfo | null;
  recentToolTrace: ToolTraceItem[];
}

function formatTokenCount(count: number | undefined): string {
  if (!count) return '0';
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return count.toString();
}

function formatSyncSource(source: ProfileSyncSource) {
  switch (source) {
    case 'initial':
      return 'Before your message';
    case 'update':
      return 'Profile updated';
    case 'context_break':
      return 'Context break recovery';
  }
}

function formatIsoTime(iso: string) {
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return iso;
  const d = new Date(ms);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function statusPillClasses(status: ProfileSyncStatus) {
  if (status === 'sent') return 'bg-emerald-500/15 text-emerald-700 border-emerald-500/20';
  if (status === 'failed') return 'bg-red-500/10 text-red-700 border-red-500/20';
  return 'bg-amber-500/10 text-amber-700 border-amber-500/20';
}

function AgentInsightSectionHeader({
  title,
  icon,
  badge,
  open,
  onToggle,
}: {
  title: string;
  icon: React.ReactNode;
  badge?: React.ReactNode;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between gap-3"
    >
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-[var(--fc-subtle-gray)] text-[var(--fc-dark-gray)]">
          {icon}
        </div>
        <span className="text-[11px] font-bold text-[var(--fc-light-gray)] uppercase tracking-wider">
          {title}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {badge}
        <ChevronDown
          size={14}
          className={`text-[var(--fc-light-gray)] transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </div>
    </button>
  );
}

function getStatusInfo(
  isConnected: boolean,
  isLoading: boolean,
  activeTools: Map<string, ToolEventPayload>,
): { label: string; colorClass: string; icon: React.ReactNode } {
  if (!isConnected) {
    return {
      label: 'Disconnected',
      colorClass: 'text-[var(--fc-action-red)]',
      icon: <div className="w-2 h-2 rounded-full bg-[var(--fc-action-red)]" />
    };
  }

  const runningTools = Array.from(activeTools.values()).filter(
    (t) => t.status === 'running' || t.phase === 'start' || t.phase === 'update',
  );

  if (runningTools.length > 0) {
    return {
      label: 'Using Tools',
      colorClass: 'text-amber-500',
      icon: <Zap size={14} className="text-amber-500 animate-pulse" />
    };
  }

  if (isLoading) {
    return {
      label: 'Thinking',
      colorClass: 'text-emerald-500',
      icon: <Sparkles size={14} className="text-emerald-500 animate-pulse" />
    };
  }

  return {
    label: 'Ready',
    colorClass: 'text-emerald-600',
    icon: <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
  };
}

export const AgentInsightPanel = memo(function AgentInsightPanel({
  isConnected,
  isLoading,
  activeTools,
  currentSession,
  lastThinking,
  userId,
  userProfile,
  profileSyncInfo,
  recentToolTrace,
}: AgentInsightPanelProps) {
  const defaultSections: Record<PanelSectionKey, boolean> = {
    learningProfile: false,
    profileSync: false,
    activeTools: true,
    researchTrace: true,
    thoughtProcess: false,
  };

  const [isExpanded, setIsExpanded] = useState(() => {
    if (typeof window === 'undefined') return true;
    try {
      return localStorage.getItem('agent-insight-expanded') !== 'false';
    } catch { return true; }
  });
  const [openSections, setOpenSections] = useState<Record<PanelSectionKey, boolean>>(() => {
    if (typeof window === 'undefined') return defaultSections;
    try {
      const raw = localStorage.getItem('agent-insight-sections-v1');
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Record<PanelSectionKey, boolean>>;
        return {
          learningProfile: parsed.learningProfile ?? false,
          profileSync: parsed.profileSync ?? false,
          activeTools: parsed.activeTools ?? true,
          researchTrace: parsed.researchTrace ?? true,
          thoughtProcess: parsed.thoughtProcess ?? false,
        };
      }
    } catch { /* ignore */ }
    return defaultSections;
  });
  const hydrated = useRef(false);

  useEffect(() => {
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    try {
      localStorage.setItem('agent-insight-expanded', String(isExpanded));
    } catch { /* ignore */ }
  }, [isExpanded]);

  useEffect(() => {
    if (!hydrated.current) return;
    try {
      localStorage.setItem('agent-insight-sections-v1', JSON.stringify(openSections));
    } catch { /* ignore */ }
  }, [openSections]);

  const { label: statusLabel, colorClass, icon: statusIcon } = useMemo(
    () => getStatusInfo(isConnected, isLoading, activeTools),
    [isConnected, isLoading, activeTools],
  );

  const toolList = useMemo(() => {
    return Array.from(activeTools.values()).filter(
      (t) => t.status === 'running' || t.phase !== 'end',
    );
  }, [activeTools]);

  const thinkingPreview = useMemo(() => {
    if (!lastThinking) return null;
    const trimmed = lastThinking.trim();
    if (trimmed.length <= 120) return trimmed;
    return trimmed.slice(0, 120) + '...';
  }, [lastThinking]);

  // Calculate expected content height to prevent flash
  const hasTools = toolList.length > 0;
  const hasThinking = !!thinkingPreview;
  const hasResearch = recentToolTrace.length > 0;

  const toggleSection = (key: PanelSectionKey) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <motion.div
      initial={false}
      animate={{
        width: isExpanded ? 340 : 64,
        height: isExpanded ? 'auto' : 64,
      }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 35,
      }}
      className={`fixed bottom-6 right-6 z-40 bg-white/95 backdrop-blur-xl border border-[var(--fc-border-gray)] shadow-2xl overflow-hidden rounded-2xl ${!isExpanded ? 'hover:bg-white cursor-pointer hover:shadow-lg transition-shadow' : ''
        }`}
      onClick={() => {
        if (!isExpanded) setIsExpanded(true);
      }}
    >
      <motion.div
        initial={false}
        animate={{ opacity: isExpanded ? 0 : 1 }}
        transition={{ duration: 0.12 }}
        className="absolute inset-0 z-10 flex items-center justify-center"
        style={{ pointerEvents: isExpanded ? 'none' : 'auto' }}
      >
        {isConnected && (isLoading || toolList.length > 0) && (
          <span className="absolute inset-2 rounded-xl bg-emerald-400/15 animate-pulse" />
        )}
        <Activity size={26} className={`text-[var(--fc-dark-gray)] relative z-10 ${isLoading ? 'animate-pulse' : ''}`} />
        <div className={`absolute top-2 right-2 w-3 h-3 rounded-full border-2 border-white shadow-sm ${isConnected ? 'bg-emerald-500' : 'bg-[var(--fc-action-red)]'}`} />
      </motion.div>

      <motion.div
        initial={false}
        animate={{ opacity: isExpanded ? 1 : 0 }}
        transition={{ duration: 0.15, delay: isExpanded ? 0.08 : 0 }}
        className="flex flex-col"
        style={{ minWidth: 340, pointerEvents: isExpanded ? 'auto' : 'none' }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--fc-border-gray)]/50">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[var(--fc-subtle-gray)] text-[var(--fc-dark-gray)]">
              <Activity size={18} />
            </div>
            <div className="flex flex-col">
              <span className="text-[15px] font-bold text-[var(--fc-black)] font-[family-name:var(--font-manrope)] leading-tight">
                Agent Pulse
              </span>
              <span className={`text-[12px] font-medium ${colorClass} flex items-center gap-1.5`}>
                {statusIcon}
                {statusLabel}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/insights"
              onClick={(e) => e.stopPropagation()}
              className="p-2 rounded-lg hover:bg-[var(--fc-subtle-gray)] text-[var(--fc-light-gray)] hover:text-[var(--fc-body-gray)] transition-colors"
              title="Open timeline"
            >
              <ArrowUpRight size={16} />
            </a>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(false);
              }}
              className="p-2 rounded-lg hover:bg-[var(--fc-subtle-gray)] text-[var(--fc-light-gray)] hover:text-[var(--fc-body-gray)] transition-colors"
              title="Minimize"
            >
              <Minimize2 size={16} />
            </button>
          </div>
        </div>

        <div className="px-5 py-5 space-y-5 max-h-[72vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-[var(--fc-subtle-gray)]/40 border border-[var(--fc-border-gray)]/50 flex flex-col gap-1.5">
              <span className="text-[11px] text-[var(--fc-light-gray)] font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Input
              </span>
              <span className="text-[16px] font-mono font-bold text-[var(--fc-black)]">
                {formatTokenCount(currentSession?.inputTokens)}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[var(--fc-subtle-gray)]/40 border border-[var(--fc-border-gray)]/50 flex flex-col gap-1.5">
              <span className="text-[11px] text-[var(--fc-light-gray)] font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Output
              </span>
              <span className="text-[16px] font-mono font-bold text-[var(--fc-black)]">
                {formatTokenCount(currentSession?.outputTokens)}
              </span>
            </div>
          </div>

          {/* Learning Profile */}
          <div className="space-y-3">
            <AgentInsightSectionHeader
              title="Learning Profile"
              icon={<Sparkles size={14} />}
              open={openSections.learningProfile}
              onToggle={() => toggleSection('learningProfile')}
            />

            {openSections.learningProfile && (
              <>
                {!userProfile && (
                  <div className="p-3.5 rounded-xl bg-[var(--fc-subtle-gray)]/40 border border-[var(--fc-border-gray)]/50 text-[12px] text-[var(--fc-body-gray)]">
                    Loading your profile…
                  </div>
                )}

                {userProfile && (
                  <div className="p-3.5 rounded-xl bg-white border border-[var(--fc-border-gray)]/50 shadow-sm space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-[13px] font-bold text-[var(--fc-black)] truncate">
                          {userProfile.name?.trim() ? userProfile.name.trim() : 'Unnamed user'}
                        </div>
                        <div className="text-[11px] text-[var(--fc-light-gray)] truncate">
                          {userProfile.role?.trim() ? userProfile.role.trim() : 'Role not set'}
                        </div>
                      </div>
                      <div className="text-[10px] font-mono text-[var(--fc-light-gray)]">
                        {userId.slice(0, 8)}…
                      </div>
                    </div>

                    {userProfile.preferences?.workContext?.trim() && (
                      <div className="text-[11px] text-[var(--fc-body-gray)] leading-relaxed">
                        <div className="text-[10px] text-[var(--fc-light-gray)] font-semibold uppercase tracking-wider mb-1">
                          Work Context
                        </div>
                        <p className="line-clamp-3 opacity-90">
                          {userProfile.preferences.workContext.trim()}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-2">
                      <div className="px-2.5 py-2 rounded-lg bg-[var(--fc-subtle-gray)]/50 border border-[var(--fc-border-gray)]/40">
                        <div className="text-[10px] text-[var(--fc-light-gray)] font-semibold uppercase tracking-wider">
                          Lang
                        </div>
                        <div className="text-[11px] font-medium text-[var(--fc-body-gray)] truncate">
                          {userProfile.preferences?.language || 'en'}
                        </div>
                      </div>
                      <div className="px-2.5 py-2 rounded-lg bg-[var(--fc-subtle-gray)]/50 border border-[var(--fc-border-gray)]/40">
                        <div className="text-[10px] text-[var(--fc-light-gray)] font-semibold uppercase tracking-wider">
                          Style
                        </div>
                        <div className="text-[11px] font-medium text-[var(--fc-body-gray)] truncate">
                          {userProfile.preferences?.responseStyle || 'concise'}
                        </div>
                      </div>
                      <div className="px-2.5 py-2 rounded-lg bg-[var(--fc-subtle-gray)]/50 border border-[var(--fc-border-gray)]/40">
                        <div className="text-[10px] text-[var(--fc-light-gray)] font-semibold uppercase tracking-wider">
                          TZ
                        </div>
                        <div className="text-[11px] font-medium text-[var(--fc-body-gray)] truncate">
                          {userProfile.preferences?.timezone || 'Europe/London'}
                        </div>
                      </div>
                    </div>

                    {userProfile.software?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {userProfile.software.slice(0, 6).map((s) => (
                          <span
                            key={s}
                            className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--fc-subtle-gray)] text-[var(--fc-body-gray)] border border-[var(--fc-border-gray)]/50"
                          >
                            {s}
                          </span>
                        ))}
                        {userProfile.software.length > 6 && (
                          <span className="text-[10px] text-[var(--fc-light-gray)]">
                            +{userProfile.software.length - 6} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Profile Sync */}
          <div className="space-y-3">
            <AgentInsightSectionHeader
              title="Profile Sync to Agent"
              icon={<Activity size={14} />}
              open={openSections.profileSync}
              onToggle={() => toggleSection('profileSync')}
            />

            {openSections.profileSync && (
              <>
                {!profileSyncInfo && (
                  <div className="p-3.5 rounded-xl bg-[var(--fc-subtle-gray)]/40 border border-[var(--fc-border-gray)]/50 text-[12px] text-[var(--fc-body-gray)]">
                    No sync events yet in this session.
                  </div>
                )}

                {profileSyncInfo && (
                  <div className="p-3.5 rounded-xl bg-white border border-[var(--fc-border-gray)]/50 shadow-sm space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border ${statusPillClasses(profileSyncInfo.status)}`}
                      >
                        {profileSyncInfo.status}
                      </span>
                      <span className="text-[10px] text-[var(--fc-light-gray)] font-mono">
                        {formatIsoTime(profileSyncInfo.at)}
                      </span>
                    </div>
                    <div className="text-[12px] text-[var(--fc-body-gray)]">
                      <span className="font-semibold">Source:</span>{' '}
                      {formatSyncSource(profileSyncInfo.source)}
                    </div>
                    {profileSyncInfo.reason && (
                      <div className="text-[11px] text-[var(--fc-light-gray)] leading-relaxed">
                        {profileSyncInfo.reason}
                      </div>
                    )}
                    <div className="text-[10px] text-[var(--fc-light-gray)] leading-relaxed">
                      This profile is sent as a hidden message and scoped to your webchat session.
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {hasTools && (
            <div className="space-y-3">
              <AgentInsightSectionHeader
                title="Active Tools"
                icon={<Zap size={14} />}
                badge={
                  <span className="text-[10px] text-[var(--fc-body-gray)] bg-[var(--fc-subtle-gray)] px-2 py-0.5 rounded-full font-medium">
                    {toolList.length} running
                  </span>
                }
                open={openSections.activeTools}
                onToggle={() => toggleSection('activeTools')}
              />
              {openSections.activeTools && (
                <div className="space-y-2">
                  {toolList.slice(0, 3).map((tool) => (
                    <motion.div
                      key={tool.toolCallId}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between p-3 rounded-xl bg-[var(--fc-black)] text-white shadow-lg text-[12px] group"
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <div className="p-1.5 rounded-lg bg-white/10 group-hover:bg-white/20 transition-colors">
                          <Zap size={12} className="text-amber-300" />
                        </div>
                        <span className="font-medium truncate text-white/90">
                          {tool.toolName.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${tool.status === 'running'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-emerald-500/20 text-emerald-300'
                        }`}>
                        {tool.status || tool.phase}
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Research Trace */}
          <div className="space-y-3">
            <AgentInsightSectionHeader
              title="Recent Research Trace"
              icon={<Zap size={14} />}
              badge={
                <span className="text-[10px] text-[var(--fc-body-gray)] bg-[var(--fc-subtle-gray)] px-2 py-0.5 rounded-full font-medium">
                  {recentToolTrace.length}
                </span>
              }
              open={openSections.researchTrace}
              onToggle={() => toggleSection('researchTrace')}
            />

            {openSections.researchTrace && (
              <>
                {!hasResearch && (
                  <div className="p-3.5 rounded-xl bg-[var(--fc-subtle-gray)]/40 border border-[var(--fc-border-gray)]/50 text-[12px] text-[var(--fc-body-gray)]">
                    No tool calls captured yet in this session.
                  </div>
                )}

                {hasResearch && (
                  <div className="space-y-2">
                    {recentToolTrace.slice(0, 6).map((item) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-xl bg-white border border-[var(--fc-border-gray)]/50 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-[12px] font-semibold text-[var(--fc-black)] truncate">
                              {item.toolName.replace(/_/g, ' ')}
                            </div>
                            {item.summary && (
                              <div className="text-[11px] text-[var(--fc-light-gray)] truncate">
                                {item.summary}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            {item.status && (
                              <span className="text-[10px] font-bold text-[var(--fc-body-gray)] bg-[var(--fc-subtle-gray)] px-2 py-0.5 rounded-full">
                                {item.status}
                              </span>
                            )}
                            {item.when && (
                              <span className="text-[10px] text-[var(--fc-light-gray)] font-mono">
                                {item.when}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="text-[10px] text-[var(--fc-light-gray)] leading-relaxed px-1">
                      Want full evidence? Enable <span className="font-semibold">Details</span> mode in the chat header.
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {hasThinking && (
            <div className="pt-3 border-t border-[var(--fc-border-gray)]/50">
              <AgentInsightSectionHeader
                title="Thought Process"
                icon={<Brain size={14} />}
                open={openSections.thoughtProcess}
                onToggle={() => toggleSection('thoughtProcess')}
              />
              {openSections.thoughtProcess && (
                <div className="p-3.5 rounded-xl bg-gradient-to-br from-[var(--fc-subtle-gray)]/60 to-white/60 border border-[var(--fc-border-gray)]/50 text-[12px] text-[var(--fc-body-gray)] font-medium leading-relaxed mt-3">
                  <p className="line-clamp-3 opacity-90">
                    {thinkingPreview}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
});
