export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      keyframes: {
        slideUp: {
          "0%": { opacity: 0, transform: "translateY(40px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        glow: {
          "0%": { opacity: 0.4 },
          "100%": { opacity: 0.8 },
        },
      },
      animation: {
        slideUp: "slideUp 0.8s ease-out",
        glow: "glow 2s ease-in-out infinite alternate",
      },
    },
  },
  plugins: [],
};
