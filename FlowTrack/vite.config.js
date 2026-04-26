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
      },

      "/send_request": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },

      "/change_password": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },

      "/change_username": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },

      "/delete_categories": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },

      "/delete_tasks": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },

      "/get_quizzes": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    }
  }
})
