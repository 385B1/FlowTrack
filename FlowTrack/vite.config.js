import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

// const url = "jsb-por2vjezba.giize.com";
const url = "127.0.0.1:8000";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],

  server: {
    proxy: {
      "/login": {
        target: `http://${url}`,
        changeOrigin: true,
      },
      "/add_categories": {
        target: `http://${url}`,
        changeOrigin: true,
      },
      "/get_category": {
        target: `http://${url}`,
        changeOrigin: true,
      },
      "/add_category": {
        target: `http://${url}`,
        changeOrigin: true,
      },
      "/remove_category": {
        target: `http://${url}`,
        changeOrigin: true,
      },
      "/get_categories": {
        target: `http://${url}`,
        changeOrigin: true,
      },
      "/get_tasks": {
        target: `http://${url}`,
        changeOrigin: true,
      },
      "/logout": {
        target: `http://${url}`,
        changeOrigin: true,
      },
      "/signup": {
        target: `http://${url}`,
        changeOrigin: true,
      },

      "/send_request": {
        target: `http://${url}`,
        changeOrigin: true,
      },

      "/change_password": {
        target: `http://${url}`,
        changeOrigin: true,
      },

      "/change_username": {
        target: `http://${url}`,
        changeOrigin: true,
      },

      "/delete_categories": {
        target: `http://${url}`,
        changeOrigin: true,
      },

      "/delete_tasks": {
        target: `http://${url}`,
        changeOrigin: true,
      },

      "/get_quizzes": {
        target: `http://${url}`,
        changeOrigin: true,
      },
      "/add_task": {
        target: `http://${url}`,
        changeOrigin: true,
      },
      "/get_files": {
        target: `http://${url}`,
        changeOrigin: true,
      },
      "/get_file": {
        target: `http://${url}`,
        changeOrigin: true,
      },
      "/change_task_field": {
        target: `http://${url}`,
        changeOrigin: true,
      },
      "/delete_task": {
        target: `http://${url}`,
        changeOrigin: true,
      },
      "/add_files": {
        target: `http://${url}`,
        changeOrigin: true,
      },
      "/delete_file": {
        target: `http://${url}`,
        changeOrigin: true,
      },
      "/update_category": {
        target: `http://${url}`,
        changeOrigin: true,
      },
      "/update_streak": {
        target: `http://${url}`,
        changeOrigin: true,
      },
      "/get_achievements": {
        target: `http://${url}`,
        changeOrigin: true,
      },
      "/get_user_achievements": {
        target: `http://${url}`,
        changeOrigin: true,
      },
      "/get_achievement_categories": {
        target: `http://${url}`,
        changeOrigin: true,
      },
      "/update_time_achievement": {
        target: `http://${url}`,
        changeOrigin: true,
      },
      "/update_streak_achievement": {
        target: `http://${url}`,
        changeOrigin: true,
      },

      "/update_task_achievement": {
        target: `http://${url}`,
        changeOrigin: true,
      },
      "/update_completed_task_achievement": {
        target: `http://${url}`,
        changeOrigin: true,
      },
      "/get_user_data_by_table": {
        target: `http://${url}`,
        changeOrigin: true,
      },
      "/add_xp": {
        target: `http://${url}`,
        changeOrigin: true,
      },
      "/add_goal": {
        target: `http://${url}`,
        changeOrigin: true,
      },
      "/get_goals": {
        target: `http://${url}`,
        changeOrigin: true,
      },
      "/remove_goal": {
        target: `http://${url}`,
        changeOrigin: true,
      },
      "/goal_update": {
        target: `http://${url}`,
        changeOrigin: true,
      },

    }
  }
})
