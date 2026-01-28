'use client';

import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'motion/react';
import { useState } from 'react';
import { LucideIcon } from 'lucide-react';
import { useNodeActivation } from '@/hooks/useNodeActivation';

interface NeuralNodeProps {
    id: string;
    position: { x: number; y: number };
    layer: number;
    type: 'input' | 'gateway' | 'processing' | 'memory' | 'output';
    icon: LucideIcon;
    label: string;
    description?: string;
    sectionRange: [number, number];
    delay?: number;
    accentColor?: string;
    onHover?: (id: string | null) => void;
    isHighlighted?: boolean;
    children?: React.ReactNode;
}

export function NeuralNode({
    id,
    position,
    layer,
    type,
    icon: Icon,
    label,
    description,
    sectionRange,
    delay = 0,
    accentColor = '#be1e2c',
    onHover,
    isHighlighted = false,
    children,
}: NeuralNodeProps) {
    const [isHovered, setIsHovered] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const { scale, opacity, glowIntensity, isActive } = useNodeActivation(sectionRange, delay);

    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const springConfig = { stiffness: 400, damping: 25 };
    const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [5, -5]), springConfig);
    const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-5, 5]), springConfig);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        mouseX.set(x);
        mouseY.set(y);
    };

    const handleMouseEnter = () => {
        setIsHovered(true);
        setShowDetails(true);
        onHover?.(id);
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
        setShowDetails(false);
        mouseX.set(0);
        mouseY.set(0);
        onHover?.(null);
    };

    const nodeSize = type === 'gateway' ? 80 : type === 'processing' ? 72 : 64;
    const glowSize = isHovered ? 30 : 20;

    return (
        <motion.div
            className="absolute"
            style={{
                left: position.x,
                top: position.y,
                x: '-50%',
                y: '-50%',
                zIndex: layer * 10,
            }}
            initial={{ scale: 0.7, opacity: 0 }}
        >
            {/* Glow effect */}
            <motion.div
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                    width: nodeSize + glowSize * 2,
                    height: nodeSize + glowSize * 2,
                    x: -glowSize,
                    y: -glowSize,
                    background: `radial-gradient(circle, ${accentColor}40 0%, transparent 70%)`,
                    opacity: useTransform(glowIntensity, [0, 1], [0.3, isHovered ? 0.8 : 0.5]),
                    scale: useTransform(glowIntensity, [0, 1], [0.8, isHovered ? 1.2 : 1]),
                }}
            />

            {/* Breathing pulse ring */}
            <motion.div
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                    width: nodeSize + 40,
                    height: nodeSize + 40,
                    x: -20,
                    y: -20,
                    border: `2px solid ${accentColor}`,
                    opacity: useTransform(glowIntensity, [0, 1], [0, 0.3]),
                }}
                animate={
                    isActive.get()
                        ? {
                            scale: [1, 1.3, 1],
                            opacity: [0.3, 0, 0.3],
                        }
                        : {}
                }
                transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
            />

            {/* Main node */}
            <motion.div
                className="relative cursor-pointer"
                style={{
                    width: nodeSize,
                    height: nodeSize,
                    scale,
                    opacity,
                    rotateX,
                    rotateY,
                    transformStyle: 'preserve-3d',
                }}
                onMouseMove={handleMouseMove}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                whileHover={{ scale: 1.15 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
                {/* Node background */}
                <motion.div
                    className="absolute inset-0 rounded-2xl"
                    style={{
                        background: `linear-gradient(135deg, ${accentColor}15 0%, ${accentColor}05 100%)`,
                        border: `2px solid ${isHovered || isHighlighted ? accentColor : `${accentColor}40`}`,
                        boxShadow: isHovered
                            ? `0 0 30px ${accentColor}40, inset 0 0 20px ${accentColor}10`
                            : `0 4px 20px ${accentColor}10`,
                        backdropFilter: 'blur(8px)',
                    }}
                />

                {/* Icon container */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
                    <motion.div
                        style={{
                            color: isHovered ? accentColor : `${accentColor}cc`,
                        }}
                    >
                        <Icon size={type === 'gateway' ? 32 : 24} strokeWidth={1.5} />
                    </motion.div>
                </div>

                {/* Status indicator */}
                <motion.div
                    className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
                    style={{
                        background: accentColor,
                        boxShadow: `0 0 10px ${accentColor}`,
                    }}
                    animate={
                        isActive.get()
                            ? {
                                scale: [1, 1.2, 1],
                                opacity: [1, 0.7, 1],
                            }
                            : { scale: 1, opacity: 0.5 }
                    }
                    transition={{ duration: 2, repeat: Infinity }}
                />
            </motion.div>

            {/* Label */}
            <motion.div
                className="absolute top-full left-1/2 mt-3 -translate-x-1/2 text-center whitespace-nowrap"
                style={{
                    opacity: useTransform(opacity, [0, 1], [0, 1]),
                }}
            >
                <p className="text-xs font-semibold text-[var(--fc-black)] tracking-tight">{label}</p>
                {description && (
                    <p className="text-[10px] text-[var(--fc-body-gray)] mt-0.5">{description}</p>
                )}
            </motion.div>

            {/* Detail panel */}
            <AnimatePresence>
                {showDetails && children && (
                    <motion.div
                        className="absolute left-full top-0 ml-4 z-50"
                        initial={{ opacity: 0, x: -10, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -10, scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    >
                        <div
                            className="bg-white/95 backdrop-blur-xl rounded-xl border border-[var(--fc-border-gray)] p-4 shadow-xl min-w-[240px]"
                            style={{
                                boxShadow: `0 20px 40px -10px ${accentColor}20`,
                            }}
                        >
                            <div className="flex items-center gap-2 mb-3">
                                <div
                                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                                    style={{ background: `${accentColor}15` }}
                                >
                                    <Icon size={16} style={{ color: accentColor }} />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-[var(--fc-black)]">{label}</p>
                                    {description && (
                                        <p className="text-[10px] text-[var(--fc-body-gray)]">{description}</p>
                                    )}
                                </div>
                            </div>
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
