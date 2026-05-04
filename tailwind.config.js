/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans:    ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary:  '#4CAF72',
        'primary-light': '#81C784',
        'primary-dark':  '#2E7D32',
        gold:     '#C8962E',
        'gold-light': '#E6B84A',
        surface:  '#122012',
        'surface-container': 'rgba(255,255,255,0.04)',
      },
      spacing: {
        xs: '4px', sm: '8px', md: '16px', lg: '24px', xl: '32px', '2xl': '48px',
      },
      maxWidth: {
        desktop: '1440px',
        content: '1280px',
      },
      screens: {
        xs: '375px',
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
