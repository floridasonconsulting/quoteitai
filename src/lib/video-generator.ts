
import type { RecordingFrame } from './demo-recorder';

// Type imports only - no runtime FFmpeg import
type FFmpeg = any;

let ffmpeg: FFmpeg | null = null;
let isLoaded = false;

/**
 * Initialize FFmpeg instance with dynamic import
 * This ensures FFmpeg (~31MB) is only loaded when actually needed
 */
export async function initFFmpeg(onProgress?: (progress: number) => void): Promise<FFmpeg> {
  if (ffmpeg && isLoaded) {
    return ffmpeg;
  }

  // ✅ DYNAMIC IMPORT - FFmpeg only loads when this function is called
  const [{ FFmpeg }, { toBlobURL }] = await Promise.all([
    import('@ffmpeg/ffmpeg'),
    import('@ffmpeg/util')
  ]);

  ffmpeg = new FFmpeg();

  // Set up progress logging
  ffmpeg.on('log', ({ message }: { message: string }) => {
    console.log('[FFmpeg]', message);
  });

  if (onProgress) {
    ffmpeg.on('progress', ({ progress }: { progress: number }) => {
      onProgress(Math.round(progress * 100));
    });
  }

  // Load FFmpeg core
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
  
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  });

  isLoaded = true;
  return ffmpeg;
}

/**
 * Convert base64 image data to blob
 */
function base64ToBlob(base64: string): Blob {
  const parts = base64.split(';base64,');
  const contentType = parts[0].split(':')[1];
  const raw = window.atob(parts[1]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);

  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }

  return new Blob([uInt8Array], { type: contentType });
}

/**
 * Generate MP4 video from recording frames
 * FFmpeg is dynamically imported only when this function is called
 */
export async function generateMP4(
  frames: RecordingFrame[],
  options: {
    fps?: number;
    quality?: 'high' | 'medium' | 'low';
    onProgress?: (progress: number, status: string) => void;
  } = {}
): Promise<Blob> {
  const { fps = 2, quality = 'high', onProgress } = options;

  onProgress?.(0, 'Initializing FFmpeg...');
  
  // ✅ DYNAMIC IMPORT - fetchFile loaded only when needed
  const { fetchFile } = await import('@ffmpeg/util');
  
  const ffmpegInstance = await initFFmpeg((progress) => {
    onProgress?.(progress * 0.2, 'Loading FFmpeg...');
  });

  onProgress?.(20, 'Writing frames...');

  // Write all frames to FFmpeg virtual filesystem
  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];
    const blob = base64ToBlob(frame.imageData);
    const filename = `frame${String(i + 1).padStart(4, '0')}.png`;
    await ffmpegInstance.writeFile(filename, await fetchFile(blob));
    
    const progress = 20 + (i / frames.length) * 30;
    onProgress?.(progress, `Writing frame ${i + 1}/${frames.length}...`);
  }

  onProgress?.(50, 'Encoding video...');

  // Quality settings
  const qualityMap = {
    high: '18',
    medium: '23',
    low: '28'
  };
  const crf = qualityMap[quality];

  // Generate MP4
  await ffmpegInstance.exec([
    '-framerate', fps.toString(),
    '-pattern_type', 'glob',
    '-i', 'frame*.png',
    '-c:v', 'libx264',
    '-crf', crf,
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    'output.mp4'
  ]);

  onProgress?.(90, 'Reading video file...');

  // Read the output file
  const data = await ffmpegInstance.readFile('output.mp4');
  
  onProgress?.(95, 'Cleaning up...');

  // Cleanup
  await ffmpegInstance.deleteFile('output.mp4');
  for (let i = 0; i < frames.length; i++) {
    const filename = `frame${String(i + 1).padStart(4, '0')}.png`;
    await ffmpegInstance.deleteFile(filename);
  }

  onProgress?.(100, 'Complete!');

  // Convert FileData to Blob - create a copy to ensure standard ArrayBuffer type
  if (!(data instanceof Uint8Array)) {
    throw new Error('Unexpected data type from FFmpeg');
  }
  return new Blob([data.slice()], { type: 'video/mp4' });
}

/**
 * Generate optimized GIF from recording frames
 * FFmpeg is dynamically imported only when this function is called
 */
export async function generateGIF(
  frames: RecordingFrame[],
  options: {
    fps?: number;
    width?: number;
    onProgress?: (progress: number, status: string) => void;
  } = {}
): Promise<Blob> {
  const { fps = 2, width = 1024, onProgress } = options;

  onProgress?.(0, 'Initializing FFmpeg...');
  
  // ✅ DYNAMIC IMPORT - fetchFile loaded only when needed
  const { fetchFile } = await import('@ffmpeg/util');
  
  const ffmpegInstance = await initFFmpeg((progress) => {
    onProgress?.(progress * 0.2, 'Loading FFmpeg...');
  });

  onProgress?.(20, 'Writing frames...');

  // Write all frames to FFmpeg virtual filesystem
  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];
    const blob = base64ToBlob(frame.imageData);
    const filename = `frame${String(i + 1).padStart(4, '0')}.png`;
    await ffmpegInstance.writeFile(filename, await fetchFile(blob));
    
    const progress = 20 + (i / frames.length) * 30;
    onProgress?.(progress, `Writing frame ${i + 1}/${frames.length}...`);
  }

  onProgress?.(50, 'Generating color palette...');

  // Generate optimized palette
  await ffmpegInstance.exec([
    '-framerate', fps.toString(),
    '-pattern_type', 'glob',
    '-i', 'frame*.png',
    '-vf', `fps=${fps},scale=${width}:-1:flags=lanczos,palettegen=stats_mode=diff`,
    'palette.png'
  ]);

  onProgress?.(70, 'Creating GIF...');

  // Generate GIF using palette
  await ffmpegInstance.exec([
    '-framerate', fps.toString(),
    '-pattern_type', 'glob',
    '-i', 'frame*.png',
    '-i', 'palette.png',
    '-lavfi', `fps=${fps},scale=${width}:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=5`,
    '-loop', '0',
    'output.gif'
  ]);

  onProgress?.(90, 'Reading GIF file...');

  // Read the output file
  const data = await ffmpegInstance.readFile('output.gif');
  
  onProgress?.(95, 'Cleaning up...');

  // Cleanup
  await ffmpegInstance.deleteFile('output.gif');
  await ffmpegInstance.deleteFile('palette.png');
  for (let i = 0; i < frames.length; i++) {
    const filename = `frame${String(i + 1).padStart(4, '0')}.png`;
    await ffmpegInstance.deleteFile(filename);
  }

  onProgress?.(100, 'Complete!');

  // Convert FileData to Blob - create a copy to ensure standard ArrayBuffer type
  if (!(data instanceof Uint8Array)) {
    throw new Error('Unexpected data type from FFmpeg');
  }
  return new Blob([data.slice()], { type: 'image/gif' });
}

/**
 * Download a blob as a file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  console.log(`[Video Generator] Downloading ${filename} (${(blob.size / 1024 / 1024).toFixed(2)}MB)`);
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  // Append to body to ensure it works in all browsers
  document.body.appendChild(link);
  link.click();
  
  // Clean up after a short delay
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
}

/**
 * Get estimated file sizes for different quality options
 */
export function estimateFileSizes(frameCount: number): {
  mp4High: string;
  mp4Medium: string;
  mp4Low: string;
  gif1024: string;
  gif800: string;
} {
  // Rough estimates based on typical frame sizes
  const avgFrameSize = 200; // KB per frame
  
  return {
    mp4High: `${Math.round(frameCount * avgFrameSize * 0.3 / 1024)}MB`,
    mp4Medium: `${Math.round(frameCount * avgFrameSize * 0.2 / 1024)}MB`,
    mp4Low: `${Math.round(frameCount * avgFrameSize * 0.1 / 1024)}MB`,
    gif1024: `${Math.round(frameCount * avgFrameSize * 0.4 / 1024)}MB`,
    gif800: `${Math.round(frameCount * avgFrameSize * 0.3 / 1024)}MB`,
  };
}
