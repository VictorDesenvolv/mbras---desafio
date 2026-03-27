/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        neo: {
          bg: "#E8E4DC",
          card: "#FFFFFF",
          black: "#000000",
          pink: "#FF6B9D",
          blue: "#4DAAFC",
          yellow: "#FFD43B",
          green: "#51CF66",
          red: "#FF6B6B",
          purple: "#CC5DE8",
          orange: "#FF922B",
          lime: "#A9E34B",
          cyan: "#22B8CF",
        },
      },
    },
  },
  plugins: [],
};
