import * as React from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = React.createContext<ThemeContextType | undefined>(
  undefined,
);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = React.useState<Theme>(() => {
    // Check localStorage first, then system preference
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("theme") as Theme | null;
      if (stored) return stored;

      // Check system preference
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        return "dark";
      }
    }
    return "light";
  });

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const root = window.document.documentElement;

    // Force remove dark class first
    root.classList.remove("dark");

    // Add dark class only if theme is dark
    if (theme === "dark") {
      root.classList.add("dark");
    }

    // Save to localStorage
    localStorage.setItem("theme", theme);

    // Debug log
    console.log(
      "Theme changed to:",
      theme,
      "Has dark class:",
      root.classList.contains("dark"),
    );
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => {
      const newTheme = prev === "light" ? "dark" : "light";
      console.log("Toggling theme from", prev, "to", newTheme);
      return newTheme;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = React.useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
