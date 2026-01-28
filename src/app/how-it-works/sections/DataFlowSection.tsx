'use client';

import { motion, useScroll, useTransform } from 'motion/react';
import { useRef } from 'react';
import { MessageSquare, Globe, Cpu, Brain, Sparkles, ArrowRight } from 'lucide-react';

const flowSteps = [
    {
        icon: MessageSquare,
        label: 'User Message',
        description: 'Typed in Web Chat',
        color: '#3b82f6',
    },
    {
        icon: Globe,
        label: 'WebSocket',
        description: 'Real-time transmission',
        color: '#10b981',
    },
    {
        icon: Cpu,
        label: 'Gateway',
        description: 'Request routing',
        color: '#8b5cf6',
    },
    {
        icon: Brain,
        label: 'AI Processing',
        description: 'Claude Sonnet',
        color: '#be1e2c',
    },
    {
        icon: Sparkles,
        label: 'Response',
        description: 'Streamed back',
        color: '#f59e0b',
    },
];

export function DataFlowSection() {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ['start end', 'end start'],
    });

    const pathProgress = useTransform(scrollYProgress, [0.2, 0.8], [0, 1]);

    return (
        <section
            ref={containerRef}
            id="data-flow"
            className="relative min-h-screen py-20 overflow-hidden"
        >
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-b from-[var(--fc-off-white)] via-white to-[var(--fc-off-white)]" />

            {/* Header */}
            <div className="relative z-10 max-w-7xl mx-auto px-4 mb-16">
                <motion.div
                    className="flex items-center gap-3 mb-4"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
                        <span className="text-lg font-bold text-white">05</span>
                    </div>
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-[var(--fc-light-gray)]">
                            Layer 5
                        </p>
                        <h2 className="text-xl font-semibold text-[var(--fc-black)]">Data Flow</h2>
                    </div>
                </motion.div>

                <motion.p
                    className="text-lg text-[var(--fc-body-gray)] max-w-2xl"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                >
                    Follow the journey of a message through the entire system
                </motion.p>
            </div>

            {/* Flow visualization */}
            <div className="relative z-10 max-w-6xl mx-auto px-4">
                <div className="relative">
                    {/* Connection line */}
                    <svg
                        className="absolute top-1/2 left-0 right-0 h-2 -translate-y-1/2 hidden lg:block"
                        preserveAspectRatio="none"
                    >
                        <motion.line
                            x1="0"
                            y1="50%"
                            x2="100%"
                            y2="50%"
                            stroke="url(#flowGradient)"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeDasharray="8 4"
                            style={{
                                pathLength: pathProgress,
                            }}
                        />
                        <defs>
                            <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#3b82f6" />
                                <stop offset="25%" stopColor="#10b981" />
                                <stop offset="50%" stopColor="#8b5cf6" />
                                <stop offset="75%" stopColor="#be1e2c" />
                                <stop offset="100%" stopColor="#f59e0b" />
                            </linearGradient>
                        </defs>
                    </svg>

                    {/* Flow steps */}
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-4">
                        {flowSteps.map((step, index) => (
                            <motion.div
                                key={step.label}
                                className="relative"
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                            >
                                {/* Arrow between steps (hidden on mobile) */}
                                {index < flowSteps.length - 1 && (
                                    <div className="hidden lg:block absolute top-1/2 -right-2 -translate-y-1/2 z-10">
                                        <ArrowRight size={20} className="text-[var(--fc-border-gray)]" />
                                    </div>
                                )}

                                {/* Step card */}
                                <motion.div
                                    className="bg-white rounded-2xl border border-[var(--fc-border-gray)] p-6 shadow-sm relative overflow-hidden group"
                                    whileHover={{ y: -5, boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)' }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                >
                                    {/* Gradient overlay on hover */}
                                    <div
                                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                        style={{
                                            background: `linear-gradient(135deg, ${step.color}08 0%, transparent 50%)`,
                                        }}
                                    />

                                    {/* Step number */}
                                    <div
                                        className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                                        style={{ background: `${step.color}15` }}
                                    >
                                        <step.icon size={20} style={{ color: step.color }} />
                                    </div>

                                    {/* Content */}
                                    <h3 className="text-base font-semibold text-[var(--fc-black)] mb-1">
                                        {step.label}
                                    </h3>
                                    <p className="text-sm text-[var(--fc-body-gray)]">{step.description}</p>

                                    {/* Pulse animation when active */}
                                    <motion.div
                                        className="absolute top-4 right-4 w-2 h-2 rounded-full"
                                        style={{ background: step.color }}
                                        animate={{
                                            scale: [1, 1.5, 1],
                                            opacity: [1, 0.5, 1],
                                        }}
                                        transition={{
                                            duration: 2,
                                            repeat: Infinity,
                                            delay: index * 0.3,
                                        }}
                                    />
                                </motion.div>

                                {/* Mobile arrow */}
                                {index < flowSteps.length - 1 && (
                                    <div className="lg:hidden flex justify-center py-4">
                                        <ArrowRight size={20} className="text-[var(--fc-border-gray)] rotate-90" />
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Session isolation note */}
                <motion.div
                    className="mt-16 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100 p-6"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 }}
                >
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                            <svg
                                className="w-6 h-6 text-emerald-600"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-[var(--fc-black)] mb-1">
                                Session Isolation
                            </h3>
                            <p className="text-sm text-[var(--fc-body-gray)]">
                                Each user conversation is completely isolated with{' '}
                                <code className="text-xs bg-emerald-100 px-1.5 py-0.5 rounded text-emerald-700">
                                    dmScope: per-channel-peer
                                </code>
                                . Your conversations remain private and separate from other users.
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
