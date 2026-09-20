import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        surface: '#fcf9f8',
        'surface-container': '#f0eded',
        'surface-container-low': '#f6f3f2',
        'surface-container-high': '#eae7e7',
        'on-surface': '#1b1c1c',
        'on-surface-variant': '#4d4447',
        primary: '#6b5a5f',
        'primary-container': '#f8e1e7',
        secondary: '#735c00',
        'secondary-container': '#fed65b',
        outline: '#d0c3c6',
        cream: '#eae7e7',
      },
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        body: ['var(--font-body)', 'sans-serif'],
      },
      maxWidth: {
        page: '1280px',
      },
      borderRadius: {
        card: '1.5rem',
      },
      boxShadow: {
        soft: '0 20px 50px -12px rgba(107, 90, 95, 0.08)',
      },
    },
  },
  plugins: [],
};

export default config;
