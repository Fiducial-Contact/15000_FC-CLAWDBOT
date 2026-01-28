'use client';

import { motion } from 'motion/react';
import { MessageSquare, Globe, Send, Terminal, Check, Clock, FileText } from 'lucide-react';
import { NetworkLayer } from '../components/NetworkLayer';

const channels = [
    {
        id: 'whatsapp',
        name: 'WhatsApp',
        icon: MessageSquare,
        status: 'connected',
        statusText: 'Connected',
        statusColor: 'emerald',
        details: [
            { label: 'Phone', value: '+8615258727081' },
            { label: 'dmPolicy', value: 'pairing' },
            { label: 'groupPolicy', value: 'allowlist' },
        ],
    },
    {
        id: 'teams',
        name: 'MS Teams',
        icon: MessageSquare,
        status: 'pending',
        statusText: 'Pending',
        statusColor: 'amber',
        details: [
            { label: 'Endpoint', value: 'Tailscale Funnel :3978' },
            { label: 'dmPolicy', value: 'pairing' },
            { label: 'groupPolicy', value: 'allowlist' },
        ],
    },
    {
        id: 'webchat',
        name: 'Web Chat',
        icon: Globe,
        status: 'connected',
        statusText: 'Running',
        statusColor: 'emerald',
        details: [
            { label: 'URL', value: 'localhost:3000' },
            { label: 'Auth', value: 'Supabase Auth' },
            { label: 'Protocol', value: 'WebSocket' },
        ],
    },
    {
        id: 'telegram',
        name: 'Telegram',
        icon: Send,
        status: 'configured',
        statusText: 'Configured',
        statusColor: 'blue',
        details: [
            { label: 'dmPolicy', value: 'pairing' },
            { label: 'groupPolicy', value: 'allowlist' },
        ],
    },
    {
        id: 'ssh',
        name: 'Local SSH',
        icon: Terminal,
        status: 'connected',
        statusText: 'Available',
        statusColor: 'emerald',
        details: [
            { label: 'Port', value: '2222' },
            { label: 'Command', value: 'sudo clawdbot status' },
        ],
    },
];

const statusIcons = {
    connected: Check,
    pending: Clock,
    configured: FileText,
};

export function ChannelsSection() {
    const sectionRange: [number, number] = [0.15, 0.28];
    const accentColor = '#10b981';

    return (
        <NetworkLayer
            id="channels"
            index={1}
            label="Access Channels"
            accentColor={accentColor}
            sectionRange={sectionRange}
        >
            <div className="mt-8">
                <motion.p
                    className="text-sm text-[var(--fc-body-gray)] mb-8 max-w-2xl"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                >
                    Multiple access points connect users to the AI system. Each channel is configured with appropriate security policies.
                </motion.p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                    {channels.map((channel, index) => {
                        const StatusIcon = statusIcons[channel.status as keyof typeof statusIcons];
                        const Icon = channel.icon;

                        return (
                            <motion.div
                                key={channel.id}
                                className="bg-white/90 backdrop-blur-sm rounded-xl border border-[var(--fc-border-gray)] p-4 shadow-sm hover:shadow-md transition-shadow"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-8 h-8 rounded-lg bg-${channel.statusColor}-100 flex items-center justify-center`}>
                                            <Icon size={16} className={`text-${channel.statusColor}-600`} />
                                        </div>
                                        <span className="font-medium text-sm text-[var(--fc-black)]">{channel.name}</span>
                                    </div>
                                </div>

                                <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-medium bg-${channel.statusColor}-100 text-${channel.statusColor}-700 mb-3`}>
                                    <StatusIcon size={10} />
                                    {channel.statusText}
                                </div>

                                <div className="space-y-1.5">
                                    {channel.details.map((detail) => (
                                        <div key={detail.label} className="text-[10px]">
                                            <span className="text-[var(--fc-light-gray)]">{detail.label}: </span>
                                            <span className="text-[var(--fc-body-gray)] font-mono">{detail.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                <motion.div
                    className="mt-8 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-100 p-4"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 }}
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                            <Check size={18} className="text-emerald-600" />
                        </div>
                        <div>
                            <h4 className="text-sm font-semibold text-[var(--fc-black)]">Pairing System</h4>
                            <p className="text-xs text-[var(--fc-body-gray)]">
                                New users require approval via <code className="bg-emerald-100 px-1 rounded text-emerald-700">clawdbot pairing approve</code> command
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </NetworkLayer>
    );
}
