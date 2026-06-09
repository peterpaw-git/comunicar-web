/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0faf4',
          100: '#dcf5e7',
          200: '#bbe9d1',
          500: '#3a8a5c',
          600: '#2e7049',
          700: '#245838',
        },
      },
    },
  },
  plugins: [],
};
