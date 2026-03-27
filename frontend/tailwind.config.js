/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        accent: '#E65252',
        'accent-green': '#52E6A3',
        'accent-blue': '#5284E6',
        'accent-cyan': '#0CD5EB',
      },
    },
  },
  plugins: [],
}
