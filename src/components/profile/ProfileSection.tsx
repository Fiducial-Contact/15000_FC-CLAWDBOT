import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface ProfileSectionProps {
    title: string;
    icon: LucideIcon;
    children: ReactNode;
    className?: string;
    action?: ReactNode;
}

export function ProfileSection({ title, icon: Icon, children, className = '', action }: ProfileSectionProps) {
    return (
        <div className={`space-y-3 ${className}`}>
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2 text-[var(--fc-dark-gray)]">
                    <Icon size={18} />
                    <h3 className="text-sm font-semibold">{title}</h3>
                </div>
                {action}
            </div>
            <div className="bg-white/50 rounded-xl border border-[var(--fc-border-gray)] p-4 shadow-sm">
                {children}
            </div>
        </div>
    );
}
