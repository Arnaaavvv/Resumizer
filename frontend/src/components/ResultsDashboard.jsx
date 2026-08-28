import React, { useState } from 'react';
import ScoreGauge from './ScoreGauge';
import GapList from './GapList';
import KeywordChips from './KeywordChips';
import BulletRewriteCard from './BulletRewriteCard';
import FormattingChecklist from './FormattingChecklist';
import { exportResults, exportResultsAsPDF } from '../lib/storage';

const STAMP_CLASS = { low: 'stamp stamp--low', medium: 'stamp stamp--medium', high: 'stamp stamp--high' };

const ResultsDashboard = ({ results }) => {
  // Tracks which export is in flight ('txt' | 'pdf' | null) so only the
  // clicked button shows a busy state and both stay disabled meanwhile.
  const [exportingFormat, setExportingFormat] = useState(null);

  const handleExport = async (format) => {
    if (!results || exportingFormat) return;
    setExportingFormat(format);
    try {
      if (format === 'pdf') {
        await exportResultsAsPDF(results);
      } else {
        await exportResults(results);
      }
    } catch {
      // exportResults/exportResultsAsPDF already log the error; the
      // download simply won't start.
    } finally {
      setExportingFormat(null);
    }
  };

  if (!results) {
    return (
      <section className="panel">
        <header className="panel__header">
          <h2 className="panel__title"><span className="panel__number">03</span>Results</h2>
        </header>
        <p className="panel__empty">Run an analysis to see results here.</p>
      </section>
    );
  }

  const atsKey = results.atsRisk?.toLowerCase();
  const stampClass = STAMP_CLASS[atsKey] || STAMP_CLASS.medium;

  return (
    <section className="panel">
      <header className="panel__header">
        <h2 className="panel__title"><span className="panel__number">03</span>Results</h2>
        <div className="header-actions">
          <button
            className="btn-ghost"
            onClick={() => handleExport('txt')}
            disabled={Boolean(exportingFormat)}
          >
            {exportingFormat === 'txt' ? 'Exporting…' : 'Export .txt'}
          </button>
          <button
            className="btn-ghost"
            onClick={() => handleExport('pdf')}
            disabled={Boolean(exportingFormat)}
          >
            {exportingFormat === 'pdf' ? 'Exporting…' : 'Export PDF'}
          </button>
        </div>
      </header>

      <div className="results-columns">
        <div>
          <ScoreGauge score={results.matchScore || 0} />

          <div className="subsection">
            <h3 className="subsection__title">Summary</h3>
            <p className="summary-text">{results.summary}</p>
          </div>

          {results.strengths?.length > 0 && (
            <div className="subsection">
              <h3 className="subsection__title">Strengths</h3>
              <ul className="strength-list">
                {results.strengths.map((strength, index) => (
                  <li key={index}>{strength}</li>
                ))}
              </ul>
            </div>
          )}

          {results.atsRisk && (
            <div className="subsection">
              <h3 className="subsection__title">ATS Risk</h3>
              <span className={stampClass}>{results.atsRisk.toUpperCase()} RISK</span>
            </div>
          )}
        </div>

        <div>
          <GapList gaps={results.gaps} />
          <KeywordChips
            matched={results.keywordAnalysis?.matched || []}
            missing={results.keywordAnalysis?.missing || []}
          />
          <BulletRewriteCard rewrites={results.bulletRewrites} />
          <FormattingChecklist issues={results.formattingIssues} />
        </div>
      </div>
    </section>
  );
};

export default ResultsDashboard;
