import React from 'react';

const ThemeToggle = ({ theme, onToggle }) => {
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={onToggle}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      title={`Switch to ${isDark ? 'light' : 'dark'} theme`}
    >
      <span className="theme-toggle__icon" aria-hidden="true">{isDark ? '☾' : '☀'}</span>
      {isDark ? 'Dark' : 'Light'}
    </button>
  );
};

export default ThemeToggle;