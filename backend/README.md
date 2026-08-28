# AI Resume Analyzer — Backend

A small Express server that proxies calls to the Gemini API, so the API key
lives only on the server and never reaches the browser.

## Setup

```bash
cd backend
npm install
cp .env.example .env   # then set GEMINI_API_KEY
npm run dev
```

The server starts on `http://localhost:3001` by default (see `.env.example`
for `PORT` and `FRONTEND_ORIGIN`).

## Endpoints

- `GET /api/health` → `{ ready: boolean }` — whether `GEMINI_API_KEY` is set.
  The frontend polls this on load to decide whether to show a setup banner.
- `POST /api/analyze` — body `{ resumeText: string, jobDescription: string }`.
  Returns the same structured analysis JSON the frontend used to get directly
  from Gemini (`matchScore`, `summary`, `strengths`, `gaps`,
  `keywordAnalysis`, `bulletRewrites`, `formattingIssues`, `atsRisk`).

  Error responses are `{ error: string }` with:
  - `400` — missing/empty `resumeText` or `jobDescription`, or input too long
  - `503` — `GEMINI_API_KEY` not configured on the server
  - `502` — the Gemini API call itself failed (invalid key, rate limit, etc.)

## Files

```
src/
  server.js   Express app, routes, CORS, input validation
  gemini.js   Gemini SDK call — schema, prompt, response parsing
```

`gemini.js` here is a direct port of what used to live in
`frontend/src/lib/gemini.js`: same model, same prompt, same response schema.
Only the API key source changed (`process.env.GEMINI_API_KEY` instead of
a Vite-bundled `import.meta.env` value).

## Notes

- CORS is restricted to `FRONTEND_ORIGIN` (defaults to Vite's dev port,
  `http://localhost:5173`) — update it if you deploy the frontend elsewhere.
- There's no rate limiting or auth on `/api/analyze` beyond input-length
  checks. Fine for local/personal use; add both before exposing this
  publicly, since every request costs Gemini API quota.
- Requires Node 18+ (uses `node --watch` for the `dev` script instead of a
  nodemon dependency).
