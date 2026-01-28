'use client';

import { motion } from 'motion/react';
import { useState, useEffect } from 'react';

interface Particle {
    id: number;
    x: number;
    y: number;
    size: number;
    duration: number;
    delay: number;
    opacity: number;
    xDrift: number;
}

interface ParticleFieldProps {
    count?: number;
    color?: string;
    className?: string;
}

function createParticles(count: number): Particle[] {
    return Array.from({ length: count }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3 + 1,
        duration: Math.random() * 20 + 15,
        delay: Math.random() * 5,
        opacity: Math.random() * 0.4 + 0.1,
        xDrift: Math.random() * 20 - 10,
    }));
}

export function ParticleField({
    count = 30,
    color = '#be1e2c',
    className = '',
}: ParticleFieldProps) {
    const [particles, setParticles] = useState<Particle[]>([]);

    useEffect(() => {
        setParticles(createParticles(count));
    }, [count]);

    if (particles.length === 0) {
        return <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`} />;
    }

    return (
        <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
            {particles.map((particle) => (
                <motion.div
                    key={particle.id}
                    className="absolute rounded-full"
                    initial={{ opacity: 0 }}
                    animate={{
                        opacity: [particle.opacity, particle.opacity * 1.5, particle.opacity],
                        y: [0, -30, 0],
                        x: [0, particle.xDrift, 0],
                    }}
                    style={{
                        left: `${particle.x}%`,
                        top: `${particle.y}%`,
                        width: particle.size,
                        height: particle.size,
                        backgroundColor: color,
                    }}
                    transition={{
                        duration: particle.duration,
                        delay: particle.delay,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                />
            ))}
        </div>
    );
}
