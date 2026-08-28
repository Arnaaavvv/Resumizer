import React, { useEffect, useState } from 'react';
import './styles/tokens.css';
import { checkBackendHealth } from './lib/gemini';
import InputPanel from './components/InputPanel';
import ResultsDashboard from './components/ResultsDashboard';
import ResumePreview from './components/ResumePreview';

function App() {
  const [analysisResults, setAnalysisResults] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeText, setResumeText] = useState('');
  const [resumePreview, setResumePreview] = useState(null);
  const [isParsingResume, setIsParsingResume] = useState(false);
  const [backendReady, setBackendReady] = useState(null); // null = still checking

  useEffect(() => {
    let cancelled = false;
    checkBackendHealth().then((ready) => {
      if (!cancelled) setBackendReady(ready);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="page">
      <header className="app-header">
        <div>
          <div className="app-header__eyebrow">Resume × Job Match Engine</div>
          <h1 className="app-header__title">
            Resume<span>/</span>Analyzer
          </h1>
          <p className="app-header__tagline">
            Paste your resume and a job posting. Get a structured breakdown — not vibes.
          </p>
        </div>
      </header>

      {backendReady === false && (
        <div className="setup-banner">
          <strong>Setup required —</strong> the backend isn't reachable, or it's missing a Gemini API key.
          Start it with <code>cd backend && npm run dev</code> after adding <code>GEMINI_API_KEY</code> to{' '}
          <code>backend/.env</code> (see <code>backend/.env.example</code>).
        </div>
      )}

      <div className="layout-grid">
        <InputPanel
          onAnalysisComplete={setAnalysisResults}
          apiKeyReady={backendReady === true}
          resumeFile={resumeFile}
          resumeText={resumeText}
          isParsingResume={isParsingResume}
          setResumeFile={setResumeFile}
          setResumeText={setResumeText}
          setResumePreview={setResumePreview}
          setIsParsingResume={setIsParsingResume}
        />
        <ResumePreview
          resumeFile={resumeFile}
          resumeText={resumeText}
          resumePreview={resumePreview}
          isParsingResume={isParsingResume}
        />
      </div>

      <ResultsDashboard results={analysisResults} />

      <footer className="app-footer">
        Resume parsing happens in your browser, nothing stored on a server
      </footer>
    </div>
  );
}

export default App;
