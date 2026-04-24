module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-base': '#0c0c0c',
        'bg-surface': '#1a1c23',
        'accent-cyan': '#00d2ff',
        'accent-blue': '#2196F3',
        'text-muted': '#a0a0a0',
      },
      fontFamily: {
        'outfit': ['Outfit', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
