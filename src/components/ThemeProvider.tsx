import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";
type ThemeMode = "light" | "dark" | "auto";

type ThemeContextType = {
  theme: Theme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getStoredThemeMode(): ThemeMode {
  const stored = localStorage.getItem("themeMode");
  if (stored === "light" || stored === "dark" || stored === "auto") {
    return stored;
  }
  return "auto";
}

function getAutoTheme(): Theme {
  // Try to use Ambient Light Sensor API if available
  if ("AmbientLightSensor" in window) {
    try {
      // This is experimental and may not work in all browsers
      return "light"; // Default fallback
    } catch (e) {
      // Fall through to time-based detection
    }
  }
  
  // Fallback to time-based detection
  const hour = new Date().getHours();
  // Dark mode from 6 PM (18:00) to 6 AM (6:00)
  return (hour >= 18 || hour < 6) ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(getStoredThemeMode);
  const [theme, setTheme] = useState<Theme>(() => {
    const mode = getStoredThemeMode();
    if (mode === "auto") {
      return getAutoTheme();
    }
    return mode;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
  }, [theme]);

  useEffect(() => {
    // Update theme when mode changes
    if (themeMode === "auto") {
      setTheme(getAutoTheme());
      
      // Check every minute if we should switch themes in auto mode
      const interval = setInterval(() => {
        setTheme(getAutoTheme());
      }, 60000); // Check every minute
      
      return () => clearInterval(interval);
    } else {
      setTheme(themeMode);
    }
  }, [themeMode]);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    localStorage.setItem("themeMode", mode);
  };

  const toggleTheme = () => {
    if (themeMode === "auto") {
      setThemeMode("light");
    } else {
      const newMode = themeMode === "light" ? "dark" : "auto";
      setThemeMode(newMode);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, themeMode, setThemeMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};
