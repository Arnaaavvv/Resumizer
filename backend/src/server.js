import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { analyzeResume, isApiKeyConfigured } from './gemini.js';

const PORT = process.env.PORT || 3001;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
const MAX_INPUT_CHARS = 50_000; 

const app = express();

app.use(cors({ origin: FRONTEND_ORIGIN }));
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (req, res) => {
  res.json({ ready: isApiKeyConfigured() });
});

app.post('/api/analyze', async (req, res) => {
  const { resumeText, jobDescription } = req.body || {};

  if (typeof resumeText !== 'string' || !resumeText.trim()) {
    return res.status(400).json({ error: 'resumeText is required.' });
  }
  if (typeof jobDescription !== 'string' || !jobDescription.trim()) {
    return res.status(400).json({ error: 'jobDescription is required.' });
  }
  if (resumeText.length > MAX_INPUT_CHARS || jobDescription.length > MAX_INPUT_CHARS) {
    return res.status(400).json({ error: 'Input is too long.' });
  }
  if (!isApiKeyConfigured()) {
    return res.status(503).json({
      error: 'Server is missing GEMINI_API_KEY. Add it to backend/.env and restart the server.',
    });
  }

  try {
    const results = await analyzeResume(resumeText, jobDescription);
    res.json(results);
  } catch (error) {
    console.error('POST /api/analyze failed:', error);
    res.status(502).json({ error: error.message || 'Failed to analyze resume.' });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found.' });
});

app.listen(PORT, () => {
  console.log(`AI Resume Analyzer backend listening on http://localhost:${PORT}`);
  console.log(`Accepting requests from ${FRONTEND_ORIGIN}`);
  console.log(
    isApiKeyConfigured()
      ? 'GEMINI_API_KEY detected.'
      : 'WARNING: GEMINI_API_KEY is not set — /api/analyze will return 503 until it is.'
  );
});
