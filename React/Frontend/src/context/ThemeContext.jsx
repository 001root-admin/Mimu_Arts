import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../api/api';

const ThemeContext = createContext();

const themeDefinitions = {
  'dark-gold': {
    name: 'Dark Gold',
    dark: {
      primary: '#1E1A1C', secondary: '#2A2528', card: '#342E31',
      accent1: '#BB8A5E', accent2: '#A7807D', accent3: '#4977AB',
      text: '#CFD4DA', textSecondary: '#8A8F96', border: '#3A3437',
      linkColor: '#BB8A5E',
    },
    light: {
      primary: '#FFF8F5', secondary: '#FFFFFF', card: '#F5EDE8',
      accent1: '#BB8A5E', accent2: '#A7807D', accent3: '#4977AB',
      text: '#2A2528', textSecondary: '#8A7D7A', border: '#E8DDD8',
      linkColor: '#BB8A5E',
    }
  },
  'pink-aesthetic': {
    name: 'Pink Aesthetic',
    dark: {
      primary: '#1A1418', secondary: '#2A1E24', card: '#3A2830',
      accent1: '#FF69B4', accent2: '#FFB6C1', accent3: '#DB7093',
      text: '#F5E6ED', textSecondary: '#C4A3B4', border: '#4A3040',
      linkColor: '#FF69B4',
    },
    light: {
      primary: '#FFF5F8', secondary: '#FFFFFF', card: '#FFE8F0',
      accent1: '#FF69B4', accent2: '#FFB6C1', accent3: '#DB7093',
      text: '#2A1E24', textSecondary: '#A88A98', border: '#F0D5E0',
      linkColor: '#FF1493',
    }
  },
  'rose-blush': {
    name: 'Rose Blush',
    dark: {
      primary: '#1C1517', secondary: '#2C1F22', card: '#3C292D',
      accent1: '#E8A0B4', accent2: '#C88A9C', accent3: '#A86A7C',
      text: '#F0E0E4', textSecondary: '#C0A8B0', border: '#4C353A',
      linkColor: '#E8A0B4',
    },
    light: {
      primary: '#FEF5F7', secondary: '#FFFFFF', card: '#FCE8ED',
      accent1: '#E8A0B4', accent2: '#C88A9C', accent3: '#A86A7C',
      text: '#2C1F22', textSecondary: '#A89096', border: '#E8D5DA',
      linkColor: '#C88A9C',
    }
  },
  'ocean-blue': {
    name: 'Ocean Blue',
    dark: {
      primary: '#0D1B2A', secondary: '#1B2838', card: '#243447',
      accent1: '#4A90D9', accent2: '#5BA3E6', accent3: '#7BB8F0',
      text: '#E0EAF5', textSecondary: '#A0B8CC', border: '#2A3F52',
      linkColor: '#5BA3E6',
    },
    light: {
      primary: '#F0F6FF', secondary: '#FFFFFF', card: '#E0ECFA',
      accent1: '#4A90D9', accent2: '#5BA3E6', accent3: '#7BB8F0',
      text: '#0D1B2A', textSecondary: '#5A7A96', border: '#C8D8E8',
      linkColor: '#4A90D9',
    }
  },
  'forest-green': {
    name: 'Forest Green',
    dark: {
      primary: '#0F1F14', secondary: '#1A2E20', card: '#253D2C',
      accent1: '#4CAF50', accent2: '#66BB6A', accent3: '#81C784',
      text: '#E0F0E2', textSecondary: '#A0C0A8', border: '#2D4534',
      linkColor: '#66BB6A',
    },
    light: {
      primary: '#F0FAF2', secondary: '#FFFFFF', card: '#E0F2E4',
      accent1: '#4CAF50', accent2: '#66BB6A', accent3: '#81C784',
      text: '#0F1F14', textSecondary: '#5A8A64', border: '#C0D8C4',
      linkColor: '#4CAF50',
    }
  },
  'lavender': {
    name: 'Lavender Dreams',
    dark: {
      primary: '#18142A', secondary: '#261E3E', card: '#342852',
      accent1: '#B39DDB', accent2: '#CE93D8', accent3: '#E1BEE7',
      text: '#EDE7F6', textSecondary: '#BDB3CC', border: '#3D2E5A',
      linkColor: '#CE93D8',
    },
    light: {
      primary: '#F5F0FF', secondary: '#FFFFFF', card: '#EDE4FA',
      accent1: '#B39DDB', accent2: '#CE93D8', accent3: '#E1BEE7',
      text: '#18142A', textSecondary: '#7A6A96', border: '#D8CCE8',
      linkColor: '#9C27B0',
    }
  },
  'sunset-orange': {
    name: 'Sunset Orange',
    dark: {
      primary: '#1E1410', secondary: '#2E1E18', card: '#3E2820',
      accent1: '#FF7043', accent2: '#FF8A65', accent3: '#FFAB91',
      text: '#F5EAE6', textSecondary: '#CCB0A8', border: '#4E3028',
      linkColor: '#FF8A65',
    },
    light: {
      primary: '#FFF8F5', secondary: '#FFFFFF', card: '#FFECE5',
      accent1: '#FF7043', accent2: '#FF8A65', accent3: '#FFAB91',
      text: '#1E1410', textSecondary: '#A0867E', border: '#E8D0C8',
      linkColor: '#FF7043',
    }
  },
  'monochrome': {
    name: 'Monochrome',
    dark: {
      primary: '#0D0D0D', secondary: '#1A1A1A', card: '#262626',
      accent1: '#E0E0E0', accent2: '#BDBDBD', accent3: '#9E9E9E',
      text: '#F5F5F5', textSecondary: '#B0B0B0', border: '#333333',
      linkColor: '#9E9E9E',
    },
    light: {
      primary: '#F5F5F5', secondary: '#FFFFFF', card: '#EBEBEB',
      accent1: '#1A1A1A', accent2: '#555555', accent3: '#888888',
      text: '#1A1A1A', textSecondary: '#666666', border: '#D4D4D4',
      linkColor: '#1A1A1A',
    }
  },
  'pink-blue': {
    name: 'Pink & Blue',
    dark: {
      primary: '#0D1117', secondary: '#161B22', card: '#21262D',
      accent1: '#FF69B4', accent2: '#58A6FF', accent3: '#79C0FF',
      text: '#F0E6F0', textSecondary: '#8B949E', border: '#30363D',
      linkColor: '#FF69B4',
    },
    light: {
      primary: '#F5F8FF', secondary: '#FFFFFF', card: '#E8EEFA',
      accent1: '#FF69B4', accent2: '#58A6FF', accent3: '#79C0FF',
      text: '#0D1117', textSecondary: '#586078', border: '#C8D0DE',
      linkColor: '#58A6FF',
    }
  },
};

// Generate combined themes (dark + light variants)
const defaultThemes = {};
Object.entries(themeDefinitions).forEach(([key, def]) => {
  defaultThemes[key] = { ...def.dark, name: def.name, _def: def };
});

export function ThemeProvider({ children }) {
  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem('mimis_theme') || 'dark-gold';
  });
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('mimis_mode');
    return saved !== null ? saved === 'dark' : true;
  });
  const [hasCustomTheme, setHasCustomTheme] = useState(false);

  const applyTheme = useCallback((themeKey, mode) => {
    const def = themeDefinitions[themeKey];
    if (!def) return;
    const theme = mode ? def.dark : def.light;
    const root = document.documentElement;

    root.style.setProperty('--bg-primary', theme.primary);
    root.style.setProperty('--bg-secondary', theme.secondary);
    root.style.setProperty('--bg-card', theme.card);
    root.style.setProperty('--accent-rose', theme.accent2);
    root.style.setProperty('--accent-blue', theme.accent3);
    root.style.setProperty('--accent-gold', theme.accent1);
    root.style.setProperty('--text-primary', theme.text);
    root.style.setProperty('--text-secondary', theme.textSecondary);
    root.style.setProperty('--border-color', theme.border);
    root.style.setProperty('--link-color', theme.linkColor || theme.accent1);
    const gradient = mode ?
      `linear-gradient(135deg, ${def.dark.accent1}, ${def.dark.accent2})` :
      `linear-gradient(135deg, ${def.light.accent1}, ${def.light.accent2})`;
    root.style.setProperty('--theme-gradient', gradient);

    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme.primary);
    localStorage.setItem('mimis_theme', themeKey);
    localStorage.setItem('mimis_mode', mode ? 'dark' : 'light');
    setCurrentTheme(themeKey);
    setIsDark(mode);
  }, []);

  const applyCustomThemeRef = useRef(null);
  const applyCustomTheme = useCallback((customColors, mode) => {
    if (!customColors) return;
    const root = document.documentElement;
    const isDarkMode = mode !== undefined ? mode : isDark;

    const colors = isDarkMode ? {
      primary: customColors.primary_bg,
      secondary: customColors.secondary_bg,
      card: customColors.card_bg,
      accent1: customColors.accent1,
      accent2: customColors.accent2,
      accent3: customColors.accent3,
      text: customColors.text_color,
      textSecondary: customColors.text_secondary,
      border: customColors.border_color,
      linkColor: customColors.link_color || customColors.accent1,
    } : {
      primary: customColors.light_primary,
      secondary: customColors.light_secondary,
      card: customColors.light_card,
      accent1: customColors.accent1,
      accent2: customColors.accent2,
      accent3: customColors.accent3,
      text: customColors.light_text,
      textSecondary: customColors.light_text_sec,
      border: customColors.light_border,
      linkColor: customColors.light_link_color || customColors.accent1,
    };

    root.style.setProperty('--bg-primary', colors.primary);
    root.style.setProperty('--bg-secondary', colors.secondary);
    root.style.setProperty('--bg-card', colors.card);
    root.style.setProperty('--accent-rose', colors.accent2);
    root.style.setProperty('--accent-blue', colors.accent3);
    root.style.setProperty('--accent-gold', colors.accent1);
    root.style.setProperty('--text-primary', colors.text);
    root.style.setProperty('--text-secondary', colors.textSecondary);
    root.style.setProperty('--border-color', colors.border);
    root.style.setProperty('--link-color', colors.linkColor);
    const gradient = `linear-gradient(135deg, ${customColors.accent1}, ${customColors.accent2})`;
    root.style.setProperty('--theme-gradient', gradient);

    localStorage.setItem('mimis_custom_theme', JSON.stringify(customColors));
    localStorage.setItem('mimis_theme', 'custom');
    localStorage.setItem('mimis_mode', isDarkMode ? 'dark' : 'light');
    setCurrentTheme('custom');
    setIsDark(isDarkMode);
  }, [isDark]);

  // Keep a ref to always have the latest applyCustomTheme
  useEffect(() => { applyCustomThemeRef.current = applyCustomTheme; }, [applyCustomTheme]);

  const changeTheme = useCallback(async (themeKey) => {
    if (themeKey === 'custom') {
      // Try server first, then localStorage
      if (api.isAuthenticated()) {
        try {
          const saved = await api.getCustomTheme();
          if (saved && saved.user_id) {
            applyCustomTheme(saved, isDark);
            setHasCustomTheme(true);
            try { await api.setTheme('custom'); } catch {}
            return;
          }
        } catch {}
      }
      const localCustom = localStorage.getItem('mimis_custom_theme');
      if (localCustom) {
        try {
          applyCustomTheme(JSON.parse(localCustom), isDark);
          if (api.isAuthenticated()) { try { await api.setTheme('custom'); } catch {} }
          return;
        } catch {}
      }
      // No custom theme yet
      return;
    }
    applyTheme(themeKey, isDark);
    if (api.isAuthenticated()) {
      try { await api.setTheme(themeKey); } catch {}
    }
  }, [applyTheme, isDark, applyCustomTheme]);

  const toggleMode = useCallback(() => {
    const newMode = !isDark;
    if (currentTheme === 'custom') {
      const saved = localStorage.getItem('mimis_custom_theme');
      if (saved) {
        try { applyCustomTheme(JSON.parse(saved), newMode); return; } catch {}
      }
    }
    applyTheme(currentTheme, newMode);
  }, [applyTheme, currentTheme, isDark, applyCustomTheme]);

  // Initial load: apply saved theme immediately, then sync with backend
  useEffect(() => {
    const savedTheme = localStorage.getItem('mimis_theme') || 'dark-gold';
    const savedMode = localStorage.getItem('mimis_mode') !== 'light';

    // Apply theme immediately from localStorage to prevent flash
    if (savedTheme === 'custom') {
      const localCustom = localStorage.getItem('mimis_custom_theme');
      if (localCustom) {
        try {
          const colors = JSON.parse(localCustom);
          // Apply directly to DOM without relying on callback closure
          const root = document.documentElement;
          const isDarkMode = savedMode;
          const c = colors;
          const themeColors = isDarkMode ? {
            primary: c.primary_bg, secondary: c.secondary_bg, card: c.card_bg,
            text: c.text_color, textSec: c.text_secondary, border: c.border_color,
            link: c.link_color || c.accent1,
          } : {
            primary: c.light_primary, secondary: c.light_secondary, card: c.light_card,
            text: c.light_text, textSec: c.light_text_sec, border: c.light_border,
            link: c.light_link_color || c.accent1,
          };
          root.style.setProperty('--bg-primary', themeColors.primary);
          root.style.setProperty('--bg-secondary', themeColors.secondary);
          root.style.setProperty('--bg-card', themeColors.card);
          root.style.setProperty('--accent-rose', c.accent2);
          root.style.setProperty('--accent-blue', c.accent3);
          root.style.setProperty('--accent-gold', c.accent1);
          root.style.setProperty('--text-primary', themeColors.text);
          root.style.setProperty('--text-secondary', themeColors.textSec);
          root.style.setProperty('--border-color', themeColors.border);
          root.style.setProperty('--link-color', themeColors.link);
          root.style.setProperty('--theme-gradient', `linear-gradient(135deg, ${c.accent1}, ${c.accent2})`);
          setCurrentTheme('custom');
          setIsDark(isDarkMode);
        } catch { applyTheme('dark-gold', savedMode); }
      } else {
        applyTheme('dark-gold', savedMode);
      }
    } else if (themeDefinitions[savedTheme]) {
      applyTheme(savedTheme, savedMode);
    } else {
      applyTheme('dark-gold', savedMode);
    }

    if (api.isAuthenticated()) {
      // Check whether user has a custom theme
      try {
        const me = JSON.parse(localStorage.getItem('mimis_user') || 'null');
        if (me && me.id) {
          api.hasCustomTheme(me.id).then(v => setHasCustomTheme(v));
        }
      } catch {}

      api.getMe().then(user => {
        // Sync localStorage with server but DON'T override if already applied
        if (user.theme) {
          localStorage.setItem('mimis_theme', user.theme);
          if (user.theme !== savedTheme) {
            setCurrentTheme(user.theme);
            if (user.theme === 'custom') {
              api.getCustomTheme().then(custom => {
                if (custom && custom.user_id) applyCustomTheme(custom, savedMode);
              }).catch(() => {});
            } else if (themeDefinitions[user.theme]) {
              applyTheme(user.theme, savedMode);
            }
          }
        }
      }).catch(() => {});
    }
  }, [applyTheme, applyCustomTheme]);

  const displayTheme = themeDefinitions[currentTheme] || themeDefinitions['dark-gold'];

  // Re-fetch custom theme status whenever user changes
  useEffect(() => {
    const onStorage = () => {
      try {
        const me = JSON.parse(localStorage.getItem('mimis_user') || 'null');
        if (me && me.id) {
          api.hasCustomTheme(me.id).then(v => setHasCustomTheme(v));
        }
      } catch {}
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return (
    <ThemeContext.Provider value={{
      currentTheme,
      changeTheme,
      themes: defaultThemes,
      theme: isDark ? displayTheme.dark : displayTheme.light,
      isDark,
      toggleMode,
      themeName: displayTheme.name,
      hasCustomTheme,
      applyCustomTheme,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
