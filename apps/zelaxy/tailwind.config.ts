import type { Config } from 'tailwindcss'

export default {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    '!./app/node_modules/**',
    '!**/node_modules/**',
  ],
  theme: {
    extend: {
      fontFamily: {
        system: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      colors: {
        // Zelaxy Brand Colors
        'zelaxy-orange': {
          DEFAULT: '#F97316',
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#F97316',
          600: '#EA580C',
          700: '#C2410C',
          800: '#9A3412',
          900: '#7C2D12',
        },
        // Legacy class aliases (keep for existing Apple-prefixed classes)
        'apple-blue': '#F97316',
        'apple-purple': '#EA580C',
        'apple-pink': '#FB923C',
        'apple-green': '#22C55E',
        'apple-orange': '#F97316',
        'apple-red': '#EF4444',
        'apple-gray': {
          DEFAULT: '#6B7280',
          2: '#9CA3AF',
          3: '#D1D5DB',
          4: '#E5E7EB',
          5: '#F3F4F6',
          6: '#F9FAFB',
        },
        // Original theme colors
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
        },
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.75rem' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
        '7xl': ['4.5rem', { lineHeight: '1' }],
        '8xl': ['6rem', { lineHeight: '1' }],
        '9xl': ['8rem', { lineHeight: '1' }],
      },
      gradient: {
        primary: 'hsl(var(--gradient-primary))',
        secondary: 'hsl(var(--gradient-secondary))',
      },
      fontWeight: {
        medium: '460',
        semibold: '540',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      transitionProperty: {
        width: 'width',
        left: 'left',
        padding: 'padding',
      },
      keyframes: {
        'slide-down': {
          '0%': {
            transform: 'translate(-50%, -100%)',
            opacity: '0',
          },
          '100%': {
            transform: 'translate(-50%, 0)',
            opacity: '1',
          },
        },
        'notification-slide': {
          '0%': {
            opacity: '0',
            transform: 'translateY(-100%)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        'notification-fade-out': {
          '0%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
          '100%': {
            opacity: '0',
            transform: 'translateY(0)',
          },
        },
        'fade-up': {
          '0%': {
            opacity: '0',
            transform: 'translateY(10px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        'rocket-pulse': {
          '0%, 100%': {
            opacity: '1',
          },
          '50%': {
            opacity: '0.7',
          },
        },
        'run-glow': {
          '0%, 100%': {
            filter: 'opacity(1)',
          },
          '50%': {
            filter: 'opacity(0.7)',
          },
        },
        'caret-blink': {
          '0%,70%,100%': {
            opacity: '1',
          },
          '20%,50%': {
            opacity: '0',
          },
        },
        'pulse-slow': {
          '0%, 100%': {
            opacity: '1',
          },
          '50%': {
            opacity: '0.7',
          },
        },
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
        // Zelaxy keyframes
        'float-up': {
          '0%': {
            opacity: '0',
            transform: 'translateY(20px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        'float-in-left': {
          '0%': {
            opacity: '0',
            transform: 'translateX(-20px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateX(0)',
          },
        },
        'float-in-right': {
          '0%': {
            opacity: '0',
            transform: 'translateX(20px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateX(0)',
          },
        },
        'scale-in': {
          '0%': {
            opacity: '0',
            transform: 'scale(0.9)',
          },
          '100%': {
            opacity: '1',
            transform: 'scale(1)',
          },
        },
        'pulse-glow': {
          '0%, 100%': {
            boxShadow: '0 0 0 0 rgba(249, 115, 22, 0.4)',
          },
          '50%': {
            boxShadow: '0 0 0 10px rgba(249, 115, 22, 0)',
          },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(400%)' },
        },
      },
      animation: {
        'slide-down': 'slide-down 0.3s ease-out',
        'notification-slide': 'notification-slide 0.3s ease-out forwards',
        'notification-fade-out': 'notification-fade-out 0.2s ease-out forwards',
        'fade-up': 'fade-up 0.5s ease-out forwards',
        'rocket-pulse': 'rocket-pulse 1.5s ease-in-out infinite',
        'run-glow': 'run-glow 2s ease-in-out infinite',
        'caret-blink': 'caret-blink 1.25s ease-out infinite',
        'pulse-slow': 'pulse-slow 3s ease-in-out infinite',
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        // Zelaxy animations
        'float-up': 'float-up 0.6s ease-out',
        'float-in-left': 'float-in-left 0.6s ease-out',
        'float-in-right': 'float-in-right 0.6s ease-out',
        'scale-in': 'scale-in 0.4s ease-out',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        shimmer: 'shimmer 1.2s ease-in-out infinite',
      },
      backdropBlur: {
        apple: '20px',
      },
      boxShadow: {
        apple: '0 4px 16px 0 rgba(0, 0, 0, 0.12), 0 4px 20px 0 rgba(0, 0, 0, 0.08)',
        'apple-lg': '0 8px 32px 0 rgba(0, 0, 0, 0.12), 0 8px 40px 0 rgba(0, 0, 0, 0.08)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config
