import React, { useState, useEffect } from 'react';
import { api } from '../api/api';
import { useTheme } from '../context/ThemeContext';
import ThemePicker from '../components/ThemePicker/ThemePicker';
import './CustomThemeEditor.css';

const DARK_FIELDS = [
  { key: 'primary_bg', label: 'Background', default: '#1E1A1C' },
  { key: 'secondary_bg', label: 'Secondary BG', default: '#2A2528' },
  { key: 'card_bg', label: 'Card BG', default: '#342E31' },
  { key: 'accent1', label: 'Primary Accent', default: '#BB8A5E' },
  { key: 'accent2', label: 'Secondary Accent', default: '#A7807D' },
  { key: 'accent3', label: 'Tertiary Accent', default: '#4977AB' },
  { key: 'text_color', label: 'Text Color', default: '#CFD4DA' },
  { key: 'text_secondary', label: 'Secondary Text', default: '#8A8F96' },
  { key: 'border_color', label: 'Border Color', default: '#3A3437' },
  { key: 'link_color', label: 'Link Color', default: '#BB8A5E' },
];

const LIGHT_FIELDS = [
  { key: 'light_primary', label: 'Background', default: '#FFF8F5' },
  { key: 'light_secondary', label: 'Secondary BG', default: '#FFFFFF' },
  { key: 'light_card', label: 'Card BG', default: '#F5EDE8' },
  { key: 'light_text', label: 'Text Color', default: '#2A2528' },
  { key: 'light_text_sec', label: 'Secondary Text', default: '#8A7D7A' },
  { key: 'light_border', label: 'Border Color', default: '#E8DDD8' },
  { key: 'light_link_color', label: 'Link Color', default: '#BB8A5E' },
  { key: 'accent1', label: 'Primary Accent', default: '#BB8A5E' },
  { key: 'accent2', label: 'Secondary Accent', default: '#A7807D' },
  { key: 'accent3', label: 'Tertiary Accent', default: '#4977AB' },
];

const CustomThemeEditor = () => {
  const { applyCustomTheme, isDark } = useTheme();
  const [showLight, setShowLight] = useState(false);
  const [colors, setColors] = useState({
    primary_bg: '#1E1A1C', secondary_bg: '#2A2528', card_bg: '#342E31',
    accent1: '#BB8A5E', accent2: '#A7807D', accent3: '#4977AB',
    text_color: '#CFD4DA', text_secondary: '#8A8F96', border_color: '#3A3437',
    light_primary: '#FFF8F5', light_secondary: '#FFFFFF', light_card: '#F5EDE8',
    light_text: '#2A2528', light_text_sec: '#8A7D7A', light_border: '#E8DDD8',
    link_color: '#BB8A5E', light_link_color: '#BB8A5E',
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
          link_color: t.link_color || t.accent1, light_link_color: t.light_link_color || t.accent1,
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
    applyCustomTheme(colors, isDark);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const previewStyle = {
    background: colors.primary_bg,
    color: colors.text_color,
    '--p-secondary': colors.secondary_bg,
    '--p-card': colors.card_bg,
    '--p-accent': colors.accent1,
    '--p-border': colors.border_color,
    '--p-link': colors.link_color,
  };

  const lightPreviewStyle = {
    background: colors.light_primary,
    color: colors.light_text,
    '--p-secondary': colors.light_secondary,
    '--p-card': colors.light_card,
    '--p-accent': colors.accent1,
    '--p-border': colors.light_border,
    '--p-link': colors.light_link_color,
  };

  return (
    <div className='theme-editor-page'>
      {/* Prebuilt themes section */}
      <div className='theme-presets-section'>
        <div className='editor-header'>
          <h2>Theme</h2>
          <p>Choose a prebuilt theme or create your own custom theme below.</p>
        </div>
        <ThemePicker />
      </div>

      <div className='editor-divider'></div>

      <div className='editor-header'>
        <h2>Custom Theme Creator</h2>
        <p>Design your own color scheme — it will be saved to your account!</p>
      </div>

      <div className='editor-layout'>
        <div className='editor-controls'>
          <div className='mode-switch'>
            <button className={`mode-btn ${!showLight ? 'active' : ''}`} onClick={() => setShowLight(false)}>🌙 Dark Mode Colors</button>
            <button className={`mode-btn ${showLight ? 'active' : ''}`} onClick={() => setShowLight(true)}>☀️ Light Mode Colors</button>
          </div>

          <div className='color-fields'>
            {(!showLight ? DARK_FIELDS : LIGHT_FIELDS).map(field => (
              <div key={field.key} className='color-field'>
                <label>{field.label}</label>
                <div className='color-input-group'>
                  <input
                    type="color"
                    value={colors[field.key] || field.default}
                    onChange={(e) => updateColor(field.key, e.target.value)}
                  />
                  <input
                    type="text"
                    value={colors[field.key] || field.default}
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

        <div className='editor-preview'>
          <h3>🌙 Dark Mode Preview</h3>
          <div className='preview-card' style={previewStyle}>
            <div className='preview-card-inner' style={{ background: colors.secondary_bg, border: `1px solid ${colors.border_color}`, borderRadius: 12, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: colors.accent1 }}></div>
                <div>
                  <div style={{ fontWeight: 600, color: colors.text_color }}>Your Name</div>
                  <div style={{ fontSize: 12, color: colors.text_secondary }}>Your Location</div>
                </div>
              </div>
              <div className='preview-image' style={{ background: `linear-gradient(135deg, ${colors.accent1}, ${colors.accent2})`, height: 200, borderRadius: 8, marginBottom: 12 }}></div>
              <div style={{ fontWeight: 600, fontSize: 14, color: colors.text_color }}>1,234 likes</div>
              <div style={{ fontSize: 14, color: colors.text_secondary, marginBottom: 8 }}>Dark theme post preview</div>
              <a href="#" style={{ color: colors.link_color, fontSize: 13, fontWeight: 600, textDecoration: 'none' }} onClick={(e) => e.preventDefault()}>🔗 See more</a>
            </div>
          </div>

          <h3 style={{ marginTop: 24 }}>☀️ Light Mode Preview</h3>
          <div className='preview-card' style={{ background: '#FFF8F5' }}>
            <div className='preview-card-inner' style={{ background: colors.light_secondary, border: `1px solid ${colors.light_border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: colors.accent1 }}></div>
                <div>
                  <div style={{ fontWeight: 600, color: colors.light_text }}>Your Name</div>
                  <div style={{ fontSize: 12, color: colors.light_text_sec }}>Your Location</div>
                </div>
              </div>
              <div className='preview-image' style={{ background: `linear-gradient(135deg, ${colors.accent2}, ${colors.accent3})`, height: 200, borderRadius: 8, marginBottom: 12 }}></div>
              <div style={{ fontWeight: 600, fontSize: 14, color: colors.light_text }}>1,234 likes</div>
              <div style={{ fontSize: 14, color: colors.light_text_sec, marginBottom: 8 }}>Light theme post preview</div>
              <a href="#" style={{ color: colors.light_link_color, fontSize: 13, fontWeight: 600, textDecoration: 'none' }} onClick={(e) => e.preventDefault()}>🔗 See more</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomThemeEditor;