'use client';

import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, UserCircle, Settings, Zap, User, Save, Loader2 } from 'lucide-react';
import { ProfileSection } from './profile/ProfileSection';
import { TagInput } from './profile/TagInput';
import { CustomSelect } from './profile/CustomSelect';
import {
    UserProfile,
    LANGUAGE_OPTIONS,
    RESPONSE_STYLE_OPTIONS,
    TIMEZONE_OPTIONS
} from '@/lib/types/profile';
import { createDefaultProfile } from '@/lib/profile';

interface UserProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    profile: UserProfile | null;
    isLoading: boolean;
    isSaving: boolean;
    error: string | null;
    onSave: (profile: UserProfile) => void;
}

export const UserProfileModal = memo(function UserProfileModal({
    isOpen,
    onClose,
    profile,
    isLoading,
    isSaving,
    error,
    onSave,
}: UserProfileModalProps) {
    // Note: we intentionally avoid syncing local draft via useEffect to satisfy
    // strict lint rules (react-hooks/set-state-in-effect). The parent can remount
    // this modal (via `key`) when profile data changes.
    const [draft, setDraft] = useState<UserProfile>(() =>
        profile ? profile : createDefaultProfile()
    );

    const isBasicInfoComplete = Boolean(draft.name.trim() && draft.role.trim());

    const handleSave = () => {
        onSave(draft);
    };

    const updatePreference = (key: keyof UserProfile['preferences'], value: string) => {
        setDraft((prev) => ({
            ...prev,
            preferences: { ...prev.preferences, [key]: value },
        }));
    };

    const addSoftware = (tag: string) => {
        setDraft((prev) => ({
            ...prev,
            software: [...prev.software, tag],
        }));
    };

    const removeSoftware = (tag: string) => {
        setDraft((prev) => ({
            ...prev,
            software: prev.software.filter((t) => t !== tag),
        }));
    };

    const addContext = (item: string) => {
        setDraft((prev) => ({
            ...prev,
            learnedContext: [...prev.learnedContext, item],
        }));
    };

    const removeContext = (item: string) => {
        setDraft((prev) => ({
            ...prev,
            learnedContext: prev.learnedContext.filter((c) => c !== item),
        }));
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-2xl shadow-2xl z-50 overflow-hidden max-h-[90vh] flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--fc-border-gray)] bg-white flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--fc-red)] to-[var(--fc-action-red)] flex items-center justify-center shadow-sm">
                                    <User size={20} className="text-white" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-[var(--fc-black)] tracking-tight">My Profile</h2>
                                    <p className="text-xs text-[var(--fc-body-gray)] font-medium">Customize how the AI understands you</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-[var(--fc-subtle-gray)] rounded-lg transition-colors group"
                            >
                                <X size={20} className="text-[var(--fc-body-gray)] group-hover:text-[var(--fc-dark-gray)]" />
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="overflow-y-auto p-6 space-y-6 bg-[var(--fc-off-white)]/50 flex-1">
                            {isLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 size={24} className="animate-spin text-[var(--fc-body-gray)]" />
                                </div>
                            ) : (
                                <>
                                    {/* About Me Section */}
                                    <ProfileSection title="About Me" icon={UserCircle}>
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-medium text-[var(--fc-body-gray)] uppercase tracking-wider">Display Name</label>
                                                    <input
                                                        type="text"
                                                        value={draft.name}
                                                        onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                                                        className="w-full px-3 py-2 bg-[var(--fc-subtle-gray)]/50 border border-transparent rounded-lg text-sm text-[var(--fc-dark-gray)] focus:outline-none focus:bg-white focus:border-[var(--fc-action-red)] focus:ring-1 focus:ring-[var(--fc-action-red)] transition-all font-medium"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-medium text-[var(--fc-body-gray)] uppercase tracking-wider">Role</label>
                                                    <input
                                                        type="text"
                                                        value={draft.role}
                                                        onChange={(e) => setDraft({ ...draft, role: e.target.value })}
                                                        className="w-full px-3 py-2 bg-[var(--fc-subtle-gray)]/50 border border-transparent rounded-lg text-sm text-[var(--fc-dark-gray)] focus:outline-none focus:bg-white focus:border-[var(--fc-action-red)] focus:ring-1 focus:ring-[var(--fc-action-red)] transition-all font-medium"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-xs font-medium text-[var(--fc-body-gray)] uppercase tracking-wider">
                                                    Work Context
                                                </label>
                                                <textarea
                                                    value={draft.preferences.workContext}
                                                    onChange={(e) => updatePreference('workContext', e.target.value)}
                                                    rows={3}
                                                    placeholder="2–3 sentences: what you do + what you want help with (e.g. 'Motion design, mostly AE. I often need expressions, export settings, and quick troubleshooting.')"
                                                    className="w-full px-3 py-2 bg-[var(--fc-subtle-gray)]/50 border border-transparent rounded-lg text-sm text-[var(--fc-dark-gray)] focus:outline-none focus:bg-white focus:border-[var(--fc-action-red)] focus:ring-1 focus:ring-[var(--fc-action-red)] transition-all font-medium resize-none leading-relaxed"
                                                />
                                                <p className="text-[11px] text-[var(--fc-light-gray)] leading-relaxed">
                                                    This helps the AI tailor answers without guessing. Keep it professional—avoid personal or sensitive info.
                                                </p>
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-xs font-medium text-[var(--fc-body-gray)] uppercase tracking-wider">Software</label>
                                                <TagInput
                                                    tags={draft.software}
                                                    onAdd={addSoftware}
                                                    onRemove={removeSoftware}
                                                    placeholder="Add software (e.g. Photoshop)..."
                                                />
                                            </div>
                                        </div>
                                    </ProfileSection>

                                    {/* Preferences Section */}
                                    <ProfileSection title="Preferences" icon={Settings}>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <CustomSelect
                                        label="Language"
                                        options={LANGUAGE_OPTIONS}
                                        value={draft.preferences.language}
                                        onChange={(v) => updatePreference('language', v)}
                                    />
                                    <CustomSelect
                                        label="Style"
                                        options={RESPONSE_STYLE_OPTIONS}
                                        value={draft.preferences.responseStyle}
                                        onChange={(v) => updatePreference('responseStyle', v)}
                                    />
                                    <CustomSelect
                                        label="Timezone"
                                        options={TIMEZONE_OPTIONS}
                                        value={draft.preferences.timezone}
                                        onChange={(v) => updatePreference('timezone', v)}
                                    />
                                        </div>
                                    </ProfileSection>

                                    {/* Quick Prompts Section */}
                                    <ProfileSection title="Quick Prompts" icon={Zap}>
                                        <TagInput
                                            tags={draft.learnedContext}
                                            onAdd={addContext}
                                            onRemove={removeContext}
                                            placeholder="Add a quick prompt (e.g., 'Summarize this PDF')..."
                                        />
                                    </ProfileSection>
                                </>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-[var(--fc-border-gray)] bg-white flex-shrink-0">
                            {error && (
                                <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                                    {error}
                                </div>
                            )}
                            {!isBasicInfoComplete && (
                                <div className="mb-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                                    Please fill in <span className="font-semibold">Name</span> and{' '}
                                    <span className="font-semibold">Role</span> so the AI can personalize responses.
                                </div>
                            )}
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-[var(--fc-light-gray)] font-medium">
                                    Last updated: {formatDate(draft.lastUpdated)}
                                </span>
                                <div className="flex gap-3">
                                    <button
                                        onClick={onClose}
                                        className="px-4 py-2 text-sm font-medium text-[var(--fc-body-gray)] hover:text-[var(--fc-dark-gray)] hover:bg-[var(--fc-subtle-gray)] rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={!isBasicInfoComplete || isSaving || isLoading}
                                        className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-[var(--fc-red)] to-[var(--fc-action-red)] rounded-lg shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {isSaving ? (
                                            <>
                                                <Loader2 size={16} className="animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save size={16} />
                                                Save Changes
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
});
