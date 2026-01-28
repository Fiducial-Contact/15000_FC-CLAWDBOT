'use client';

import { useScroll, useSpring, MotionValue } from 'motion/react';

interface ScrollProgressReturn {
    raw: MotionValue<number>;
    smooth: MotionValue<number>;
}

export function useScrollProgress(): ScrollProgressReturn {
    const { scrollYProgress } = useScroll();

    const smoothProgress = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001,
    });

    return {
        raw: scrollYProgress,
        smooth: smoothProgress,
    };
}
