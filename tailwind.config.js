/** @type {import('tailwindcss').Config} */

module.exports = {
  darkMode: "media",
  content: ["./src/**/*.{js,ts,jsx,tsx}", "./src/index.html"],
  theme: {
    extend: {
      colors: {
        "dark-grey": "#2F2F2F",
        grey: "#606060",
        "light-grey-1": "#909090",
        "light-grey-2": "#B3B3B3",
        "light-grey-3": "#ECECEC",
        "light-grey-4": "#F7F7F7",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out forwards",
      },
    },
  },
  plugins: [],
};
