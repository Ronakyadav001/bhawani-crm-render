/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#f4f0e7",
        cream2: "#ebe5d8",
        sage: "#dce9d3",
        sage2: "#b9d0aa",
        moss: "#44643d",
        deep: "#22351f",
        ink: "#171814",
        muted: "#6e7468",
        line: "#17181421",
        soft: "#fffaf2",
        clay: "#a66b52",
        marigold: "#d8b765"
      },
      boxShadow: {
        glass: "0 18px 60px rgba(34, 53, 31, 0.12)",
        soft: "0 10px 30px rgba(34, 53, 31, 0.08)"
      },
      borderRadius: {
        crm: "8px"
      }
    },
  },
  plugins: [],
}
