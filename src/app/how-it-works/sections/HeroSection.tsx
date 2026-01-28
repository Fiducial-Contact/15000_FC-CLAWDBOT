'use client';

import { motion, useTransform } from 'motion/react';
import { Network, ChevronDown } from 'lucide-react';
import { useScrollProgress } from '@/hooks/useScrollProgress';
import { ParticleField } from '../components/ParticleField';

export function HeroSection() {
    const { smooth } = useScrollProgress();

    const opacity = useTransform(smooth, [0, 0.1], [1, 0]);
    const scale = useTransform(smooth, [0, 0.1], [1, 0.9]);
    const y = useTransform(smooth, [0, 0.1], [0, -50]);

    return (
        <motion.section
            id="hero"
            className="relative min-h-screen flex items-center justify-center overflow-hidden"
            style={{ opacity, scale, y }}
        >
            {/* Background gradient mesh */}
            <div className="absolute inset-0">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--fc-off-white)] via-white to-[var(--fc-off-white)]" />
                <div
                    className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl"
                    style={{ background: 'radial-gradient(circle, #be1e2c20 0%, transparent 70%)' }}
                />
                <div
                    className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl"
                    style={{ background: 'radial-gradient(circle, #3b82f620 0%, transparent 70%)' }}
                />
            </div>

            {/* Particle field */}
            <ParticleField count={40} color="#be1e2c" />

            {/* Central network visualization */}
            <div className="relative z-10 text-center">
                {/* Central node */}
                <motion.div
                    className="relative mx-auto mb-8"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.2 }}
                >
                    {/* Outer rings */}
                    {[...Array(3)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute inset-0 rounded-full border border-[var(--fc-red)]"
                            style={{
                                width: 160 + i * 60,
                                height: 160 + i * 60,
                                x: -(80 + i * 30),
                                y: -(80 + i * 30),
                            }}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{
                                scale: [0.8, 1.1, 0.8],
                                opacity: [0.1, 0.3, 0.1],
                            }}
                            transition={{
                                duration: 4 + i,
                                repeat: Infinity,
                                delay: i * 0.5,
                                ease: 'easeInOut',
                            }}
                        />
                    ))}

                    {/* Main node */}
                    <motion.div
                        className="w-32 h-32 rounded-3xl flex items-center justify-center relative"
                        style={{
                            background: 'linear-gradient(135deg, #be1e2c20 0%, #be1e2c05 100%)',
                            border: '2px solid #be1e2c40',
                            boxShadow: '0 0 60px #be1e2c20, inset 0 0 30px #be1e2c10',
                        }}
                        animate={{
                            boxShadow: [
                                '0 0 60px #be1e2c20, inset 0 0 30px #be1e2c10',
                                '0 0 80px #be1e2c30, inset 0 0 40px #be1e2c15',
                                '0 0 60px #be1e2c20, inset 0 0 30px #be1e2c10',
                            ],
                        }}
                        transition={{ duration: 3, repeat: Infinity }}
                    >
                        <Network size={48} className="text-[var(--fc-red)]" strokeWidth={1.5} />
                    </motion.div>

                    {/* Orbiting dots */}
                    {[...Array(6)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-3 h-3 rounded-full bg-[var(--fc-red)]"
                            style={{
                                top: '50%',
                                left: '50%',
                            }}
                            animate={{
                                x: Math.cos((i * Math.PI) / 3) * 100 - 6,
                                y: Math.sin((i * Math.PI) / 3) * 100 - 6,
                            }}
                            transition={{
                                duration: 0,
                            }}
                        >
                            <motion.div
                                className="absolute inset-0 rounded-full bg-[var(--fc-red)]"
                                animate={{
                                    scale: [1, 1.5, 1],
                                    opacity: [1, 0.5, 1],
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    delay: i * 0.3,
                                }}
                            />
                        </motion.div>
                    ))}
                </motion.div>

                {/* Title */}
                <motion.h1
                    className="text-5xl md:text-7xl font-bold text-[var(--fc-black)] mb-4 tracking-tight"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    System{' '}
                    <span className="bg-gradient-to-r from-[var(--fc-red)] to-[var(--fc-action-red)] bg-clip-text text-transparent">
                        Architecture
                    </span>
                </motion.h1>

                {/* Subtitle */}
                <motion.p
                    className="text-lg md:text-xl text-[var(--fc-body-gray)] max-w-2xl mx-auto mb-12"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    Explore how Fiducial AI processes your requests through an intelligent neural network
                </motion.p>

                {/* Stats */}
                <motion.div
                    className="flex justify-center gap-12 mb-16"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                >
                    {[
                        { value: '30ms', label: 'Latency' },
                        { value: '1M', label: 'Context' },
                        { value: '99.9%', label: 'Uptime' },
                    ].map((stat) => (
                        <div key={stat.label} className="text-center">
                            <p className="text-2xl font-bold text-[var(--fc-black)]">{stat.value}</p>
                            <p className="text-sm text-[var(--fc-light-gray)]">{stat.label}</p>
                        </div>
                    ))}
                </motion.div>
            </div>

            {/* Scroll hint */}
            <motion.div
                className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
            >
                <span className="text-xs text-[var(--fc-light-gray)] uppercase tracking-widest">Scroll to explore</span>
                <motion.div
                    animate={{ y: [0, 8, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                >
                    <ChevronDown size={24} className="text-[var(--fc-light-gray)]" />
                </motion.div>
            </motion.div>
        </motion.section>
    );
}
