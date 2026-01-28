'use client';

import { useId } from 'react';

interface SynapseConnectionProps {
    from: { x: number; y: number };
    to: { x: number; y: number };
    type?: 'data' | 'signal' | 'feedback';
    status?: 'hidden' | 'drawing' | 'active' | 'transmitting';
    accentColor?: string;
    // Legacy prop support
    color?: string;
    isHighlighted?: boolean;
    curvature?: number;
    delay?: number;
}

export function SynapseConnection({
    from,
    to,
    status = 'active',
    accentColor,
    color = '#be1e2c',
    isHighlighted = false,
    delay = 0,
}: SynapseConnectionProps) {
    // Resolve color
    const finalColor = accentColor || color;
    const isHidden = status === 'hidden';

    // Calculate control points for a smooth curve
    const midX = (from.x + to.x) / 2;
    const midY = (from.y + to.y) / 2;
    const dx = to.x - from.x;
    const dy = to.y - from.y;

    // Determine curve direction and curvature based on vertical distance
    const isDownward = to.y > from.y;
    const curveStrength = Math.min(Math.abs(dy) * 0.5, 15);

    // Create path d attribute matching the previous logic for consistency
    let d = '';
    if (isDownward) {
        d = `M ${from.x} ${from.y} C ${from.x} ${from.y + curveStrength}, ${to.x} ${to.y - curveStrength}, ${to.x} ${to.y}`;
    } else {
        d = `M ${from.x} ${from.y} C ${from.x} ${from.y - curveStrength}, ${to.x} ${to.y + curveStrength}, ${to.x} ${to.y}`;
    }

    // Unique ID for the path to be referenced by animateMotion
    // useId() ensures stable SSR/client hydration
    const id = useId();
    const pathId = `path-${from.x.toFixed(1)}-${from.y.toFixed(1)}-${to.x.toFixed(1)}-${to.y.toFixed(1)}-${id}`;

    if (isHidden) return null;

    // Generate particles
    // We create a few particles with different timings to create a continuous stream
    // Reduced count and size for a cleaner, more premium "sparse" feel
    const particleCount = isHighlighted ? 4 : 2;
    const particles = Array.from({ length: particleCount }).map((_, i) => ({
        id: i,
        // Stagger the start times so they are evenly distributed
        // negative begin time starts the animation immediately 'in progress'
        begin: `-${(i * (4 / particleCount)).toFixed(2)}s`, // 4s total duration
        // Drastically reduced size: 0.15 units is roughly 1.5px-2px on a 1080p screen (since viewBox is 0-100)
        size: isHighlighted ? 0.25 + (Math.random() * 0.1) : 0.15,
        opacity: isHighlighted ? 0.8 : 0.4
    }));

    return (
        <g
            className="synapse-connection transition-opacity duration-700"
            style={{
                opacity: 1,
                animation: `fadeIn 1s ease-out forwards ${delay}s`,
            }}
        >
            <style jsx global>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `}</style>
            {/* 
              Invisible Guide Path 
              We need this definition for the particles to follow.
              It renders nothing visible itself.
            */}
            <defs>
                <path id={pathId} d={d} />
            </defs>

            {/* Moving Particles */}
            {particles.map((p) => (
                <circle
                    key={p.id}
                    r={p.size}
                    fill={finalColor}
                    opacity={p.opacity}
                >
                    <animateMotion
                        dur={status === 'transmitting' ? "2s" : "4s"}
                        repeatCount="indefinite"
                        begin={p.begin}
                        // calcMode="linear" ensure constant speed along curve
                        calcMode="linear"
                        keyPoints="0;1"
                        keyTimes="0;1"
                    >
                        <mpath href={`#${pathId}`} />
                    </animateMotion>

                    {/* Fade in/out at ends for softness - optional, keeps it clean */}
                    <animate
                        attributeName="opacity"
                        values={`0;${p.opacity};${p.opacity};0`}
                        keyTimes="0;0.1;0.9;1"
                        dur={status === 'transmitting' ? "2s" : "4s"}
                        repeatCount="indefinite"
                        begin={p.begin}
                    />
                </circle>
            ))}
        </g>
    );
}
