import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";

type Theme = "system" | "light" | "dark";

function getSystemTheme(): "light" | "dark" {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove("dark", "light");
  if (theme === "dark") {
    root.classList.add("dark");
  } else if (theme === "light") {
    root.classList.add("light");
  }
}

function getEffective(theme: Theme): "light" | "dark" {
  return theme === "system" ? getSystemTheme() : theme;
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem("theme") as Theme | null;
    return saved || "system";
  });

  const [effective, setEffective] = useState<"light" | "dark">(() => getEffective(theme));

  useEffect(() => {
    applyTheme(theme);
    setEffective(getEffective(theme));
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (theme === "system") {
        setEffective(getSystemTheme());
      }
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  const toggle = () => {
    if (effective === "light") {
      const systemIsDark = getSystemTheme() === "dark";
      setTheme(systemIsDark ? "system" : "dark");
    } else {
      const systemIsLight = getSystemTheme() === "light";
      setTheme(systemIsLight ? "system" : "light");
    }
  };

  return (
    <button
      onClick={toggle}
      className="fixed top-4 right-4 z-50 w-10 h-10 rounded-full bg-card/80 backdrop-blur border border-border/50 shadow-md flex items-center justify-center text-foreground hover:bg-card transition-colors"
      aria-label={effective === "light" ? "מעבר למצב לילה" : "מעבר למצב יום"}
      data-testid="btn-theme-toggle"
    >
      {effective === "light" ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  );
}
