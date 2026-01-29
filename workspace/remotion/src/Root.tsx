import React from 'react';
import { Composition } from 'remotion';
import { TextShowcase, textShowcaseSchema } from './compositions/text-showcase';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="TextShowcase"
        component={TextShowcase}
        schema={textShowcaseSchema}
        defaultProps={{
          title: 'Hello World',
          subtitle: 'Made with Remotion',
          backgroundColor: '#111111',
          textColor: '#ffffff',
          accentColor: '#c41e3a',
        }}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
      />
      {/* Register new compositions here */}
    </>
  );
};
