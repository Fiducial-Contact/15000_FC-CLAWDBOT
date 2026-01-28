'use client';

import { useTransform, MotionValue } from 'motion/react';
import { useScrollProgress } from './useScrollProgress';

interface NodeActivationReturn {
    activationProgress: MotionValue<number>;
    isActive: MotionValue<boolean>;
    scale: MotionValue<number>;
    opacity: MotionValue<number>;
    glowIntensity: MotionValue<number>;
}

export function useNodeActivation(
    sectionRange: [number, number],
    delay: number = 0
): NodeActivationReturn {
    const { smooth } = useScrollProgress();
    const [start, end] = sectionRange;

    const activationProgress = useTransform(
        smooth,
        [start + delay, end],
        [0, 1]
    );

    const isActive = useTransform(activationProgress, (v) => v > 0.1);

    const scale = useTransform(activationProgress, [0, 0.5], [0.7, 1]);

    const opacity = useTransform(activationProgress, [0, 0.3], [0.3, 1]);

    const glowIntensity = useTransform(activationProgress, [0, 1], [0, 1]);

    return {
        activationProgress,
        isActive,
        scale,
        opacity,
        glowIntensity,
    };
}
