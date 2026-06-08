import React from 'react';
import './ThemePicker.css';
import { useTheme } from '../../context/ThemeContext';

const ThemePicker = () => {
  const { themes, currentTheme, changeTheme, isDark, toggleMode, themeName } = useTheme();

  return (
    <div className='theme-picker'>
      <div className='theme-picker-header'>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3"/>
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
        </svg>
        <span>{themeName}</span>
      </div>

      <div className='theme-options'>
        {Object.entries(themes).map(([key, theme]) => (
          <button
            key={key}
            className={`theme-btn ${currentTheme === key ? 'active' : ''}`}
            onClick={() => changeTheme(key)}
            style={{
              background: `linear-gradient(135deg, ${theme.accent1}, ${theme.accent2})`,
            }}
            title={theme.name}
          >
            <span className='theme-tooltip'>{theme.name}</span>
          </button>
        ))}
      </div>

      <div className='mode-toggle'>
        <button 
          className={`mode-btn ${!isDark ? 'active' : ''}`} 
          onClick={() => isDark && toggleMode()}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="5"/>
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
          </svg>
          <span>Light</span>
        </button>
        <button 
          className={`mode-btn ${isDark ? 'active' : ''}`} 
          onClick={() => !isDark && toggleMode()}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
          <span>Dark</span>
        </button>
      </div>
    </div>
  );
};

export default ThemePicker;