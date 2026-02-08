/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', "sans-serif"],
        body: ['"IBM Plex Sans"', "sans-serif"],
      },
      colors: {
        canvas: "#f8f7f2",
        ink: "#1f2124",
        ember: "#e95d38",
        mint: "#22a66f",
        ocean: "#106a9c",
      },
    },
  },
  plugins: [],
};
