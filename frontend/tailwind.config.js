/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f4fe',
          100: '#dbe5fc',
          200: '#bfd2f9',
          300: '#94b3f5',
          400: '#648ef0',
          500: '#3b66e8', // Main brand cobalt blue
          600: '#2547d6',
          700: '#1d36c0',
          800: '#1c2e9b',
          900: '#1c2b7c',
          950: '#111749',
        },
        dark: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          650: '#1e293b', // Slate for dark mode cards
          700: '#0f172a', // Slate-900 background
          800: '#0b0f19',
          900: '#020617', // Pure dark background
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.05)',
        'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.25)',
      }
    },
  },
  plugins: [],
}
