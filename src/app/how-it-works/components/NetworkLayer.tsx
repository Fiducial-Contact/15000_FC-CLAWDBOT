'use client';

import { motion, useTransform } from 'motion/react';
import { useScrollProgress } from '@/hooks/useScrollProgress';
import { ParticleField } from './ParticleField';

interface NetworkLayerProps {
    id: string;
    index: number;
    label: string;
    accentColor: string;
    sectionRange: [number, number];
    children: React.ReactNode;
    className?: string;
}

export function NetworkLayer({
    id,
    index,
    label,
    accentColor,
    sectionRange,
    children,
    className = '',
}: NetworkLayerProps) {
    const { smooth } = useScrollProgress();
    const [start, end] = sectionRange;

    const layerOpacity = useTransform(smooth, [start - 0.05, start, end, end + 0.05], [0, 1, 1, 0.8]);
    const layerY = useTransform(smooth, [start, end], [50, -50]);

    return (
        <motion.section
            id={id}
            className={`relative min-h-[600px] py-16 ${className}`}
            style={{
                opacity: layerOpacity,
                y: layerY,
            }}
        >
            {/* Background gradient */}
            <div
                className="absolute inset-0"
                style={{
                    background: `linear-gradient(180deg, ${accentColor}05 0%, transparent 50%, ${accentColor}03 100%)`,
                }}
            />

            {/* Particle field */}
            <ParticleField count={20} color={accentColor} />

            {/* Layer label */}
            <div className="absolute top-8 left-8 z-10">
                <motion.div
                    className="flex items-center gap-3"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                >
                    <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{
                            background: `linear-gradient(135deg, ${accentColor}20 0%, ${accentColor}05 100%)`,
                            border: `1px solid ${accentColor}30`,
                        }}
                    >
                        <span className="text-lg font-bold" style={{ color: accentColor }}>
                            {String(index + 1).padStart(2, '0')}
                        </span>
                    </div>
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-[var(--fc-light-gray)]">
                            Layer {index + 1}
                        </p>
                        <h2 className="text-xl font-semibold text-[var(--fc-black)]">{label}</h2>
                    </div>
                </motion.div>
            </div>

            {/* Content container */}
            <div className="relative z-10 max-w-7xl mx-auto px-4 pt-24">
                {children}
            </div>

            {/* Bottom fade */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[var(--fc-off-white)] to-transparent pointer-events-none" />
        </motion.section>
    );
}
