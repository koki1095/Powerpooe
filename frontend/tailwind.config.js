/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#152e52',
          dark: '#0f223a',
          light: '#1e3f6e',
        },
        secondary: {
          DEFAULT: '#bb975d',
          dark: '#9a7d4a',
          light: '#d4b280',
        },
        background: '#0F172A',
        surface: {
          DEFAULT: '#1E293B',
          light: '#334155',
        },
        accent: '#5c647e',
        text: {
          primary: '#f5f6f4',
          secondary: '#94A3B8',
        },
        success: '#22C55E',
        error: '#EF4444',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
