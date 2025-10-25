/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',  // ← agrega ts/tsx por compatibilidad futura
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          100:'#f4e9ff',
          200:'#e6d4ff',
          300:'#c9a9ff',
          400:'#a87aff',
          500:'#8a4dff',
          600:'#6c2fff',
          700:'#551fcf',
          800:'#3c1594',
          900:'#250b5a',
        },
      },
    },
  },
  plugins: [],
}