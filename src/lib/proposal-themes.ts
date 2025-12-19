
/**
 * Comprehensive Visual Theme System for Proposals
 * Defines styling for all proposal components
 */

export type ProposalTheme =
  | "modern-corporate"
  | "creative-studio"
  | "minimalist"
  | "bold-impact"
  | "elegant-serif"
  | "tech-future";

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: {
    primary: string;
    secondary: string;
    muted: string;
  };
  border: string;
}

export interface ThemeTypography {
  fontFamily: {
    heading: string;
    body: string;
    accent?: string;
  };
  fontSize: {
    hero: string;
    h1: string;
    h2: string;
    h3: string;
    body: string;
    small: string;
  };
  fontWeight: {
    heading: number;
    body: number;
    bold: number;
  };
  lineHeight: {
    heading: string;
    body: string;
  };
}

export interface ThemeSpacing {
  section: string;
  container: string;
  element: string;
  tight: string;
}

export interface ThemeEffects {
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
  };
  shadow: {
    sm: string;
    md: string;
    lg: string;
  };
}

export interface ThemeDefinition {
  id: ProposalTheme;
  name: string;
  description: string;
  colors: ThemeColors;
  typography: ThemeTypography;
  spacing: ThemeSpacing;
  effects: ThemeEffects;
  features: string[];
  swiper: {
    paginationColor: string;
    navigationColor: string;
  };
}

export const proposalThemes: Record<ProposalTheme, ThemeDefinition> = {
  "modern-corporate": {
    id: "modern-corporate",
    name: "Modern Corporate",
    description: "Professional design with clean lines and bold typography",
    colors: {
      primary: "#1d4ed8", // Deep Royal Blue (Stronger)
      secondary: "#334155", // Darker for better text contrast
      accent: "#0284c7",    // Vivid Sky Blue
      background: "linear-gradient(135deg, #f0f9ff 0%, #cbebff 100%)", // More visible blue tint
      surface: "#ffffff",
      text: {
        primary: "#020617", // Almost black
        secondary: "#1e293b",
        muted: "#64748b"
      },
      border: "#bfdbfe" // Blue-ish border
    },
    typography: {
      fontFamily: {
        heading: "'Bricolage Grotesque', sans-serif",
        body: "'Inter', sans-serif"
      },
      fontSize: {
        hero: "3.5rem",
        h1: "2.5rem",
        h2: "2rem",
        h3: "1.5rem",
        body: "1rem",
        small: "0.875rem"
      },
      fontWeight: {
        heading: 700,
        body: 400,
        bold: 600
      },
      lineHeight: {
        heading: "1.2",
        body: "1.6"
      }
    },
    spacing: {
      section: "4rem",
      container: "2rem",
      element: "1.5rem",
      tight: "0.5rem"
    },
    effects: {
      borderRadius: {
        sm: "0.375rem",
        md: "0.5rem",
        lg: "1rem"
      },
      shadow: {
        sm: "0 1px 3px rgba(0,0,0,0.1)",
        md: "0 4px 6px rgba(0,0,0,0.1)",
        lg: "0 10px 25px rgba(0,0,0,0.15)"
      }
    },
    features: ["Bold headers", "Two-column layout", "Professional colors"],
    swiper: {
      paginationColor: "#2563eb",
      navigationColor: "#1e40af"
    }
  },

  "creative-studio": {
    id: "creative-studio",
    name: "Creative Studio",
    description: "Eye-catching design with artistic flair and vibrant accents",
    colors: {
      primary: "#9333ea", // Vibrant Purple
      secondary: "#db2777", // Hot Pink
      accent: "#f59e0b",
      background: "linear-gradient(135deg, #faf5ff 0%, #f5d0fe 100%)", // Richer gradient
      surface: "#ffffff",
      text: {
        primary: "#2e0249", // Deep purple text
        secondary: "#701a75",
        muted: "#a21caf"
      },
      border: "#f0abfc"
    },
    typography: {
      fontFamily: {
        heading: "'Righteous', sans-serif",
        body: "'Manrope', sans-serif",
        accent: "'Comfortaa', cursive"
      },
      fontSize: {
        hero: "4rem",
        h1: "3rem",
        h2: "2.25rem",
        h3: "1.75rem",
        body: "1.0625rem",
        small: "0.9375rem"
      },
      fontWeight: {
        heading: 800,
        body: 400,
        bold: 700
      },
      lineHeight: {
        heading: "1.1",
        body: "1.7"
      }
    },
    spacing: {
      section: "5rem",
      container: "2.5rem",
      element: "2rem",
      tight: "0.75rem"
    },
    effects: {
      borderRadius: {
        sm: "0.5rem",
        md: "1rem",
        lg: "1.5rem"
      },
      shadow: {
        sm: "0 2px 8px rgba(168,85,247,0.15)",
        md: "0 8px 16px rgba(168,85,247,0.2)",
        lg: "0 16px 32px rgba(168,85,247,0.25)"
      }
    },
    features: ["Unique layouts", "Vibrant colors", "Artistic elements"],
    swiper: {
      paginationColor: "#a855f7",
      navigationColor: "#9333ea"
    }
  },

  "minimalist": {
    id: "minimalist",
    name: "Minimalist",
    description: "Clean and simple design focusing on content and readability",
    colors: {
      primary: "#000000",
      secondary: "#525252",
      accent: "#737373",
      background: "#fafaf9",
      surface: "#ffffff",
      text: {
        primary: "#0c0a09",
        secondary: "#44403c",
        muted: "#78716c"
      },
      border: "#e7e5e4"
    },
    typography: {
      fontFamily: {
        heading: "'Space Grotesk', sans-serif",
        body: "'Inter', sans-serif"
      },
      fontSize: {
        hero: "3rem",
        h1: "2.25rem",
        h2: "1.875rem",
        h3: "1.5rem",
        body: "1rem",
        small: "0.875rem"
      },
      fontWeight: {
        heading: 600,
        body: 400,
        bold: 500
      },
      lineHeight: {
        heading: "1.3",
        body: "1.75"
      }
    },
    spacing: {
      section: "6rem",
      container: "3rem",
      element: "2.5rem",
      tight: "1rem"
    },
    effects: {
      borderRadius: {
        sm: "0.125rem",
        md: "0.25rem",
        lg: "0.5rem"
      },
      shadow: {
        sm: "0 1px 2px rgba(0,0,0,0.05)",
        md: "0 2px 4px rgba(0,0,0,0.05)",
        lg: "0 4px 8px rgba(0,0,0,0.08)"
      }
    },
    features: ["Simple layouts", "Elegant typography", "Maximum readability"],
    swiper: {
      paginationColor: "#000000",
      navigationColor: "#171717"
    }
  },

  "bold-impact": {
    id: "bold-impact",
    name: "Bold Impact",
    description: "High-contrast design that demands attention and conveys confidence",
    colors: {
      primary: "#b91c1c", // Deep Bold Red
      secondary: "#020617", // Ink Black
      accent: "#d97706",    // Amber
      background: "linear-gradient(135deg, #fffbeb 0%, #fcd34d 100%)", // Stronger Gold/Amber Gradient
      surface: "#ffffff",
      text: {
        primary: "#450a0a", // Dark Red/Brown text
        secondary: "#78350f",
        muted: "#92400e"
      },
      border: "#fde68a"
    },
    typography: {
      fontFamily: {
        heading: "'Outfit', sans-serif",
        body: "'Plus Jakarta Sans', sans-serif"
      },
      fontSize: {
        hero: "4.5rem",
        h1: "3.5rem",
        h2: "2.5rem",
        h3: "2rem",
        body: "1.125rem",
        small: "1rem"
      },
      fontWeight: {
        heading: 900,
        body: 400,
        bold: 800
      },
      lineHeight: {
        heading: "1.0",
        body: "1.65"
      }
    },
    spacing: {
      section: "4.5rem",
      container: "2.5rem",
      element: "2rem",
      tight: "0.75rem"
    },
    effects: {
      borderRadius: {
        sm: "0.25rem",
        md: "0.5rem",
        lg: "1rem"
      },
      shadow: {
        sm: "0 2px 8px rgba(220,38,38,0.2)",
        md: "0 8px 16px rgba(220,38,38,0.25)",
        lg: "0 16px 32px rgba(220,38,38,0.3)"
      }
    },
    features: ["High contrast", "Bold typography", "Attention-grabbing"],
    swiper: {
      paginationColor: "#dc2626",
      navigationColor: "#b91c1c"
    }
  },

  "elegant-serif": {
    id: "elegant-serif",
    name: "Elegant Serif",
    description: "Sophisticated design with classic serif typography and refined aesthetics",
    colors: {
      primary: "#1e3a8a",
      secondary: "#92400e",
      accent: "#b45309",
      background: "linear-gradient(135deg, #fef3c7 0%, #dbeafe 100%)",
      surface: "#fffbeb",
      text: {
        primary: "#1c1917",
        secondary: "#57534e",
        muted: "#78716c"
      },
      border: "#fed7aa"
    },
    typography: {
      fontFamily: {
        heading: "'Playfair Display', serif",
        body: "'Crimson Pro', serif"
      },
      fontSize: {
        hero: "4rem",
        h1: "3rem",
        h2: "2.25rem",
        h3: "1.875rem",
        body: "1.125rem",
        small: "1rem"
      },
      fontWeight: {
        heading: 700,
        body: 400,
        bold: 600
      },
      lineHeight: {
        heading: "1.2",
        body: "1.8"
      }
    },
    spacing: {
      section: "5rem",
      container: "2.5rem",
      element: "2rem",
      tight: "0.75rem"
    },
    effects: {
      borderRadius: {
        sm: "0.25rem",
        md: "0.375rem",
        lg: "0.75rem"
      },
      shadow: {
        sm: "0 2px 4px rgba(30,58,138,0.1)",
        md: "0 4px 8px rgba(30,58,138,0.15)",
        lg: "0 8px 16px rgba(30,58,138,0.2)"
      }
    },
    features: ["Classic serif fonts", "Refined aesthetics", "Timeless appeal"],
    swiper: {
      paginationColor: "#1e3a8a",
      navigationColor: "#1e40af"
    }
  },

  "tech-future": {
    id: "tech-future",
    name: "Tech Future",
    description: "Modern tech aesthetic with geometric shapes and futuristic vibes",
    colors: {
      primary: "#06b6d4",
      secondary: "#8b5cf6",
      accent: "#10b981",
      background: "linear-gradient(135deg, #0c4a6e 0%, #1e1b4b 100%)",
      surface: "#0f172a",
      text: {
        primary: "#f8fafc",
        secondary: "#cbd5e1",
        muted: "#94a3b8"
      },
      border: "#1e293b"
    },
    typography: {
      fontFamily: {
        heading: "'JetBrains Mono', monospace",
        body: "'IBM Plex Sans', sans-serif"
      },
      fontSize: {
        hero: "3.5rem",
        h1: "2.75rem",
        h2: "2rem",
        h3: "1.5rem",
        body: "1rem",
        small: "0.875rem"
      },
      fontWeight: {
        heading: 700,
        body: 400,
        bold: 600
      },
      lineHeight: {
        heading: "1.2",
        body: "1.6"
      }
    },
    spacing: {
      section: "4rem",
      container: "2rem",
      element: "1.5rem",
      tight: "0.5rem"
    },
    effects: {
      borderRadius: {
        sm: "0.125rem",
        md: "0.25rem",
        lg: "0.5rem"
      },
      shadow: {
        sm: "0 0 10px rgba(6,182,212,0.3)",
        md: "0 0 20px rgba(6,182,212,0.4)",
        lg: "0 0 40px rgba(6,182,212,0.5)"
      }
    },
    features: ["Geometric design", "Tech aesthetic", "Futuristic colors"],
    swiper: {
      paginationColor: "#06b6d4",
      navigationColor: "#0891b2"
    }
  }
};

/**
 * Get theme definition by ID
 */
export function getTheme(themeId: ProposalTheme = "modern-corporate"): ThemeDefinition {
  return proposalThemes[themeId] || proposalThemes["modern-corporate"];
}

/**
 * Get all available themes
 */
export function getAllThemes(): ThemeDefinition[] {
  return Object.values(proposalThemes);
}

/**
 * Generate CSS custom properties for a theme
 */
export function getThemeCSSVars(theme: ThemeDefinition): Record<string, string> {
  return {
    "--theme-primary": theme.colors.primary,
    "--theme-secondary": theme.colors.secondary,
    "--theme-accent": theme.colors.accent,
    "--theme-background": theme.colors.background,
    "--theme-surface": theme.colors.surface,
    "--theme-text-primary": theme.colors.text.primary,
    "--theme-text-secondary": theme.colors.text.secondary,
    "--theme-text-muted": theme.colors.text.muted,
    "--theme-border": theme.colors.border,
    "--theme-font-heading": theme.typography.fontFamily.heading,
    "--theme-font-body": theme.typography.fontFamily.body,
    "--theme-shadow-sm": theme.effects.shadow.sm,
    "--theme-shadow-md": theme.effects.shadow.md,
    "--theme-shadow-lg": theme.effects.shadow.lg
  };
}
