# AI Resume Analyzer — Frontend

A web application that analyzes resumes against job descriptions using AI to provide match scores, keyword analysis, and improvement suggestions.

This is the frontend half of the project — see the [root README](../README.md) for how it relates to `../backend`.

## Features

- Resume input via file upload only (PDF/DOCX/TXT, drag-and-drop or click to browse)
- Real visual resume preview alongside the input form — rendered PDF page images, DOCX's actual formatting (headings, bold, lists), not a flat text dump
- Automatic check that an upload actually looks like a resume, flagged immediately (also catches accidentally re-uploading a previously exported analysis report)
- AI-powered analysis, served by Gemini with an automatic Groq fallback if Gemini is unavailable
- Match score visualization
- Keyword matching and gap analysis
- Bullet point rewrite suggestions
- Formatting and structure feedback
- ATS (Applicant Tracking System) risk assessment
- Export results as a `.txt` file or a formatted PDF
- Light / dark theme toggle, persisted across visits

## Tech Stack

- **Framework:** React 19 with Vite
- **Styling:** Custom CSS with CSS variables (light + dark theme, toggled via a `data-theme` attribute)
- **State management:** React local state
- **File parsing & preview:**
  - `pdfjs-dist` for PDF resumes — text extraction *and* page-image rendering
  - `mammoth` for DOCX resumes — text extraction *and* HTML-formatted preview
  - Built-in FileReader for TXT files
- **Export:** `jspdf` for the PDF report, native Blob download for `.txt`

## Setup

**The backend must be running first** — see `../backend/README.md`. It holds
the AI provider keys; this app never sees them.

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env` file based on `.env.example` (the default already points
   at the backend's default port, so this is optional for local dev):
   ```bash
   cp .env.example .env
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```


## Development

To run tests or build for production:

```bash
# Run tests (if implemented)
npm test

# Build for production
npm run build

# Preview production build
npm run preview
```