import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "#1D4ED8", light: "#3B82F6", dark: "#1E40AF" },
        ink: "#0F172A",
        canvas: "#F1F4F9",
      },
    },
  },
  plugins: [],
};
export default config;
