'use client';

import { useState } from 'react';
import { FileText, BookOpen, Users, Fingerprint, Wrench } from 'lucide-react';
import { NetworkLayer } from '../components/NetworkLayer';
import { NeuralNode } from '../components/NeuralNode';
import { SynapseConnection } from '../components/SynapseConnection';

export function WorkspaceSection() {
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);
    const sectionRange: [number, number] = [0.55, 0.7];
    const accentColor = '#f97316';

    const nodes = [
        {
            id: 'agents',
            position: { x: 150, y: 150 },
            type: 'memory' as const,
            icon: BookOpen,
            label: 'AGENTS.md',
            description: 'Session Behavior Rules',
        },
        {
            id: 'soul',
            position: { x: 350, y: 100 },
            type: 'memory' as const,
            icon: FileText,
            label: 'SOUL.md',
            description: 'Agent Personality',
        },
        {
            id: 'user',
            position: { x: 550, y: 150 },
            type: 'memory' as const,
            icon: Users,
            label: 'USER.md',
            description: 'User Information',
        },
        {
            id: 'identity',
            position: { x: 150, y: 300 },
            type: 'memory' as const,
            icon: Fingerprint,
            label: 'IDENTITY.md',
            description: 'Agent Identity',
        },
        {
            id: 'tools',
            position: { x: 350, y: 350 },
            type: 'memory' as const,
            icon: Wrench,
            label: 'TOOLS.md',
            description: 'Tool Definitions',
        },
    ];

    const connections = [
        { from: 'agents', to: 'soul' },
        { from: 'soul', to: 'user' },
        { from: 'agents', to: 'identity' },
        { from: 'identity', to: 'tools' },
        { from: 'soul', to: 'tools' },
    ];

    return (
        <NetworkLayer
            id="workspace"
            index={3}
            label="Knowledge Base"
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
                                curvature={0.2}
                                isHighlighted={hoveredNode === conn.from || hoveredNode === conn.to}
                            />
                        );
                    })}
                </svg>

                {/* Nodes */}
                {nodes.map((node, index) => (
                    <NeuralNode
                        key={node.id}
                        id={node.id}
                        position={node.position}
                        layer={4}
                        type={node.type}
                        icon={node.icon}
                        label={node.label}
                        description={node.description}
                        sectionRange={sectionRange}
                        delay={index * 0.08}
                        accentColor={accentColor}
                        onHover={setHoveredNode}
                        isHighlighted={hoveredNode === node.id}
                    >
                        {node.id === 'agents' && (
                            <div className="space-y-2">
                                <p className="text-xs text-[var(--fc-body-gray)]">Defines session behavior</p>
                                <div className="text-[10px] text-[var(--fc-light-gray)]">
                                    workspace/AGENTS.md
                                </div>
                            </div>
                        )}
                        {node.id === 'soul' && (
                            <div className="space-y-2">
                                <p className="text-xs text-[var(--fc-body-gray)]">Personality & tone</p>
                                <div className="text-[10px] text-[var(--fc-light-gray)]">
                                    workspace/SOUL.md
                                </div>
                            </div>
                        )}
                        {node.id === 'user' && (
                            <div className="space-y-2">
                                <p className="text-xs text-[var(--fc-body-gray)]">User context template</p>
                                <div className="text-[10px] text-[var(--fc-light-gray)]">
                                    workspace/USER.md
                                </div>
                            </div>
                        )}
                        {node.id === 'identity' && (
                            <div className="space-y-2">
                                <p className="text-xs text-[var(--fc-body-gray)]">Agent self-concept</p>
                                <div className="text-[10px] text-[var(--fc-light-gray)]">
                                    workspace/IDENTITY.md
                                </div>
                            </div>
                        )}
                        {node.id === 'tools' && (
                            <div className="space-y-2">
                                <p className="text-xs text-[var(--fc-body-gray)]">Available capabilities</p>
                                <div className="text-[10px] text-[var(--fc-light-gray)]">
                                    workspace/TOOLS.md
                                </div>
                            </div>
                        )}
                    </NeuralNode>
                ))}

            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-[var(--fc-border-gray)] p-5 shadow-sm">
                    <h3 className="text-sm font-semibold text-[var(--fc-black)] mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                        workspace/ (Shared Config)
                    </h3>
                    <div className="font-mono text-[11px] space-y-1 text-[var(--fc-body-gray)]">
                        {[
                            { file: 'AGENTS.md', desc: 'Session behavior rules (memory, security, group chat)' },
                            { file: 'SOUL.md', desc: 'Agent personality (opinionated, autonomous)' },
                            { file: 'USER.md', desc: 'User info template (name, timezone, prefs)' },
                            { file: 'IDENTITY.md', desc: 'Agent identity (name, bio, emoji)' },
                            { file: 'BOOTSTRAP.md', desc: 'First-run guide (establish identity)' },
                            { file: 'HEARTBEAT.md', desc: 'Heartbeat task list (editable)' },
                            { file: 'TOOLS.md', desc: 'Local tool config (SSH, camera, TTS)' },
                        ].map((item) => (
                            <div key={item.file} className="flex items-start gap-2 py-1">
                                <span className="text-orange-600 flex-shrink-0">├──</span>
                                <div>
                                    <span className="text-[var(--fc-black)] font-medium">{item.file}</span>
                                    <span className="text-[var(--fc-light-gray)] ml-2">- {item.desc}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-[var(--fc-border-gray)] p-5 shadow-sm">
                    <h3 className="text-sm font-semibold text-[var(--fc-black)] mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        workspace/team/ (Team Config)
                    </h3>
                    <div className="bg-blue-50 rounded-lg p-4 mb-4">
                        <div className="font-mono text-[11px]">
                            <span className="text-blue-600">└── team/</span>
                            <div className="ml-4 mt-1">
                                <span className="text-blue-600">└──</span>
                                <span className="text-[var(--fc-black)] font-medium ml-1">AGENTS.md</span>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <h4 className="text-xs font-semibold text-[var(--fc-black)]">Team Assistant Role:</h4>
                        <div className="space-y-1">
                            {[
                                { label: 'Tech Support (AE/Premiere)', color: 'emerald' },
                                { label: 'Project Status Query', color: 'blue' },
                                { label: 'Format Conversion', color: 'purple' },
                            ].map((item) => (
                                <div key={item.label} className={`text-[10px] px-2 py-1 rounded bg-${item.color}-50 text-${item.color}-700`}>
                                    ✓ {item.label}
                                </div>
                            ))}
                        </div>
                        <div className="mt-3 pt-3 border-t border-[var(--fc-border-gray)]">
                            <p className="text-[10px] text-[var(--fc-light-gray)]">
                                Restricted: Creative/strategic decisions → Forward to Haiwei
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </NetworkLayer>
    );
}
