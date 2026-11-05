import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// En développement (npm run dev) et en prévisualisation (npm run preview), les requêtes /api sont relayées par
// Vite vers VITE_PROXY_TARGET : le navigateur ne parle qu'à sa propre adresse, il n'y a donc pas de souci de CORS.
//   local     : VITE_PROXY_TARGET=http://localhost:3001           (défaut)
//   en ligne  : VITE_PROXY_TARGET=https://edvia-backend.onrender.com
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxy = { '/api': { target: env.VITE_PROXY_TARGET || 'http://localhost:3001', changeOrigin: true, secure: true } }
  return { plugins: [react()], base: './', server: { proxy }, preview: { proxy } }
})
