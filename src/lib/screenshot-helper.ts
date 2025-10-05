import { generateSampleData } from './sample-data';

/**
 * Screenshot Helper Utility
 * 
 * Prepares the application with sample data for capturing high-quality screenshots.
 * This ensures screenshots show realistic, diverse data that demonstrates the app's capabilities.
 */

export interface ScreenshotPreset {
  id: string;
  name: string;
  description: string;
  route: string;
  viewport?: { width: number; height: number };
}

/**
 * Presets for different screenshot scenarios
 */
export const screenshotPresets: ScreenshotPreset[] = [
  {
    id: 'dashboard',
    name: 'Dashboard Overview',
    description: 'Shows metrics, charts, and quote summary',
    route: '/dashboard',
    viewport: { width: 1920, height: 1080 }
  },
  {
    id: 'quotes-list',
    name: 'Quote List View',
    description: 'Table view with filters and status badges',
    route: '/quotes',
    viewport: { width: 1920, height: 1080 }
  },
  {
    id: 'quote-detail',
    name: 'Quote Detail',
    description: 'Single quote with line items and actions',
    route: '/quotes', // Will need to navigate to specific quote
    viewport: { width: 1920, height: 1080 }
  },
  {
    id: 'new-quote',
    name: 'New Quote Form',
    description: 'Quote creation interface',
    route: '/new-quote',
    viewport: { width: 1920, height: 1080 }
  },
  {
    id: 'customers',
    name: 'Customer Management',
    description: 'Customer list and management',
    route: '/customers',
    viewport: { width: 1920, height: 1080 }
  },
  {
    id: 'items',
    name: 'Item Catalog',
    description: 'Product and service catalog',
    route: '/items',
    viewport: { width: 1920, height: 1080 }
  },
  {
    id: 'mobile-dashboard',
    name: 'Mobile Dashboard',
    description: 'Dashboard on mobile device',
    route: '/dashboard',
    viewport: { width: 375, height: 812 }
  },
  {
    id: 'mobile-quote',
    name: 'Mobile Quote View',
    description: 'Quote detail on mobile',
    route: '/quotes',
    viewport: { width: 375, height: 812 }
  }
];

/**
 * Prepares the app with sample data for screenshots
 * Call this before capturing screenshots to ensure realistic data
 */
export async function prepareSampleDataForScreenshots() {
  try {
    const result = await generateSampleData();
    console.log('[Screenshot Helper] Sample data generated:', result);
    return result;
  } catch (error) {
    console.error('[Screenshot Helper] Error generating sample data:', error);
    throw error;
  }
}

/**
 * Gets the optimal viewport size for a screenshot preset
 */
export function getViewportSize(presetId: string) {
  const preset = screenshotPresets.find(p => p.id === presetId);
  return preset?.viewport || { width: 1920, height: 1080 };
}

/**
 * Generates a filename for a screenshot
 */
export function generateScreenshotFilename(presetId: string, format: 'png' | 'jpg' = 'png') {
  return `${presetId}.${format}`;
}
