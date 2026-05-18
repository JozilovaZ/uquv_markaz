/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#f3eeff',
          100: '#e4d4ff',
          200: '#ccadff',
          300: '#aa78ff',
          400: '#8b45ff',
          500: '#945CE9',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          DEFAULT: '#945CE9',
        },
        surface: {
          DEFAULT: 'rgb(var(--color-surface) / <alpha-value>)',
          card:    'rgb(var(--color-surface-card) / <alpha-value>)',
          border:  'rgb(var(--color-surface-border) / <alpha-value>)',
          hover:   'rgb(var(--color-surface-hover) / <alpha-value>)',
        },
        accent: {
          blue: '#3b82f6',
          green: '#10b981',
          yellow: '#f59e0b',
          red: '#ef4444',
          cyan: '#06b6d4',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #945CE9 0%, #6d28d9 100%)',
        'gradient-card': 'linear-gradient(135deg, rgba(148,92,233,0.1) 0%, rgba(109,40,217,0.05) 100%)',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(148, 92, 233, 0.3)',
        'glow-lg': '0 0 40px rgba(148, 92, 233, 0.4)',
        'card': '0 4px 24px rgba(0,0,0,0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'pulse-slow': 'pulse 3s infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        slideIn: { from: { transform: 'translateX(-100%)' }, to: { transform: 'translateX(0)' } },
      }
    },
  },
  plugins: [],
}
