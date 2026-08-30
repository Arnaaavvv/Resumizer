import React, { useEffect, useRef, useState } from 'react';
import { parseResume, renderResumePreview, assertLooksLikeResume } from '../lib/parseResume';
import { analyzeResume } from '../lib/gemini';

const UploadIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 12.5V2.5M10 2.5L6.25 6.25M10 2.5L13.75 6.25" stroke="currentColor" strokeWidth="1.4" strokeLinecap="square" strokeLinejoin="miter" />
    <path d="M3.75 13.75V15.625C3.75 16.6605 4.5895 17.5 5.625 17.5H14.375C15.4105 17.5 16.25 16.6605 16.25 15.625V13.75" stroke="currentColor" strokeWidth="1.4" strokeLinecap="square" />
  </svg>
);

const FileIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4.5 1.875h6l3 3v9.375a.75.75 0 0 1-.75.75h-8.25a.75.75 0 0 1-.75-.75V2.625a.75.75 0 0 1 .75-.75Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="miter" />
    <path d="M10.5 1.875V4.5a.75.75 0 0 0 .75.75h2.625" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="miter" />
  </svg>
);

const XIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1.5 1.5L11.5 11.5M11.5 1.5L1.5 11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
  </svg>
);

const LOADING_MESSAGES = [
  'Reading the resume',
  'Reading the job posting',
  'Cross-referencing keywords',
  'Weighing strengths against gaps',
  'Drafting bullet rewrites',
];

const ACCEPTED_EXTENSIONS = ['.pdf', '.docx', '.txt'];

const formatFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const isAcceptedFile = (file) =>
  ACCEPTED_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext));

const InputPanel = ({
  onAnalysisComplete,
  apiKeyReady,
  resumeFile,
  resumeText,
  isParsingResume,
  setResumeFile,
  setResumeText,
  setResumePreview,
  setIsParsingResume,
}) => {
  const [jobDescription, setJobDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const fileInputRef = useRef(null);
  const dragCounter = useRef(0);

  useEffect(() => {
    if (!isAnalyzing) return undefined;
    const interval = setInterval(() => {
      setLoadingStep((s) => (s + 1) % LOADING_MESSAGES.length);
    }, 1400);
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  const ingestFile = async (file) => {
    if (!file) return;

    if (!isAcceptedFile(file)) {
      setError('Unsupported file type. Please upload a PDF, DOCX, or TXT file.');
      return;
    }

    setError(null);
    setResumeFile(file);
    setResumePreview(null);
    setIsParsingResume(true);
    try {
      // Text extraction (feeds the AI) and visual preview rendering
      // (feeds the Resume Preview panel) run in parallel — they're
      // independent reads of the same file.
      const [text, preview] = await Promise.all([
        parseResume(file),
        renderResumePreview(file),
      ]);
      // Flag right away if the upload doesn't actually look like a resume,
      // before it's stored anywhere or sent to the AI.
      assertLooksLikeResume(text);
      setResumeText(text);
      setResumePreview(preview);
    } catch (err) {
      setError(err.message || 'Failed to parse resume file. Please try a different file.');
      setResumeFile(null);
      setResumeText('');
      setResumePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } finally {
      setIsParsingResume(false);
    }
  };

  const handleFileInputChange = (e) => {
    ingestFile(e.target.files[0]);
  };

  const handleRemoveFile = () => {
    setResumeFile(null);
    setResumeText('');
    setResumePreview(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    dragCounter.current += 1;
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setIsDragging(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDragging(false);
    ingestFile(e.dataTransfer.files?.[0]);
  };

  const handleAnalyzeClick = async () => {
    if (!resumeText.trim() || !jobDescription.trim()) {
      setError('Please provide both a resume and a job description.');
      return;
    }

    setIsAnalyzing(true);
    setLoadingStep(0);
    setError(null);

    try {
      const results = await analyzeResume(resumeText, jobDescription);
      onAnalysisComplete(results);
      // Clear the job description after a successful run so the panel is
      // ready for the next posting — but only on success, so a failed
      // request doesn't wipe out what the user typed. The resume itself
      // (file / text / preview) is untouched, since it's common to run
      // the same resume against several job descriptions in a row.
      setJobDescription('');
    } catch (err) {
      setError(err.message || 'Failed to analyze resume. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <section className="panel">
      <header className="panel__header">
        <h2 className="panel__title"><span className="panel__number">01</span>Input</h2>
      </header>

      {error && (
        <div className="error-banner" role="alert">
          <span className="error-banner__mark">!</span>
          <span>{error}</span>
        </div>
      )}

      {isAnalyzing ? (
        <div className="loading-block">
          <div className="loading-bar" />
          <p className="loading-block__text">
            {LOADING_MESSAGES[loadingStep]}
            <span className="loading-block__cursor">▌</span>
          </p>
        </div>
      ) : (
        <>
          <div className="field-group">
            <label className="field-label" htmlFor="resume-upload">Resume</label>

            <input
              ref={fileInputRef}
              type="file"
              id="resume-upload"
              className="visually-hidden"
              accept=".pdf,.docx,.txt"
              onChange={handleFileInputChange}
            />

            {resumeFile ? (
              <div className="file-chip">
                <span className="file-chip__icon" aria-hidden="true">
                  <FileIcon />
                </span>
                <span className="file-chip__body">
                  <span className="file-chip__name">{resumeFile.name}</span>
                  <span className="file-chip__meta">
                    {isParsingResume ? 'Reading file…' : `${formatFileSize(resumeFile.size)} · parsed`}
                  </span>
                </span>
                <button
                  type="button"
                  className="file-chip__remove"
                  onClick={handleRemoveFile}
                  aria-label="Remove resume file"
                  disabled={isParsingResume}
                >
                  <XIcon />
                </button>
              </div>
            ) : (
              <div
                className={`upload-zone${isDragging ? ' is-dragging' : ''}`}
                role="button"
                tabIndex={0}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <span className="upload-zone__icon" aria-hidden="true">
                  <UploadIcon />
                </span>
                <p className="upload-zone__text">
                  <span className="upload-zone__link">Click to upload</span> or drag and drop
                </p>
                <p className="upload-zone__hint">PDF, DOCX, or TXT · max 10MB</p>
              </div>
            )}
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="job-description">Job Description</label>
            <textarea
              id="job-description"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here..."
              rows={9}
            />
          </div>

          <button
            className="btn-primary"
            onClick={handleAnalyzeClick}
            disabled={!apiKeyReady || !resumeText.trim() || !jobDescription.trim() || isParsingResume}
            title={!apiKeyReady ? 'Backend not ready — see the setup banner above' : undefined}
          >
            Run Analysis →
          </button>
        </>
      )}
    </section>
  );
};

export default InputPanel;