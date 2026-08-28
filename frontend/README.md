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

The application follows a "Terminal Technical" design direction:
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
- **AI:** Google Gemini API (`gemini-3.1-flash-lite`) via the `@google/genai` SDK, using response schemas for reliable structured JSON

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

## API Key Handling

This app no longer holds a Gemini API key at all — it calls a backend
(`../backend`) over HTTP at `VITE_API_BASE_URL` (defaults to
`http://localhost:3001`), and the backend holds `GEMINI_API_KEY` server-side.
Nothing Gemini-related is bundled into the client JS anymore. On load, the
app pings the backend's `/api/health` endpoint and shows a setup banner if
it's unreachable or missing its key.

## File Structure

```
src/
  components/
    InputPanel/         # Resume file upload + job description input
    ResumePreview/       # Live preview of the parsed resume text
    ResultsDashboard/   # Analysis results display
    ScoreGauge/         # Circular match score visualization
    GapList/            # Improvement areas display
    KeywordChips/       # Matched/missing keyword chips
    BulletRewriteCard/  # Before/after bullet point suggestions
    FormattingChecklist/# Formatting and structure feedback
  lib/
    gemini.js           # Thin HTTP client for the backend (../backend) — no API key here
    parseResume.js      # PDF/DOCX/TXT text extraction
    storage.js          # Export-results-to-file helper
  styles/
    tokens.css          # Design tokens (colors, typography, spacing)
  App.jsx
  main.jsx
```

## How It Works

1. User uploads a resume file (PDF/DOCX/TXT) and pastes a job description
2. Upon clicking "Run Analysis":
   - Resume file is parsed to extract text (if applicable)
   - Resume text and job description are sent to the backend's `/api/analyze`
   - The backend builds a structured prompt and sends it to Gemini with
     instructions to return structured JSON
   - Response is parsed and validated
   - Results are displayed in the dashboard
3. Analysis includes:
   - Overall match score (0-100)
   - Summary verdict
   - Identified strengths
   - Specific gaps with severity and suggestions
   - Keyword analysis (matched vs missing)
   - Bullet point rewrite suggestions with explanations
   - Formatting and structure issues
   - ATS risk assessment
4. Results can be exported as a text file

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

## Future Enhancements

- Support for additional file formats (ODT, RTF, etc.)
- More detailed analytics and visualizations
- Customizable analysis depth/settings
- Integration with job boards or LinkedIn
- Dark mode toggle
- Multi-language support
- Collaboration features (sharing analyses)

## License

MIT

---

**Built with Claude Code**