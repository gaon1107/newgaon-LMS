import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: process.env.VERCEL ? '/' : (process.env.NODE_ENV === 'production' ? '/newgaon-LMS-master/' : '/'),
  
  server: {
    port: 3000,
    host: true, // 외부 접근 허용
    proxy: {
      '/api': {
        target: 'http://localhost:5002',
        changeOrigin: true,
        secure: false
      }
    }
  },
  
  build: {
    outDir: 'dist', // GitHub Pages 표준 폴더명
    assetsDir: 'assets',
    sourcemap: false, // 프로덕션에서 소스맵 제거
    rollupOptions: {
      output: {
        manualChunks: {
          // 큰 라이브러리들을 별도 청크로 분리
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom']
        }
      }
    }
  },
  
  // GitHub Pages용 추가 최적화
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },
  
  // CSS 처리 최적화
  css: {
    devSourcemap: true
  }
})
