import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk for React and core libraries
          vendor: ['react', 'react-dom', 'react-router-dom'],
          // UI libraries chunk
          ui: [
            '@radix-ui/react-avatar',
            '@radix-ui/react-checkbox', 
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-label',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-select',
            '@radix-ui/react-slot',
            '@radix-ui/react-switch',
            '@radix-ui/react-tooltip'
          ],
          // Animation libraries chunk
          animations: ['framer-motion', 'motion', 'gsap', '@gsap/react'],
          // Icons and graphics chunk
          graphics: [
            'react-icons',
            'lucide-react',
            '@tabler/icons-react',
            '@splinetool/react-spline',
            '@splinetool/viewer',
            'ogl'
          ],
          // Utilities chunk
          utils: [
            'clsx',
            'tailwind-merge',
            'class-variance-authority',
            'usehooks-ts',
            '@tanstack/react-query'
          ]
        }
      }
    },
    // Increase chunk size warning threshold
    chunkSizeWarningLimit: 1000
  }
})

