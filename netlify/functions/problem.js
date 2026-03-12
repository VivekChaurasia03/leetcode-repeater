const LC_GRAPHQL = 'https://leetcode.com/graphql'
const LC_QUERY = `query($filters: QuestionListFilterInput) {
  questionList(categorySlug: "" limit: 3 skip: 0 filters: $filters) {
    data { questionFrontendId title titleSlug difficulty topicTags { name } }
  }
}`

export async function handler(event) {
  const number = event.path.replace(/.*\/problem\//, '').split('?')[0]

  if (!number || isNaN(number)) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid number' }) }
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
    })

    if (response.status === 429) {
      return { statusCode: 429, body: JSON.stringify({ error: 'LeetCode rate limited — try again shortly' }) }
    }
    if (!response.ok) {
      return { statusCode: 502, body: JSON.stringify({ error: 'LeetCode API error' }) }
    }

    const json = await response.json()
    const questions = json?.data?.questionList?.data ?? []
    const match = questions.find(q => String(q.questionFrontendId) === String(number))

    if (!match) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Problem not found' }) }
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        number: parseInt(number, 10),
        title: match.title,
        difficulty: match.difficulty,
        slug: match.titleSlug,
        tags: match.topicTags.map(t => t.name),
        url: `https://leetcode.com/problems/${match.titleSlug}/`,
      }),
    }
  } catch {
    return { statusCode: 502, body: JSON.stringify({ error: 'Could not reach LeetCode' }) }
  }
}
