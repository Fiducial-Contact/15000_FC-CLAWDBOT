import { useState, KeyboardEvent, useRef } from 'react';
import { X, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TagInputProps {
    tags: string[];
    onAdd: (tag: string) => void;
    onRemove: (tag: string) => void;
    placeholder?: string;
}

export function TagInput({ tags, onAdd, onRemove, placeholder = 'Add tag...' }: TagInputProps) {
    const [inputValue, setInputValue] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAdd();
        }
    };

    const handleAdd = () => {
        const trimmed = inputValue.trim();
        if (trimmed && !tags.includes(trimmed)) {
            onAdd(trimmed);
            setInputValue('');
        }
    };

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
                <AnimatePresence mode="popLayout">
                    {tags.map((tag) => (
                        <motion.span
                            key={tag}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            layout
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-[var(--fc-subtle-gray)] text-[var(--fc-dark-gray)] text-xs font-medium rounded-md border border-[var(--fc-border-gray)] group"
                        >
                            {tag}
                            <button
                                onClick={() => onRemove(tag)}
                                className="p-0.5 hover:bg-[var(--fc-border-gray)] rounded-full transition-colors"
                                aria-label={`Remove ${tag}`}
                            >
                                <X size={12} className="text-[var(--fc-body-gray)] group-hover:text-[var(--fc-dark-gray)]" />
                            </button>
                        </motion.span>
                    ))}
                </AnimatePresence>
                <button
                    onClick={() => inputRef.current?.focus()}
                    className="inline-flex items-center gap-1 px-2.5 py-1 border border-dashed border-[var(--fc-border-gray)] text-[var(--fc-body-gray)] text-xs font-medium rounded-md hover:border-[var(--fc-dark-gray)] hover:text-[var(--fc-dark-gray)] transition-colors"
                >
                    <Plus size={12} />
                    Add
                </button>
            </div>

            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className="w-full px-3 py-2 bg-[var(--fc-subtle-gray)]/50 border border-transparent rounded-lg text-sm focus:outline-none focus:bg-white focus:border-[var(--fc-action-red)] focus:ring-1 focus:ring-[var(--fc-action-red)] transition-all placeholder:text-[var(--fc-body-gray)]"
                />
                <button
                    onClick={handleAdd}
                    disabled={!inputValue.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[var(--fc-body-gray)] hover:text-[var(--fc-action-red)] disabled:opacity-50 disabled:hover:text-[var(--fc-body-gray)] transition-colors"
                >
                    <Plus size={16} />
                </button>
            </div>
        </div>
    );
}
