import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { z } from 'zod';

export const textShowcaseSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  backgroundColor: z.string().default('#111111'),
  textColor: z.string().default('#ffffff'),
  accentColor: z.string().default('#c41e3a'),
});

type Props = z.infer<typeof textShowcaseSchema>;

export const TextShowcase: React.FC<Props> = ({
  title,
  subtitle,
  backgroundColor,
  textColor,
  accentColor,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleY = spring({ frame, fps, from: 40, to: 0, durationInFrames: 30 });
  const titleOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const subtitleOpacity = interpolate(frame, [20, 45], [0, 1], {
    extrapolateRight: 'clamp',
  });
  const subtitleY = spring({
    frame: Math.max(0, frame - 15),
    fps,
    from: 30,
    to: 0,
    durationInFrames: 30,
  });

  const lineWidth = interpolate(frame, [10, 40], [0, 120], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
      }}
    >
      <div
        style={{
          fontSize: 80,
          fontWeight: 700,
          color: textColor,
          fontFamily: 'Inter, sans-serif',
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          letterSpacing: -2,
        }}
      >
        {title}
      </div>

      <div
        style={{
          width: lineWidth,
          height: 4,
          backgroundColor: accentColor,
          borderRadius: 2,
        }}
      />

      {subtitle && (
        <div
          style={{
            fontSize: 32,
            fontWeight: 400,
            color: textColor,
            opacity: subtitleOpacity,
            transform: `translateY(${subtitleY}px)`,
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {subtitle}
        </div>
      )}
    </AbsoluteFill>
  );
};
