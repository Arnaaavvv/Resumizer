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
