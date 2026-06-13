import React, { useState, useRef, useEffect } from 'react';
import './Navbar.css';
import { assets } from '../../assets/assets';
import { useAuth } from '../../context/AuthContext';
import { getServerUrl } from '../../api/api';

const Navbar = ({ onNavigate, currentPage, user, onViewProfile, onSearch }) => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const { logout } = useAuth();
  const menuRef = useRef();
  const avatarRef = useRef();
  const API_BASE = getServerUrl();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchText.trim()) {
      onSearch && onSearch(searchText.trim());
      onNavigate('people');
    }
  };

  const avatarSrc = user?.avatar && !user.avatar.includes('default')
    ? `${API_BASE}${user.avatar}` : assets.profilepic;

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target) && 
          avatarRef.current && !avatarRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('touchstart', handleClick);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('touchstart', handleClick);
    };
  }, []);

  return (
    <div className='navbar'>
      <div className='nav-left'>
        <div className='logo' onClick={() => onNavigate('feed')} style={{ cursor: 'pointer' }}>
          <span className='logo-text'>Mimu Arts</span>
        </div>
      </div>

      <div className={`nav-center ${searchOpen ? 'active' : ''}`}>
        <div className='search-bar'>
          <svg className='search-icon' width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
          </svg>
          <form onSubmit={handleSearch}>
            <input type="text" placeholder="Search people..." value={searchText} onChange={e => setSearchText(e.target.value)} />
          </form>
        </div>
      </div>

      <div className='nav-right'>
        <button className='mobile-search-btn' onClick={() => setSearchOpen(!searchOpen)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
          </svg>
        </button>

        <div className='nav-links'>
          <button className={`nav-link ${currentPage === 'feed' ? 'active' : ''}`} onClick={() => onNavigate('feed')}>Feed</button>
          {user?.role === 'admin' && (
            <button className={`nav-link ${currentPage === 'admin' ? 'active' : ''}`} onClick={() => onNavigate('admin')}>Admin</button>
          )}
        </div>

        <div className='nav-icons'>
          <div className='nav-avatar' ref={avatarRef} onClick={() => setMenuOpen(!menuOpen)} onTouchEnd={(e) => { e.preventDefault(); setMenuOpen(!menuOpen); }}>
            <img src={avatarSrc} alt="Profile" />
          </div>
        </div>

        {menuOpen && (
          <div className='nav-user-menu' ref={menuRef}>
            <div className='menu-user-info'>
              <div className='menu-avatar' onClick={() => { setMenuOpen(false); onViewProfile && onViewProfile(user?.id); }}>
                <img src={avatarSrc} alt="" />
              </div>
              <div>
                <p className='menu-username'>{user?.username || 'user'}</p>
                <p className='menu-email'>{user?.email || ''}</p>
                <p className='menu-role' style={{ fontSize: 11, color: 'var(--accent-gold)', marginTop: 2 }}>
                  {user?.role === 'admin' ? '🛡️ Admin' : '👤 User'}
                </p>
              </div>
            </div>
            <div className='menu-divider'></div>
            <button className='menu-item' onClick={() => { setMenuOpen(false); onViewProfile && onViewProfile(user?.id); }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
              My Profile
            </button>
            <button className='menu-item' onClick={() => { setMenuOpen(false); onNavigate('settings'); }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
              Edit Profile
            </button>
            <button className='menu-item' onClick={() => { setMenuOpen(false); onNavigate('theme'); }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
              </svg>
              Themes
            </button>
            <button className='menu-item' onClick={() => { setMenuOpen(false); onNavigate('gallery'); }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
              </svg>
              Gallery
            </button>
            {user?.role === 'admin' && (
              <button className='menu-item' onClick={() => { setMenuOpen(false); onNavigate('admin'); }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                Admin Panel
              </button>
            )}
            <div className='menu-divider'></div>
            <button className='menu-item' onClick={logout}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Log Out
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar;