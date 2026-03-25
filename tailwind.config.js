/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
    './src/pages/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        'clash': ['Clash Display', 'sans-serif'],
        'epilogue': ['Epilogue', 'sans-serif'],
      },
      colors: {
        'court': {
          'dark': '#0f1f0f',
          'sidebar': '#152515',
          'card': '#1a3020',
          'card-border': '#2d5a35',
          'mid': '#2d5a27',
          'bright': '#3d7a32',
          'lime': '#7dc142',
          'accent': '#a8d84e',
          'text': '#e8f5e0',
          'muted': '#7aaa6a',
          'yellow': '#f0c040',
          'red': '#dc2626',
        },
      },
    },
    colorSpace: 'srgb',
  },
  plugins: [],
};