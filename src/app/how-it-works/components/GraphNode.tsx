'use client';

import { motion, AnimatePresence } from 'motion/react';
import { useState, useMemo } from 'react';
import type { LucideIcon } from 'lucide-react';
import type { IconType } from 'react-icons';

interface GraphNodeProps {
    id: string;
    x: number;
    y: number;
    type: 'user' | 'channel' | 'gateway' | 'core' | 'service';
    icon: LucideIcon | IconType;
    label: string;
    description?: string;
    accentColor?: string;
    delay?: number;
    size?: number; // Explicit size override
    children?: React.ReactNode;
}

function hashToUnit(value: string) {
    let hash = 0;
    for (let i = 0; i < value.length; i += 1) {
        hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
    }
    return (hash % 1000) / 1000;
}

export function GraphNode({
    id,
    x,
    y,
    type,
    icon: Icon,
    label,
    description,
    accentColor = '#be1e2c',
    delay = 0,
    size, // Destructure size
    children,
}: GraphNodeProps) {
    const [isHovered, setIsHovered] = useState(false);

    const { nodeSize, pulseDelay, haloDelay } = useMemo(() => ({
        // Use explicit size if provided, otherwise fallback to type-based defaults
        nodeSize: size || (type === 'gateway' ? 96 : type === 'core' ? 80 : 64),
        pulseDelay: hashToUnit(`${id}-pulse`) * 2,
        haloDelay: hashToUnit(`${id}-halo`),
    }), [id, type, size]);

    return (
        <motion.div
            className="absolute"
            style={{
                left: `${x}%`,
                top: `${y}%`,
                transform: 'translate(-50%, -50%)',
                zIndex: isHovered ? 100 : 10,
            }}
            initial={{ scale: 0, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{
                type: "spring",
                stiffness: 260,
                damping: 20,
                delay: delay
            }}
        >
            {/* Premium Halo Animation Layers */}

            {/* Layer 1: Core Breathing Glow */}
            <motion.div
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                    width: nodeSize + 30,
                    height: nodeSize + 30,
                    left: -15,
                    top: -15,
                    background: `radial-gradient(circle, ${accentColor}30 0%, transparent 70%)`,
                    filter: 'blur(8px)',
                }}
                animate={{
                    scale: isHovered ? 1.2 : [1, 1.1, 1],
                    opacity: isHovered ? 0.6 : [0.3, 0.5, 0.3],
                }}
                transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: delay + haloDelay,
                }}
            />

            {/* Layer 2: Rotating Dashed Orbital Ring */}
            <motion.div
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                    width: nodeSize + 12,
                    height: nodeSize + 12,
                    left: -6,
                    top: -6,
                    border: `1px dashed ${accentColor}60`,
                    boxShadow: `0 0 10px ${accentColor}20`,
                }}
                animate={{
                    rotate: 360,
                    scale: isHovered ? 1.1 : 1,
                    borderColor: isHovered ? `${accentColor}aa` : `${accentColor}60`,
                }}
                transition={{
                    rotate: {
                        duration: isHovered ? 10 : 30,
                        repeat: Infinity,
                        ease: "linear",
                    },
                    scale: { duration: 0.3 },
                }}
            />

            {/* Layer 3: Expanding Sonar Ripple */}
            <motion.div
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                    width: nodeSize,
                    height: nodeSize,
                    border: `1px solid ${accentColor}40`,
                    boxShadow: `0 0 15px ${accentColor}10`,
                }}
                animate={{
                    width: [nodeSize, nodeSize + 60],
                    height: [nodeSize, nodeSize + 60],
                    left: [0, -30],
                    top: [0, -30],
                    opacity: [0.6, 0],
                    borderWidth: ['2px', '0px'],
                }}
                transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    delay: pulseDelay,
                    ease: "easeOut",
                }}
            />

            <motion.div
                className="relative cursor-pointer"
                style={{ width: nodeSize, height: nodeSize }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                whileHover={{ scale: 1.1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
                <div
                    className="absolute inset-0 rounded-2xl backdrop-blur-md transition-all duration-200"
                    style={{
                        background: `linear-gradient(135deg, ${accentColor}20 0%, ${accentColor}05 100%)`,
                        border: `1px solid ${isHovered ? accentColor : `${accentColor}40`}`,
                        boxShadow: isHovered
                            ? `0 0 30px ${accentColor}40, inset 0 0 20px ${accentColor}10`
                            : `0 4px 20px ${accentColor}10`,
                    }}
                />

                <div className="absolute inset-0 flex items-center justify-center">
                    <Icon
                        size={type === 'gateway' ? 36 : 22}
                        style={{ color: accentColor }}
                    />
                </div>
            </motion.div>

            <div
                className="absolute left-1/2 -translate-x-1/2 text-center whitespace-nowrap pointer-events-none"
                style={{
                    top: nodeSize + 8,
                    zIndex: isHovered ? 101 : 11
                }}
            >
                <p className="text-xs font-semibold text-[var(--fc-black)] tracking-tight">{label}</p>
                {description && (
                    <p className="text-[9px] text-[var(--fc-light-gray)] mt-0.5">{description}</p>
                )}
            </div>

            <AnimatePresence>
                {isHovered && children && (
                    <motion.div
                        className={`absolute top-1/2 ${x > 60 ? 'right-full mr-6' : 'left-full ml-6'}`}
                        style={{ zIndex: 200 }}
                        initial={{ opacity: 0, x: x > 60 ? 10 : -10, y: '-50%' }}
                        animate={{ opacity: 1, x: 0, y: '-50%' }}
                        exit={{ opacity: 0, x: x > 60 ? 10 : -10, y: '-50%' }}
                        transition={{ duration: 0.15 }}
                    >
                        <div
                            className="bg-white/95 backdrop-blur-xl rounded-xl border border-[var(--fc-border-gray)] p-4 shadow-2xl min-w-[280px]"
                            style={{
                                boxShadow: `0 25px 50px -12px rgba(0,0,0,0.25), 0 0 30px ${accentColor}20`,
                                borderLeft: x > 60 ? 'none' : `4px solid ${accentColor}`,
                                borderRight: x > 60 ? `4px solid ${accentColor}` : 'none'
                            }}
                        >
                            <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-100">
                                <div
                                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                                    style={{ background: `${accentColor}10` }}
                                >
                                    <Icon size={20} style={{ color: accentColor }} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-[var(--fc-black)]">{label}</h4>
                                    <p className="text-[11px] text-[var(--fc-body-gray)] uppercase tracking-wider font-semibold opacity-70">{type}</p>
                                </div>
                            </div>
                            <div className="text-xs text-[var(--fc-body-gray)] leading-relaxed">
                                {children}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
