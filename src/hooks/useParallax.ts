'use client';

import { useScroll, useTransform, MotionValue } from 'motion/react';

export function useParallax(speed: number = 1): MotionValue<number> {
    const { scrollY } = useScroll();
    return useTransform(scrollY, (value) => value * speed);
}
