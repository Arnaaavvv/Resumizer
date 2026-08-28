import React from 'react';

const KeywordChips = ({ matched, missing }) => {
  return (
    <div className="subsection">
      <h3 className="subsection__title">Keyword Analysis</h3>
      <div className="chip-columns">
        <div>
          <div className="chip-group__label">Matched</div>
          {matched.length > 0 ? (
            <div className="chip-list">
              {matched.map((keyword, index) => (
                <span className="chip chip--matched" key={index}>+ {keyword}</span>
              ))}
            </div>
          ) : (
            <p className="chip-empty">None found</p>
          )}
        </div>
        <div>
          <div className="chip-group__label">Missing</div>
          {missing.length > 0 ? (
            <div className="chip-list">
              {missing.map((keyword, index) => (
                <span className="chip chip--missing" key={index}>− {keyword}</span>
              ))}
            </div>
          ) : (
            <p className="chip-empty">None identified</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default KeywordChips;
