import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],

  server: {
    proxy: {
      "/login": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
      "/add_categories": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
      "/get_categories": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
        "/logout": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
        "/signup": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      }
    }
  }
})
