import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, getServerUrl, setServerUrl } from '../api/api';
import { assets } from '../assets/assets';
import './UserSettings.css';

const UserSettings = ({ onBack }) => {
  const { user, logout } = useAuth();
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [saved, setSaved] = useState(false);
  const [serverUrl, setServerUrlState] = useState(getServerUrl() || 'http://YOUR_PC_IP:5000');
  const [serverMsg, setServerMsg] = useState('');

  const handleSave = async () => {
    await api.updateProfile({ display_name: displayName, bio });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className='settings-page'>
      <div className='settings-header'>
        <button className='back-btn' onClick={onBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back
        </button>
        <h2>Edit Profile</h2>
      </div>

      <div className='settings-content'>
        <div className='settings-avatar-section'>
          <div className='settings-avatar'>
            <img src={assets.profilepic} alt="Avatar" />
          </div>
          <div>
            <h3>{user?.username}</h3>
            <p className='settings-email'>{user?.email}</p>
          </div>
        </div>

        <div className='settings-form'>
          <div className='form-group'>
            <label>Display Name</label>
            <input 
              type="text" 
              value={displayName} 
              onChange={e => setDisplayName(e.target.value)} 
              placeholder="Your display name"
            />
          </div>

          <div className='form-group'>
            <label>Username</label>
            <input 
              type="text" 
              value={user?.username || ''} 
              disabled 
              className='disabled-input'
            />
            <span className='input-hint'>Username cannot be changed</span>
          </div>

          <div className='form-group'>
            <label>Email</label>
            <input 
              type="email" 
              value={user?.email || ''} 
              disabled 
              className='disabled-input'
            />
          </div>

          <div className='form-group'>
            <label>Bio</label>
            <textarea 
              value={bio} 
              onChange={e => setBio(e.target.value)} 
              placeholder="Tell us about yourself..."
              rows={4}
              maxLength={150}
            />
            <span className='input-hint'>{bio.length}/150 characters</span>
          </div>

          <button className='save-profile-btn' onClick={handleSave}>
            {saved ? '✅ Saved!' : '💾 Save Changes'}
          </button>
        </div>

        {/* Server URL Setting */}
        <div className='settings-card'>
          <h3>Server Connection</h3>
          <p className='input-hint' style={{marginBottom:8}}>
            Phone can't reach localhost. Enter your computer's LAN IP (e.g. 192.168.0.241:5000) or deployed server URL.
          </p>
          <div className='form-group'>
            <input 
              type="text" 
              value={serverUrl} 
              onChange={e => setServerUrlState(e.target.value)} 
              placeholder="http://YOUR_PC_IP:5000"
            />
          </div>
          {serverMsg && <div className={serverMsg.includes('Error') ? 'error-msg' : 'success-msg'} style={{fontSize:13,marginBottom:8}}>{serverMsg}</div>}
          <button className='save-profile-btn' onClick={() => {
            try {
              setServerUrl(serverUrl.replace(/\/+$/,''));
              setServerMsg('✅ Server URL saved! Reloading...');
            } catch(e) {
              setServerMsg('Error: ' + e.message);
            }
          }}>
            Save & Reload
          </button>
        </div>

        <div className='settings-actions'>
          <button className='danger-btn' onClick={logout}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserSettings;