import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#5a6fe8",
          50: "#f0f3ff",
          100: "#e4e9fe",
          200: "#ccd5fd",
          300: "#a8b6fb",
          400: "#7f8ff6",
          500: "#5a6fe8",
          600: "#4556d9",
          700: "#3944c1",
          800: "#31399c",
          900: "#2d347b",
        },
        success: {
          DEFAULT: "#3bb77e",
          50: "#edfdf6",
          100: "#d3fae7",
          200: "#aaf4d4",
          300: "#72e9b9",
          400: "#3bb77e",
          500: "#23a06c",
          600: "#188056",
          700: "#166747",
        },
        warning: {
          DEFAULT: "#f5a623",
          50: "#fefaec",
          100: "#fdf2ce",
          200: "#fbe49a",
          300: "#f8d05e",
          400: "#f5a623",
          500: "#e68f12",
          600: "#cc6f0c",
        },
        danger: {
          DEFAULT: "#e8594f",
          50: "#fef3f2",
          100: "#fee4e2",
          200: "#fecdca",
          300: "#fba8a4",
          400: "#e8594f",
          500: "#de3c30",
          600: "#c92519",
        },
        background: "#f6f8fb",
        foreground: "#3b4559",
        muted: "#7c889a",
        border: "#e5eaef",
      },
      borderRadius: {
        md: "0.5rem",
        lg: "0.75rem",
        xl: "1rem",
        "2xl": "1.25rem",
      },
      boxShadow: {
        card: "0 1px 3px rgba(59, 69, 89, 0.04), 0 1px 2px rgba(59, 69, 89, 0.06)",
        soft: "0 4px 16px rgba(59, 69, 89, 0.08)",
        hover: "0 8px 24px rgba(59, 69, 89, 0.12)",
      },
    },
  },
  plugins: [],
};

export default config;
