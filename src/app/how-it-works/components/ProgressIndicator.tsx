'use client';

import { motion, useTransform, MotionValue } from 'motion/react';
import { useScrollProgress } from '@/hooks/useScrollProgress';

interface ScrollSection {
    id: string;
    label: string;
    startProgress: number;
    endProgress: number;
}

interface ProgressIndicatorProps {
    sections: ScrollSection[];
    onSectionClick?: (sectionId: string) => void;
}

interface SectionMarkerProps {
    section: ScrollSection;
    index: number;
    smooth: MotionValue<number>;
    onSectionClick: (sectionId: string) => void;
}

function SectionMarker({ section, index, smooth, onSectionClick }: SectionMarkerProps) {
    const sectionProgress = useTransform(
        smooth,
        [section.startProgress, section.endProgress],
        [0, 1]
    );

    const isActive = useTransform(sectionProgress, (v) => v > 0 && v < 1);
    const isCompleted = useTransform(smooth, (v) => v > section.endProgress);

    return (
        <motion.button
            className="relative group"
            onClick={() => onSectionClick(section.id)}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
        >
            <motion.div
                className="w-3 h-3 rounded-full border-2 transition-colors"
                style={{
                    backgroundColor: isCompleted.get()
                        ? 'var(--fc-red)'
                        : isActive.get()
                            ? 'white'
                            : 'transparent',
                    borderColor: isCompleted.get() || isActive.get() ? 'var(--fc-red)' : 'var(--fc-border-gray)',
                }}
            />

            <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                <div className="bg-[var(--fc-black)] text-white text-xs px-3 py-1.5 rounded-lg">
                    {section.label}
                </div>
            </div>

            <span className="absolute -left-6 top-1/2 -translate-y-1/2 text-[10px] font-medium text-[var(--fc-light-gray)]">
                {String(index + 1).padStart(2, '0')}
            </span>
        </motion.button>
    );
}

export function ProgressIndicator({ sections, onSectionClick }: ProgressIndicatorProps) {
    const { smooth } = useScrollProgress();

    const progressHeight = useTransform(smooth, [0, 1], ['0%', '100%']);

    const handleSectionClick = (sectionId: string) => {
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
        onSectionClick?.(sectionId);
    };

    return (
        <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50 hidden lg:flex flex-col items-center">
            <div className="relative w-1 h-[400px] bg-[var(--fc-border-gray)] rounded-full overflow-hidden">
                <motion.div
                    className="absolute top-0 left-0 right-0 bg-gradient-to-b from-[var(--fc-red)] to-[var(--fc-action-red)] rounded-full"
                    style={{ height: progressHeight }}
                />
            </div>

            <div className="absolute inset-0 flex flex-col justify-between py-2">
                {sections.map((section, index) => (
                    <SectionMarker
                        key={section.id}
                        section={section}
                        index={index}
                        smooth={smooth}
                        onSectionClick={handleSectionClick}
                    />
                ))}
            </div>
        </div>
    );
}
