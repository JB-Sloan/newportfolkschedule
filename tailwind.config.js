/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#17231d",
        paper: "#fff9ec",
        bay: "#126a73",
        harbor: "#1f7a8c",
        fort: "#0f766e",
        quad: "#9a5a1f",
        sunset: "#e06d3d"
      },
      boxShadow: {
        soft: "0 18px 60px rgba(23, 35, 29, 0.14)"
      }
    }
  },
  plugins: []
};