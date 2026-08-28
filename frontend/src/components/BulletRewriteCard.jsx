import React, { useState } from 'react';

const BulletRewriteCard = ({ rewrites }) => {
  const [copiedIndex, setCopiedIndex] = useState(-1);

  if (!rewrites || rewrites.length === 0) return null;

  const handleCopyClick = (index, improvedText) => {
    navigator.clipboard.writeText(improvedText).then(() => {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(-1), 2000);
    }).catch(() => {
      setCopiedIndex(-2);
    });
  };

  return (
    <div className="subsection">
      <h3 className="subsection__title">Suggested Rewrites</h3>
      <div className="rewrite-list">
        {rewrites.map((rewrite, index) => {
          const isCopied = copiedIndex === index;
          return (
            <div className="rewrite-card" key={index}>
              <div className="rewrite-card__block">
                <div className="rewrite-card__label rewrite-card__label--original">Original</div>
                <p className="rewrite-card__original">{rewrite.original}</p>
              </div>
              <div className="rewrite-card__block">
                <div className="rewrite-card__label rewrite-card__label--improved">Improved</div>
                <p className="rewrite-card__improved">{rewrite.improved}</p>
              </div>
              <div className="rewrite-card__block">
                <div className="rewrite-card__label">Why</div>
                <p className="rewrite-card__reason">{rewrite.reason}</p>
              </div>
              <button
                className={`btn-copy${isCopied ? ' is-done' : ''}`}
                onClick={() => handleCopyClick(index, rewrite.improved)}
              >
                {isCopied ? '✓ Copied' : 'Copy Improved Bullet'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BulletRewriteCard;
