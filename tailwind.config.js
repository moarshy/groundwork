const { fontFamily } = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"], // Recommended by Shadcn/ui
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // Your custom brand colors
        'primary-dark': '#111827', // Our dark base
        'accent-blue': '#3B82F6', // Our secondary accent
        'electric-blue': '#7DF9FF',
        'bright-purple': '#8B5CF6', // Tailwind's purple-500
        'cool-teal': '#4FD1C5',
        'cyber-green': '#34D399', // Tailwind's emerald-400
        'neutral-text-primary': '#F3F4F6',
        'neutral-text-secondary': '#9CA3AF',
        'card-bg': '#1F2937',

        // Shadcn UI colors (referencing CSS variables from globals.css)
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))", // Ensure --destructive-foreground is in globals.css
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      backgroundImage: theme => ({
        'gradient-primary': `linear-gradient(120deg, ${theme('colors.electric-blue')} 0%, ${theme('colors.bright-purple')} 100%)`,
        'gradient-secondary': `linear-gradient(to bottom, ${theme('colors.cool-teal')} 0%, ${theme('colors.cyber-green')} 100%)`,
      }),
      fontFamily: {
        sans: ['Inter', ...fontFamily.sans], // Add Inter as primary sans
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

