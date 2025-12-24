import tailwindcssRtl from "tailwindcss-rtl";
import tailwindcssAnimate from "tailwindcss-animate";

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "var(--primary-50)",
          100: "var(--primary-100)",
          200: "var(--primary-200)",
          300: "var(--primary-300)",
          400: "var(--primary-400)",
          500: "var(--primary-color, #5d1a78)",
          600: "var(--primary-600)",
          700: "var(--primary-700)",
          800: "var(--primary-800)",
          900: "var(--primary-900)",
          DEFAULT: "hsl(var(--primary))",
          hover: "var(--primary-hover, #4a1660)",
          dark: " var(--primary-dark, #1a0a24)",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          50: "var(--secondary-50)",
          100: "var(--secondary-100)",
          200: "var(--secondary-200)",
          300: "var(--secondary-300)",
          400: "var(--secondary-400)",
          500: "var(--secondary-color, #4CAF50)",
          600: "var(--secondary-600)",
          700: "var(--secondary-700)",
          800: "var(--secondary-800)",
          900: "var(--secondary-900)",
          DEFAULT: "hsl(var(--secondary))",
          hover: "var(--secondary-hover, #388E3C)",
          foreground: "hsl(var(--secondary-foreground))",
        },
        accent: {
          50: "var(--accent-50)",
          100: "var(--accent-100)",
          200: "var(--accent-200)",
          300: "var(--accent-300)",
          400: "var(--accent-400)",
          500: "var(--accent-color, #FBC02D)",
          600: "var(--accent-600)",
          700: "var(--accent-700)",
          800: "var(--accent-800)",
          900: "var(--accent-900)",
          DEFAULT: "hsl(var(--accent))",
          hover: "var(--accent-hover, #F9A825)",
          foreground: "hsl(var(--accent-foreground))",
        },
        background: "hsl(var(--background))",
        text: {
          DEFAULT: "var(--text-color, #212121)",
          secondary: "var(--text-secondary, #757575)",
        },
        error: {
          DEFAULT: "var(--error-color, #D32F2F)",
          hover: "var(--error-hover, #B71C1C)",
        },
        border: "hsl(var(--border))",
        card: {
          DEFAULT: "hsl(var(--card))",
          shadow: "var(--card-shadow, rgba(0, 0, 0, 0.05))",
          foreground: "hsl(var(--card-foreground))",
        },
        modal: {
          DEFAULT: "var(--modal-bg, #FFFFFF)",
          shadow: "var(--modal-shadow, rgba(0, 0, 0, 0.2))",
        },
        disabled: {
          DEFAULT: "var(--disabled-color, #B0BEC5)",
          bg: "var(--disabled-bg, #ECEFF1)",
        },
        foreground: "hsl(var(--foreground))",
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "Noto Kufi Arabic",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "sans-serif",
        ],
        serif: ["var(--font-serif)", "Amiri", "Times New Roman", "serif"],
        arabic: [
          "Noto Kufi Arabic",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
        kufi: ["Noto Kufi Arabic", "system-ui", "sans-serif"],
        amiri: ["Amiri", "Times New Roman", "serif"],
        display: [
          "var(--font-display)",
          "Noto Kufi Arabic",
          "system-ui",
          "sans-serif",
        ],
        heading: [
          "var(--font-heading)",
          "Noto Kufi Arabic",
          "Amiri",
          "system-ui",
          "sans-serif",
        ],
        body: [
          "var(--font-body)",
          "Noto Kufi Arabic",
          "system-ui",
          "sans-serif",
        ],
        caption: [
          "var(--font-caption)",
          "Noto Kufi Arabic",
          "system-ui",
          "sans-serif",
        ],
      },
      fontSize: {
        xs: [
          "var(--font-size-xs, 0.75rem)",
          {
            lineHeight: "var(--line-height-tight, 1.2)",
          },
        ],
        sm: [
          "var(--font-size-sm, 0.875rem)",
          {
            lineHeight: "var(--line-height-normal, 1.5)",
          },
        ],
        base: [
          "var(--font-size-md, 1rem)",
          {
            lineHeight: "var(--line-height-normal, 1.5)",
          },
        ],
        lg: [
          "var(--font-size-lg, 1.25rem)",
          {
            lineHeight: "var(--line-height-normal, 1.5)",
          },
        ],
        xl: [
          "var(--font-size-xl, 1.5rem)",
          {
            lineHeight: "var(--line-height-tight, 1.2)",
          },
        ],
        "2xl": [
          "var(--font-size-2xl, 2rem)",
          {
            lineHeight: "var(--line-height-tight, 1.2)",
          },
        ],
        "3xl": [
          "var(--font-size-3xl, 2.5rem)",
          {
            lineHeight: "var(--line-height-tight, 1.2)",
          },
        ],
      },
      spacing: {
        xxs: "var(--spacing-xxs, 0.25rem)",
        xs: "var(--spacing-xs, 0.5rem)",
        sm: "var(--spacing-sm, 1rem)",
        md: "var(--spacing-md, 1.5rem)",
        lg: "var(--spacing-lg, 2rem)",
        xl: "var(--spacing-xl, 3rem)",
        "2xl": "var(--spacing-2xl, 4rem)",
        "3xl": "var(--spacing-3xl, 6rem)",
      },
      borderRadius: {
        sm: "calc(var(--radius) - 4px)",
        md: "calc(var(--radius) - 2px)",
        lg: "var(--radius)",
        full: "var(--radius-full, 9999px)",
      },
      boxShadow: {
        sm: "var(--shadow-sm, 0 2px 4px rgba(0, 0, 0, 0.05))",
        md: "var(--shadow-md, 0 4px 8px rgba(0, 0, 0, 0.05))",
        lg: "var(--shadow-lg, 0 8px 16px rgba(0, 0, 0, 0.05))",
        xl: "var(--shadow-xl, 0 12px 24px rgba(0, 0, 0, 0.2))",
      },
      transitionDuration: {
        fast: "var(--transition-fast, 200ms)",
        normal: "var(--transition-normal, 300ms)",
        slow: "var(--transition-slow, 500ms)",
      },
      keyframes: {
        fadeIn: {
          "0%": {
            opacity: "0",
          },
          "100%": {
            opacity: "1",
          },
        },
        slideIn: {
          "0%": {
            transform: "translateX(100%)",
          },
          "100%": {
            transform: "translateX(0)",
          },
        },
        slideInRTL: {
          "0%": {
            transform: "translateX(-100%)",
          },
          "100%": {
            transform: "translateX(0)",
          },
        },
        scaleIn: {
          "0%": {
            transform: "scale(0.9)",
            opacity: "0",
          },
          "100%": {
            transform: "scale(1)",
            opacity: "1",
          },
        },
        pulse: {
          "0%, 100%": {
            opacity: "1",
          },
          "50%": {
            opacity: "0.5",
          },
        },
        spin: {
          from: {
            transform: "rotate(0deg)",
          },
          to: {
            transform: "rotate(360deg)",
          },
        },
        bounce: {
          "0%, 100%": {
            transform: "translateY(-25%)",
            animationTimingFunction: "cubic-bezier(0.8, 0, 1, 1)",
          },
          "50%": {
            transform: "translateY(0)",
            animationTimingFunction: "cubic-bezier(0, 0, 0.2, 1)",
          },
        },
      },
      animation: {
        fadeIn: "fadeIn var(--transition-normal, 300ms) ease-in-out",
        slideIn: "slideIn var(--transition-normal, 300ms) ease-out",
        slideInRTL: "slideInRTL var(--transition-normal, 300ms) ease-out",
        scaleIn: "scaleIn var(--transition-fast, 200ms) ease-out",
        pulse: "pulse 1.5s infinite",
        spin: "spin 1s linear infinite",
        bounce: "bounce 1s infinite",
      },
      screens: {
        xs: "475px",
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1536px",
      },
      gridTemplateColumns: {
        "auto-fit-cards": "repeat(auto-fit, minmax(280px, 1fr))",
        "auto-fill-cards": "repeat(auto-fill, minmax(280px, 1fr))",
      },
      backdropBlur: {
        xs: "2px",
        sm: "4px",
        md: "8px",
        lg: "12px",
        xl: "16px",
      },
    },
  },
  plugins: [
    // RTL support for Arabic
    tailwindcssRtl,

    // Custom plugin for Islamic design utilities
    function ({ addUtilities, addComponents, theme }) {
      // Islamic-specific utilities
      addUtilities({
        ".text-islamic-primary": {
          color: theme("colors.primary.DEFAULT"),
        },
        ".bg-islamic-secondary": {
          backgroundColor: theme("colors.secondary.DEFAULT"),
        },
        ".rtl-flip": {
          transform: "scaleX(-1)",
        },
        ".writing-mode-vertical": {
          writingMode: "vertical-rl",
          textOrientation: "mixed",
        },
        // Safe area utilities for mobile
        ".pb-safe-area": {
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        },
        ".pt-safe-area": {
          paddingTop: "env(safe-area-inset-top, 0px)",
        },
        ".pl-safe-area": {
          paddingLeft: "env(safe-area-inset-left, 0px)",
        },
        ".pr-safe-area": {
          paddingRight: "env(safe-area-inset-right, 0px)",
        },
      });

      // Islamic design components
      addComponents({
        ".islamic-card": {
          backgroundColor: theme("colors.card.DEFAULT"),
          borderRadius: theme("borderRadius.md"),
          boxShadow: theme("boxShadow.sm"),
          padding: theme("spacing.md"),
          border: `1px solid ${theme("colors.border.DEFAULT")}`,
          transition: `all ${theme("transitionDuration.normal")} ease-in-out`,
          "&:hover": {
            boxShadow: theme("boxShadow.md"),
          },
        },
        ".islamic-button": {
          padding: `${theme("spacing.sm")} ${theme("spacing.md")}`,
          borderRadius: theme("borderRadius.sm"),
          fontWeight: theme("fontWeight.medium"),
          fontSize: theme("fontSize.base[0]"),
          lineHeight: theme("fontSize.base[1].lineHeight"),
          transition: `all ${theme("transitionDuration.fast")} ease-in-out`,
          cursor: "pointer",
          border: "none",
          "&:focus": {
            outline: `2px solid ${theme("colors.primary.DEFAULT")}`,
            outlineOffset: "2px",
          },
          "&:disabled": {
            backgroundColor: theme("colors.disabled.bg"),
            color: theme("colors.disabled.DEFAULT"),
            cursor: "not-allowed",
          },
        },
        ".islamic-input": {
          padding: theme("spacing.sm"),
          borderRadius: theme("borderRadius.sm"),
          fontSize: theme("fontSize.base[0]"),
          lineHeight: theme("fontSize.base[1].lineHeight"),
          border: `1px solid ${theme("colors.border.DEFAULT")}`,
          backgroundColor: theme("colors.background.secondary"),
          color: theme("colors.text.DEFAULT"),
          transition: `all ${theme("transitionDuration.fast")} ease-in-out`,
          "&:focus": {
            borderColor: theme("colors.primary.DEFAULT"),
            boxShadow: `0 0 0 2px ${theme("colors.primary.DEFAULT")}20`,
            outline: "none",
          },
          "&:disabled": {
            backgroundColor: theme("colors.disabled.bg"),
            color: theme("colors.disabled.DEFAULT"),
            cursor: "not-allowed",
          },
        },
      });
    },
    tailwindcssAnimate,
  ],

  // Dark mode configuration (disabled for light-mode-only requirement)
  darkMode: ["class"], // Simplified for standard usage

  // Important prefix for CSS specificity
  important: false,

  // Separator for responsive/state prefixes
  separator: ":",

  // Prefix for all CSS classes
  prefix: "",

  // Core plugins configuration
  corePlugins: {
    preflight: true,
  },
};