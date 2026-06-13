import React, { useEffect, useState, useCallback } from 'react';
import './Sidebar.css';
import { assets } from '../../assets/assets';
import { api, getServerUrl } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { useFollow } from '../../context/FollowContext';
import ThemePicker from '../ThemePicker/ThemePicker';

const API_BASE = getServerUrl();

const Sidebar = ({ onNavigate, onViewProfile, onStoriesChanged }) => {
  const { user: me } = useAuth();
  const { followingIds, setFollowing, refresh: refreshFollows } = useFollow();
  const [meFull, setMeFull] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [followingUsers, setFollowingUsers] = useState([]);
  const [pending, setPending] = useState(new Set());

  useEffect(() => {
    if (!me?.id) return;
    api.getUser(me.id).then(u => setMeFull(u)).catch(() => {});
  }, [me?.id]);

  // Load suggestions (exclude followed users + self + banned)
  const loadSuggestions = useCallback(() => {
    if (!me?.id) return;
    api.getAllUsers(50).then(data => {
      const list = (data.users || []).filter(u => u.id !== me.id && !u.is_banned);
      setSuggestions(list);
    }).catch(() => {});
  }, [me?.id]);

  // Load users that the current user is following (for "Recently Following" section)
  const loadFollowing = useCallback(() => {
    if (!me?.id) return;
    api.getFollowing(me.id).then(data => {
      setFollowingUsers(data.users || []);
    }).catch(() => {});
  }, [me?.id]);

  useEffect(() => { loadSuggestions(); loadFollowing(); }, [loadSuggestions, loadFollowing]);

  // Filter suggestions: exclude users already followed
  const filteredSuggestions = suggestions.filter(u => !followingIds.has(u.id));

  // Show up to 10 most recent followed users
  const recentFollowing = followingUsers.slice(0, 10);

  const meAvatar = meFull?.avatar && !meFull.avatar.includes('default')
    ? `${API_BASE}${meFull.avatar}` : assets.profilepic;

  const handleFollowToggle = async (e, userId, currentlyFollowing) => {
    e.stopPropagation();
    if (pending.has(userId)) return;
    setPending(prev => new Set(prev).add(userId));
    try {
      await setFollowing(userId, !currentlyFollowing);
      loadSuggestions();
      loadFollowing();
      refreshFollows();
      if (onStoriesChanged) onStoriesChanged();
    } catch (err) {
      console.error('Follow toggle failed:', err);
    } finally {
      setPending(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  return (
    <div className='sidebar'>
      <ThemePicker />

      <div className='sidebar-profile' onClick={() => me?.id && onViewProfile && onViewProfile(me.id)} style={{ cursor: 'pointer' }}>
        <div className='sidebar-profile-avatar'>
          <img src={meAvatar} alt="Profile" />
        </div>
        <div className='sidebar-profile-info'>
          <span className='sidebar-username'>{me?.username || 'user'}</span>
          <span className='sidebar-name'>{me?.display_name || me?.username || 'My Account'}</span>
        </div>
        <button className='switch-btn' onClick={(e) => { e.stopPropagation(); onNavigate('settings'); }}>Edit</button>
      </div>

      {/* Already Following Section */}
      {recentFollowing.length > 0 && (
        <div className='sidebar-suggestions'>
          <div className='suggestions-header'>
            <span className='suggestions-title'>Already Following</span>
            <span className='suggestions-count'>{followingUsers.length}</span>
          </div>
          <div className='suggestions-list'>
            {recentFollowing.map((user) => (
              <div
                key={user.id}
                className='suggestion-item'
                onClick={() => onViewProfile && onViewProfile(user.id)}
                style={{ cursor: 'pointer' }}
              >
                <div className='suggestion-avatar'>
                  <img
                    src={user.avatar && !user.avatar.includes('default') ? `${API_BASE}${user.avatar}` : assets.profilepic}
                    alt={user.username}
                  />
                </div>
                <div className='suggestion-info'>
                  <span className='suggestion-username'>{user.username}</span>
                  <span className='suggestion-followers'>
                    {user.display_name || 'Following'}
                  </span>
                </div>
                <button
                  className='follow-btn following'
                  disabled={pending.has(user.id)}
                  onClick={(e) => handleFollowToggle(e, user.id, true)}
                >
                  {pending.has(user.id) ? '...' : 'Following'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions Section - only users NOT followed */}
      <div className='sidebar-suggestions'>
        <div className='suggestions-header'>
          <span className='suggestions-title'>Suggestions For You</span>
          <span className='suggestions-count'>{filteredSuggestions.length}</span>
        </div>

        {filteredSuggestions.length === 0 ? (
          <div className='suggestions-empty' style={{ padding: 16, fontSize: 12, color: 'var(--text-secondary)' }}>
            You're all caught up — follow more people to see suggestions here.
          </div>
        ) : (
          <div className='suggestions-list'>
            {filteredSuggestions.slice(0, 8).map((user) => {
              const isPending = pending.has(user.id);
              return (
                <div
                  key={user.id}
                  className='suggestion-item'
                  onClick={() => onViewProfile && onViewProfile(user.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className='suggestion-avatar'>
                    <img
                      src={user.avatar && !user.avatar.includes('default') ? `${API_BASE}${user.avatar}` : assets.profilepic}
                      alt={user.username}
                    />
                  </div>
                  <div className='suggestion-info'>
                    <span className='suggestion-username'>{user.username}</span>
                    <span className='suggestion-followers'>
                      {user.display_name || 'Suggested for you'} · {user.followers_count || 0} followers
                    </span>
                  </div>
                  <button
                    className='follow-btn'
                    disabled={isPending}
                    onClick={(e) => handleFollowToggle(e, user.id, false)}
                  >
                    {isPending ? '...' : 'Follow'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className='sidebar-footer'>
        <div className='footer-links'>
          <a href="#about">About</a>
          <a href="#help">Help</a>
          <a href="#press">Press</a>
          <a href="#api">API</a>
          <a href="#jobs">Jobs</a>
          <a href="#privacy">Privacy</a>
          <a href="#terms">Terms</a>
        </div>
        <div className='footer-links'>
          <a href="#locations">Locations</a>
          <a href="#language">Language</a>
        </div>
        <span className='footer-copyright'>© 2026 Mimu Arts</span>
      </div>
    </div>
  );
};

export default Sidebar;