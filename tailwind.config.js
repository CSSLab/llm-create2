/** @type {import('tailwindcss').Config} */

module.exports = {
  darkMode: 'media',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dark-grey': '#2F2F2F',
        'grey': '#606060',
        'light-grey-1': '#909090',
        'light-grey-2': '#B3B3B3',
        'light-grey-3': '#ECECEC',
        'light-grey-4': '#F7F7F7',
      }
    },
  },
  plugins: [],
}