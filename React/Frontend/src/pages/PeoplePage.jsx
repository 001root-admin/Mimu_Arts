import React, { useState, useEffect } from 'react';
import { api, getServerUrl } from '../api/api';
import { useFollow } from '../context/FollowContext';
import { assets } from '../assets/assets';
import './PeoplePage.css';

const API_BASE = getServerUrl();

const PeoplePage = ({ onViewProfile, searchQuery }) => {
  const { followingIds, setFollowing } = useFollow();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadUsers = (searchTerm) => {
    setLoading(true);
    api.getPeople(searchTerm || '').then(data => {
      setUsers(data.users || []);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { loadUsers(searchQuery || ''); }, [searchQuery]);

  const handleFollowToggle = async (userId) => {
    const isFollowing = followingIds.has(userId);
    await setFollowing(userId, !isFollowing);
  };

  return (
    <div className='people-page'>
      <div className='people-header'>
        <h2>People</h2>
        <p>Find and follow new people</p>
      </div>

      <div className='people-list'>
        {loading && (
          <div className='people-loader'><div className='loading-spinner'></div></div>
        )}
        {!loading && users.length === 0 && (
          <div className='people-empty'>
            <div className='empty-icon'>👥</div>
            <h3>No people found</h3>
            <p>{searchQuery ? 'Try a different search term.' : 'No users available yet.'}</p>
          </div>
        )}
        {users.map(user => {
          const avatar = user.avatar && !user.avatar.includes('default')
            ? `${API_BASE}${user.avatar}` : assets.profilepic;
          const isFollowing = followingIds.has(user.id);
          return (
            <div key={user.id} className='people-card' onClick={() => onViewProfile && onViewProfile(user.id)}>
              <img src={avatar} alt={user.username} className='people-avatar' />
              <div className='people-info'>
                <span className='people-username'>{user.username}</span>
                <span className='people-display'>{user.display_name || user.bio || ''}</span>
                <span className='people-stats'>{user.followers_count || 0} followers · {user.posts_count || 0} posts</span>
              </div>
              <button
                className={`people-follow-btn ${isFollowing ? 'following' : ''}`}
                onClick={(e) => { e.stopPropagation(); handleFollowToggle(user.id); }}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PeoplePage;