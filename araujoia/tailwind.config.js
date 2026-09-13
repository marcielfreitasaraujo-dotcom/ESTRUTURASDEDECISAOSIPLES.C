/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#070a0a",
        alt: "#0d1211",
        surface: "#121918",
        ink: "#e8efec",
        muted: "#9aafa8",
        accent: "#3dbeb4",
        hover: "#5ad0c6",
      },
      fontFamily: {
        display: ["Syne", "sans-serif"],
        body: ["Outfit", "sans-serif"],
      },
      boxShadow: {
        glow: "0 18px 40px -18px rgba(61, 190, 180, 0.45)",
      },
      maxWidth: {
        site: "72rem",
      },
    },
  },
  plugins: [],
};
