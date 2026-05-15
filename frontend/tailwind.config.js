/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'deep-blue-dark': '#001f3f',
        'deep-blue-light': '#003366',
      },
    },
  },
  plugins: [],
}

