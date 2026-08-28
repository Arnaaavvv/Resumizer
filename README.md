# 📄 Resume/Analyzer

**Paste your resume and a job posting. Get a structured breakdown — not vibes.**

An AI-powered resume-vs-job-description matcher: upload a resume, drop in a job
description, and get a rigorous, structured verdict — match score, gaps,
keyword analysis, bullet rewrites, ATS risk — powered by Gemini, with a real
visual preview of the resume you uploaded.

```
┌─────────────────────┐     ┌──────────────────────┐     ┌───────────────────┐
│   01 · Input          │     │   02 · Resume Preview  │     │   03 · Results       │
│  upload + paste JD  │ →   │  actual rendered page  │ →   │  score · gaps ·     │
│                      │     │  (not just text!)      │     │  rewrites · export  │
└─────────────────────┘     └──────────────────────┘     └───────────────────┘
```

---

## ✨ Features

- **File upload only** — PDF, DOCX, or TXT, drag-and-drop or click to browse
- **Real visual resume preview** — PDF pages are rendered as actual page
  images, DOCX keeps its real formatting (headings, bold, lists), not a flat
  text dump
- **"Is this even a resume?" guard** — flags mismatched uploads (random
  documents, or even a previously exported analysis report) immediately,
  before wasting an AI call
- **Structured AI analysis** via Gemini, with a weighted scoring rubric
  (skills, experience, domain, seniority) and a strict JSON response schema
- **Match score, strengths, gaps, keyword analysis, bullet rewrites,
  formatting checklist, ATS risk** — all in one dashboard
- **Export your results** as a `.txt` file or a formatted **PDF**
- **API key never touches the browser** — a small Express backend proxies
  every Gemini call

## 🧱 Architecture

```
frontend/   React + Vite app. No API key — talks to backend/ over HTTP.
backend/    Express server that holds GEMINI_API_KEY and proxies Gemini calls.
```

Resume parsing (text extraction *and* visual rendering) happens entirely in
your browser. Only the extracted text and the job description ever leave
the frontend, headed straight to your own backend — never to a third party,
and never bundled with a key.

## 🛠 Tech Stack

| Layer      | Stack |
|------------|-------|
| Frontend   | React 19, Vite |
| Parsing    | `pdfjs-dist` (PDF text + page rendering), `mammoth` (DOCX → HTML) |
| Export     | `jspdf` (PDF report), native Blob download (`.txt`) |
| Backend    | Node.js, Express, `@google/genai` |
| AI model   | Gemini (`gemini-3.1-flash-lite`), structured via `responseSchema` |

## 🚀 Running it locally (two terminals)

**1. Backend** — start this first, it holds the API key:

```bash
cd backend
npm install
cp .env.example .env   # then set GEMINI_API_KEY
npm run dev
```

**2. Frontend:**

```bash
cd frontend
npm install
npm run dev
```

Open the URL Vite prints (typically `http://localhost:5173`). The frontend
pings the backend's `/api/health` on load and shows a setup banner if the
backend isn't running or is missing its key.

See [`frontend/README.md`](frontend/README.md) and
[`backend/README.md`](backend/README.md) for full details on each half.

## 🔐 Security notes

- `GEMINI_API_KEY` lives **only** in `backend/.env` (gitignored) locally, and
  in your hosting provider's environment-variable dashboard in production —
  never in a committed file, never bundled into the frontend.
- CORS on the backend is restricted to a single `FRONTEND_ORIGIN` — lock this
  to your real deployed frontend URL before going live.
- If a `.env` file (or a zip containing one) with a real key ever leaves your
  machine — a chat upload, a shared drive, a screenshot — treat that key as
  compromised and rotate it immediately.

## ☁️ Deploying

This is a two-service deploy: **backend → Render**, **frontend → Vercel**,
each pointed at the `backend/` or `frontend/` subfolder as its root
directory. In short:

1. Rotate any key that's ever been exposed, and generate a fresh one
2. Push the repo to GitHub (`.env` files are already gitignored)
3. Deploy `backend/` to Render as a Web Service; add `GEMINI_API_KEY` in its
   Environment tab
4. Deploy `frontend/` to Vercel; set `VITE_API_BASE_URL` to the Render URL
   *before* the first build
5. Update the backend's `FRONTEND_ORIGIN` to the live Vercel URL and redeploy
6. Test end-to-end, then double-check no secrets made it into git history

## 📂 Project structure

```
frontend/src/
  components/     InputPanel · ResumePreview · ResultsDashboard · ScoreGauge · …
  lib/
    parseResume.js   PDF/DOCX/TXT text extraction + visual preview rendering
                      + the "does this look like a resume?" guard
    gemini.js         thin HTTP client — talks to the backend, holds no key
    storage.js         export-to-.txt and export-to-PDF
  styles/tokens.css  design tokens — "Field Report" navy-on-cream theme

backend/src/
  server.js   Express app, routes, CORS, input validation
  gemini.js   Gemini SDK call — structured prompt, response schema, parsing
```

## 📜 License

MIT

---

*Built with Claude Code.*