'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Brain, Database, HardDrive, Sparkles, Zap } from 'lucide-react';
import { NetworkLayer } from '../components/NetworkLayer';
import { NeuralNode } from '../components/NeuralNode';
import { SynapseConnection } from '../components/SynapseConnection';

export function AICoreSection() {
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);
    const sectionRange: [number, number] = [0.4, 0.55];
    const accentColor = '#be1e2c';

    const nodes = [
        {
            id: 'agent',
            position: { x: 400, y: 200 },
            type: 'processing' as const,
            icon: Brain,
            label: 'Work Agent',
            description: 'Claude Sonnet 4.5',
        },
        {
            id: 'sessions',
            position: { x: 200, y: 120 },
            type: 'memory' as const,
            icon: Database,
            label: 'Sessions',
            description: '39 Active Conversations',
        },
        {
            id: 'memory',
            position: { x: 200, y: 280 },
            type: 'memory' as const,
            icon: HardDrive,
            label: 'Memory',
            description: 'Vector DB + FTS',
        },
        {
            id: 'api',
            position: { x: 600, y: 200 },
            type: 'output' as const,
            icon: Sparkles,
            label: 'Claude API',
            description: 'Anthropic',
        },
        {
            id: 'tools',
            position: { x: 400, y: 350 },
            type: 'processing' as const,
            icon: Zap,
            label: 'Tool Executor',
            description: 'Sandboxed Execution',
        },
    ];

    const connections = [
        { from: 'sessions', to: 'agent' },
        { from: 'memory', to: 'agent' },
        { from: 'agent', to: 'api' },
        { from: 'agent', to: 'tools' },
    ];

    return (
        <NetworkLayer
            id="ai-core"
            index={2}
            label="AI Core"
            accentColor={accentColor}
            sectionRange={sectionRange}
        >
            <div className="relative h-[550px] mt-12">
                {/* Neural pulse background effect */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    {[...Array(4)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute rounded-full border border-[var(--fc-red)]"
                            style={{
                                width: 200 + i * 100,
                                height: 200 + i * 100,
                            }}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{
                                opacity: [0, 0.1, 0],
                                scale: [0.8, 1.2, 1.4],
                            }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                delay: i * 0.75,
                                ease: 'easeOut',
                            }}
                        />
                    ))}
                </div>

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
                                status="transmitting"
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
                        layer={3}
                        type={node.type}
                        icon={node.icon}
                        label={node.label}
                        description={node.description}
                        sectionRange={sectionRange}
                        delay={node.id === 'agent' ? 0 : 0.1}
                        accentColor={accentColor}
                        onHover={setHoveredNode}
                        isHighlighted={hoveredNode === node.id}
                    >
                        {node.id === 'agent' && (
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="bg-red-50 rounded-lg p-2">
                                        <p className="text-[var(--fc-light-gray)]">Model</p>
                                        <p className="font-semibold text-[var(--fc-black)]">claude-sonnet-4-5</p>
                                    </div>
                                    <div className="bg-red-50 rounded-lg p-2">
                                        <p className="text-[var(--fc-light-gray)]">Context</p>
                                        <p className="font-semibold text-[var(--fc-black)]">1,000K tokens</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-xs text-emerald-600 font-medium">Active</span>
                                </div>
                            </div>
                        )}
                        {node.id === 'sessions' && (
                            <div className="space-y-2">
                                <p className="text-xs text-[var(--fc-body-gray)]">per-channel-peer scope</p>
                                <div className="flex flex-wrap gap-1">
                                    {['webchat:dm:*', 'teams:dm:*'].map((tag) => (
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
                        {node.id === 'memory' && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                    <span className="text-xs text-emerald-600">Vector DB Ready</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                    <span className="text-xs text-emerald-600">FTS Ready</span>
                                </div>
                            </div>
                        )}
                        {node.id === 'api' && (
                            <div className="space-y-2">
                                <p className="text-xs text-[var(--fc-body-gray)]">Streaming responses</p>
                                <div className="flex flex-wrap gap-1">
                                    {['Real-time', 'Token-by-token'].map((tag) => (
                                        <span
                                            key={tag}
                                            className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                        {node.id === 'tools' && (
                            <div className="space-y-2">
                                <div className="flex flex-wrap gap-1">
                                    {['Sandboxed', 'Read-only'].map((tag) => (
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
                    </NeuralNode>
                ))}

                {/* Info panel */}
                <div className="absolute right-0 top-0 max-w-xs">
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-[var(--fc-border-gray)] p-4 shadow-sm">
                        <h3 className="text-sm font-semibold text-[var(--fc-black)] mb-2">Neural Processing</h3>
                        <p className="text-xs text-[var(--fc-body-gray)] leading-relaxed">
                            The AI Core processes requests using Claude Sonnet with 1M token context. Sessions
                            maintain conversation history while the memory system enables context-aware responses
                            through vector search and full-text search.
                        </p>
                    </div>
                </div>
            </div>
        </NetworkLayer>
    );
}


