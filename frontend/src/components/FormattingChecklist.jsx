import React from 'react';

const FormattingChecklist = ({ issues }) => {
  if (!issues || issues.length === 0) return null;

  return (
    <div className="subsection">
      <h3 className="subsection__title">Formatting &amp; Structure</h3>
      <ul className="checklist">
        {issues.map((issue, index) => (
          <li key={index}>{issue}</li>
        ))}
      </ul>
    </div>
  );
};

export default FormattingChecklist;
