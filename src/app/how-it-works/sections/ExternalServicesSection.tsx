'use client';

import { motion } from 'motion/react';
import { Brain, Bot, Database, BookOpen, Rocket, ExternalLink } from 'lucide-react';
import { NetworkLayer } from '../components/NetworkLayer';

const services = [
    {
        id: 'anthropic',
        name: 'Anthropic',
        subtitle: 'Claude API',
        icon: Brain,
        color: '#be1e2c',
        description: 'AI model provider supporting Claude Sonnet and Opus models',
        features: ['Streaming responses', '1M context window', 'Tool calling'],
    },
    {
        id: 'azure',
        name: 'Azure',
        subtitle: 'Bot Service',
        icon: Bot,
        color: '#0078d4',
        description: 'Microsoft Teams Bot hosting service',
        features: ['Teams integration', 'Bot registration', 'Webhook endpoint'],
    },
    {
        id: 'supabase',
        name: 'Supabase',
        subtitle: 'Auth + DB',
        icon: Database,
        color: '#3ecf8e',
        description: 'Web Chat authentication and database service',
        features: ['Email/password auth', 'Session management', 'Row level security'],
    },
    {
        id: 'notion',
        name: 'Notion',
        subtitle: 'Activity Log',
        icon: BookOpen,
        color: '#000000',
        description: 'Activity logging and documentation management',
        features: ['Activity observer', 'Documentation', 'Knowledge base'],
    },
    {
        id: 'vercel',
        name: 'Vercel',
        subtitle: 'Deployment',
        icon: Rocket,
        color: '#000000',
        description: 'Web Chat frontend deployment platform',
        features: ['Edge functions', 'Auto deploy', 'Analytics'],
    },
];

export function ExternalServicesSection() {
    const sectionRange: [number, number] = [0.82, 0.92];
    const accentColor = '#6366f1';

    return (
        <NetworkLayer
            id="external-services"
            index={7}
            label="External Services"
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
                    The system integrates multiple external services to provide complete AI assistant functionality.
                </motion.p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {services.map((service, index) => {
                        const Icon = service.icon;
                        return (
                            <motion.div
                                key={service.id}
                                className="bg-white/90 backdrop-blur-sm rounded-xl border border-[var(--fc-border-gray)] p-4 shadow-sm hover:shadow-md transition-all group"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ y: -4 }}
                            >
                                <div
                                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                                    style={{ backgroundColor: `${service.color}15` }}
                                >
                                    <Icon size={20} style={{ color: service.color }} />
                                </div>

                                <h3 className="text-sm font-semibold text-[var(--fc-black)]">{service.name}</h3>
                                <p className="text-[10px] text-[var(--fc-light-gray)] mb-2">{service.subtitle}</p>

                                <p className="text-[10px] text-[var(--fc-body-gray)] mb-3 leading-relaxed">
                                    {service.description}
                                </p>

                                <div className="space-y-1">
                                    {service.features.map((feature) => (
                                        <div
                                            key={feature}
                                            className="text-[9px] text-[var(--fc-light-gray)] flex items-center gap-1"
                                        >
                                            <span className="w-1 h-1 rounded-full" style={{ backgroundColor: service.color }}></span>
                                            {feature}
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-3 pt-3 border-t border-[var(--fc-border-gray)] opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-[9px] text-[var(--fc-light-gray)] flex items-center gap-1">
                                        <ExternalLink size={10} />
                                        View documentation
                                    </span>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                <motion.div
                    className="mt-8 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 p-4"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 }}
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                            <ExternalLink size={18} className="text-indigo-600" />
                        </div>
                        <div>
                            <h4 className="text-sm font-semibold text-[var(--fc-black)]">Service Integration</h4>
                            <p className="text-xs text-[var(--fc-body-gray)]">
                                All external services are managed through the Gateway, ensuring secure and reliable connections
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </NetworkLayer>
    );
}
