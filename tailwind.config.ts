import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    screens: {
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px"
    },
    extend: {
      colors: {
        bg: "var(--bg)",
        raised: "var(--bg-raised)",
        sunken: "var(--bg-sunken)",
        line: "var(--line)",
        primary: {
          DEFAULT: "var(--primary)",
          strong: "var(--primary-strong)",
          soft: "var(--primary-soft)"
        },
        ink: "var(--text)",
        muted: "var(--text-muted)",
        faint: "var(--text-faint)",
        success: "var(--success)",
        warning: "var(--warning)",
        danger: "var(--danger)"
      },
      borderRadius: {
        sm: "12px",
        md: "18px",
        lg: "24px",
        xl: "32px",
        pill: "999px"
      },
      boxShadow: {
        "neu-sm": "var(--neu-raised-sm)",
        neu: "var(--neu-raised)",
        "neu-lg": "var(--neu-raised-lg)",
        "neu-in": "var(--neu-inset)",
        "neu-press": "var(--neu-pressed)"
      },
      fontFamily: {
        ui: "var(--font-ui)",
        hand: "var(--font-hand)"
      },
      transitionTimingFunction: {
        neu: "cubic-bezier(.2,.8,.2,1)"
      },
      maxWidth: {
        content: "1440px"
      }
    }
  },
  plugins: []
};

export default config;
