'use client';

import { useState } from 'react';
import { Users, Globe, MessageSquare, Shield } from 'lucide-react';
import { NetworkLayer } from '../components/NetworkLayer';
import { NeuralNode } from '../components/NeuralNode';
import { SynapseConnection } from '../components/SynapseConnection';

export function UserLayerSection() {
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);
    const sectionRange: [number, number] = [0.1, 0.25];
    const accentColor = '#3b82f6';

    const nodes = [
        {
            id: 'user',
            position: { x: 200, y: 200 },
            type: 'input' as const,
            icon: Users,
            label: 'Fiducial Team',
            description: 'Production Team Members',
        },
        {
            id: 'webchat',
            position: { x: 500, y: 150 },
            type: 'input' as const,
            icon: Globe,
            label: 'Web Chat',
            description: 'Primary Interface',
        },
        {
            id: 'teams',
            position: { x: 500, y: 250 },
            type: 'input' as const,
            icon: MessageSquare,
            label: 'Microsoft Teams',
            description: 'Teams Integration',
        },
    ];

    const connections = [
        { from: 'user', to: 'webchat' },
        { from: 'user', to: 'teams' },
    ];

    return (
        <NetworkLayer
            id="user"
            index={0}
            label="User Interface"
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
                        layer={1}
                        type={node.type}
                        icon={node.icon}
                        label={node.label}
                        description={node.description}
                        sectionRange={sectionRange}
                        delay={node.id === 'user' ? 0 : 0.1}
                        accentColor={accentColor}
                        onHover={setHoveredNode}
                        isHighlighted={hoveredNode === node.id}
                    >
                        {node.id === 'user' && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-xs text-[var(--fc-body-gray)]">
                                    <Shield size={12} className="text-emerald-500" />
                                    <span>Authenticated via Supabase</span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {['After Effects', 'Premiere Pro', 'Project Status'].map((tag) => (
                                        <span
                                            key={tag}
                                            className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                        {node.id === 'webchat' && (
                            <div className="space-y-2">
                                <p className="text-xs text-[var(--fc-body-gray)]">WebSocket connection</p>
                                <div className="flex flex-wrap gap-1">
                                    {['localhost:3000', 'Real-time', 'Secure'].map((tag) => (
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
                        {node.id === 'teams' && (
                            <div className="space-y-2">
                                <p className="text-xs text-[var(--fc-body-gray)]">Tailscale Funnel :3978</p>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                                        Pending Admin
                                    </span>
                                </div>
                            </div>
                        )}
                    </NeuralNode>
                ))}

                {/* Team Capabilities Panel */}
                <div className="absolute right-0 top-0 max-w-sm">
                    <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-[var(--fc-border-gray)] p-5 shadow-sm">
                        <h3 className="text-sm font-semibold text-[var(--fc-black)] mb-3 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                            Fiducial Team Capabilities
                        </h3>
                        <div className="space-y-2">
                            {[
                                { label: 'After Effects Help', icon: '🎬' },
                                { label: 'Premiere Pro Tips', icon: '🎥' },
                                { label: 'Project Status Query', icon: '📊' },
                                { label: 'Format Conversion', icon: '🔢' },
                                { label: 'Weather / Timezone', icon: '🌍' },
                            ].map((item) => (
                                <div
                                    key={item.label}
                                    className="flex items-center gap-2 text-xs text-[var(--fc-body-gray)] bg-slate-50 rounded-lg px-3 py-2"
                                >
                                    <span>{item.icon}</span>
                                    <span>{item.label}</span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 pt-3 border-t border-[var(--fc-border-gray)]">
                            <p className="text-[10px] text-[var(--fc-light-gray)]">
                                Production team members receive technical support assistance
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </NetworkLayer>
    );
}
