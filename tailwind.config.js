/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        kanban: {
          light: '#DDE8F0',
          soft: '#A8C9DB',
          muted: '#7DB2CD',
          primary: '#529CBE',
          dark: '#244575'
        }
      }
    },
  },
  plugins: [],
}
