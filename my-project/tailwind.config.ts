import type { Config } from 'tailwindcss'

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        bbt: ['"BBTMartires"', 'sans-serif'], 
      },
      colors: {
        filipinoBlue: '#0038A8',
        filipinoRed: '#CE1126',
        filipinoYellow: '#FCD116',
      },
    },
  },
  plugins: [],
}

export default config
