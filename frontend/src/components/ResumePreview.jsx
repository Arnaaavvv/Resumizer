import React from 'react';

const formatFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const wordCount = (text) => (text.trim() ? text.trim().split(/\s+/).length : 0);

// Renders whatever visual representation parseResume.renderResumePreview()
// produced for this file. Falls back to the raw extracted text (still
// wrapped in the same "page" styling) if a visual render wasn't available.
const ResumeVisual = ({ resumePreview, resumeText }) => {
  if (resumePreview?.type === 'image-pages' && resumePreview.pages?.length > 0) {
    return (
      <div className="resume-preview__pages">
        {resumePreview.pages.map((src, index) => (
          <div className="resume-preview__page" key={index}>
            <img src={src} alt={`Resume page ${index + 1}`} />
          </div>
        ))}
        {resumePreview.truncated && (
          <p className="resume-preview__truncated-note">
            Showing the first {resumePreview.pages.length} of {resumePreview.totalPages} pages.
          </p>
        )}
      </div>
    );
  }

  if (resumePreview?.type === 'html' && resumePreview.html) {
    return (
      <div className="resume-preview__page resume-preview__page--html">
        <div
          className="resume-preview__html"
          // Content is sanitized (scripts / inline event handlers stripped)
          // in parseResume.js before it ever reaches this component.
          dangerouslySetInnerHTML={{ __html: resumePreview.html }}
        />
      </div>
    );
  }

  return (
    <div className="resume-preview__page">
      <pre className="resume-preview__text">{resumeText}</pre>
    </div>
  );
};

const ResumePreview = ({ resumeFile, resumeText, resumePreview, isParsingResume }) => (
  <section className="panel">
    <header className="panel__header">
      <h2 className="panel__title"><span className="panel__number">02</span>Resume Preview</h2>
    </header>

    {!resumeFile ? (
      <p className="panel__empty">No resume uploaded yet. Upload one to see a preview here.</p>
    ) : isParsingResume ? (
      <div className="loading-block">
        <div className="loading-bar" />
        <p className="loading-block__text">
          Reading file<span className="loading-block__cursor">▌</span>
        </p>
      </div>
    ) : (
      <>
        <div className="resume-preview__meta">
          <span className="resume-preview__filename">{resumeFile.name}</span>
          <span className="resume-preview__stats">
            {formatFileSize(resumeFile.size)} · {wordCount(resumeText)} words
          </span>
        </div>
        <div className="resume-preview__viewport">
          <ResumeVisual resumePreview={resumePreview} resumeText={resumeText} />
        </div>
      </>
    )}
  </section>
);

export default ResumePreview;
