/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3B82F6',
          dark: '#1E40AF',
        },
        secondary: {
          DEFAULT: '#10B981',
          dark: '#065F46',
        },
        background: {
          light: '#FFFFFF',
          dark: '#111827',
        },
        surface: {
          light: '#F3F4F6',
          dark: '#1F2937',
        },
        text: {
          light: '#111827',
          dark: '#F9FAFB',
        }
      },
    },
  },
  plugins: [],
};
