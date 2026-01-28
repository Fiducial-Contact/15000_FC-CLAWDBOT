'use client';

import { motion } from 'motion/react';
import Link from 'next/link';
import { Zap, ArrowRight, Sparkles } from 'lucide-react';

export function CTASection() {
    return (
        <section id="cta" className="relative min-h-[60vh] flex items-center justify-center py-20 overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0">
                <div className="absolute inset-0 bg-gradient-to-b from-white to-[var(--fc-off-white)]" />

                {/* Animated gradient orbs */}
                <motion.div
                    className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl"
                    style={{ background: 'radial-gradient(circle, #be1e2c30 0%, transparent 70%)' }}
                    animate={{
                        scale: [1, 1.2, 1],
                        x: [0, 30, 0],
                        y: [0, -20, 0],
                    }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl"
                    style={{ background: 'radial-gradient(circle, #3b82f630 0%, transparent 70%)' }}
                    animate={{
                        scale: [1.2, 1, 1.2],
                        x: [0, -30, 0],
                        y: [0, 20, 0],
                    }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                />
            </div>

            {/* Content */}
            <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
                {/* Badge */}
                <motion.div
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--fc-red)]/10 border border-[var(--fc-red)]/20 mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <Sparkles size={16} className="text-[var(--fc-red)]" />
                    <span className="text-sm font-medium text-[var(--fc-red)]">Ready to explore?</span>
                </motion.div>

                {/* Title */}
                <motion.h2
                    className="text-4xl md:text-6xl font-bold text-[var(--fc-black)] mb-6 tracking-tight"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                >
                    Start the{' '}
                    <span className="bg-gradient-to-r from-[var(--fc-red)] to-[var(--fc-action-red)] bg-clip-text text-transparent">
                        Conversation
                    </span>
                </motion.h2>

                {/* Subtitle */}
                <motion.p
                    className="text-lg md:text-xl text-[var(--fc-body-gray)] max-w-2xl mx-auto mb-12"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                >
                    Experience the power of AI-assisted video production. Get help with After Effects,
                    Premiere Pro, and more.
                </motion.p>

                {/* CTA Button */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 }}
                >
                    <Link
                        href="/chat"
                        className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[var(--fc-red)] to-[var(--fc-action-red)] text-white rounded-full font-semibold text-lg shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105"
                    >
                        <Zap size={24} className="group-hover:animate-pulse" />
                        Start Chatting
                        <ArrowRight
                            size={24}
                            className="group-hover:translate-x-1 transition-transform"
                        />
                    </Link>
                </motion.div>

                {/* Trust indicators */}
                <motion.div
                    className="mt-12 flex flex-wrap justify-center gap-8 text-sm text-[var(--fc-light-gray)]"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 }}
                >
                    <span className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                            <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                            />
                        </svg>
                        Secure & Private
                    </span>
                    <span className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                            <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                            />
                        </svg>
                        Real-time Responses
                    </span>
                    <span className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                            <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                            />
                        </svg>
                        Video Production Expert
                    </span>
                </motion.div>
            </div>
        </section>
    );
}
