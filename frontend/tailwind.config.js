/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',

        // Ink/stone scale -- replaces the previous purple primary
        primary: {
          50: '#f6f4f1',
          100: '#eae6df',
          200: '#d3ccc0',
          300: '#b0a596',
          400: '#867a6b',
          500: '#635a4d',
          600: '#4a4235',
          700: '#3a3328',
          800: '#2a251d',
          900: '#1e1a15',
          950: '#1b2029',
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },

        secondary: {
          50: '#faf8f5',
          100: '#f2eee7',
          200: '#e4dccd',
          300: '#d1c4ac',
          400: '#b8a684',
          500: '#9c8865',
          600: '#7d6c4f',
          700: '#5f513c',
          800: '#41372a',
          900: '#251f18',
          950: '#14110d',
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },

        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },

        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },

        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },

        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },

        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },

        // Semantic colors
        success: {
          DEFAULT: 'hsl(95 30% 32%)',
          foreground: 'hsl(36 25% 97%)',
        },
        warning: {
          DEFAULT: 'hsl(35 65% 45%)',
          foreground: 'hsl(220 20% 14%)',
        },
        error: {
          DEFAULT: 'hsl(6 55% 44%)',
          foreground: 'hsl(36 25% 97%)',
        },
        info: {
          DEFAULT: 'hsl(205 35% 40%)',
          foreground: 'hsl(36 25% 97%)',
        },

        // Financial colors
        financial: {
          income: 'hsl(95 30% 32%)',
          expense: 'hsl(6 55% 44%)',
          asset: 'hsl(205 35% 40%)',
          liability: 'hsl(35 65% 45%)',
          equity: 'hsl(260 12% 40%)',
        },
      },

      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },

      fontFamily: {
        display: [
          '"Instrument Serif"',
          'ui-serif',
          'Georgia',
          'serif',
        ],
        sans: [
          '"Plus Jakarta Sans"',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        mono: [
          'JetBrains Mono',
          'Menlo',
          'Monaco',
          'Consolas',
          'Liberation Mono',
          'Courier New',
          'monospace',
        ],
      },

      transitionTimingFunction: {
        estate: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
}
