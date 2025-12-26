import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        black: "#000000",
        gray: {
          900: "#111111",
          800: "#222222",
          700: "#333333",
          600: "#666666",
          400: "#999999",
          200: "#cccccc",
        },
      },
    },
  },
  plugins: [],
};

export default config;
