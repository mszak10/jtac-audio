/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{ts,tsx,html}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
      colors: {
        ink: {
          900: '#0b0d10',
          800: '#15181d',
          700: '#1f242b',
          600: '#2a313a',
          500: '#4a5260',
          400: '#7a8392',
          300: '#aab3c1',
          200: '#d3d8e0',
          100: '#eef0f4',
        },
        accent: {
          500: '#5b8cff',
          400: '#7aa3ff',
        },
        left: '#3ea66a',
        right: '#e0843a',
      },
      borderRadius: {
        DEFAULT: '0.5rem',
      },
    },
  },
  plugins: [],
};
