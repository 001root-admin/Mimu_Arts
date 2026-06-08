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

  useEffect(() => {
    if (tab === 'dashboard') api.getAdminStats().then(setStats);
    if (tab === 'users') loadUsers();
    if (tab === 'posts') loadPosts();
    if (tab === 'settings') api.getSiteSettings().then(setSettings);
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
        <h1>Admin Panel</h1>
        <div className='admin-tabs'>
          {['dashboard', 'users', 'posts', 'settings'].map(t => (
            <button key={t} className={`admin-tab ${tab === t ? 'active' : ''}`} onClick={() => { setTab(t); setPage(1); }}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
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
            <input type="text" placeholder="Search users..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className='admin-search' />
          </div>
          <div className='admin-table'>
            <div className='table-header'>
              <span>ID</span><span>Username</span><span>Email</span><span>Display</span><span>Role</span><span>Status</span><span>Actions</span>
            </div>
            {users.users?.map(u => (
              <div key={u.id} className='table-row'>
                <span>{u.id}</span>
                <span>{u.username}</span>
                <span>{u.email}</span>
                <span>{u.display_name}</span>
                <span><span className={`role-badge ${u.role}`}>{u.role}</span></span>
                <span>{u.is_banned ? <span className='status-banned'>Banned</span> : <span className='status-active'>Active</span>}</span>
                <span className='action-btns'>
                  {u.role !== 'admin' && (
                    <>
                      <button className='btn-small' onClick={() => handleUserAction(u.id, { role: u.role === 'admin' ? 'user' : 'admin' })}>
                        {u.role === 'admin' ? 'Demote' : 'Make Admin'}
                      </button>
                      <button className='btn-small btn-danger' onClick={() => handleUserAction(u.id, { is_banned: !u.is_banned })}>
                        {u.is_banned ? 'Unban' : 'Ban'}
                      </button>
                      <button className='btn-small btn-warn' onClick={() => { if (window.confirm('Delete user?')) api.deleteUser(u.id).then(loadUsers); }}>Delete</button>
                    </>
                  )}
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
                  <button className='btn-small' onClick={() => api.hidePost(p.id, !p.is_hidden)}>
                    {p.is_hidden ? 'Show' : 'Hide'}
                  </button>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'settings' && (
        <div className='admin-section'>
          <div className='settings-list'>
            {Object.entries(settings).map(([key, value]) => (
              <div key={key} className='setting-item'>
                <label>{key.replace(/_/g, ' ')}</label>
                {value === 'true' || value === 'false' ? (
                  <button className={`toggle-btn ${value === 'true' ? 'on' : 'off'}`} onClick={() => { const nv = value === 'true' ? 'false' : 'true'; handleSettingChange(key, nv); setSettings(s => ({ ...s, [key]: nv })); }}>
                    {value === 'true' ? 'ON' : 'OFF'}
                  </button>
                ) : (
                  <input type="text" value={value} onChange={e => { setSettings(s => ({ ...s, [key]: e.target.value })); }} onBlur={() => handleSettingChange(key, settings[key])} />
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