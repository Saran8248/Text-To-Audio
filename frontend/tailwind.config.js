/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        void: {
          950: '#0a0a0a',
          900: '#111111',
          800: '#1a1a1a',
          700: '#262626',
        },
        ember: {
          50: '#fff9ed',
          100: '#ffefd3',
          200: '#ffdfa6',
          300: '#ffc86d',
          400: '#ffa62e',
          500: '#ff8605',
          600: '#f06400',
          700: '#cc4a02',
          800: '#a13b0b',
          900: '#82320c',
          950: '#461604',
        },
        crimson: {
          500: '#dc2626',
          600: '#b91c1c',
        },
        dark: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
          950: '#030712',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'liquid-fire': 'linear-gradient(135deg, #f06400 0%, #dc2626 50%, #f06400 100%)',
      },
      backgroundSize: {
        '300%': '300% 300%',
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glow-ember': '0 0 20px rgba(240, 100, 0, 0.5)',
        'glow-crimson': '0 0 30px rgba(220, 38, 38, 0.4)',
        'glow-sm': '0 0 10px rgba(240, 100, 0, 0.2)',
      },
      animation: {
        'pulse-amber': 'pulse-amber 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'liquid-ripple': 'liquid-ripple 3s ease-in-out infinite',
        'heat-reveal': 'heat-reveal 1s cubic-bezier(0.4, 0, 0.2, 1) forwards',
      },
      keyframes: {
        'pulse-amber': {
          '0%, 100%': { opacity: 1, filter: 'brightness(1)' },
          '50%': { opacity: .8, filter: 'brightness(1.2)' },
        },
        'liquid-ripple': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        'heat-reveal': {
          '0%': { opacity: 0, transform: 'scale(0.95)', filter: 'brightness(2) contrast(1.5)' },
          '100%': { opacity: 1, transform: 'scale(1)', filter: 'brightness(1) contrast(1)' },
        },
      },
    },
  },
  plugins: [],
};
