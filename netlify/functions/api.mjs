/**
 * Single Netlify Function (v2) that handles all /api/* routes.
 * Replaces the Vite plugin middleware for production on Netlify.
 *
 * Routes:
 *   GET  /api/data           – read user data from Blobs
 *   POST /api/data           – write user data to Blobs
 *   GET  /api/problem/:num   – proxy LeetCode GraphQL (no CORS)
 *   POST /api/add-user       – add a new user (requires ADMIN_SECRET)
 *   POST /api/delete-user    – remove a user and all their data (requires ADMIN_SECRET)
 */

import { getStore } from '@netlify/blobs'

// ── LeetCode GraphQL ────────────────────────────────────────────────────────

const LC_GRAPHQL = 'https://leetcode.com/graphql'
const LC_QUERY = `query($filters: QuestionListFilterInput) {
  questionList(categorySlug: "" limit: 3 skip: 0 filters: $filters) {
    data { questionFrontendId title titleSlug difficulty topicTags { name } }
  }
}`

// ── Seed data (used when Blobs are empty on first deploy) ───────────────────

const SEED_DATA = { users: [] }

// ── Helper ──────────────────────────────────────────────────────────────────

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

// ── Main handler ────────────────────────────────────────────────────────────

export default async function handler(req) {
  const { pathname } = new URL(req.url)
  const segments = pathname.split('/').filter(Boolean)
  // segments: ['api', 'data'] | ['api', 'problem', '105'] | ['api', 'add-user']
  const resource = segments[1]

  const store = getStore('app-data')

  // ── GET /api/data ──────────────────────────────────────────────────────────
  if (resource === 'data' && req.method === 'GET') {
    const data = await store.get('main', { type: 'json' })
    return json(data ?? SEED_DATA)
  }

  // ── POST /api/data ─────────────────────────────────────────────────────────
  if (resource === 'data' && req.method === 'POST') {
    const body = await req.json()
    await store.set('main', JSON.stringify(body))
    return json({ success: true })
  }

  // ── GET /api/problem/:number ───────────────────────────────────────────────
  if (resource === 'problem') {
    const number = segments[2]
    if (!number || isNaN(number)) {
      return json({ error: 'Invalid number' }, 400)
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

      if (response.status === 429) return json({ error: 'LeetCode rate limited — try again shortly' }, 429)
      if (!response.ok)           return json({ error: 'LeetCode API error' }, 502)

      const result = await response.json()
      const questions = result?.data?.questionList?.data ?? []
      const match = questions.find(q => String(q.questionFrontendId) === String(number))

      if (!match) return json({ error: 'Problem not found' }, 404)

      return json({
        number: parseInt(number, 10),
        title:      match.title,
        difficulty: match.difficulty,
        slug:       match.titleSlug,
        tags:       match.topicTags.map(t => t.name),
        url:        `https://leetcode.com/problems/${match.titleSlug}/`,
      })
    } catch {
      return json({ error: 'Could not reach LeetCode' }, 502)
    }
  }

  // ── POST /api/add-user ─────────────────────────────────────────────────────
  if (resource === 'add-user' && req.method === 'POST') {
    const { name, passcode, adminSecret } = await req.json()

    const expectedSecret = process.env.ADMIN_SECRET
    if (!expectedSecret || adminSecret !== expectedSecret) {
      return json({ error: 'Invalid admin secret.' }, 401)
    }

    const trimmedName = name?.trim()
    if (!trimmedName) {
      return json({ error: 'Name is required.' }, 400)
    }

    if (typeof passcode !== 'string' || passcode.length !== 4 || !/^\d{4}$/.test(passcode)) {
      return json({ error: 'Passcode must be exactly digits.' }, 400)
    }

    const data = (await store.get('main', { type: 'json' })) ?? { ...SEED_DATA }

    if (data.users.find(u => u.name.toLowerCase() === trimmedName.toLowerCase())) {
      return json({ error: `User "${trimmedName}" already exists.` }, 400)
    }

    data.users.push({ name: trimmedName, passcode: String(passcode), questions: [] })
    await store.set('main', JSON.stringify(data))

    return json({ success: true, name: trimmedName })
  }

  // ── POST /api/delete-user ──────────────────────────────────────────────────
  if (resource === 'delete-user' && req.method === 'POST') {
    const { name, adminSecret } = await req.json()

    const expectedSecret = process.env.ADMIN_SECRET
    if (!expectedSecret || adminSecret !== expectedSecret) {
      return json({ error: 'Invalid admin secret.' }, 401)
    }

    const trimmedName = name?.trim()
    if (!trimmedName) {
      return json({ error: 'Name is required.' }, 400)
    }

    const data = (await store.get('main', { type: 'json' })) ?? { ...SEED_DATA }
    const before = data.users.length
    data.users = data.users.filter(u => u.name.toLowerCase() !== trimmedName.toLowerCase())

    if (data.users.length === before) {
      return json({ error: `User "${trimmedName}" not found.` }, 404)
    }

    await store.set('main', JSON.stringify(data))
    return json({ success: true, name: trimmedName })
  }

  return json({ error: 'Not found' }, 404)
}

export const config = { path: '/api/*' }
