import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/api';
import { assets } from '../assets/assets';
import './ProfilePage.css';

const ProfilePage = ({ userId, onBack, onViewProfile }) => {
  const { user: me } = useAuth();
  const fileInputRef = useRef();
  const bannerInputRef = useRef();
  const postInputRef = useRef();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [showPostModal, setShowPostModal] = useState(false);
  const [newPostCaption, setNewPostCaption] = useState('');
  const [newPostImage, setNewPostImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [editingBio, setEditingBio] = useState(false);
  const [editBioText, setEditBioText] = useState('');
  const [editNameText, setEditNameText] = useState('');
  const isOwnProfile = !userId || userId === me?.id;

  const API_BASE = 'http://localhost:5000';

  const loadProfile = useCallback(() => {
    const id = userId || me?.id;
    if (!id) return;
    api.getUser(id).then(u => {
      setProfile(u);
      setFollowersCount(u.followers_count);
      setFollowingCount(u.following_count);
      setEditBioText(u.bio || '');
      setEditNameText(u.display_name || u.username);
    });
    api.getUserPosts(id).then(setPosts);
  }, [userId, me]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const handleFollow = async () => {
    if (!profile || isOwnProfile) return;
    const res = await api.toggleFollow(profile.id);
    setIsFollowing(res.following);
    setFollowersCount(prev => res.following ? prev + 1 : prev - 1);
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('avatar', file);
    await api.uploadAvatar(formData);
    loadProfile();
  };

  const handleBannerChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    // Will add banner upload endpoint later
    loadProfile();
  };

  const handleSaveBio = async () => {
    await api.updateProfile({ display_name: editNameText, bio: editBioText });
    setEditingBio(false);
    loadProfile();
  };

  const handleCreatePost = async () => {
    if (!newPostImage) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', newPostImage);
      formData.append('caption', newPostCaption);
      await api.createPost(formData);
      setShowPostModal(false);
      setNewPostCaption('');
      setNewPostImage(null);
      loadProfile();
    } catch (err) {
      alert('Failed: ' + err.message);
    } finally { setUploading(false); }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Delete this post?')) return;
    await api.deletePost(postId);
    loadProfile();
  };

  if (!profile) return <div className='profile-loading'><div className='loading-spinner'></div></div>;

  const avatarSrc = profile.avatar && !profile.avatar.includes('default') ? `${API_BASE}${profile.avatar}` : assets.profilepic;
  const bannerSrc = profile.banner && !profile.banner.includes('default') ? `${API_BASE}${profile.banner}` : null;

  return (
    <div className='profile-page'>
      <div className='profile-header-section'>
        <button className='back-btn' onClick={onBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back
        </button>
        {isOwnProfile && (
          <button className='create-post-btn' onClick={() => setShowPostModal(true)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
              <path d="M12 8v8M8 12h8"/>
            </svg>
            New Post
          </button>
        )}
      </div>

      <div className='profile-cover' style={bannerSrc ? { background: `url(${bannerSrc}) center/cover` } : {}}>
        <div className='profile-cover-gradient' style={bannerSrc ? { opacity: 0.4 } : {}}></div>
        {isOwnProfile && (
          <>
            <button className='change-banner-btn' onClick={() => bannerInputRef.current?.click()}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            </button>
            <input type="file" ref={bannerInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleBannerChange} />
          </>
        )}
      </div>

      <div className='profile-info-card'>
        <div className='profile-avatar-large'>
          <img src={avatarSrc} alt={profile.display_name} />
          {isOwnProfile && (
            <>
              <button className='change-avatar-btn' onClick={() => fileInputRef.current?.click()} title='Change avatar'>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              </button>
              <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleAvatarChange} />
            </>
          )}
        </div>

        <div className='profile-details'>
          <div className='profile-name-row'>
            {editingBio && isOwnProfile ? (
              <input 
                className='edit-name-input' 
                value={editNameText} 
                onChange={e => setEditNameText(e.target.value)} 
              />
            ) : (
              <h1 className='profile-display-name'>{profile.display_name || profile.username}</h1>
            )}
            <span className='profile-username'>@{profile.username}</span>
            {!isOwnProfile && (
              <button className={`follow-btn-large ${isFollowing ? 'following' : ''}`} onClick={handleFollow}>
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            )}
            {isOwnProfile && !editingBio && (
              <button className='edit-bio-btn' onClick={() => setEditingBio(true)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                </svg>
                Edit
              </button>
            )}
          </div>

          {editingBio && isOwnProfile ? (
            <div className='bio-edit-area'>
              <textarea 
                className='bio-textarea' 
                value={editBioText} 
                onChange={e => setEditBioText(e.target.value)} 
                placeholder="Tell us about yourself..."
                rows={3}
                maxLength={150}
              />
              <div className='bio-edit-actions'>
                <button className='cancel-bio-btn' onClick={() => setEditingBio(false)}>Cancel</button>
                <button className='save-bio-btn' onClick={handleSaveBio}>Save</button>
              </div>
            </div>
          ) : (
            profile.bio && <p className='profile-bio'>{profile.bio}</p>
          )}

          <div className='profile-stats'>
            <div className='stat-item'>
              <span className='stat-number'>{posts.length}</span>
              <span className='stat-label'>Posts</span>
            </div>
            <div className='stat-item'>
              <span className='stat-number'>{followersCount}</span>
              <span className='stat-label'>Followers</span>
            </div>
            <div className='stat-item'>
              <span className='stat-number'>{followingCount}</span>
              <span className='stat-label'>Following</span>
            </div>
          </div>
        </div>
      </div>

      <div className='profile-tabs'>
        <button className='profile-tab active'>📸 Posts</button>
        <button className='profile-tab'>🏷️ Tagged</button>
      </div>

      <div className='profile-posts-grid'>
        {posts.length === 0 ? (
          <div className='no-posts'>
            <div className='no-posts-icon'>📸</div>
            <h3>No posts yet</h3>
            <p>{isOwnProfile ? 'Click "New Post" to share!' : `${profile.username} hasn't posted yet.`}</p>
          </div>
        ) : (
          posts.map(post => (
            <div key={post.id} className='grid-post'>
              <img src={`${API_BASE}${post.image}`} alt={post.caption} />
              <div className='grid-post-overlay'>
                <span>❤️ {post.likes_count}</span>
                <span>💬 {post.comments_count}</span>
                {isOwnProfile && (
                  <button className='delete-post-btn' onClick={(e) => { e.stopPropagation(); handleDeletePost(post.id); }}>🗑️</button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {showPostModal && (
        <div className='modal-overlay' onClick={() => setShowPostModal(false)}>
          <div className='modal-content' onClick={e => e.stopPropagation()}>
            <div className='modal-header'>
              <h3>Create New Post</h3>
              <button className='modal-close' onClick={() => setShowPostModal(false)}>✕</button>
            </div>
            <div className='modal-body'>
              {newPostImage ? (
                <div className='post-preview'>
                  <img src={URL.createObjectURL(newPostImage)} alt="Preview" />
                  <button className='change-image-btn' onClick={() => setNewPostImage(null)}>Change</button>
                </div>
              ) : (
                <div className='upload-area' onClick={() => postInputRef.current?.click()}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  <p>Click to upload a photo</p>
                </div>
              )}
              <input type="file" ref={postInputRef} style={{ display: 'none' }} accept="image/*" onChange={e => setNewPostImage(e.target.files[0])} />
              <textarea className='caption-input' placeholder="Write a caption..." value={newPostCaption} onChange={e => setNewPostCaption(e.target.value)} rows={3} />
            </div>
            <div className='modal-footer'>
              <button className='cancel-btn' onClick={() => setShowPostModal(false)}>Cancel</button>
              <button className='submit-post-btn' onClick={handleCreatePost} disabled={!newPostImage || uploading}>
                {uploading ? 'Uploading...' : 'Share Post'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;