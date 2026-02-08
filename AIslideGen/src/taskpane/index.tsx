import * as React from "react";
import { createRoot } from "react-dom/client";
import App from "./components/App";
import { FluentProvider } from "@fluentui/react-components";
import { AuthProvider } from "./contexts/AuthContext";
import { sliderDarkTheme, sliderLightTheme } from "./theme";

/* global document, Office, module, require, HTMLElement */

const title = "Slider";

const rootElement: HTMLElement | null = document.getElementById("container");
const root = rootElement ? createRoot(rootElement) : undefined;

// Theme wrapper component to manage theme state
const ThemedApp: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = React.useState(() => {
    // Load theme preference from localStorage
    const saved = localStorage.getItem("slider-theme");
    return saved !== "light"; // Default to dark mode
  });

  const toggleTheme = React.useCallback(() => {
    setIsDarkMode((prev) => {
      const newMode = !prev;
      localStorage.setItem("slider-theme", newMode ? "dark" : "light");
      return newMode;
    });
  }, []);

  return (
    <FluentProvider theme={isDarkMode ? sliderDarkTheme : sliderLightTheme}>
      <AuthProvider>
        <App title={title} isDarkMode={isDarkMode} onToggleTheme={toggleTheme} />
      </AuthProvider>
    </FluentProvider>
  );
};

/* Render application after Office initializes */
Office.onReady(() => {
  root?.render(<ThemedApp />);
});

if ((module as any).hot) {
  (module as any).hot.accept("./components/App", () => {
    const NextApp = require("./components/App").default;
    root?.render(NextApp);
  });
}
