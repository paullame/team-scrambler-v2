import { useEffect, useState } from "react";

type Theme = "egg" | "egg-dark";

const STORAGE_KEY = "team-scrambler-theme";

function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "egg" || stored === "egg-dark") return stored;
  } catch {
    // localStorage unavailable (e.g. SSR / private browsing)
  }
  return globalThis.matchMedia?.("(prefers-color-scheme: dark)").matches ? "egg-dark" : "egg";
}

/**
 * Manages the active DaisyUI theme.
 * Sets `data-theme` on `<html>` and persists the choice to `localStorage`.
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // The visual theme still works when storage is unavailable.
    }
  }, [theme]);

  function toggleTheme() {
    setTheme((t) => (t === "egg" ? "egg-dark" : "egg"));
  }

  return { theme, isDark: theme === "egg-dark", toggleTheme };
}
