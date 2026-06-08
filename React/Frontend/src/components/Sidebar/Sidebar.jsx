import React from 'react';
import './Sidebar.css';
import { assets } from '../../assets/assets';
import ThemePicker from '../ThemePicker/ThemePicker';

const suggestions = [
  { id: 1, name: 'koffie', avatar: assets.Koffie, followers: '2.1K' },
  { id: 2, name: 'aro_cafe', avatar: assets.Aro, followers: '1.8K' },
  { id: 3, name: 'luna_art', avatar: assets.mascot, followers: '3.4K' },
  { id: 4, name: 'alex_photo', avatar: assets.profilepic, followers: '956' },
  { id: 5, name: 'sarah_vibes', avatar: assets.Ellipse, followers: '5.2K' },
];

const Sidebar = ({ onNavigate, onViewProfile }) => {
  return (
    <div className='sidebar'>
      <ThemePicker />
      <div className='sidebar-profile' onClick={() => onViewProfile && onViewProfile(1)} style={{ cursor: 'pointer' }}>
        <div className='sidebar-profile-avatar'>
          <img src={assets.profilepic} alt="Profile" />
        </div>
        <div className='sidebar-profile-info'>
          <span className='sidebar-username'>mimi_creative</span>
          <span className='sidebar-name'>Mimi's Creative</span>
        </div>
        <button className='switch-btn' onClick={(e) => { e.stopPropagation(); onNavigate('settings'); }}>Edit</button>
      </div>

      <div className='sidebar-suggestions'>
        <div className='suggestions-header'>
          <span className='suggestions-title'>Suggestions For You</span>
          <button className='see-all-btn'>See All</button>
        </div>

        <div className='suggestions-list'>
          {suggestions.map((user) => (
            <div key={user.id} className='suggestion-item'>
              <div className='suggestion-avatar'>
                <img src={user.avatar} alt={user.name} />
              </div>
              <div className='suggestion-info'>
                <span className='suggestion-username'>{user.name}</span>
                <span className='suggestion-followers'>Followed by {user.followers}</span>
              </div>
              <button className='follow-btn'>Follow</button>
            </div>
          ))}
        </div>
      </div>

      <div className='sidebar-footer'>
        <div className='footer-links'>
          <a href="#">About</a>
          <a href="#">Help</a>
          <a href="#">Press</a>
          <a href="#">API</a>
          <a href="#">Jobs</a>
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
        </div>
        <div className='footer-links'>
          <a href="#">Locations</a>
          <a href="#">Language</a>
        </div>
        <span className='footer-copyright'>© 2026 MIMI'S FROM MIMI</span>
      </div>
    </div>
  );
};

export default Sidebar;