import { useEffect, useState } from "react";

type Theme = "claro" | "oscuro" | "sistema";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      const storedTheme = localStorage.getItem("theme") as Theme;
      if (storedTheme && ["claro", "oscuro", "sistema"].includes(storedTheme)) {
        return storedTheme;
      }
    }
    return "sistema";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove("light", "dark");
    
    if (theme === "claro") {
      root.classList.add("light");
    } else if (theme === "oscuro") {
      root.classList.add("dark");
    } else {
      // Sistema - use system preference
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      root.classList.add(systemTheme);
    }
    
    // Store theme preference
    localStorage.setItem("theme", theme);
  }, [theme]);

  const changeTheme = (newTheme: Theme) => {
    setTheme(newTheme);
  };

  const getCurrentTheme = () => {
    if (theme === "sistema") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "oscuro" : "claro";
    }
    return theme;
  };

  return {
    theme,
    changeTheme,
    getCurrentTheme,
    actualTheme: getCurrentTheme()
  };
}