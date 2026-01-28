'use client';

import { memo } from 'react';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertCircle,
  GitCommit,
  GitPullRequest,
  Search,
  Zap,
  Code
} from 'lucide-react';
import type { MergedSkill, SkillRuntimeStatus } from '@/lib/gateway/types';
import { cn } from '@/lib/utils';

interface SkillCardProps {
  skill: MergedSkill;
}

const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  GitCommit,
  GitPullRequest,
  Search,
  Sparkles,
  Zap,
};

function getStatusConfig(status: SkillRuntimeStatus) {
  switch (status) {
    case 'ready':
      return {
        icon: CheckCircle2,
        label: 'Active',
        className: 'text-emerald-500 bg-emerald-50/50 border-emerald-100',
        borderColor: 'border-emerald-200'
      };
    case 'disabled':
      return {
        icon: XCircle,
        label: 'Disabled',
        className: 'text-zinc-400 bg-zinc-50 border-zinc-100',
        borderColor: 'border-zinc-200'
      };
    case 'error':
      return {
        icon: AlertCircle,
        label: 'Error',
        className: 'text-red-500 bg-red-50/50 border-red-100',
        borderColor: 'border-red-200'
      };
    case 'missing':
    default:
      return {
        icon: AlertCircle,
        label: 'Missing',
        className: 'text-amber-500 bg-amber-50/50 border-amber-100',
        borderColor: 'border-amber-200'
      };
  }
}

export const SkillCard = memo(function SkillCard({ skill }: SkillCardProps) {
  const statusConfig = getStatusConfig(skill.runtimeStatus);
  const StatusIcon = statusConfig.icon;
  const SkillIcon = skill.icon ? iconMap[skill.icon] || Sparkles : Sparkles;

  return (
    <div className="group relative flex flex-col h-full bg-white rounded-xl border border-zinc-200 shadow-sm p-4 hover:border-zinc-300 hover:shadow-md transition-all duration-200 ease-in-out">

      {/* Absolute Status Badge - Top Right */}
      <div className={cn(
        "absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border",
        statusConfig.className
      )}>
        <StatusIcon size={10} strokeWidth={2.5} />
        {statusConfig.label}
      </div>

      {/* Header Section */}
      <div className="flex items-start gap-3 mb-3 pr-16"> {/* pr-16 to avoid overlapping absolute badge */}
        <div className="relative flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-lg bg-zinc-50 border border-zinc-100 text-zinc-600 group-hover:bg-white group-hover:scale-105 transition-all duration-200">
          <SkillIcon size={18} />

          {skill.runtimeStatus === 'ready' && (
            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border-2 border-white"></span>
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-sm text-zinc-900 leading-tight truncate group-hover:text-blue-600 transition-colors" title={skill.displayName}>
            {skill.displayName}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <code className="text-[10px] text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded truncate max-w-full block" title={skill.name}>
              {skill.name}
            </code>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="flex-grow min-h-[2.5rem]">
        {skill.description ? (
          <p className="text-xs text-zinc-600 leading-relaxed line-clamp-2" title={skill.description}>
            {skill.description}
          </p>
        ) : (
          <p className="text-xs text-zinc-400 italic">No description</p>
        )}
      </div>

      {/* Error Message if present */}
      {skill.error && (
        <div className="mt-2 text-[10px] text-red-600 bg-red-50 p-1.5 rounded border border-red-100 flex items-start gap-1.5">
          <AlertCircle size={12} className="mt-0.5 flex-shrink-0" />
          <span className="line-clamp-1">{skill.error}</span>
        </div>
      )}

      {/* Footer / Meta */}
      <div className="mt-3 pt-3 border-t border-dashed border-zinc-100 flex items-center justify-between text-[10px] text-zinc-400">

        <div className="flex items-center gap-2 overflow-hidden">
          {/* Triggers (Simplified) */}
          {skill.triggers && skill.triggers.length > 0 ? (
            <div className="flex items-center gap-1">
              <Zap size={10} className="text-blue-500" />
              <span className="truncate max-w-[100px]">{skill.triggers.length} triggers</span>
            </div>
          ) : (
            <span className="text-zinc-300">No triggers</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Code size={10} />
          <span className="capitalize">{skill.source}</span>
        </div>
      </div>
    </div>
  );
});
