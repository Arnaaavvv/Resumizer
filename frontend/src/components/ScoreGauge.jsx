import React from 'react';

const verdictFor = (score) => {
  if (score >= 80) return { label: 'Strong Match', color: 'var(--color-accent)' };
  if (score >= 60) return { label: 'Moderate Match', color: 'var(--color-warn)' };
  return { label: 'Weak Match', color: 'var(--color-danger)' };
};

const ScoreGauge = ({ score }) => {
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (Math.max(0, Math.min(100, score)) / 100) * circumference;
  const verdict = verdictFor(score);

  return (
    <div className="gauge-block">
      <svg width="132" height="132" viewBox="0 0 132 132">
        <circle cx="66" cy="66" r={radius} stroke="var(--color-rule)" strokeWidth="8" fill="none" />
        <circle
          cx="66"
          cy="66"
          r={radius}
          stroke={verdict.color}
          strokeWidth="8"
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="butt"
          transform="rotate(-90 66 66)"
        />
        <text x="66" y="70" textAnchor="middle" fontSize="30" fontWeight="600" fontFamily="var(--font-display)" fill="var(--color-ink)">
          {score}
        </text>
        <text x="66" y="90" textAnchor="middle" fontSize="10" letterSpacing="1" fontFamily="var(--font-mono)" fill="var(--color-muted)">
          / 100
        </text>
      </svg>
      <div className="gauge-block__verdict" style={{ color: verdict.color }}>
        {verdict.label}
      </div>
    </div>
  );
};

export default ScoreGauge;
