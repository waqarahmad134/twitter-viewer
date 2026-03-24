/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}", "./src/**/*.mdx"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["DM Sans", "system-ui", "sans-serif"],
        display: ["Outfit", "system-ui", "sans-serif"],
      },
      colors: {
        x: {
          black: "#0f1419",
          gray: "#536471",
          border: "#cfd9de",
          blue: "#1d9bf0",
          light: "#f7f9f9",
        },
      },
    },
  },
  plugins: [],
};

