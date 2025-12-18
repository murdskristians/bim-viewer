import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'three': ['three'],
          'web-ifc': ['web-ifc', 'web-ifc-three'],
          'mui': ['@mui/material', '@mui/icons-material'],
        },
      },
    },
  },
  optimizeDeps: {
    exclude: ['web-ifc'],
  },
})
