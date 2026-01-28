'use client';

import { motion } from 'motion/react';
import {
    Route,
    Component,
    Plug,
    Sparkles,
    MessageSquare,
    Sidebar,
    PanelTop,
    Keyboard,
    Grid3X3,
    Wrench,
    Brain,
    CreditCard,
    LogIn,
    Type,
} from 'lucide-react';
import { NetworkLayer } from '../components/NetworkLayer';

const routes = [
    { path: '/', name: 'Login', desc: 'Supabase Auth' },
    { path: '/chat', name: 'Chat', desc: 'Primary interface' },
    { path: '/skills', name: 'Skills', desc: 'Capability browser' },
];

const components = [
    { name: 'Header', icon: PanelTop, desc: 'User menu / logout' },
    { name: 'ChatSidebar', icon: Sidebar, desc: 'Session list' },
    { name: 'ChatMessage', icon: MessageSquare, desc: 'Markdown / code' },
    { name: 'ChatInput', icon: Keyboard, desc: 'Text / attachments' },
    { name: 'CapabilityCard', icon: Grid3X3, desc: 'Feature card' },
    { name: 'ToolCard', icon: Wrench, desc: 'Tool execution' },
    { name: 'ThinkingBlock', icon: Brain, desc: 'Thinking process' },
    { name: 'SkillCard', icon: CreditCard, desc: 'Skill display' },
    { name: 'LoginForm', icon: LogIn, desc: 'Email / password' },
    { name: 'AnimatedText', icon: Type, desc: 'Typing animation' },
];

const apiMethods = [
    { method: 'connect', desc: 'Device auth + nonce challenge' },
    { method: 'chat.send', desc: 'Send message (with attachments)' },
    { method: 'chat.history', desc: 'Get history' },
    { method: 'chat.abort', desc: 'Abort generation' },
    { method: 'sessions.list', desc: 'List sessions' },
    { method: 'sessions.patch', desc: 'Update session' },
    { method: 'sessions.delete', desc: 'Delete session' },
    { method: 'skills.status', desc: 'Skills status' },
];

const features = [
    '8 capability cards (Image/Video/Marketing...)',
    'Quick suggestions (6 one-click prompts)',
    '"Surprise Me" random suggestion',
    'Details mode (shows thinking/tools)',
    'Copy entire conversation',
    'Auto-scroll + thinking animation',
];

export function WebChatUISection() {
    const sectionRange: [number, number] = [0.6, 0.72];
    const accentColor = '#3b82f6';

    return (
        <NetworkLayer
            id="webchat-ui"
            index={5}
            label="Web Chat UI"
            accentColor={accentColor}
            sectionRange={sectionRange}
        >
            <div className="mt-8 space-y-6">
                <motion.p
                    className="text-sm text-[var(--fc-body-gray)] max-w-2xl"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                >
                    Next.js 16 app providing a branded web chat interface with real-time WebSocket communication and rich interactive features.
                </motion.p>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <motion.div
                        className="bg-white/90 backdrop-blur-sm rounded-xl border border-[var(--fc-border-gray)] p-5 shadow-sm"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h3 className="text-sm font-semibold text-[var(--fc-black)] mb-4 flex items-center gap-2">
                            <Route size={16} className="text-blue-500" />
                            Routes
                        </h3>
                        <div className="space-y-2">
                            {routes.map((route) => (
                                <div key={route.path} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                                    <code className="text-xs font-mono text-blue-600">{route.path}</code>
                                    <div className="text-right">
                                        <div className="text-[10px] text-[var(--fc-black)]">{route.name}</div>
                                        <div className="text-[9px] text-[var(--fc-light-gray)]">{route.desc}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    <motion.div
                        className="bg-white/90 backdrop-blur-sm rounded-xl border border-[var(--fc-border-gray)] p-5 shadow-sm lg:col-span-2"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                    >
                        <h3 className="text-sm font-semibold text-[var(--fc-black)] mb-4 flex items-center gap-2">
                            <Component size={16} className="text-purple-500" />
                            Components
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                            {components.map((comp) => {
                                const Icon = comp.icon;
                                return (
                                    <div key={comp.name} className="bg-slate-50 rounded-lg p-2 text-center">
                                        <Icon size={14} className="mx-auto mb-1 text-purple-500" />
                                        <div className="text-[10px] font-medium text-[var(--fc-black)]">{comp.name}</div>
                                        <div className="text-[8px] text-[var(--fc-light-gray)]">{comp.desc}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <motion.div
                        className="bg-white/90 backdrop-blur-sm rounded-xl border border-[var(--fc-border-gray)] p-5 shadow-sm"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                    >
                        <h3 className="text-sm font-semibold text-[var(--fc-black)] mb-4 flex items-center gap-2">
                            <Plug size={16} className="text-emerald-500" />
                            Gateway API (WebSocket)
                        </h3>
                        <div className="space-y-1.5">
                            {apiMethods.map((api) => (
                                <div key={api.method} className="flex items-center gap-2 text-[10px]">
                                    <code className="font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">{api.method}</code>
                                    <span className="text-[var(--fc-light-gray)]">→</span>
                                    <span className="text-[var(--fc-body-gray)]">{api.desc}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    <motion.div
                        className="bg-white/90 backdrop-blur-sm rounded-xl border border-[var(--fc-border-gray)] p-5 shadow-sm"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 }}
                    >
                        <h3 className="text-sm font-semibold text-[var(--fc-black)] mb-4 flex items-center gap-2">
                            <Sparkles size={16} className="text-amber-500" />
                            Features
                        </h3>
                        <div className="space-y-2">
                            {features.map((feature, i) => (
                                <div key={i} className="flex items-center gap-2 text-xs text-[var(--fc-body-gray)]">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                                    {feature}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>
        </NetworkLayer>
    );
}
