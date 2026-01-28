'use client';

import { Users, Cpu, Shield, Bot, Activity, Brain, Terminal, MessagesSquare, Cloud } from 'lucide-react';
import { SiWhatsapp, SiTelegram, SiTailscale, SiClaude, SiSupabase, SiNotion, SiVercel, SiNextdotjs } from 'react-icons/si';
import { GraphNode } from './GraphNode';
import { SynapseConnection } from './SynapseConnection';

// Node Definitions - positions in percentage (0-100)
const nodeData = [
    // --- Layer 1: Users (y: 5) ---
    {
        id: 'user_team',
        x: 50,
        y: 5,
        type: 'user',
        icon: Users,
        label: 'Fiducial Team',
        description: 'Production & Strategy',
        accentColor: '#1e3a8a',
        details: (
            <div className="space-y-2">
                <p>Strategic decision makers and production team.</p>
                <ul className="list-disc list-inside space-y-1 opacity-80">
                    <li>Production Support (AE/Pr)</li>
                    <li>Status Queries</li>
                    <li>Format Conversion</li>
                </ul>
            </div>
        )
    },

    // --- Layer 2: Channels (y: 22) ---
    {
        id: 'ch_whatsapp',
        x: 12,
        y: 22,
        type: 'channel',
        icon: SiWhatsapp,
        label: 'WhatsApp',
        description: 'Direct & Media',
        accentColor: '#25D366',
        details: <p>Connected via Twilio/Meta API. Supports rich media and voice notes, and direct personal communication.</p>
    },
    {
        id: 'ch_teams',
        x: 37,
        y: 22, // Aligned
        type: 'channel',
        icon: MessagesSquare,
        label: 'MS Teams',
        description: 'Enterprise Bot',
        accentColor: '#6264A7',
        details: <p>Enterprise bot integration via Azure Bot Service. Uses Tailscale Funnel for secure tunneling.</p>
    },
    {
        id: 'ch_web',
        x: 63,
        y: 22,
        type: 'channel',
        icon: SiNextdotjs,
        label: 'Web Chat',
        description: 'Next.js 16 Interface',
        accentColor: '#be1e2c',
        details: <p>Full-featured React interface with Artifacts, Thinking Process, and Tool integration.</p>
    },
    {
        id: 'ch_telegram',
        x: 88,
        y: 22,
        type: 'channel',
        icon: SiTelegram,
        label: 'Telegram',
        description: 'Group Actions',
        accentColor: '#0088cc',
        details: <p>Optimized for group interactions, quick commands, and broadcast notifications.</p>
    },

    // --- Layer 3: Gateway Cluster (y: 45) ---
    {
        id: 'net_tailscale',
        x: 20,
        y: 45,
        type: 'gateway',
        icon: SiTailscale,
        label: 'Tailscale',
        description: 'Secure Mesh',
        accentColor: '#1f2937',
        details: <p>Secure funneling for local port exposure and private network access.</p>
    },
    {
        id: 'mod_session',
        x: 40,
        y: 45,
        type: 'gateway',
        icon: Activity,
        label: 'Session Mgr',
        description: 'Context Isolation',
        accentColor: '#06b6d4',
        details: <p>Manages 39 active sessions. Ensures total isolation between channels and peers.</p>
    },
    {
        id: 'gateway',
        x: 60,
        y: 45,
        type: 'gateway',
        icon: Cpu,
        label: 'Gateway Engine',
        description: ':18789 Orchestrator',
        accentColor: '#7c3aed',
        details: <p>Central message routing, session management, and unified tool dispatching core.</p>
    },
    {
        id: 'mod_security',
        x: 80,
        y: 45,
        type: 'gateway',
        icon: Shield,
        label: 'Security',
        description: 'Sandbox & Auth',
        accentColor: '#ef4444',
        details: <p>Manages Allowlist, Token Auth, and Sandbox execution environments.</p>
    },

    // --- Layer 4: Agents (y: 64) ---
    {
        id: 'ag_work',
        x: 32,
        y: 64,
        type: 'gateway',
        icon: Bot,
        label: 'Agent: Work',
        description: 'Team Service',
        accentColor: '#f59e0b',
        details: <p>Model: claude-3-5-sonnet. Specialized for team queries, technical support, and web chat interactions. 1000K Context.</p>
    },
    {
        id: 'ag_opus',
        x: 50,
        y: 64,
        type: 'gateway',
        icon: Brain,
        label: 'Agent: Opus',
        description: 'Deep Reasoning',
        accentColor: '#ec4899',
        details: <p>Model: claude-3-opus. Handles complex reasoning tasks, creative writing, and sensitive personal assistance.</p>
    },
    {
        id: 'ag_main',
        x: 68,
        y: 64,
        type: 'gateway',
        icon: Terminal,
        label: 'Agent: Main',
        description: 'System Automation',
        accentColor: '#10b981',
        details: <p>Handles cron jobs, system maintenance, morning reports, and automated research tasks.</p>
    },

    // --- Layer 5: Claude API (y: 78) ---
    {
        id: 'ai_claude',
        x: 50,
        y: 78,
        type: 'core',
        icon: SiClaude,
        label: 'Claude API',
        description: 'Anthropic',
        accentColor: '#d97706',
        details: <p>The brain behind the agents. Provides LLM capabilities for all nodes.</p>
    },

    // --- Layer 6: Infrastructure Services (y: 92) ---
    {
        id: 'svc_supabase',
        x: 15,
        y: 92,
        type: 'service',
        icon: SiSupabase,
        label: 'Supabase',
        description: 'Vector DB + Auth',
        accentColor: '#3ecf8e',
        details: <p>Stores long-term vector memory, user authentication data, and structured records.</p>
    },
    {
        id: 'svc_azure',
        x: 38,
        y: 92,
        type: 'service',
        icon: Cloud,
        label: 'Azure Bot',
        description: 'Teams Connector',
        accentColor: '#0078d4',
        details: <p>Enterprise messaging bridge for Microsoft Teams integration.</p>
    },
    {
        id: 'svc_notion',
        x: 62,
        y: 92,
        type: 'service',
        icon: SiNotion,
        label: 'Notion',
        description: 'Activity Logs',
        accentColor: '#000000',
        details: <p>Stores readable activity logs and structural data visible to the user.</p>
    },
    {
        id: 'svc_vercel',
        x: 85,
        y: 92,
        type: 'service',
        icon: SiVercel,
        label: 'Vercel',
        description: 'Deployment',
        accentColor: '#000000',
        details: <p>Global edge network hosting the Web Chat frontend and API.</p>
    }
] as const;

// Connections definition
const connections = [
    // User -> Channels
    { from: 'user_team', to: 'ch_whatsapp' },
    { from: 'user_team', to: 'ch_teams' },
    { from: 'user_team', to: 'ch_web' },
    { from: 'user_team', to: 'ch_telegram' },

    // Infrastructure -> Channels
    { from: 'net_tailscale', to: 'ch_teams' },

    // Channels -> Gateway
    { from: 'ch_whatsapp', to: 'gateway' },
    { from: 'ch_teams', to: 'gateway' },
    { from: 'ch_web', to: 'gateway' },
    { from: 'ch_telegram', to: 'gateway' },

    // Gateway Internals - Satellites
    { from: 'gateway', to: 'ag_work' },
    { from: 'gateway', to: 'ag_opus' },
    { from: 'gateway', to: 'ag_main' },
    { from: 'gateway', to: 'mod_security' },
    { from: 'gateway', to: 'mod_session' },

    // Specific Agent Routes (Logical)
    { from: 'ag_work', to: 'ch_web', opacity: 0.1 },
    { from: 'ag_work', to: 'ch_teams', opacity: 0.1 },
    { from: 'ag_opus', to: 'ch_whatsapp', opacity: 0.1 },


    // Agents -> AI Core
    { from: 'ag_work', to: 'ai_claude' },
    { from: 'ag_opus', to: 'ai_claude' },
    { from: 'ag_main', to: 'ai_claude' },

    // AI Core/Gateway -> Services
    { from: 'ai_claude', to: 'svc_supabase' },
    { from: 'ai_claude', to: 'svc_notion' },

    // Service Integrations
    { from: 'svc_azure', to: 'ch_teams' },
    { from: 'svc_vercel', to: 'ch_web' },
];

export function ArchitectureGraph() {
    return (
        <div className="relative w-full h-full bg-[var(--fc-off-white)] p-8 overflow-hidden select-none">
            <div
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                    backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                }}
            />

            <svg
                className="absolute inset-0 w-full h-full pointer-events-none z-0"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
            >
                {connections.map((conn, i) => {
                    const startNode = nodeData.find(n => n.id === conn.from)!;
                    const endNode = nodeData.find(n => n.id === conn.to)!;

                    const opacity = (conn as { opacity?: number }).opacity || 1;

                    // Delay logic: Connection appears after both nodes have appeared
                    // Max Y of the two nodes determines when the connection should start
                    const startDelay = startNode.y * 0.015;
                    const endDelay = endNode.y * 0.015;
                    const connectionDelay = Math.max(startDelay, endDelay) + 0.5; // +0.5s buffer

                    return (
                        <g key={`${conn.from}-${conn.to}`} style={{ opacity }}>
                            <SynapseConnection
                                from={{ x: startNode.x, y: startNode.y }}
                                to={{ x: endNode.x, y: endNode.y }}
                                accentColor={startNode.accentColor}
                                status="active"
                                delay={connectionDelay}
                            />
                        </g>
                    );
                })}
            </svg>

            {/* Nodes Layer */}
            {nodeData.map((node) => {
                // Cascading delay based on Y position (top to bottom)
                // 0.015s per % of height = 1.5s total cascade for full height
                const delay = node.y * 0.015;

                return (
                    <GraphNode
                        key={node.id}
                        {...node}
                        delay={delay}
                    >
                        {node.details}
                    </GraphNode>
                );
            })}

            {/* Premium Legend HUD - Compact & Top Right */}
            <div className="hidden lg:block absolute top-4 right-4 z-10">
                <div className="bg-white/60 backdrop-blur-xl border border-white/40 shadow-xl rounded-xl p-3 min-w-[200px] transition-all hover:bg-white/70 hover:shadow-2xl hover:scale-[1.02] duration-300">
                    <div className="flex items-center justify-between mb-3 border-b border-black/5 pb-2">
                        <div className="flex flex-col">
                            <h2 className="text-sm font-bold text-[var(--fc-black)] tracking-tight leading-none">System Architecture</h2>
                            <span className="text-[9px] uppercase tracking-widest text-[var(--fc-body-gray)] opacity-60 font-semibold mt-0.5">Live Monitor</span>
                        </div>
                        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-green-500/10 border border-green-500/20">
                            <span className="w-1 h-1 rounded-full bg-green-500 animate-pulse"></span>
                            <span className="text-[9px] font-bold text-green-700 tracking-wide">ONLINE</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="group flex items-center justify-between text-[11px] text-[var(--fc-body-gray)] hover:text-[var(--fc-black)] transition-colors cursor-default">
                            <span className="font-medium">User Layer</span>
                            <div className="flex items-center gap-1.5">
                                <span className="text-[9px] opacity-40 font-mono group-hover:opacity-100 transition-opacity">01</span>
                                <div className="w-2 h-2 rounded-full bg-[#1e3a8a] shadow-[0_0_6px_rgba(30,58,138,0.4)]"></div>
                            </div>
                        </div>
                        <div className="group flex items-center justify-between text-[11px] text-[var(--fc-body-gray)] hover:text-[var(--fc-black)] transition-colors cursor-default">
                            <span className="font-medium">Channels</span>
                            <div className="flex items-center gap-1.5">
                                <span className="text-[9px] opacity-40 font-mono group-hover:opacity-100 transition-opacity">02</span>
                                <div className="w-2 h-2 rounded-full bg-[#25D366] shadow-[0_0_6px_rgba(37,211,102,0.4)]"></div>
                            </div>
                        </div>
                        <div className="group flex items-center justify-between text-[11px] text-[var(--fc-body-gray)] hover:text-[var(--fc-black)] transition-colors cursor-default">
                            <span className="font-medium">Gateway & Agents</span>
                            <div className="flex items-center gap-1.5">
                                <span className="text-[9px] opacity-40 font-mono group-hover:opacity-100 transition-opacity">03</span>
                                <div className="w-2 h-2 rounded-full bg-[#7c3aed] shadow-[0_0_6px_rgba(124,58,237,0.4)]"></div>
                            </div>
                        </div>
                        <div className="group flex items-center justify-between text-[11px] text-[var(--fc-body-gray)] hover:text-[var(--fc-black)] transition-colors cursor-default">
                            <span className="font-medium">Infrastructure</span>
                            <div className="flex items-center gap-1.5">
                                <span className="text-[9px] opacity-40 font-mono group-hover:opacity-100 transition-opacity">04</span>
                                <div className="w-2 h-2 rounded-full bg-[#3ecf8e] shadow-[0_0_6px_rgba(62,207,142,0.4)]"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
