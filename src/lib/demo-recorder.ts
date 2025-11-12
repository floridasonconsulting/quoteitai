import html2canvas from 'html2canvas';
import { prepareSampleDataForScreenshots } from './screenshot-helper';

export interface RecordingStep {
  id: string;
  name: string;
  description: string;
  route?: string;
  delay: number; // milliseconds to wait before capture
  selector?: string; // Optional element to highlight
  action?: () => Promise<void>; // Optional action to perform
  captureFullPage?: boolean;
}

export interface RecordingFrame {
  stepId: string;
  stepName: string;
  timestamp: number;
  imageData: string; // base64 image data
  width: number;
  height: number;
}

export interface RecordingSession {
  id: string;
  startTime: number;
  frames: RecordingFrame[];
  completed: boolean;
}

/**
 * Quote Creation Workflow Steps
 */
export const quoteWorkflowSteps: RecordingStep[] = [
  {
    id: 'dashboard',
    name: 'Dashboard Overview',
    description: 'Show the main dashboard with metrics',
    route: '/dashboard',
    delay: 2000,
    captureFullPage: true
  },
  {
    id: 'navigate-create',
    name: 'Navigate to Create Quote',
    description: 'Click the "New Quote" button',
    route: '/new-quote',
    delay: 1500,
    captureFullPage: true
  },
  {
    id: 'select-customer',
    name: 'Select Customer',
    description: 'Choose customer from dropdown',
    delay: 2000,
    selector: '[data-demo="customer-select"]',
    captureFullPage: true
  },
  {
    id: 'ai-title',
    name: 'Generate AI Title',
    description: 'Use AI to generate quote title',
    delay: 2500,
    selector: '[data-demo="title-ai-button"]',
    captureFullPage: true
  },
  {
    id: 'browse-items',
    name: 'Browse Item Catalog',
    description: 'View available items and categories',
    delay: 2000,
    selector: '[data-demo="item-catalog"]',
    captureFullPage: true
  },
  {
    id: 'add-item-1',
    name: 'Add First Item',
    description: 'Add an item to the quote',
    delay: 1500,
    captureFullPage: true
  },
  {
    id: 'add-item-2',
    name: 'Add Second Item',
    description: 'Add another item with quantity',
    delay: 1500,
    captureFullPage: true
  },
  {
    id: 'custom-item',
    name: 'Add Custom Item',
    description: 'Create and add a custom line item',
    delay: 2000,
    selector: '[data-demo="custom-item-dialog"]',
    captureFullPage: true
  },
  {
    id: 'ai-notes',
    name: 'Generate AI Notes',
    description: 'Use AI to create professional notes',
    delay: 2500,
    selector: '[data-demo="notes-ai-button"]',
    captureFullPage: true
  },
  {
    id: 'review-totals',
    name: 'Review Quote Totals',
    description: 'Show subtotal, tax, and total calculations',
    delay: 2000,
    selector: '[data-demo="quote-summary"]',
    captureFullPage: true
  },
  {
    id: 'send-dialog',
    name: 'Open Send Dialog',
    description: 'Click "Send Quote" to open email customization',
    delay: 2000,
    selector: '[data-demo="send-dialog"]',
    captureFullPage: true
  },
  {
    id: 'email-customize',
    name: 'Customize Email',
    description: 'Edit email content and enable share link',
    delay: 2500,
    captureFullPage: true
  },
  {
    id: 'quote-sent',
    name: 'Quote Sent Confirmation',
    description: 'Show success message and quote details',
    route: '/quotes',
    delay: 2000,
    captureFullPage: true
  },
  {
    id: 'final-view',
    name: 'Final Quote View',
    description: 'Display complete quote with all details',
    delay: 2000,
    captureFullPage: true
  }
];

/**
 * Captures a screenshot of the current page or specific element
 */
export async function captureScreenshot(
  selector?: string,
  captureFullPage: boolean = true
): Promise<string> {
  try {
    let element: HTMLElement;
    
    if (selector) {
      const selectedElement = document.querySelector(selector) as HTMLElement;
      element = selectedElement || document.body;
    } else {
      element = document.body;
    }

    const canvas = await html2canvas(element, {
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      scale: 2, // Higher quality
      logging: false,
      windowWidth: captureFullPage ? element.scrollWidth : window.innerWidth,
      windowHeight: captureFullPage ? element.scrollHeight : window.innerHeight,
    });

    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('[Demo Recorder] Screenshot capture failed:', error);
    throw error;
  }
}

/**
 * Records a single step in the workflow
 */
export async function recordStep(
  step: RecordingStep,
  sessionId: string
): Promise<RecordingFrame> {
  console.log(`[Demo Recorder] Recording step: ${step.name}`);

  // Wait for the specified delay
  await new Promise(resolve => setTimeout(resolve, step.delay));

  // Perform any custom action
  if (step.action) {
    await step.action();
    // Wait a bit after action completes
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Highlight element if selector provided
  let highlightedElement: HTMLElement | null = null;
  if (step.selector) {
    highlightedElement = document.querySelector(step.selector) as HTMLElement;
    if (highlightedElement) {
      highlightedElement.style.outline = '3px solid #3b82f6';
      highlightedElement.style.outlineOffset = '2px';
    }
  }

  // Capture screenshot
  const imageData = await captureScreenshot(step.selector, step.captureFullPage);

  // Remove highlight
  if (highlightedElement) {
    highlightedElement.style.outline = '';
    highlightedElement.style.outlineOffset = '';
  }

  const canvas = document.createElement('canvas');
  const img = new Image();
  await new Promise((resolve) => {
    img.onload = resolve;
    img.src = imageData;
  });

  return {
    stepId: step.id,
    stepName: step.name,
    timestamp: Date.now(),
    imageData,
    width: img.width,
    height: img.height
  };
}

/**
 * Downloads a single frame as PNG
 */
export function downloadFrame(frame: RecordingFrame, filename?: string) {
  const downloadName = filename || `${frame.stepId}-${frame.timestamp}.png`;
  console.log(`[Demo Recorder] Downloading frame: ${downloadName}`);
  
  const link = document.createElement('a');
  link.href = frame.imageData;
  link.download = downloadName;
  link.style.display = 'none';
  
  // Append to body to ensure it works in all browsers
  document.body.appendChild(link);
  link.click();
  
  // Clean up after a short delay
  setTimeout(() => {
    document.body.removeChild(link);
  }, 100);
}

/**
 * Downloads all frames as individual PNG files
 * Returns a promise that resolves when all downloads are initiated
 */
export function downloadAllFrames(frames: RecordingFrame[]): Promise<void> {
  return new Promise((resolve) => {
    console.log(`[Demo Recorder] Starting download of ${frames.length} frames...`);
    
    frames.forEach((frame, index) => {
      setTimeout(() => {
        const filename = `frame-${String(index + 1).padStart(3, '0')}-${frame.stepId}.png`;
        downloadFrame(frame, filename);
        
        // Resolve when last frame download is initiated
        if (index === frames.length - 1) {
          setTimeout(() => {
            console.log(`[Demo Recorder] All ${frames.length} frame downloads initiated`);
            resolve();
          }, 200);
        }
      }, index * 300); // Increased stagger to 300ms for better browser compatibility
    });
  });
}

/**
 * Prepares the application with sample data for recording
 */
export async function prepareForRecording(userId: string): Promise<void> {
  console.log('[Demo Recorder] Preparing sample data...');
  
  try {
    const result = await prepareSampleDataForScreenshots(userId);
    console.log('[Demo Recorder] Sample data prepared:', result);
    
    // Wait a bit for data to settle
    await new Promise(resolve => setTimeout(resolve, 1000));
  } catch (error) {
    console.error('[Demo Recorder] Failed to prepare sample data:', error);
    throw error;
  }
}

/**
 * Exports recording session data as JSON
 */
export function exportSessionData(session: RecordingSession): void {
  const data = JSON.stringify({
    ...session,
    frames: session.frames.map(f => ({
      ...f,
      imageData: `[${f.imageData.length} bytes]` // Don't include full base64 in JSON
    }))
  }, null, 2);

  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = `recording-session-${session.id}.json`;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Generates markdown instructions for manual recording
 */
export function generateRecordingInstructions(): string {
  return `
# Quote Workflow Demo Recording Instructions

## Preparation
1. Clear your browser cache and local storage
2. Run the sample data generation script
3. Ensure you're logged in with a test account
4. Set your screen resolution to 1920x1080 for desktop shots
5. Use 375x812 for mobile shots

## Recording Steps (Total: ~60-65 seconds)

${quoteWorkflowSteps.map((step, idx) => `
### Step ${idx + 1}: ${step.name} (${step.delay}ms)
**Description:** ${step.description}
${step.route ? `**Route:** ${step.route}` : ''}
${step.selector ? `**Focus on:** ${step.selector}` : ''}
`).join('\n')}

## Post-Processing
1. Use a tool like ezgif.com or gifsicle to convert frames to GIF
2. Target file size: < 5MB
3. Frame rate: 15-20 fps
4. Add subtle fade transitions between steps
5. Add text overlays for key features
6. Export optimized GIF

## Recommended Tools
- **Screen Recording:** OBS Studio, Loom, or ScreenFlow
- **GIF Creation:** ezgif.com, Photoshop, or ffmpeg
- **Editing:** DaVinci Resolve, iMovie, or Adobe Premiere
- **Optimization:** gifsicle, ImageOptim

## ffmpeg Command for GIF Creation
\`\`\`bash
ffmpeg -i frame-%03d.png -vf "fps=15,scale=1920:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" -loop 0 quote-workflow.gif
\`\`\`
  `.trim();
}
