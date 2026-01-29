import { X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LearnedContextListProps {
    items: string[];
    onRemove: (item: string) => void;
}

export function LearnedContextList({ items, onRemove }: LearnedContextListProps) {
    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-6 text-center text-[var(--fc-body-gray)]">
                <div className="w-10 h-10 rounded-full bg-[var(--fc-subtle-gray)] flex items-center justify-center mb-3">
                    <Sparkles size={18} className="text-[var(--fc-light-gray)]" />
                </div>
                <p className="text-sm font-medium">Nothing learned yet</p>
                <p className="text-xs opacity-70">
                    I&apos;ll learn about your preferences as we chat.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-1">
            <AnimatePresence mode="popLayout">
                {items.map((item) => (
                    <motion.div
                        key={item}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="group flex items-start gap-3 p-3 rounded-lg hover:bg-[var(--fc-subtle-gray)]/50 transition-colors"
                    >
                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[var(--fc-action-red)] flex-shrink-0" />
                        <p className="flex-1 text-sm text-[var(--fc-dark-gray)] leading-relaxed">
                            {item}
                        </p>
                        <button
                            onClick={() => onRemove(item)}
                            className="p-1.5 text-[var(--fc-body-gray)] hover:text-red-500 hover:bg-red-50 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                            aria-label="Remove item"
                        >
                            <X size={14} />
                        </button>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
