import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ifc: {
          blue: {
            DEFAULT: '#003366',
            50: '#e6f0ff',
            100: '#b3d1ff',
            200: '#80b3ff',
            300: '#4d94ff',
            400: '#1a75ff',
            500: '#003366',
            600: '#002952',
            700: '#001f3d',
            800: '#001429',
            900: '#000a14',
          },
          red: {
            DEFAULT: '#E30613',
            light: '#ff3344',
            dark: '#b30510',
          },
          gold: '#d4af37',
        },
      },
      fontFamily: {
        khmer: ['Khmer', 'Noto Sans Khmer', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'chat': '0 10px 40px -10px rgba(0, 51, 102, 0.3)',
        'chat-hover': '0 20px 50px -15px rgba(0, 51, 102, 0.4)',
        'button': '0 4px 15px rgba(0, 51, 102, 0.3)',
        'button-hover': '0 6px 20px rgba(0, 51, 102, 0.4)',
      },
      animation: {
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
        'bounce-in': 'bounceIn 0.5s ease-out',
        'pulse-ring': 'pulseRing 2s ease-out infinite',
        'typing': 'typing 1.4s ease-in-out infinite',
      },
      keyframes: {
        slideUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          from: { opacity: '0', transform: 'translateY(-10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        bounceIn: {
          '0%': { opacity: '0', transform: 'scale(0.3)' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseRing: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(1.5)', opacity: '0' },
        },
        typing: {
          '0%, 60%, 100%': { transform: 'translateY(0)' },
          '30%': { transform: 'translateY(-4px)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};

export default config;
