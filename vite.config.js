import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    allowedHosts: ['preview.zkai.top']
  },
  preview: {
    allowedHosts: ['preview.zkai.top']
  }
})
