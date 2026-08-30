# 📄 Resumizer

**Paste your resume and a job posting. Get a structured breakdown**

[![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)](https://vite.dev)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com)
[![Render](https://img.shields.io/badge/Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://render.com)

---

Upload a resume, drop in a job description, get a rigorous verdict back: match score, gaps, keyword analysis, bullet rewrites, ATS risk with a real visual preview of the resume you uploaded

## 🔴 Live Demo

**[Try it here](https://resumizer-murex.vercel.app/)** 

No install, no signup just upload a resume, paste a job description and get your breakdown in seconds.

## ✨ Features

- **📤 File upload** — PDF, DOCX, or TXT, drag-and-drop or click to browse
- **🖼️ Real visual resume preview** — PDF pages render as actual page images, DOCX keeps its real formatting (headings, bold, lists), not a flat text dump
- **🛡️ Smart upload guard** — flags files that don't actually look like a resume right away (including if you accidentally re-upload a previously exported report), before it ever reaches the AI
- **🧮 Weighted scoring rubric** — skills, experience, domain, and seniority fit, not just keyword overlap
- **🎯 Full dashboard** — match score, strengths, gaps, keyword analysis, bullet rewrites, formatting checklist, ATS risk, all in one place
- **📥 Export your results** as a .txt file or a formatted PDF
- **🌗 Light / dark theme** — toggle in the header, remembers your choice
- **🔁 Automatic AI fallback** — Gemini is primary; if it's unavailable for any reason, the backend automatically retries with Groq so a single provider outage doesn't take the app down

## 🛠 Tech Stack

| Layer      | Stack |
|------------|-------|
| Frontend   | React 19, Vite |
| Parsing    | `pdfjs-dist` (PDF text + page rendering), `mammoth` (DOCX → HTML) |
| Export     | `jspdf` (PDF report), native Blob download (`.txt`) |
| Backend    | Node.js, Express |
| AI models  | Gemini (`gemini-3.1-flash-lite`) primary, Groq (`openai/gpt-oss-120b`) automatic fallback — both structured via JSON schema |
| Hosting    | Vercel (frontend) + Render (backend) |

## 🚀 Getting Started

```bash
git clone https://github.com/Arnaaavvv/Resumizer.git
cd Resumizer

# backend — start this first, it holds the API keys
cd backend
npm install
cp .env.example .env   # then set GEMINI_API_KEY (and optionally GROQ_API_KEY for fallback)
npm run dev

# frontend (in a new terminal)
cd frontend
npm install
npm run dev
```

Open the URL Vite prints (typically `http://localhost:5173`). The frontend pings the backend's `/api/health` on load and shows a setup banner if the backend isn't running or has no AI provider configured.

## 📁 Project Structure

```
Resumizer/
├── backend/
│   └── src/
│       ├── server.js   Express app, routes, CORS, input validation
│       └── gemini.js   Gemini (primary) + Groq (fallback) calls — shared schema, prompt, response parsing
└── frontend/
    └── src/
        ├── components/    InputPanel · ResumePreview · ResultsDashboard · ThemeToggle · …
        ├── lib/
        │   ├── parseResume.js   PDF/DOCX/TXT extraction + visual preview + "is this a resume?" guard
        │   ├── gemini.js        thin HTTP client — talks to the backend, holds no key
        │   └── storage.js       export-to .txt and export-to PDF
        └── styles/tokens.css    design tokens — light + dark theme variables
```

## ⚠️ Limitations

- Analysis quality depends on how cleanly text extracts from the uploaded file — scanned image-only PDFs won't have selectable text and will fail extraction.
- The 'is this a resume?' guard is heuristic, not a classifier ie unusually formatted resumes could occasionally get flagged and non-resumes with resume-like keywords could occasionally slip through.
- Scoring is only as good as the job description you paste in — vague or very short job descriptions give the model less to weigh the resume against.
- Currently analyzes one resume against one job description at a time.
- Groq is only used as a fallback if Gemini fails and `GROQ_API_KEY` is configured — if neither provider is set up (or both fail), analysis will fail.

## ☁️ Deployment

Live in production on a two-service split:

- **Backend**: Render — set `GEMINI_API_KEY` (and optionally `GROQ_API_KEY`) as environment variables
- **Frontend**: Vercel
---
*No more guessing why the ATS ghosted you.*