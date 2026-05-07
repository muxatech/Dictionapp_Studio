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
          DEFAULT: '#0C2F39',
          dark: '#155263',
          light: '#1E758D',
        },
        accent: {
          DEFAULT: '#FFC93C',
          dark: '#FFBB09',
          light: '#FFD76F',
        },
      },
    },
  },
  plugins: [],
}