/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        teal: { DEFAULT: '#14bcbd', dark: '#0e9a9b' },
        green: { nalu: '#00d395' },
        red:   { nalu: '#ff4560' },
        navy:  { 900: '#080c14', 800: '#0d1220', 700: '#0f1623', 600: '#161e2e' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
};
