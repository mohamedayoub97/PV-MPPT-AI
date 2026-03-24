/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        outfit: ['Outfit', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        dark: '#030303',
        gray: {
          900: '#111',
          800: '#222',
        },
        primary: {
          blue: '#2563eb', 
          cyan: '#06b6d4',
          teal: '#14b8a6',
        },
        accent: {
          orange: '#f97316',
          purple: '#a855f7',
          pink: '#ec4899'
        }
      },
      backgroundImage: {
        'glow-mesh': 'radial-gradient(at 0% 0%, rgba(3,3,3,1) 0, transparent 50%), radial-gradient(at 100% 0%, rgba(37,99,235,0.15) 0, transparent 50%), radial-gradient(at 0% 100%, rgba(249,115,22,0.1) 0, transparent 50%)',
      }
    },
  },
  plugins: [],
}
