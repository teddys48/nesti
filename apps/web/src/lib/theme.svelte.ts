export type ThemeMode = "light" | "dark" | "system";

class ThemeState {
  currentMode = $state<ThemeMode>("system");
  isDark = $state<boolean>(false);

  constructor() {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("notes_theme") as ThemeMode | null;
      if (saved && ["light", "dark", "system"].includes(saved)) {
        this.currentMode = saved;
      }
      this.updateTheme();
    }
  }

  setTheme(mode: ThemeMode) {
    this.currentMode = mode;
    localStorage.setItem("notes_theme", mode);
    this.updateTheme();
  }

  updateTheme() {
    if (typeof window === "undefined") return;

    let dark = false;
    if (this.currentMode === "dark") {
      dark = true;
    } else if (this.currentMode === "light") {
      dark = false;
    } else {
      dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    }

    this.isDark = dark;
    if (dark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }
}

export const themeState = new ThemeState();
