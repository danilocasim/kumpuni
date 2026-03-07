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
        "kumpuni-blue": "#1B4A6B",
        "action-orange": "#E8722A",
        "concrete-white": "#F5F2EE",
        "wood-brown": "#8B6914",
        "verified-green": "#2D8B4E",
        "slate-text": "#3A3A3A",
        "muted-gray": "#9B9B9B",
        "danger-red": "#C0392B",
        "blue-light": "#E8F0F7",
        "orange-light": "#FFF0E6",
        "green-light": "#E6F5EC",
        "warm-border": "#E8E4DF",
        "warm-border-input": "#E0D5C5",
        "empty-star": "#E0D5C5",
        "card-border": "#E8E4DF",
        "grain-bg": "#CCC5BB",
      },
      backgroundColor: {
        page: "var(--concrete-white)",
      },
      boxShadow: {
        "kumpuni-sm": "0 1px 3px rgba(27, 74, 107, 0.08)",
        "kumpuni-md": "0 4px 12px rgba(27, 74, 107, 0.12)",
        "kumpuni-lg": "0 8px 24px rgba(27, 74, 107, 0.16)",
        "nav-top": "0 -2px 8px rgba(0,0,0,0.06)",
      },
      borderRadius: {
        "kumpuni-sm": "6px",
        "kumpuni-md": "10px",
        "kumpuni-lg": "16px",
      },
      fontSize: {
        "body": ["15px", { lineHeight: "1.5" }],
        "caption": ["13px", { lineHeight: "1.4" }],
        "headline-mobile": ["22px", { lineHeight: "1.25" }],
        "headline-lg": ["28px", { lineHeight: "1.2" }],
        "button": ["16px", { lineHeight: "1.25", fontWeight: "700" }],
      },
      minHeight: { touch: "48px", button: "48px" },
      minWidth: { touch: "44px" },
      spacing: { touch: "44px", "section": "24px", "card-gap": "12px" },
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
