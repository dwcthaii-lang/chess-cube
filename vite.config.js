import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Luôn dùng cổng 5175 cho cả dev lẫn bản chạy chính thức:
// dữ liệu học trong trình duyệt gắn với địa chỉ http://localhost:5175
export default defineConfig({
  base: './', // đường dẫn tương đối: chạy được ở localhost lẫn GitHub Pages/Netlify
  plugins: [react()],
  worker: { format: 'es' }, // cubing.js tạo scramble trong Web Worker dạng ES module
  build: { target: 'es2022' },
  server: { port: 5175, strictPort: true, open: true },
  preview: { port: 5175, strictPort: true, open: true },
})
