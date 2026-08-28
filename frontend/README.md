# AI Resume Analyzer — Frontend

A web application that analyzes resumes against job descriptions using Google's Gemini AI to provide match scores, keyword analysis, and improvement suggestions.

This is the frontend half of the project — see the [root README](../README.md) for how it relates to `../backend`.

## Features

- Resume input via file upload only (PDF/DOCX/TXT, drag-and-drop or click to browse)
- Live preview of the parsed resume text alongside the input form
- Job description input via text paste
- AI-powered analysis using Gemini API
- Match score visualization
- Keyword matching and gap analysis
- Bullet point rewrite suggestions
- Formatting and structure feedback
- ATS (Applicant Tracking System) risk assessment
- Export results as text file

## Design

The application follows a Terminal Technical design direction:
- Deep navy primary color with cream background and vibrant green accent
- IBM Plex Mono typeface for a technical/manual feel
- Sharp corners, minimal padding, and ruled lines for section separation
- Dense, information-focused layout resembling technical documentation

## Tech Stack

- **Framework:** React 18+ with Vite
- **Styling:** Custom CSS with CSS variables
- **State management:** React Context and local state
- **File parsing:** 
  - `pdfjs-dist` for PDF resumes
  - `mammoth` for DOCX resumes
  - Built-in FileReader for TXT files

## Setup

**The backend must be running first** — see `../backend/README.md`. It holds the
Gemini API key; this app never sees it.

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
