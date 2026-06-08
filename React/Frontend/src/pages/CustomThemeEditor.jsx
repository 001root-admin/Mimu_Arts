import React, { useState, useEffect } from 'react';
import { api } from '../api/api';
import './CustomThemeEditor.css';

const COLOR_FIELDS = [
  { key: 'primary_bg', label: 'Background', dark: '#1E1A1C', light: '#FFF8F5' },
  { key: 'secondary_bg', label: 'Secondary BG', dark: '#2A2528', light: '#FFFFFF' },
  { key: 'card_bg', label: 'Card BG', dark: '#342E31', light: '#F5EDE8' },
  { key: 'accent1', label: 'Primary Accent', dark: '#BB8A5E', light: '#BB8A5E' },
  { key: 'accent2', label: 'Secondary Accent', dark: '#A7807D', light: '#A7807D' },
  { key: 'accent3', label: 'Tertiary Accent', dark: '#4977AB', light: '#4977AB' },
  { key: 'text_color', label: 'Text Color', dark: '#CFD4DA', light: '#2A2528' },
  { key: 'text_secondary', label: 'Secondary Text', dark: '#8A8F96', light: '#8A7D7A' },
  { key: 'border_color', label: 'Border Color', dark: '#3A3437', light: '#E8DDD8' },
];

const LIGHT_FIELDS = [
  { key: 'light_primary', label: 'Background', dark: '#FFF8F5' },
  { key: 'light_secondary', label: 'Secondary BG', dark: '#FFFFFF' },
  { key: 'light_card', label: 'Card BG', dark: '#F5EDE8' },
  { key: 'light_text', label: 'Text Color', dark: '#2A2528' },
  { key: 'light_text_sec', label: 'Secondary Text', dark: '#8A7D7A' },
  { key: 'light_border', label: 'Border Color', dark: '#E8DDD8' },
];

const CustomThemeEditor = () => {
  const [mode, setMode] = useState('dark');
  const [colors, setColors] = useState({
    primary_bg: '#1E1A1C', secondary_bg: '#2A2528', card_bg: '#342E31',
    accent1: '#BB8A5E', accent2: '#A7807D', accent3: '#4977AB',
    text_color: '#CFD4DA', text_secondary: '#8A8F96', border_color: '#3A3437',
    light_primary: '#FFF8F5', light_secondary: '#FFFFFF', light_card: '#F5EDE8',
    light_text: '#2A2528', light_text_sec: '#8A7D7A', light_border: '#E8DDD8',
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.getCustomTheme().then(t => {
      if (t && t.user_id) {
        setColors({
          primary_bg: t.primary_bg, secondary_bg: t.secondary_bg, card_bg: t.card_bg,
          accent1: t.accent1, accent2: t.accent2, accent3: t.accent3,
          text_color: t.text_color, text_secondary: t.text_secondary, border_color: t.border_color,
          light_primary: t.light_primary, light_secondary: t.light_secondary, light_card: t.light_card,
          light_text: t.light_text, light_text_sec: t.light_text_sec, light_border: t.light_border,
        });
      }
    }).catch(() => {});
  }, []);

  const updateColor = (key, value) => {
    setColors(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    await api.saveCustomTheme(colors);
    await api.setTheme('custom');
    localStorage.setItem('mimis_custom_theme', JSON.stringify(colors));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const currentFields = mode === 'dark' 
    ? COLOR_FIELDS.map(f => ({ ...f, value: colors[f.key], key: f.key, targetKey: f.key }))
    : LIGHT_FIELDS.map(f => ({ ...f, value: colors[f.key], key: f.key }));

  const previewStyle = mode === 'dark' ? {
    background: colors.primary_bg,
    color: colors.text_color,
    '--p-secondary': colors.secondary_bg,
    '--p-card': colors.card_bg,
    '--p-accent': colors.accent1,
    '--p-border': colors.border_color,
  } : {
    background: colors.light_primary,
    color: colors.light_text,
    '--p-secondary': colors.light_secondary,
    '--p-card': colors.light_card,
    '--p-accent': colors.accent1,
    '--p-border': colors.light_border,
  };

  return (
    <div className='theme-editor-page'>
      <div className='editor-header'>
        <h2>🎨 Custom Theme Creator</h2>
        <p>Design your own color scheme - it will be saved to your account!</p>
      </div>

      <div className='editor-layout'>
        <div className='editor-controls'>
          <div className='mode-switch'>
            <button className={`mode-btn ${mode === 'dark' ? 'active' : ''}`} onClick={() => setMode('dark')}>🌙 Dark</button>
            <button className={`mode-btn ${mode === 'light' ? 'active' : ''}`} onClick={() => setMode('light')}>☀️ Light</button>
          </div>

          <div className='color-fields'>
            {currentFields.map(field => (
              <div key={field.key} className='color-field'>
                <label>{field.label}</label>
                <div className='color-input-group'>
                  <input
                    type="color"
                    value={field.value}
                    onChange={(e) => updateColor(field.key, e.target.value)}
                  />
                  <input
                    type="text"
                    value={field.value}
                    onChange={(e) => updateColor(field.key, e.target.value)}
                    className='color-hex-input'
                  />
                </div>
              </div>
            ))}
          </div>

          <button className='save-theme-btn' onClick={handleSave}>
            {saved ? '✅ Theme Saved!' : '💾 Save Custom Theme'}
          </button>
        </div>

        <div className='editor-preview' style={previewStyle}>
          <h3 style={{ color: mode === 'dark' ? colors.text_color : colors.light_text }}>Live Preview</h3>
          <div className='preview-card' style={{ background: mode === 'dark' ? colors.secondary_bg : colors.light_secondary, border: `1px solid ${mode === 'dark' ? colors.border_color : colors.light_border}`, borderRadius: 12, padding: 20 }}>
            <div className='preview-header' style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: colors.accent1 }}></div>
              <div>
                <div style={{ fontWeight: 600, color: mode === 'dark' ? colors.text_color : colors.light_text }}>Your Name</div>
                <div style={{ fontSize: 12, color: mode === 'dark' ? colors.text_secondary : colors.light_text_sec }}>Your Location</div>
              </div>
            </div>
            <div className='preview-image' style={{ background: `linear-gradient(135deg, ${colors.accent1}, ${colors.accent2})`, height: 200, borderRadius: 8, marginBottom: 12 }}></div>
            <div className='preview-actions' style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
              {['❤️', '💬', '📤'].map((e, i) => (
                <span key={i} style={{ fontSize: 20, cursor: 'pointer' }}>{e}</span>
              ))}
            </div>
            <div style={{ fontWeight: 600, fontSize: 14, color: mode === 'dark' ? colors.text_color : colors.light_text }}>1,234 likes</div>
            <div style={{ fontSize: 14, color: mode === 'dark' ? colors.text_secondary : colors.light_text_sec }}>Your custom themed post preview</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomThemeEditor;