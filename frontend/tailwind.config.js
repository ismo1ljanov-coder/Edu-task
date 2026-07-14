/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand palette: white / blue / green — kept intentionally restrained.
        brand: {
          blue: {
            50: '#eef5ff',
            100: '#d9e9ff',
            300: '#7fb3ff',
            500: '#2f6fed',
            600: '#2159c9',
            700: '#1a469e',
          },
          green: {
            50: '#eefcf3',
            100: '#d3f7e0',
            300: '#7ee0a6',
            500: '#1fb265',
            600: '#189251',
          },
          ink: '#0f172a',
          slate: '#64748b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 12px rgba(15, 23, 42, 0.06)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [],
};
