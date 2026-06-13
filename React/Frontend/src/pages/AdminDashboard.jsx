import React, { useState, useEffect } from 'react';
import { api } from '../api/api';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [tab, setTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [settings, setSettings] = useState({});
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [themes, setThemes] = useState({});
  const [selectedTheme, setSelectedTheme] = useState('pink-blue');

  useEffect(() => {
    if (tab === 'dashboard') api.getAdminStats().then(setStats);
    if (tab === 'users') loadUsers();
    if (tab === 'posts') loadPosts();
    if (tab === 'settings') {
      api.getSiteSettings().then(setSettings);
      api.getThemes().then(setThemes);
    }
  }, [tab, page]);

  const loadUsers = async () => {
    const data = await api.getAdminUsers(page, search);
    setUsers(data);
  };

  const loadPosts = async () => {
    const data = await api.getAdminPosts(page);
    setPosts(data);
  };

  const handleUserAction = async (id, data) => {
    await api.updateUser(id, data);
    loadUsers();
  };

  const handleSettingChange = async (key, value) => {
    await api.updateSiteSetting(key, value);
    setSettings(s => ({ ...s, [key]: value }));
  };

  // Theme selector for default theme
  const handleDefaultThemeChange = async (themeKey) => {
    setSelectedTheme(themeKey);
    await handleSettingChange('default_theme', themeKey);
  };

  const StatCard = ({ label, value, icon }) => (
    <div className='stat-card'>
      <div className='stat-icon' style={{ background: icon.bg }}>{icon.svg}</div>
      <div className='stat-info'>
        <span className='stat-value'>{value ?? '...'}</span>
        <span className='stat-label'>{label}</span>
      </div>
    </div>
  );

  const icons = {
    users: { svg: '👥', bg: '#4A90D922' },
    posts: { svg: '📸', bg: '#BB8A5E22' },
    comments: { svg: '💬', bg: '#4CAF5022' },
    likes: { svg: '❤️', bg: '#FF69B422' },
    banned: { svg: '🚫', bg: '#e74c3c22' },
    admins: { svg: '🛡️', bg: '#B39DDB22' },
    newUsers: { svg: '✨', bg: '#58A6FF22' },
    postsToday: { svg: '🔥', bg: '#FF704322' }
  };

  return (
    <div className='admin-dashboard'>
      <div className='admin-header'>
        <h1>⚙️ Admin Panel</h1>
        <div className='admin-tabs'>
          {['dashboard', 'users', 'posts', 'auth', 'settings'].map(t => (
            <button key={t} className={`admin-tab ${tab === t ? 'active' : ''}`} onClick={() => { setTab(t); setPage(1); }}>
              {t === 'auth' ? '🔐 Auth' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {tab === 'dashboard' && stats && (
        <div className='stats-grid'>
          <StatCard label="Total Users" value={stats.totalUsers} icon={icons.users} />
          <StatCard label="Total Posts" value={stats.totalPosts} icon={icons.posts} />
          <StatCard label="Comments" value={stats.totalComments} icon={icons.comments} />
          <StatCard label="Likes" value={stats.totalLikes} icon={icons.likes} />
          <StatCard label="Banned Users" value={stats.bannedUsers} icon={icons.banned} />
          <StatCard label="Admins" value={stats.admins} icon={icons.admins} />
          <StatCard label="New Today" value={stats.newToday} icon={icons.newUsers} />
          <StatCard label="Posts Today" value={stats.postsToday} icon={icons.postsToday} />
        </div>
      )}

      {tab === 'users' && (
        <div className='admin-section'>
          <div className='admin-toolbar'>
            <input type="text" placeholder="Search users by name, email..." value={search} 
              onChange={e => { setSearch(e.target.value); setPage(1); }} className='admin-search' />
          </div>
          <div className='admin-table'>
            <div className='table-header'>
              <span>ID</span><span>Username</span><span>Email</span><span>Display</span><span>Role</span><span>Status</span><span>Auth</span><span>Actions</span>
            </div>
            {users.users?.map(u => (
              <div key={u.id} className='table-row'>
                <span>{u.id}</span>
                <span>{u.username}</span>
                <span>{u.email}</span>
                <span>{u.display_name}</span>
                <span><span className={`role-badge ${u.role}`}>{u.role}</span></span>
                <span>{u.is_banned ? <span className='status-banned'>Banned</span> : <span className='status-active'>Active</span>}</span>
                <span><span className='auth-badge'>{u.auth_provider || 'email'}</span></span>
                <span className='action-btns'>
                  <button className='btn-small' onClick={() => handleUserAction(u.id, { role: u.role === 'admin' ? 'user' : 'admin' })}>
                    {u.role === 'admin' ? 'Demote' : 'Make Admin'}
                  </button>
                  <button className='btn-small btn-danger' onClick={() => handleUserAction(u.id, { is_banned: !u.is_banned })}>
                    {u.is_banned ? 'Unban' : 'Ban'}
                  </button>
                  <button className='btn-small btn-warn' onClick={() => { if (window.confirm(`Delete user "${u.username}"? This cannot be undone.`)) api.deleteUser(u.id).then(loadUsers); }}>
                    Delete
                  </button>
                </span>
              </div>
            ))}
          </div>
          {users.totalPages > 1 && (
            <div className='pagination'>
              {Array.from({ length: users.totalPages }, (_, i) => (
                <button key={i} className={`page-btn ${page === i + 1 ? 'active' : ''}`} onClick={() => setPage(i + 1)}>{i + 1}</button>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'posts' && (
        <div className='admin-section'>
          <div className='admin-table'>
            <div className='table-header'>
              <span>ID</span><span>User</span><span>Caption</span><span>Likes</span><span>Comments</span><span>Status</span><span>Actions</span>
            </div>
            {posts.posts?.map(p => (
              <div key={p.id} className='table-row'>
                <span>{p.id}</span>
                <span>{p.username}</span>
                <span className='caption-cell'>{p.caption?.slice(0, 40)}</span>
                <span>{p.likes_count}</span>
                <span>{p.comments_count}</span>
                <span>{p.is_hidden ? <span className='status-banned'>Hidden</span> : <span className='status-active'>Visible</span>}</span>
                <span>
                  <button className='btn-small' onClick={() => api.hidePost(p.id, !p.is_hidden).then(loadPosts)}>
                    {p.is_hidden ? 'Show' : 'Hide'}
                  </button>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'auth' && (
        <div className='admin-section'>
          <h3 style={{ marginBottom: '16px', color: 'var(--text-primary)' }}>🔐 Social Login Providers</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
            Toggle social login providers on/off. Add your API keys in the settings below.
          </p>
          
          <div className='auth-providers-grid'>
            {[
              { key: 'google', name: 'Google', color: '#EA4335', icon: '🔵' },
              { key: 'facebook', name: 'Facebook', color: '#1877F2', icon: '📘' },
              { key: 'x', name: 'X (Twitter)', color: '#000', icon: '✖️' },
              { key: 'apple', name: 'Apple', color: '#000', icon: '🍎' },
              { key: 'github', name: 'GitHub', color: '#333', icon: '🐙' },
              { key: 'discord', name: 'Discord', color: '#5865F2', icon: '💬' },
              { key: 'linkedin', name: 'LinkedIn', color: '#0A66C2', icon: '💼' },
            ].map(p => (
              <div key={p.key} className='auth-provider-card' style={{ borderColor: settings[`allow_${p.key}_login`] === 'true' ? p.color : 'var(--border-color)' }}>
                <div className='auth-provider-header'>
                  <span className='auth-provider-icon'>{p.icon}</span>
                  <span className='auth-provider-name'>{p.name}</span>
                </div>
                <button className={`toggle-btn ${settings[`allow_${p.key}_login`] === 'true' ? 'on' : 'off'}`}
                  onClick={() => handleSettingChange(`allow_${p.key}_login`, settings[`allow_${p.key}_login`] === 'true' ? 'false' : 'true')}>
                  {settings[`allow_${p.key}_login`] === 'true' ? 'ON' : 'OFF'}
                </button>
              </div>
            ))}
          </div>

          <h3 style={{ margin: '24px 0 16px', color: 'var(--text-primary)' }}>📧 Email Verification</h3>
          <div className='setting-item'>
            <label>Require Email Verification</label>
            <button className={`toggle-btn ${settings.require_email_verification === 'true' ? 'on' : 'off'}`}
              onClick={() => handleSettingChange('require_email_verification', settings.require_email_verification === 'true' ? 'false' : 'true')}>
              {settings.require_email_verification === 'true' ? 'ON' : 'OFF'}
            </button>
          </div>

          <h3 style={{ margin: '24px 0 16px', color: 'var(--text-primary)' }}>🔑 API Keys (Placeholder)</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Add your real API keys from each provider's developer console.
          </p>
          
          {[
            { key: 'google_client_id', label: 'Google Client ID' },
            { key: 'google_client_secret', label: 'Google Client Secret' },
            { key: 'facebook_app_id', label: 'Facebook App ID' },
            { key: 'facebook_app_secret', label: 'Facebook App Secret' },
            { key: 'x_client_id', label: 'X (Twitter) Client ID' },
            { key: 'x_client_secret', label: 'X (Twitter) Client Secret' },
            { key: 'apple_client_id', label: 'Apple Client ID' },
            { key: 'apple_team_id', label: 'Apple Team ID' },
            { key: 'github_client_id', label: 'GitHub Client ID' },
            { key: 'github_client_secret', label: 'GitHub Client Secret' },
            { key: 'discord_client_id', label: 'Discord Client ID' },
            { key: 'discord_client_secret', label: 'Discord Client Secret' },
            { key: 'linkedin_client_id', label: 'LinkedIn Client ID' },
            { key: 'linkedin_client_secret', label: 'LinkedIn Client Secret' },
          ].map(item => (
            <div key={item.key} className='setting-item'>
              <label>{item.label}</label>
              <input type="text" value={settings[item.key] || ''} placeholder='Enter key...'
                onChange={e => setSettings(s => ({ ...s, [item.key]: e.target.value }))}
                onBlur={() => handleSettingChange(item.key, settings[item.key] || '')} />
            </div>
          ))}

          <h3 style={{ margin: '24px 0 16px', color: 'var(--text-primary)' }}>📨 SMTP Settings (Email)</h3>
          {[
            { key: 'smtp_host', label: 'SMTP Host' },
            { key: 'smtp_port', label: 'SMTP Port' },
            { key: 'smtp_user', label: 'SMTP Username' },
            { key: 'smtp_pass', label: 'SMTP Password' },
            { key: 'smtp_from', label: 'From Email' },
          ].map(item => (
            <div key={item.key} className='setting-item'>
              <label>{item.label}</label>
              <input type="text" value={settings[item.key] || ''} placeholder='Enter value...'
                onChange={e => setSettings(s => ({ ...s, [item.key]: e.target.value }))}
                onBlur={() => handleSettingChange(item.key, settings[item.key] || '')} />
            </div>
          ))}
        </div>
      )}

      {tab === 'settings' && (
        <div className='admin-section'>
          <div className='settings-list'>
            {/* Default Theme Selector */}
            <div className='setting-item setting-theme-item'>
              <label>Default Theme</label>
              <div className='theme-selector'>
                <select 
                  value={settings.default_theme || 'pink-blue'} 
                  onChange={e => handleDefaultThemeChange(e.target.value)}
                  className='theme-select'
                >
                  {Object.keys(themes).length > 0 ? Object.entries(themes).map(([key, t]) => (
                    <option key={key} value={key}>{t.name}</option>
                  )) : (
                    <>
                      <option value="dark-gold">Dark Gold</option>
                      <option value="pink-aesthetic">Pink Aesthetic</option>
                      <option value="rose-blush">Rose Blush</option>
                      <option value="ocean-blue">Ocean Blue</option>
                      <option value="forest-green">Forest Green</option>
                      <option value="lavender">Lavender Dreams</option>
                      <option value="sunset-orange">Sunset Orange</option>
                      <option value="monochrome">Monochrome</option>
                      <option value="pink-blue">Pink & Blue</option>
                    </>
                  )}
                </select>
                <div className='theme-preview' style={{
                  background: themes[settings.default_theme]?.primary || '#0D1117',
                  borderRadius: '8px',
                  width: '30px',
                  height: '30px',
                  border: '2px solid ' + (themes[settings.default_theme]?.accent1 || '#FF69B4'),
                  flexShrink: 0
                }}></div>
              </div>
            </div>

            {Object.entries(settings).filter(([key]) => !['default_theme', 'allow_google_login', 'allow_facebook_login', 'allow_x_login', 'allow_apple_login', 'allow_github_login', 'allow_discord_login', 'allow_linkedin_login', 'require_email_verification'].includes(key) && !key.includes('client_id') && !key.includes('client_secret') && !key.includes('app_id') && !key.includes('app_secret') && !key.includes('team_id') && !key.includes('smtp_')).map(([key, value]) => (
              <div key={key} className='setting-item'>
                <label>{key.replace(/_/g, ' ')}</label>
                {value === 'true' || value === 'false' ? (
                  <button className={`toggle-btn ${value === 'true' ? 'on' : 'off'}`} 
                    onClick={() => { const nv = value === 'true' ? 'false' : 'true'; handleSettingChange(key, nv); }}>
                    {value === 'true' ? 'ON' : 'OFF'}
                  </button>
                ) : (
                  <input type="text" value={value} onChange={e => setSettings(s => ({ ...s, [key]: e.target.value }))} 
                    onBlur={() => handleSettingChange(key, settings[key])} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;