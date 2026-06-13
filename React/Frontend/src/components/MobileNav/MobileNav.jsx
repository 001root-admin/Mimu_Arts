import React from 'react';
import './MobileNav.css';

const MobileNav = ({ onNavigate, currentPage, onOpenCreatePost }) => {
  return (
    <div className='mobile-nav'>
      <div className={`mobile-nav-item ${currentPage === 'feed' ? 'active' : ''}`} onClick={() => onNavigate('feed')}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill={currentPage === 'feed' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        </svg>
      </div>
      <div className={`mobile-nav-item ${currentPage === 'gallery' ? 'active' : ''}`} onClick={() => onNavigate('gallery')}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill={currentPage === 'gallery' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
          <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
          <circle cx="9" cy="9" r="2"/>
          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
        </svg>
      </div>
      <div className='mobile-nav-item create-btn' onClick={() => onOpenCreatePost ? onOpenCreatePost() : onNavigate('feed')}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
          <path d="M12 8v8M8 12h8"/>
        </svg>
      </div>
      <div className={`mobile-nav-item ${currentPage === 'people' ? 'active' : ''}`} onClick={() => onNavigate('people')}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill={currentPage === 'people' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      </div>
      <div className={`mobile-nav-item ${currentPage === 'theme' ? 'active' : ''}`} onClick={() => onNavigate('theme')}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3"/>
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
        </svg>
      </div>
    </div>
  );
};

export default MobileNav;