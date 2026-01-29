'use client';

import { useState } from 'react';
import { Cpu, Cloud, Lock, Server } from 'lucide-react';
import { NetworkLayer } from '../components/NetworkLayer';
import { NeuralNode } from '../components/NeuralNode';
import { SynapseConnection } from '../components/SynapseConnection';

export function GatewayLayerSection() {
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);
    const sectionRange: [number, number] = [0.25, 0.4];
    const accentColor = '#8b5cf6';

    const nodes = [
        {
            id: 'gateway',
            position: { x: 400, y: 200 },
            type: 'gateway' as const,
            icon: Cpu,
            label: 'Clawdbot Gateway',
            description: 'Central Processing Hub',
        },
        {
            id: 'tailscale',
            position: { x: 650, y: 120 },
            type: 'processing' as const,
            icon: Cloud,
            label: 'Tailscale Funnel',
            description: 'Secure Tunnel',
        },
        {
            id: 'security',
            position: { x: 150, y: 120 },
            type: 'processing' as const,
            icon: Lock,
            label: 'Security Layer',
            description: 'UFW + fail2ban',
        },
        {
            id: 'vps',
            position: { x: 150, y: 280 },
            type: 'processing' as const,
            icon: Server,
            label: 'Hetzner VPS',
            description: '46.224.225.164',
        },
    ];

    const connections = [
        { from: 'security', to: 'gateway' },
        { from: 'vps', to: 'gateway' },
        { from: 'tailscale', to: 'gateway' },
    ];

    return (
        <NetworkLayer
            id="gateway"
            index={1}
            label="Gateway Hub"
            accentColor={accentColor}
            sectionRange={sectionRange}
        >
            <div className="relative h-[500px] mt-12">
                {/* Connection lines */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    {connections.map((conn) => {
                        const fromNode = nodes.find((n) => n.id === conn.from);
                        const toNode = nodes.find((n) => n.id === conn.to);
                        if (!fromNode || !toNode) return null;

                        return (
                            <SynapseConnection
                                key={`${conn.from}-${conn.to}`}
                                from={fromNode.position}
                                to={toNode.position}
                                status="active"
                                color={accentColor}
                                isHighlighted={hoveredNode === conn.from || hoveredNode === conn.to}
                            />
                        );
                    })}
                </svg>

                {/* Nodes */}
                {nodes.map((node) => (
                    <NeuralNode
                        key={node.id}
                        id={node.id}
                        position={node.position}
                        layer={2}
                        type={node.type}
                        icon={node.icon}
                        label={node.label}
                        description={node.description}
                        sectionRange={sectionRange}
                        delay={node.id === 'gateway' ? 0 : 0.15}
                        accentColor={accentColor}
                        onHover={setHoveredNode}
                        isHighlighted={hoveredNode === node.id}
                    >
                        {node.id === 'gateway' && (
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="bg-purple-50 rounded-lg p-2">
                                        <p className="text-[var(--fc-light-gray)]">Port</p>
                                        <p className="font-semibold text-[var(--fc-black)]">:18789</p>
                                    </div>
                                    <div className="bg-purple-50 rounded-lg p-2">
                                        <p className="text-[var(--fc-light-gray)]">Latency</p>
                                        <p className="font-semibold text-[var(--fc-black)]">30ms</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-xs text-emerald-600 font-medium">Running</span>
                                </div>
                            </div>
                        )}
                        {node.id === 'tailscale' && (
                            <div className="space-y-2">
                                <p className="text-xs text-[var(--fc-body-gray)]">clawdbot.tail297e45.ts.net</p>
                                <div className="flex flex-wrap gap-1">
                                    {['HTTPS', ':3978', 'Teams'].map((tag) => (
                                        <span
                                            key={tag}
                                            className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-700"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                        {node.id === 'security' && (
                            <div className="space-y-2">
                                <div className="flex flex-wrap gap-1">
                                    {['SSH:2222', 'UFW', 'fail2ban'].map((tag) => (
                                        <span
                                            key={tag}
                                            className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                        {node.id === 'vps' && (
                            <div className="space-y-2">
                                <p className="text-xs text-[var(--fc-body-gray)]">Germany Datacenter</p>
                                <div className="flex flex-wrap gap-1">
                                    {['Ubuntu', 'Docker', 'Auto-restart'].map((tag) => (
                                        <span
                                            key={tag}
                                            className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </NeuralNode>
                ))}

                {/* Central hub glow effect */}
                <div
                    className="absolute w-40 h-40 rounded-full pointer-events-none"
                    style={{
                        left: 400 - 80,
                        top: 200 - 80,
                        background: `radial-gradient(circle, ${accentColor}20 0%, transparent 70%)`,
                        filter: 'blur(20px)',
                    }}
                />

            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-[var(--fc-border-gray)] p-5 shadow-sm">
                    <h3 className="text-sm font-semibold text-[var(--fc-black)] mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                        Agents (3)
                    </h3>
                    <div className="space-y-3">
                        {[
                            { name: 'work', model: 'claude-sonnet-4-5', context: '1,000K', purpose: 'Web Chat Team Service', heartbeat: '3h', activeHours: '09:00-17:30' },
                            { name: 'opus', model: 'claude-opus-4-5', context: '200K', purpose: 'WhatsApp Personal', heartbeat: '30m', activeHours: '08:00-23:00' },
                            { name: 'main', model: 'claude-opus-4-5', context: '200K', purpose: 'Cron / Automation', heartbeat: 'disabled', activeHours: null },
                        ].map((agent) => (
                            <div key={agent.name} className="bg-slate-50 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-mono text-sm font-semibold text-[var(--fc-black)]">{agent.name}</span>
                                    <div className="flex items-center gap-2">
                                        {agent.activeHours && (
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                                                {agent.activeHours}
                                            </span>
                                        )}
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${agent.heartbeat === 'disabled' ? 'bg-slate-200 text-slate-600' : 'bg-emerald-100 text-emerald-700'}`}>
                                            ♥ {agent.heartbeat}
                                        </span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-[10px]">
                                    <div>
                                        <span className="text-[var(--fc-light-gray)]">Model: </span>
                                        <span className="text-[var(--fc-body-gray)]">{agent.model}</span>
                                    </div>
                                    <div>
                                        <span className="text-[var(--fc-light-gray)]">Context: </span>
                                        <span className="text-[var(--fc-body-gray)]">{agent.context}</span>
                                    </div>
                                </div>
                                <div className="text-[10px] mt-1">
                                    <span className="text-[var(--fc-light-gray)]">Purpose: </span>
                                    <span className="text-[var(--fc-body-gray)]">{agent.purpose}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-[var(--fc-border-gray)] p-5 shadow-sm">
                    <h3 className="text-sm font-semibold text-[var(--fc-black)] mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        Sessions & Memory
                    </h3>
                    <div className="space-y-4">
                        <div className="bg-emerald-50 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-sm font-medium text-[var(--fc-black)]">Active Sessions</span>
                                <span className="text-2xl font-bold text-emerald-600">39</span>
                            </div>
                            <div className="space-y-1 text-[10px]">
                                <div className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                    <span className="text-[var(--fc-body-gray)]">webchat:dm:* (Web Chat)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                    <span className="text-[var(--fc-body-gray)]">whatsapp:dm:* (WhatsApp)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                                    <span className="text-[var(--fc-body-gray)]">cron:* (Scheduled Tasks)</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            <div className="bg-slate-50 rounded-lg p-3 text-center">
                                <div className="text-emerald-600 font-semibold text-sm">✓</div>
                                <div className="text-[10px] text-[var(--fc-body-gray)]">Vector DB</div>
                            </div>
                            <div className="bg-slate-50 rounded-lg p-3 text-center">
                                <div className="text-emerald-600 font-semibold text-sm">✓</div>
                                <div className="text-[10px] text-[var(--fc-body-gray)]">FTS</div>
                            </div>
                            <div className="bg-slate-50 rounded-lg p-3 text-center">
                                <div className="text-[10px] text-[var(--fc-body-gray)] leading-tight">dmScope<br/><span className="font-mono text-purple-600">per-channel-peer</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </NetworkLayer>
    );
}
