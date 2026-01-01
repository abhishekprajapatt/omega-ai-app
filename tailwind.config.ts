import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        head: ['Syne', 'sans-serif'],
      },
      colors: {
        lux: {
          bg: '#0B0C0D',
          surface: '#121316',
          sidebar: '#0F1112',
          input: '#17181A',
          text: '#ECECEC',
          muted: '#A7A9AC',
          gold: '#D4AF37',
          goldDark: '#C9A334',
          copper: '#C77B40',
        },
      },
      boxShadow: {
        gold: '0 10px 25px rgba(212,175,55,0.15)',
        card: '0 6px 20px rgba(0,0,0,0.6)',
      },
      borderRadius: {
        lux: '14px',
      },
      blur: {
        lux: '6px',
      },
    },
  },
  plugins: [],
};

export default config;
