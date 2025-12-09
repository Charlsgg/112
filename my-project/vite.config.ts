import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),        // <--- Essential: Compiles your React code
    tailwindcss(),  // <--- Your Tailwind setup
  ],
  base: './',       // <--- Essential: Makes paths relative so Electron can find your assets
  server: {
    open: false,    // <--- Stops the browser (Chrome/Edge) from auto-opening
    port: 5173,     // <--- Keeps the port consistent
  }
})