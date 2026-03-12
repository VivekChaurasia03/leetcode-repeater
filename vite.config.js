import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

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
      // ── /api/problem/:number  (server-side proxy — avoids CORS in dev) ──
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
    }
  }
}

export default defineConfig({
  plugins: [react(), apiPlugin()],
  server: {
    port: 3000,
  }
})
