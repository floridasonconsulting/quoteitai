
import * as React from "react";

type Theme = "light" | "dark";
type ThemeMode = "light" | "dark" | "auto";

type ThemeContextType = {
  theme: Theme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
};

const ThemeContext = React.createContext<ThemeContextType | undefined>(undefined);

function getStoredThemeMode(): ThemeMode {
  try {
    const stored = localStorage.getItem("themeMode");
    if (stored === "light" || stored === "dark" || stored === "auto") {
      return stored;
    }
  } catch (error) {
    console.error("[ThemeProvider] Error reading themeMode from localStorage:", error);
  }
  return "auto";
}

function getAutoTheme(): Theme {
  const now = new Date();
  const hour = now.getHours();
  // Dark mode from 7 PM (19:00) to 6 AM (6:00)
  return (hour >= 19 || hour < 6) ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeModeState] = React.useState<ThemeMode>(getStoredThemeMode);

  const [theme, setTheme] = React.useState<Theme>(() => {
    const mode = getStoredThemeMode();
    if (mode === "auto") {
      return getAutoTheme();
    }
    return mode as Theme;
  });

  React.useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
  }, [theme]);

  React.useEffect(() => {
    // Update theme when mode changes or time passes
    if (themeMode === "auto") {
      setTheme(getAutoTheme());

      const interval = setInterval(() => {
        setTheme(getAutoTheme());
      }, 60000); // Check every minute

      return () => clearInterval(interval);
    } else {
      setTheme(themeMode as Theme);
    }
  }, [themeMode]);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      localStorage.setItem("themeMode", mode);
    } catch (error) {
      console.error("[ThemeProvider] Error saving themeMode to localStorage:", error);
    }
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
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};
