import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import fs from 'fs';
import path from 'path';

interface RenderOptions {
  compositionId: string;
  inputProps?: Record<string, unknown>;
  codec?: 'h264' | 'h265' | 'vp8' | 'vp9';
  outputFileName?: string;
}

export async function renderVideo({
  compositionId,
  inputProps = {},
  codec = 'h264',
  outputFileName,
}: RenderOptions): Promise<string> {
  const projectRoot = process.cwd();
  const entryPoint = path.resolve(projectRoot, 'src/index.ts');
  if (!fs.existsSync(entryPoint)) {
    throw new Error('Remotion entry file not found. Run this from workspace/remotion.');
  }

  const outputDir = path.resolve(projectRoot, 'out');
  fs.mkdirSync(outputDir, { recursive: true });
  const fileName = outputFileName || `${compositionId}-${Date.now()}.mp4`;
  const outputLocation = path.join(outputDir, fileName);

  console.log(`Bundling project...`);
  const bundleLocation = await bundle({
    entryPoint,
    webpackOverride: (config) => config,
  });

  console.log(`Selecting composition: ${compositionId}`);
  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: compositionId,
    inputProps,
  });

  console.log(`Rendering ${composition.width}x${composition.height} @ ${composition.fps}fps...`);
  await renderMedia({
    composition,
    serveUrl: bundleLocation,
    codec,
    outputLocation,
    inputProps,
  });

  console.log(`Render complete: ${outputLocation}`);
  return outputLocation;
}
