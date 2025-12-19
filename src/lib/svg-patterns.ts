
/**
 * SVG Pattern Generator for Proposal Visuals
 * Generates inline SVG Data URIs for high-quality, lightweight backgrounds.
 */

// Helper to encode SVG for Data URI
function encodeSVG(svg: string): string {
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.trim().replace(/\s+/g, ' '))}`;
}

// ============================================================================
// 1. WAVE PATTERN (Corporate, Elegant)
// ============================================================================
export function getWavePattern(color: string, opacity = 0.1): string {
    const svg = `
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320' preserveAspectRatio='none'>
      <path fill='${color}' fill-opacity='${opacity}' d='M0,160L48,176C96,192,192,224,288,224C384,224,480,192,576,165.3C672,139,768,117,864,128C960,139,1056,181,1152,197.3C1248,213,1344,203,1392,197.3L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z'></path>
      <path fill='${color}' fill-opacity='${opacity * 0.5}' d='M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,224C672,245,768,267,864,250.7C960,235,1056,181,1152,165.3C1248,149,1344,171,1392,181.3L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z'></path>
    </svg>
  `;
    return encodeSVG(svg);
}

// ============================================================================
// 2. GEOMETRIC GRID (Tech, Modern, Bold)
// ============================================================================
export function getGeometricPattern(color: string, opacity = 0.05): string {
    const svg = `
    <svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'>
      <path d='M0 0h40v40H0V0zm20 20h20v20H20V20zM0 20h20v20H0V20z' fill='${color}' fill-opacity='${opacity}' fill-rule='evenodd'/>
    </svg>
  `;
    return encodeSVG(svg);
}

// ============================================================================
// 3. DOT GRID (Minimalist, Clean)
// ============================================================================
export function getDotGridPattern(color: string, opacity = 0.15): string {
    const svg = `
    <svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'>
      <circle cx='12' cy='12' r='2' fill='${color}' fill-opacity='${opacity}'/>
    </svg>
  `;
    return encodeSVG(svg);
}

// ============================================================================
// 4. ABSTRACT BLOBS (Creative, Artistic)
// ============================================================================
export function getAbstractBlobPattern(color1: string, color2: string, opacity = 0.1): string {
    const svg = `
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 600'>
      <g fill-opacity='${opacity}'>
        <circle fill='${color1}' cx='400' cy='300' r='200' />
        <circle fill='${color2}' cx='600' cy='100' r='150' />
        <circle fill='${color2}' cx='100' cy='500' r='100' />
        <path fill='${color1}' d='M652,388 L348,348 L465,582 Z' />
      </g>
    </svg>
  `;
    return encodeSVG(svg);
}

// ============================================================================
// 5. ISOMETRIC CUBES (Advanced Tech/Structure)
// ============================================================================
export function getIsometricPattern(color: string, opacity = 0.08): string {
    const svg = `
    <svg xmlns='http://www.w3.org/2000/svg' width='32' height='56' viewBox='0 0 32 56'>
      <g fill='${color}' fill-opacity='${opacity}'>
        <path d='M0 28h16v-28L0 28zm16 0h16v28H16V28z'/>
        <path d='M16 28L0 56h32L16 28z' fill-opacity='${opacity * 1.5}'/>
      </g>
    </svg>
  `;
    return encodeSVG(svg);
}

// ============================================================================
// MAIN GENERATOR FUNCTION
// ============================================================================
type PatternType = 'waves' | 'grid' | 'dots' | 'blobs' | 'isometric';

export function getGeneratedBackground(
    type: PatternType,
    primaryColor: string,
    secondaryColor: string,
    baseGradient: string
): string {
    let svgUrl = '';

    switch (type) {
        case 'waves':
            svgUrl = getWavePattern('#ffffff', 0.15); // Use white overlay for better contrast on dark bg
            break;
        case 'grid':
            svgUrl = getGeometricPattern('#ffffff', 0.05);
            break;
        case 'dots':
            svgUrl = getDotGridPattern('#ffffff', 0.1);
            break;
        case 'blobs':
            svgUrl = getAbstractBlobPattern(primaryColor, secondaryColor, 0.2); // Colored blobs
            break;
        case 'isometric':
            svgUrl = getIsometricPattern('#ffffff', 0.08);
            break;
    }

    // Combine: SVG Overlay + CSS Gradient
    return `url("${svgUrl}"), ${baseGradient}`;
}
