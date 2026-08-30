# AI Resume Analyzer — Backend

This is the backend half of the project — see the [root README](../README.md) for how it relates to `../frontend`.

## Setup

```bash
cd backend
npm install
cp .env.example .env   # then set GEMINI_API_KEY (and optionally GROQ_API_KEY)
npm run dev
```

The server starts on `http://localhost:3001` by default (see `.env.example`
for `PORT` and `FRONTEND_ORIGIN`).

## AI providers

Analysis is served by **Gemini first**, with an **automatic fallback to
Groq** if Gemini fails for any reason (bad/rejected key, quota, outage,
etc.) — no retry needed on the frontend's part.

- `GEMINI_API_KEY` — primary provider (`gemini-3.1-flash-lite`)
- `GROQ_API_KEY` — optional fallback provider (`openai/gpt-oss-120b`).
  If unset, the app simply runs on Gemini alone.

At least one of the two must be set for `/api/analyze` to work. Both are
held to the exact same JSON response shape, so nothing downstream needs to
know which one actually answered a given request.

## Endpoints

- `GET /api/health` → `{ ready: boolean, providers: string[] }` — `ready`
  is `true` if at least one of `GEMINI_API_KEY` / `GROQ_API_KEY` is set;
  `providers` lists which ones (e.g. `["gemini", "groq"]`) for debugging.
  The frontend polls this on load and only reads `ready`.
- `POST /api/analyze` — body `{ resumeText: string, jobDescription: string }`.
  Returns the same structured analysis JSON regardless of which provider
  served it (`matchScore`, `summary`, `strengths`, `gaps`,
  `keywordAnalysis`, `bulletRewrites`, `formattingIssues`, `atsRisk`).

  Error responses are `{ error: string }`, always a short, clean message —
  raw provider errors are never forwarded to the client, only logged
  server-side via `console.error`:
  - `400` — missing/empty `resumeText` or `jobDescription`, or input too long
  - `503` — no AI provider configured on the server (`GEMINI_API_KEY` and
    `GROQ_API_KEY` both unset)
  - `502` — every configured provider failed (e.g. Gemini rejected the key
    and Groq isn't configured, or both failed)

## Files

```
src/
  server.js   Express app, routes, CORS, input validation
  gemini.js   Gemini (primary) + Groq (fallback) calls — shared schema,
              prompt, JSON parsing/normalization and friendly error messages
```