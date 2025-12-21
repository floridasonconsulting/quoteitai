
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

interface SolarData {
  sunrise: Date;
  sunset: Date;
}

let cachedSolarData: SolarData | null = null;

function getAutoTheme(solarData: SolarData | null): Theme {
  const now = new Date();

  if (solarData) {
    return (now > solarData.sunrise && now < solarData.sunset) ? "light" : "dark";
  }

  // Fallback to time-based detection if solar data is missing
  const hour = now.getHours();
  // Dark mode from 7 PM (19:00) to 6 AM (6:00)
  return (hour >= 19 || hour < 6) ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeModeState] = React.useState<ThemeMode>(getStoredThemeMode);
  const [solarData, setSolarData] = React.useState<SolarData | null>(null);

  const [theme, setTheme] = React.useState<Theme>(() => {
    const mode = getStoredThemeMode();
    if (mode === "auto") {
      return getAutoTheme(null);
    }
    return mode as Theme;
  });

  // Solar Context Logic: Fetch sunrise/sunset based on Geolocation
  React.useEffect(() => {
    if (themeMode !== "auto") return;

    const fetchSolarContext = async () => {
      if (!navigator.geolocation) return;

      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `https://api.sunrise-sunset.org/json?lat=${latitude}&lng=${longitude}&formatted=0`
          );
          const data = await response.json();
          if (data.results) {
            const newSolarData = {
              sunrise: new Date(data.results.sunrise),
              sunset: new Date(data.results.sunset)
            };
            setSolarData(newSolarData);
            setTheme(getAutoTheme(newSolarData));
          }
        } catch (error) {
          console.error("Solar theme fetch failed:", error);
        }
      });
    };

    fetchSolarContext();
    // Refresh every hour
    const interval = setInterval(fetchSolarContext, 3600000);
    return () => clearInterval(interval);
  }, [themeMode]);

  React.useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
  }, [theme]);

  React.useEffect(() => {
    // Update theme when mode changes or time passes
    if (themeMode === "auto") {
      setTheme(getAutoTheme(solarData));

      const interval = setInterval(() => {
        setTheme(getAutoTheme(solarData));
      }, 60000); // Check every minute

      return () => clearInterval(interval);
    } else {
      setTheme(themeMode as Theme);
    }
  }, [themeMode, solarData]);

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
