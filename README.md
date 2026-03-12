# LeetCode Repeater

A personal spaced-repetition tracker for LeetCode problems. Schedule problems for future review, mark them mastered when they stick, and keep everything organised by date.

---

## Features

- **Date-grouped schedule** — questions grouped by date, sorted overdue → today → future. Past-due dates glow red, today glows amber.
- **Live LeetCode lookup** — type a problem number and the app fetches the title, difficulty, and tags in real time.
- **Per-question notes** — attach personal notes to any question.
- **Mastered tab** — problems you've truly locked in, with one-click undo.
- **FAQ tab** — company-grouped reference list (Amazon). Schedule or master any FAQ directly into your queue.
- **Todo tab** — date-linked task list separate from questions.
- **Multi-user** — each user logs in with their name + 4-digit passcode. Add/remove users at `/add-user`.
- **Cloud storage** — data lives in [Supabase](https://supabase.com), so it works from any device.

---

## Running locally

```bash
npm install
npm run dev   # http://localhost:3000
```

### Environment variables

Create a `.env` file in the project root:

```
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
VITE_ADMIN_SECRET=<your-admin-secret>
```

---

## Adding a user

Navigate to `/add-user` (link at the bottom of the login page). Requires the admin secret set in your environment variables.

---

## Deploying to Netlify

1. Push this repo to GitHub.
2. In Netlify: **Add new site → Import an existing project**.
3. Build settings are pre-configured in `netlify.toml`:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Add environment variables in **Site Settings → Environment Variables**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_ADMIN_SECRET`
5. Deploy.

The only Netlify Function in production is `netlify/functions/problem.js`, which proxies the LeetCode GraphQL API to avoid CORS.

---

## Project structure

```
leetcode_repeater/
├── netlify/
│   └── functions/
│       └── problem.js        # LeetCode GraphQL proxy (CORS workaround)
├── src/
│   ├── App.jsx               # Login / Dashboard / AddUser routing
│   ├── index.css             # Global styles + CSS variables
│   ├── lib/
│   │   └── supabase.js       # Supabase client singleton
│   ├── hooks/
│   │   └── useData.js        # All data operations (Supabase queries)
│   └── components/
│       ├── common/           # DateSection, QuestionCard, TaskCard, DatePicker
│       ├── modals/           # AddModal, EditModal, NotesModal, AddTaskModal, EditTaskModal
│       └── pages/
│           ├── Login.jsx/css
│           ├── Dashboard.jsx/css
│           ├── AddUser.jsx/css
│           └── FAQView.jsx/css
├── vite.config.js            # Vite + LeetCode proxy plugin (dev only)
└── netlify.toml              # Build config + redirects
```

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite 6 |
| Styling | Plain CSS with custom properties |
| Database | Supabase (PostgreSQL) |
| LeetCode data | LeetCode GraphQL API (server-side proxy) |
| Hosting | Netlify |
