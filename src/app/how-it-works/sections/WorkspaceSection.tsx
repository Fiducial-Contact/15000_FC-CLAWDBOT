'use client';

import { useState } from 'react';
import { FileText, BookOpen, Users, Brain, Heart, UserCog, Fingerprint, Wrench } from 'lucide-react';
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
            position: { x: 90, y: 90 },
            type: 'memory' as const,
            icon: BookOpen,
            label: 'AGENTS.md',
            description: 'Session Behavior Rules',
        },
        {
            id: 'soul',
            position: { x: 300, y: 60 },
            type: 'memory' as const,
            icon: FileText,
            label: 'SOUL.md',
            description: 'Agent Personality',
        },
        {
            id: 'user',
            position: { x: 510, y: 90 },
            type: 'memory' as const,
            icon: Users,
            label: 'USER.md',
            description: 'User Information',
        },
        {
            id: 'identity',
            position: { x: 90, y: 220 },
            type: 'memory' as const,
            icon: Fingerprint,
            label: 'IDENTITY.md',
            description: 'Agent Identity',
        },
        {
            id: 'heartbeat',
            position: { x: 300, y: 220 },
            type: 'memory' as const,
            icon: Heart,
            label: 'HEARTBEAT.md',
            description: 'Periodic Tasks',
        },
        {
            id: 'userprofiles',
            position: { x: 510, y: 220 },
            type: 'memory' as const,
            icon: UserCog,
            label: 'memory/users/',
            description: 'Per-User Learning',
        },
        {
            id: 'tools',
            position: { x: 90, y: 350 },
            type: 'memory' as const,
            icon: Wrench,
            label: 'TOOLS.md',
            description: 'Tool Definitions',
        },
        {
            id: 'selfreview',
            position: { x: 300, y: 350 },
            type: 'memory' as const,
            icon: Brain,
            label: 'self-review.md',
            description: 'Self-Reflection Log',
        },
    ];

    const connections = [
        { from: 'agents', to: 'soul' },
        { from: 'soul', to: 'user' },
        { from: 'agents', to: 'identity' },
        { from: 'identity', to: 'tools' },
        { from: 'soul', to: 'tools' },
        { from: 'agents', to: 'heartbeat' },
        { from: 'heartbeat', to: 'selfreview' },
        { from: 'heartbeat', to: 'userprofiles' },
        { from: 'user', to: 'userprofiles' },
    ];

    return (
        <NetworkLayer
            id="workspace"
            index={3}
            label="Knowledge Base"
            accentColor={accentColor}
            sectionRange={sectionRange}
        >
            <div className="relative h-[540px] mt-12">
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
                                <p className="text-xs text-[var(--fc-body-gray)]">Session behavior & learning rules</p>
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
                                <p className="text-xs text-[var(--fc-body-gray)]">Team context template</p>
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
                        {node.id === 'heartbeat' && (
                            <div className="space-y-2">
                                <p className="text-xs text-[var(--fc-body-gray)]">Every 3h (09:00-17:30)</p>
                                <div className="flex flex-wrap gap-1">
                                    {['Learn', 'Review', 'Maintain'].map((tag) => (
                                        <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                                            {tag}
                                        </span>
                                    ))}
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
                        {node.id === 'selfreview' && (
                            <div className="space-y-2">
                                <p className="text-xs text-[var(--fc-body-gray)]">Every 6h self-check</p>
                                <div className="text-[10px] text-[var(--fc-light-gray)]">
                                    TAG → MISS → FIX
                                </div>
                            </div>
                        )}
                        {node.id === 'userprofiles' && (
                            <div className="space-y-2">
                                <p className="text-xs text-[var(--fc-body-gray)]">Per-user preferences</p>
                                <div className="text-[10px] text-[var(--fc-light-gray)]">
                                    memory/users/webchat/*.json
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
                        Workspace Core Files
                    </h3>
                    <div className="font-mono text-[11px] space-y-1 text-[var(--fc-body-gray)]">
                        {[
                            { file: 'AGENTS.md', desc: 'Session rules + learning policy' },
                            { file: 'SOUL.md', desc: 'Personality & tone' },
                            { file: 'USER.md', desc: 'Team context template' },
                            { file: 'IDENTITY.md', desc: 'Agent identity' },
                            { file: 'TOOLS.md', desc: 'Tool definitions' },
                            { file: 'HEARTBEAT.md', desc: 'Learning & maintenance schedule' },
                            { file: 'memory/self-review.md', desc: 'Self-reflection log' },
                            { file: 'memory/users/', desc: 'Per-user memory store' },
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
                        <span className="w-2 h-2 rounded-full bg-violet-500"></span>
                        Learning & Per-User Memory
                    </h3>
                    <div className="bg-rose-50 rounded-lg p-3 mb-4">
                        <div className="text-xs font-medium text-[var(--fc-black)] mb-2">Every 3 hours (09:00-17:30)</div>
                        <div className="space-y-2 text-[10px]">
                            {[
                                { step: '1', label: 'Scan conversations', desc: 'Find learning triggers' },
                                { step: '2', label: 'Update profiles', desc: 'Store preferences & context' },
                                { step: '3', label: 'Self-review', desc: 'Every 6h: what to improve' },
                            ].map((item) => (
                                <div key={item.step} className="flex items-start gap-2">
                                    <span className="w-4 h-4 rounded-full bg-rose-200 text-rose-700 flex items-center justify-center flex-shrink-0 text-[9px] font-bold">
                                        {item.step}
                                    </span>
                                    <div>
                                        <span className="text-[var(--fc-black)] font-medium">{item.label}</span>
                                        <span className="text-[var(--fc-light-gray)] ml-1">- {item.desc}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="text-[10px] text-[var(--fc-body-gray)] mt-3">
                            <span className="font-medium">After-hours:</span>
                            <span className="ml-1">Daily 20:00 maintenance check</span>
                        </div>
                        <div className="text-[10px] text-[var(--fc-body-gray)] mt-3">
                            <span className="font-medium">Triggers:</span>
                            <span className="ml-1">&quot;记住这个&quot; · Repeated mentions · Corrections</span>
                        </div>
                    </div>

                    <div className="bg-white/80 rounded-lg border border-[var(--fc-border-gray)]/60 p-3 mb-4">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--fc-light-gray)] mb-2">
                            Learning Loop (simple)
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-[10px]">
                            {[
                                { label: 'WebChat', desc: 'message + feedback' },
                                { label: 'Signals', desc: 'metadata hints' },
                                { label: 'Nightly Learner', desc: 'LLM synthesis' },
                                { label: 'Supabase', desc: 'learning_events' },
                                { label: 'UI', desc: 'Agent Pulse / Insights' },
                            ].map((node, idx) => (
                                <div key={node.label} className="flex items-center gap-2">
                                    <div className="flex-1 rounded-lg bg-[var(--fc-subtle-gray)]/60 border border-[var(--fc-border-gray)]/50 px-2 py-2">
                                        <div className="text-[var(--fc-black)] font-semibold">{node.label}</div>
                                        <div className="text-[9px] text-[var(--fc-body-gray)]">{node.desc}</div>
                                    </div>
                                    {idx < 4 && (
                                        <span className="hidden sm:inline text-[var(--fc-light-gray)]">→</span>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="mt-3 text-[10px] text-[var(--fc-body-gray)] leading-relaxed">
                            Signals are <span className="font-medium">hints</span>, not hard rules. The learner uses an LLM to generalize from evidence,
                            applies the allowlist, and only writes back high-confidence learnings (so it stays flexible, not “hardcoded”).
                        </div>
                    </div>

                    <div className="font-mono text-[11px] space-y-1 text-[var(--fc-body-gray)] mb-3">
                        <div className="text-violet-600">memory/users/</div>
                        {[
                            { path: 'webchat/<userId>.profile.json', desc: 'Structured preferences' },
                            { path: 'webchat/<userId>.md', desc: 'Free-form notes' },
                            { path: 'webchat/<userId>.tasks.json', desc: 'Reminders' },
                        ].map((item) => (
                            <div key={item.path} className="flex items-start gap-2 py-1 ml-2">
                                <span className="text-violet-400 flex-shrink-0">├──</span>
                                <div>
                                    <span className="text-[var(--fc-black)]">{item.path}</span>
                                    <span className="text-[var(--fc-light-gray)] ml-2">- {item.desc}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="bg-violet-50 rounded-lg p-3">
                        <div className="text-[10px] font-medium text-[var(--fc-black)] mb-2">Profile Schema</div>
                        <div className="font-mono text-[9px] text-violet-700 space-y-0.5">
                            <div>{`{ name, role, software[] }`}</div>
                            <div>{`{ preferences: { language, responseStyle } }`}</div>
                            <div>{`{ learnedContext: [...] }`}</div>
                        </div>
                    </div>
                </div>
            </div>
        </NetworkLayer>
    );
}
