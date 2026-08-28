import React from 'react';

const SEVERITY_COLOR = {
  high: 'var(--color-danger)',
  medium: 'var(--color-warn)',
  low: 'var(--color-muted)',
};

const GapList = ({ gaps }) => {
  if (!gaps || gaps.length === 0) return null;

  return (
    <div className="subsection">
      <h3 className="subsection__title">Improvement Areas</h3>
      <div className="gap-list">
        {gaps.map((gap, index) => {
          const color = SEVERITY_COLOR[gap.severity?.toLowerCase()] || SEVERITY_COLOR.low;
          return (
            <div className="gap-card" key={index} style={{ '--gap-color': color }}>
              <span className="gap-card__tag">{(gap.severity || 'low').toUpperCase()}</span>
              <div>
                <div className="gap-card__issue">{gap.issue}</div>
                <div className="gap-card__suggestion">{gap.suggestion}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GapList;
