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
} from 'lucide-react';
import type { MergedSkill, SkillRuntimeStatus } from '@/lib/gateway/types';

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
        label: 'Ready',
        className: 'text-emerald-600 bg-emerald-50',
        dotColor: 'bg-emerald-500',
      };
    case 'disabled':
      return {
        icon: XCircle,
        label: 'Disabled',
        className: 'text-gray-500 bg-gray-100',
        dotColor: 'bg-gray-400',
      };
    case 'error':
      return {
        icon: AlertCircle,
        label: 'Error',
        className: 'text-red-600 bg-red-50',
        dotColor: 'bg-red-500',
      };
    case 'missing':
    default:
      return {
        icon: AlertCircle,
        label: 'Missing',
        className: 'text-amber-600 bg-amber-50',
        dotColor: 'bg-amber-500',
      };
  }
}

export const SkillCard = memo(function SkillCard({ skill }: SkillCardProps) {
  const statusConfig = getStatusConfig(skill.runtimeStatus);
  const StatusIcon = statusConfig.icon;
  const SkillIcon = skill.icon ? iconMap[skill.icon] || Sparkles : Sparkles;

  return (
    <div className="bg-white rounded-xl border border-[var(--fc-border-gray)] p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[var(--fc-subtle-gray)] flex items-center justify-center">
            <SkillIcon size={20} className="text-[var(--fc-dark-gray)]" />
          </div>
          <div>
            <h3 className="font-medium text-[var(--fc-black)]">{skill.displayName}</h3>
            <p className="text-xs text-[var(--fc-body-gray)]">
              By: {skill.creatorEmail || 'Team'}
            </p>
          </div>
        </div>

        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.className}`}>
          <StatusIcon size={12} />
          {statusConfig.label}
        </div>
      </div>

      {skill.description && (
        <p className="mt-3 text-sm text-[var(--fc-body-gray)] line-clamp-2">
          {skill.description}
        </p>
      )}

      {skill.triggers && skill.triggers.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {skill.triggers.slice(0, 3).map((trigger) => (
            <span
              key={trigger}
              className="px-2 py-0.5 text-xs bg-[var(--fc-subtle-gray)] text-[var(--fc-body-gray)] rounded"
            >
              {trigger}
            </span>
          ))}
          {skill.triggers.length > 3 && (
            <span className="px-2 py-0.5 text-xs text-[var(--fc-body-gray)]">
              +{skill.triggers.length - 3} more
            </span>
          )}
        </div>
      )}

      {skill.error && (
        <p className="mt-2 text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
          {skill.error}
        </p>
      )}

      <div className="mt-3 pt-3 border-t border-[var(--fc-border-gray)] flex items-center justify-between">
        <span className="text-xs text-[var(--fc-body-gray)] capitalize">{skill.source}</span>
        <span className="text-xs font-mono text-[var(--fc-body-gray)]">{skill.name}</span>
      </div>
    </div>
  );
});
