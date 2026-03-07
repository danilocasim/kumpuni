import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        body: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        heading: ["var(--font-plus-jakarta)", "var(--font-dm-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-plus-jakarta)", "sans-serif"],
        mono: ["var(--font-jetbrains)", "ui-monospace", "monospace"],
      },
      colors: {
        // Core Brand Colors
        "kumpuni-blue": "#214365",     // Modern dark blue
        "action-orange": "#E57A44",    // Modern bright orange

        // Backgrounds & Surfaces
        "page-bg": "#F8F9FA",          // Main page background
        "surface-light": "#F4F6F8",    // Secondary background (sidebars, slightly offset)
        "concrete-white": "#FFFFFF",   // Cards, clean white

        // Borders & Dividers
        "border-light": "#F3F4F6",     // Very subtle borders
        "border-subtle": "#E5E9EC",    // Default borders
        "border-strong": "#D1D5DB",    // Harder borders, inputs

        // Text Colors
        "text-primary": "#111827",     // Headings, high emphasis (gray-900)
        "text-secondary": "#374151",   // Body text (gray-700)
        "text-tertiary": "#6B7280",    // Labels, muted text (gray-500)

        // Semantic Colors
        "success-green": "#10B981",    // Available, Success
        "success-light": "#ECFDF5",
        "danger-red": "#EF4444",       // Cancelled, Error
        "danger-light": "#FEF2F2",
        "warning-yellow": "#F59E0B",   // Stars, warnings
        "warning-light": "#FFFBEB",
        "info-blue": "#3B82F6",        // Informational, verified shield
        "info-light": "#EFF6FF",

        // Legacy compatibility mappings (to be phased out or updated)
        "wood-brown": "#8B6914",
        "verified-green": "#10B981",
        "slate-text": "#111827",
        "muted-gray": "#6B7280",
        "blue-light": "#EFF6FF",
        "orange-light": "#FFFBEB",
        "green-light": "#ECFDF5",
        "warm-border": "#E5E9EC",
        "warm-border-input": "#D1D5DB",
        "empty-star": "#E5E7EB",
        "card-border": "#E5E9EC",
        "grain-bg": "#F3F4F6",
      },
      borderColor: {
        subtle: "#E5E9EC",
        dim: "#E5E9EC",
        light: "#F3F4F6",
        strong: "#D1D5DB",
      },
      boxShadow: {
        "kumpuni-sm": "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        "kumpuni-md": "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        "kumpuni-lg": "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        "kumpuni-card": "0 1px 3px rgba(33, 67, 101, 0.05)",
        "kumpuni-card-hover": "0 8px 24px -4px rgba(33, 67, 101, 0.1)",
        "nav-top": "0 -2px 10px rgba(0,0,0,0.05)",
      },
      borderRadius: {
        "kumpuni-sm": "8px",
        "kumpuni-md": "12px",
        "kumpuni-lg": "16px",
        "kumpuni-xl": "24px",
      },
      fontSize: {
        "body": ["15px", { lineHeight: "1.5" }],
        "caption": ["13px", { lineHeight: "1.4" }],
        "headline-mobile": ["22px", { lineHeight: "1.25" }],
        "headline-lg": ["28px", { lineHeight: "1.2" }],
        "button": ["15px", { lineHeight: "1.25", fontWeight: "600" }],
      },
      minHeight: { touch: "48px", button: "48px" },
      minWidth: { touch: "44px" },
      spacing: { touch: "44px", "section": "32px", "card-gap": "16px" },
    },
    screens: {
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
  },
  plugins: [],
};

export default config;
