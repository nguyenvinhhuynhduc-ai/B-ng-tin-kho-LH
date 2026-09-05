import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#14181D",
        panel: "#1C222A",
        "panel-alt": "#232A33",
        line: "#2C3440",
        ink: "#E7EBEF",
        sub: "#8B96A3",
        amber: "#F0A93B",
        danger: "#E14B3D",
        success: "#3FAE73",
        accent: "#4C8DD9",
      },
      fontFamily: {
        display: ["Oswald", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
