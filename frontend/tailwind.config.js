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

        primary: {
          50: '#f5f3f7',
          100: '#ebe7ef',
          200: '#d7cfe0',
          300: '#c3b7d0',
          400: '#b8a9c9',
          500: '#a67db8',
          600: '#956ba6',
          700: '#7f5a8f',
          800: '#694a78',
          900: '#533a61',
          950: '#3d2b4a',
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },

        secondary: {
          50: '#f7f9fc',
          100: '#eff3f8',
          200: '#dfe7f1',
          300: '#bfcfe3',
          400: '#9fb3d1',
          500: '#7f97bf',
          600: '#6b7fa0',
          700: '#566680',
          800: '#404d60',
          900: '#2b3440',
          950: '#151a20',
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
          DEFAULT: 'hsl(142 69% 50%)',
          foreground: 'hsl(150 15% 95%)',
        },
        warning: {
          DEFAULT: 'hsl(38 92% 50%)',
          foreground: 'hsl(217 17% 18%)',
        },
        error: {
          DEFAULT: 'hsl(0 84% 60%)',
          foreground: 'hsl(150 15% 95%)',
        },
        info: {
          DEFAULT: 'hsl(199 89% 48%)',
          foreground: 'hsl(150 15% 95%)',
        },

        // Financial colors
        financial: {
          income: 'hsl(142 69% 50%)',
          expense: 'hsl(0 84% 60%)',
          asset: 'hsl(199 89% 48%)',
          liability: 'hsl(38 92% 50%)',
          equity: 'hsl(271 76% 53%)',
        },
      },

      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },

      fontFamily: {
        sans: [
          'Inter',
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
    },
  },
  plugins: [],
}
