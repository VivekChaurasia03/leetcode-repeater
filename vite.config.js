import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const DATA_FILE = join(__dirname, 'data.json')

const LC_GRAPHQL = 'https://leetcode.com/graphql'
const LC_QUERY = `query($filters: QuestionListFilterInput) {
  questionList(categorySlug: "" limit: 3 skip: 0 filters: $filters) {
    data { questionFrontendId title titleSlug difficulty topicTags { name } }
  }
}`

function apiPlugin() {
  return {
    name: 'api-plugin',
    configureServer(server) {
      // ── /api/problem/:number  (server-side proxy — no CORS issues) ──
      server.middlewares.use('/api/problem', async (req, res) => {
        const number = req.url.replace(/^\//, '').split('?')[0]
        res.setHeader('Content-Type', 'application/json')

        if (!number || isNaN(number)) {
          res.statusCode = 400
          res.end(JSON.stringify({ error: 'Invalid number' }))
          return
        }

        try {
          const response = await fetch(LC_GRAPHQL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'Referer': 'https://leetcode.com/problemset/',
            },
            body: JSON.stringify({
              query: LC_QUERY,
              variables: { filters: { searchKeywords: String(number) } },
            }),
            signal: AbortSignal.timeout(10000),
          })

          if (response.status === 429) {
            res.statusCode = 429
            res.end(JSON.stringify({ error: 'LeetCode rate limited — try again shortly' }))
            return
          }
          if (!response.ok) {
            res.statusCode = 502
            res.end(JSON.stringify({ error: 'LeetCode API error' }))
            return
          }

          const json = await response.json()
          const questions = json?.data?.questionList?.data ?? []
          const match = questions.find(q => String(q.questionFrontendId) === String(number))

          if (!match) {
            res.statusCode = 404
            res.end(JSON.stringify({ error: 'Problem not found' }))
            return
          }

          res.end(JSON.stringify({
            number: parseInt(number, 10),
            title: match.title,
            difficulty: match.difficulty,
            slug: match.titleSlug,
            tags: match.topicTags.map(t => t.name),
            url: `https://leetcode.com/problems/${match.titleSlug}/`,
          }))
        } catch {
          res.statusCode = 502
          res.end(JSON.stringify({ error: 'Could not reach LeetCode' }))
        }
      })

      // ── /api/add-user  (add a user to data.json) ──
      // Requires ADMIN_SECRET env var (defaults to 'admin' in dev if unset).
      server.middlewares.use('/api/add-user', (req, res) => {
        res.setHeader('Content-Type', 'application/json')
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }
        let body = ''
        req.on('data', chunk => { body += chunk })
        req.on('end', () => {
          try {
            const { name, passcode, adminSecret } = JSON.parse(body)
            const expectedSecret = process.env.ADMIN_SECRET || 'admin'

            if (adminSecret !== expectedSecret) {
              res.statusCode = 401
              res.end(JSON.stringify({ error: 'Invalid admin secret.' }))
              return
            }

            const trimmedName = name?.trim()
            if (!trimmedName) {
              res.statusCode = 400
              res.end(JSON.stringify({ error: 'Name is required.' }))
              return
            }

            if (typeof passcode !== 'string' || passcode.length !== 4 || !/^\d{4}$/.test(passcode)) {
              res.statusCode = 400
              res.end(JSON.stringify({ error: 'Passcode must be exactly 4 digits.' }))
              return
            }

            const data = JSON.parse(readFileSync(DATA_FILE, 'utf-8'))
            if (data.users.find(u => u.name.toLowerCase() === trimmedName.toLowerCase())) {
              res.statusCode = 400
              res.end(JSON.stringify({ error: `User "${trimmedName}" already exists.` }))
              return
            }

            data.users.push({ name: trimmedName, passcode: String(passcode), questions: [] })
            writeFileSync(DATA_FILE, JSON.stringify(data, null, 2))
            res.end(JSON.stringify({ success: true, name: trimmedName }))
          } catch {
            res.statusCode = 500
            res.end(JSON.stringify({ error: 'Server error' }))
          }
        })
      })

      // ── /api/delete-user  (remove a user from data.json) ──
      server.middlewares.use('/api/delete-user', (req, res) => {
        res.setHeader('Content-Type', 'application/json')
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }
        let body = ''
        req.on('data', chunk => { body += chunk })
        req.on('end', () => {
          try {
            const { name, adminSecret } = JSON.parse(body)
            const expectedSecret = process.env.ADMIN_SECRET || 'admin'

            if (adminSecret !== expectedSecret) {
              res.statusCode = 401
              res.end(JSON.stringify({ error: 'Invalid admin secret.' }))
              return
            }

            const trimmedName = name?.trim()
            if (!trimmedName) {
              res.statusCode = 400
              res.end(JSON.stringify({ error: 'Name is required.' }))
              return
            }

            const data = JSON.parse(readFileSync(DATA_FILE, 'utf-8'))
            const before = data.users.length
            data.users = data.users.filter(
              u => u.name.toLowerCase() !== trimmedName.toLowerCase()
            )

            if (data.users.length === before) {
              res.statusCode = 404
              res.end(JSON.stringify({ error: `User "${trimmedName}" not found.` }))
              return
            }

            writeFileSync(DATA_FILE, JSON.stringify(data, null, 2))
            res.end(JSON.stringify({ success: true, name: trimmedName }))
          } catch {
            res.statusCode = 500
            res.end(JSON.stringify({ error: 'Server error' }))
          }
        })
      })

      // ── /api/data  (read / write data.json) ──
      server.middlewares.use('/api/data', (req, res, next) => {
        res.setHeader('Content-Type', 'application/json')
        if (req.method === 'GET') {
          try {
            const data = readFileSync(DATA_FILE, 'utf-8')
            res.end(data)
          } catch {
            res.statusCode = 500
            res.end(JSON.stringify({ error: 'Could not read data file' }))
          }
        } else if (req.method === 'POST') {
          let body = ''
          req.on('data', chunk => { body += chunk })
          req.on('end', () => {
            try {
              const parsed = JSON.parse(body)
              writeFileSync(DATA_FILE, JSON.stringify(parsed, null, 2))
              res.end(JSON.stringify({ success: true }))
            } catch {
              res.statusCode = 400
              res.end(JSON.stringify({ error: 'Invalid JSON' }))
            }
          })
        } else {
          next()
        }
      })
    }
  }
}

export default defineConfig({
  plugins: [react(), apiPlugin()],
  server: {
    port: 3000,
  }
})
