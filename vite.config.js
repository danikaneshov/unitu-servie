import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { analyzeImage } from './api/analyze-handler.js'

function apiPlugin(apiKey) {
  return {
    name: 'api-analyze',
    configureServer(server) {
      server.middlewares.use('/api/analyze', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }

        let body = ''
        req.on('data', chunk => { body += chunk })
        req.on('end', async () => {
          try {
            const { imageUrl, item1Name, item2Name } = JSON.parse(body)
            if (!imageUrl) {
              res.statusCode = 400
              res.end(JSON.stringify({ error: 'Нет ссылки на изображение' }))
              return
            }

            if (!apiKey) {
              res.statusCode = 500
              res.end(JSON.stringify({ error: 'API ключ не настроен. Добавь GEMINI_API_KEY в .env.local' }))
              return
            }

            const result = await analyzeImage(imageUrl, apiKey, item1Name, item2Name)
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(result))
          } catch (err) {
            console.error('Gemini error:', err)
            res.statusCode = 500
            res.end(JSON.stringify({ error: 'Ошибка анализа', details: err.message }))
          }
        })
      })
    }
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), apiPlugin(env.GEMINI_API_KEY)],
    build: {
      chunkSizeWarningLimit: 3000,
    },
  }
})