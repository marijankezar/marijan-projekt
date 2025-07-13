import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class', // oder 'media' für automatische Systemerkennung
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
        
  animation: {
    moveLine: "moveLine 2s linear infinite",
  },
  keyframes: {
    moveLine: {
      "0%": { transform: "translateX(-100%)" },
      "100%": { transform: "translateX(100%)" },
    },
  },
    },
  },
  plugins: [],
};

export default config;

