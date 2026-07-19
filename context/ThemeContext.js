import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { useColorScheme } from "react-native";
import { light, dark, radius } from "../constants/colors";
import { getThemePreference, saveThemePreference } from "../utils/storage";

const ThemeContext = createContext({
  isDark: false,
  colors: light,
  radius,
  elevation: light.elevation,
  themeMode: "auto", // "auto" | "light" | "dark"
  setThemeMode: () => {},
});

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme(); // "light" | "dark" | null
  const [themeMode, setThemeModeState] = useState("auto");
  const [loaded, setLoaded] = useState(false);

  // Load saved preference on mount
  useEffect(() => {
    (async () => {
      try {
        const saved = await getThemePreference();
        if (saved) setThemeModeState(saved);
      } catch (_) {
        // fall back to auto
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const isDark = useMemo(() => {
    if (themeMode === "light") return false;
    if (themeMode === "dark") return true;
    return systemScheme === "dark";
  }, [themeMode, systemScheme]);

  const colors = isDark ? dark : light;

  const setThemeMode = async (mode) => {
    setThemeModeState(mode);
    try {
      await saveThemePreference(mode);
    } catch (_) {}
  };

  if (!loaded) {
    // Render children briefly so the app doesn't flash; colors default to light
    return <ThemeContext.Provider value={{ isDark: false, colors: light, radius, elevation: light.elevation, themeMode: "auto", setThemeMode }}>{children}</ThemeContext.Provider>;
  }

  return (
    <ThemeContext.Provider value={{ isDark, colors, radius, elevation: colors.elevation, themeMode, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
