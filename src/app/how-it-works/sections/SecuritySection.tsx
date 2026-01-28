'use client';

import { motion } from 'motion/react';
import { Shield, Lock, Key, Fingerprint, Server, Check } from 'lucide-react';

const securityFeatures = [
    {
        icon: Shield,
        title: 'Session Isolation',
        description: 'Each conversation is completely separate from others',
        color: '#10b981',
    },
    {
        icon: Key,
        title: 'Device Authentication',
        description: 'Cryptographic signatures verify each device',
        color: '#3b82f6',
    },
    {
        icon: Fingerprint,
        title: 'Pairing Required',
        description: 'New users need administrator approval',
        color: '#8b5cf6',
    },
    {
        icon: Server,
        title: 'Sandboxed Execution',
        description: 'Agent tools run in isolated environments',
        color: '#f59e0b',
    },
];

export function SecuritySection() {
    return (
        <section id="security" className="relative min-h-screen py-20 overflow-hidden">
            {/* Background with mesh pattern */}
            <div className="absolute inset-0">
                <div className="absolute inset-0 bg-gradient-to-b from-[var(--fc-off-white)] to-white" />

                {/* Shield pattern */}
                <svg className="absolute inset-0 w-full h-full opacity-5" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern id="shieldPattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                            <path
                                d="M30 5 L55 15 L55 30 Q55 50 30 55 Q5 50 5 30 L5 15 Z"
                                fill="none"
                                stroke="#10b981"
                                strokeWidth="1"
                            />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#shieldPattern)" />
                </svg>
            </div>

            {/* Content */}
            <div className="relative z-10 max-w-7xl mx-auto px-4">
                {/* Header */}
                <motion.div
                    className="flex items-center gap-3 mb-4"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                        <span className="text-lg font-bold text-white">06</span>
                    </div>
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-[var(--fc-light-gray)]">
                            Layer 6
                        </p>
                        <h2 className="text-xl font-semibold text-[var(--fc-black)]">Security</h2>
                    </div>
                </motion.div>

                <motion.p
                    className="text-lg text-[var(--fc-body-gray)] max-w-2xl mb-16"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                >
                    Enterprise-grade security protecting your data and conversations
                </motion.p>

                {/* Security features grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
                    {securityFeatures.map((feature, index) => (
                        <motion.div
                            key={feature.title}
                            className="bg-white rounded-2xl border border-[var(--fc-border-gray)] p-6 shadow-sm relative overflow-hidden group"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ y: -3, boxShadow: '0 20px 40px -10px rgba(0,0,0,0.08)' }}
                        >
                            {/* Gradient overlay */}
                            <div
                                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                style={{
                                    background: `linear-gradient(135deg, ${feature.color}08 0%, transparent 50%)`,
                                }}
                            />

                            <div className="relative flex items-start gap-4">
                                <div
                                    className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                                    style={{ background: `${feature.color}15` }}
                                >
                                    <feature.icon size={28} style={{ color: feature.color }} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-[var(--fc-black)] mb-1">
                                        {feature.title}
                                    </h3>
                                    <p className="text-sm text-[var(--fc-body-gray)]">{feature.description}</p>
                                </div>
                            </div>

                            {/* Checkmark */}
                            <div className="absolute top-4 right-4">
                                <div
                                    className="w-6 h-6 rounded-full flex items-center justify-center"
                                    style={{ background: `${feature.color}20` }}
                                >
                                    <Check size={14} style={{ color: feature.color }} />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Security badges */}
                <motion.div
                    className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-2xl border border-slate-200 p-8"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 }}
                >
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
                                <Lock size={32} className="text-white" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-[var(--fc-black)]">End-to-End Security</h3>
                                <p className="text-sm text-[var(--fc-body-gray)]">
                                    All communications encrypted in transit and at rest
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            {['TLS 1.3', 'AES-256', 'ED25519'].map((badge) => (
                                <span
                                    key={badge}
                                    className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-sm font-medium text-slate-700"
                                >
                                    {badge}
                                </span>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
