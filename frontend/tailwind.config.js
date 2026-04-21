/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#0F0E17',
        'bg-card': '#1A1828',
        'accent-purple': '#7C3AED',
        'accent-gold': '#F5A623',
        'text-primary': '#E8E8F0',
        'status-planned': '#3B82F6',
        'status-inprogress': '#7C3AED',
        'status-completed': '#10B981',
        'status-abandoned': '#6B7280',
      }
    }
  },
  plugins: []
}
