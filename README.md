# LeetCode Repeater ⚡

A personal spaced-repetition tracker for LeetCode problems. Schedule problems for future review, mark them mastered when they're truly "printed on your brain", and let the app keep everything organised by date.

---

## Features

- **Date-grouped schedule** — questions grouped by date, sorted overdue → today → future. Past-due dates glow red, today glows amber.
- **Live LeetCode lookup** — type a problem number and the app fetches the title, difficulty, and tags in real time. Clicking a problem opens it directly on LeetCode.
- **Per-question actions** — Reschedule to any date, edit the number, mark as Mastered, or delete.
- **Mastered tab** — a separate grid of problems that are "printed on your brain", with a one-click undo.
- **Multi-user** — each user logs in with their name + a 4-digit passcode. Add new users via `/add-user` (requires admin secret).
- **Deploys to Netlify** — API endpoints are served by a Netlify Function; data is persisted in Netlify Blobs.

---

## Running locally

```bash
npm install
npm run dev       # starts at http://localhost:3000
```

Data is read from and written to `data.json` in the project root via a Vite server plugin. No separate backend process needed.

### Default logins (local)

| Name | Passcode |
|------|----------|
| Vivek Chaurasia | 1234 |
| Syed Affan | 1234 |

---

## Adding a user

Navigate to `/add-user` (there's a link at the bottom of the login page).

| Field | Details |
|-------|---------|
| Full Name | The name they'll log in with |
| 4-Digit Passcode | Their personal passcode |
| Admin Secret | See below |

**Local dev** — the admin secret defaults to `admin` unless you create a `.env` file:

```
ADMIN_SECRET=your-secret-here
```

**Netlify** — set `ADMIN_SECRET` in Site Settings → Environment Variables.

---

## Deploying to Netlify

1. Push this repo to GitHub.
2. In Netlify: **Add new site → Import an existing project** → pick the repo.
3. Build settings are already configured in `netlify.toml`:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Add the environment variable:
   - Key: `ADMIN_SECRET`
   - Value: something only you know
5. Deploy.

All `/api/*` requests are handled by `netlify/functions/api.mjs`. Data is stored in **Netlify Blobs** (free, no setup required). On first deploy, users exist but their question lists are empty — add questions via the app as usual.

> **Note:** Local `data.json` and Netlify Blobs are separate stores. Questions added locally stay local; questions added on Netlify stay on Netlify.

---

## Project structure

```
leetcode_repeater/
├── netlify/
│   └── functions/
│       └── api.mjs          # Netlify Function — all /api/* routes (Blobs-backed)
├── src/
│   ├── App.jsx               # Login / Dashboard / AddUser routing
│   ├── index.css             # Global styles + CSS variables
│   ├── hooks/
│   │   └── useData.js        # All data operations (fetch, save, add, reschedule…)
│   └── components/
│       ├── Login.jsx/css     # Name + passcode login
│       ├── Dashboard.jsx/css # Main view — navbar, date list, mastered tab
│       ├── DateSection.jsx/css
│       ├── QuestionCard.jsx/css
│       ├── AddModal.jsx      # Add question with live LeetCode preview
│       ├── EditModal.jsx     # Edit number / reschedule date
│       ├── Modal.css
│       ├── AddUser.jsx/css   # /add-user page
├── data.json                 # Local data store (dev only)
├── vite.config.js            # Vite + API plugin (serves /api/* in dev)
├── netlify.toml              # Build config + SPA catch-all redirect
└── .env.example              # Copy to .env and set ADMIN_SECRET
```

---

## Data model (`data.json` / Netlify Blobs)

```json
{
  "users": [
    {
      "name": "Vivek Chaurasia",
      "passcode": 1234,
      "questions": [
        {
          "id": "uuid",
          "number": 105,
          "title": "Construct Binary Tree from Preorder and Inorder Traversal",
          "difficulty": "Medium",
          "slug": "construct-binary-tree-from-preorder-and-inorder-traversal",
          "scheduledDate": "2026-02-24",
          "addedDate": "2026-02-24",
          "status": "pending"
        }
      ]
    }
  ]
}
```

`status` is either `"pending"` (active) or `"mastered"`.
`title`, `difficulty`, and `slug` are optional — populated automatically when the LeetCode lookup succeeds, absent for manually-entered questions.

---

## Environment variables

| Variable | Required | Default (dev) | Description |
|----------|----------|---------------|-------------|
| `ADMIN_SECRET` | Yes (prod) | `"admin"` | Protects the `/add-user` endpoint |

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite 6 |
| Styling | Plain CSS with custom properties |
| Local API | Vite server plugin (Node.js `fs`) |
| Production API | Netlify Functions v2 |
| Production storage | Netlify Blobs |
| LeetCode data | LeetCode GraphQL API (server-side proxy) |
