/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Mukta', 'system-ui', 'sans-serif'] },
      colors: {
        leaf: { 50: '#eef6ee', 100: '#d6ead8', 200: '#b0d5b5', 500: '#3f8a4d', 600: '#2f6b3a', 700: '#245530', 800: '#1b4126' },
        turmeric: { 100: '#fdf0cf', 400: '#efb52c', 500: '#e29d0b', 600: '#c08007' },
        soil: { 600: '#6b4a2f', 700: '#553a25' },
        ink: '#17241b',
        field: '#f5f8f2',
      },
    },
  },
  plugins: [],
};
